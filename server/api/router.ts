import { createHash } from 'node:crypto';
import { availabilityQuerySchema, bookingRequestSchema, cancelSchema, rescheduleSchema } from '@shared/booking';
import type { BookingConfig } from '@shared/booking';
import { enquiryEnvelopeSchema, schemaFor, toFieldErrors } from '@shared/enquiry';
import { CSP_REPORT_PATH } from '@shared/security';
import type { ApiError, EnquiryAccepted, EnquiryPayload } from '@shared/enquiry';
import { createCrm } from '../integrations/crm';
import { createEmail } from '../integrations/email';
import { createBookingProvider } from '../integrations/booking';
import { BookingNotFoundError, SlotUnavailableError } from '../integrations/booking/provider';
import { serverEnv } from '../lib/env';
import type { ServerEnv } from '../lib/env';
import { buildLead, FileLeadStore, newReference } from '../lib/leadStore';
import type { LeadStore } from '../lib/leadStore';
import { log } from '../lib/log';
import { Outbox } from '../lib/outbox';
import { RateLimiter } from '../lib/rateLimit';
import { ReplayGuard, verifySignature } from '../lib/signature';

const MAX_BODY = 64 * 1024;

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}
const fail = (status: number, error: ApiError['error'], message: string, extra: Partial<ApiError> = {}, headers?: Record<string, string>) =>
  json(status, { ok: false, error, message, ...extra } satisfies ApiError, headers);

/** Report fields are logged, never stored: trimmed, single-line, and pages reduced to their path. */
const clean = (v: unknown, max = 120) => (typeof v === 'string' ? v.replace(/\p{Cc}/gu, ' ').slice(0, max) : undefined);
const pathOf = (v: unknown) => { try { return typeof v === 'string' ? new URL(v).pathname.slice(0, 120) : undefined; } catch { return undefined; } };
const sourceOf = (v: unknown) => {
  if (typeof v !== 'string' || !v) return undefined;
  if (!v.includes(':')) return clean(v, 40); // keywords such as "inline" or "eval"
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' ? u.origin.slice(0, 120) : u.protocol; } catch { return clean(v, 40); }
};
export function cspReports(body: unknown): { directive?: string; blocked?: string; page?: string; disposition?: string }[] {
  const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  // Reporting API: an array of { type: 'csp-violation', body }. Older browsers: { 'csp-report': {...} }.
  const raw = Array.isArray(body)
    ? body.filter((r) => obj(r) && r.type === 'csp-violation' && obj(r.body)).map((r) => (r as { body: Record<string, unknown> }).body)
    : obj(body) && obj(body['csp-report']) ? [body['csp-report']] : [];
  return raw.slice(0, 5).map((r) => ({
    directive: clean(r.effectiveDirective ?? r['effective-directive'] ?? r['violated-directive'], 60),
    blocked: sourceOf(r.blockedURL ?? r['blocked-uri']),
    page: pathOf(r.documentURL ?? r['document-uri']),
    disposition: clean(r.disposition, 12),
  }));
}

async function readBody(req: Request): Promise<string | null> {
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > MAX_BODY) return null;
  const text = await req.text();
  return text.length > MAX_BODY ? null : text;
}

export type Api = { handle(req: Request, ip: string): Promise<Response>; outbox: Outbox; env: ServerEnv };

export function createApi(env: ServerEnv = serverEnv(), deps?: { store?: LeadStore }): Api {
  const store = deps?.store ?? new FileLeadStore(env.LEAD_STORE_DIR);
  const crm = createCrm(env);
  const email = createEmail(env);
  const booking = createBookingProvider(env);
  const outbox = new Outbox(env.LEAD_STORE_DIR, { store, crm, email, operatorEmail: env.OPERATOR_NOTIFICATION_EMAIL });
  const formLimiter = new RateLimiter(env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_SECONDS * 1000);
  const readLimiter = new RateLimiter(env.RATE_LIMIT_MAX * 40, env.RATE_LIMIT_WINDOW_SECONDS * 1000);
  const replay = new ReplayGuard();
  const reportLimiter = new RateLimiter(30, 10 * 60_000);

  /**
   * Content Security Policy reports: the browser tells the site when it blocked something,
   * which is how an injection attempt or a broken deploy shows up in the logs. Handled here,
   * with no outside service; nothing is stored and no visitor details are logged.
   */
  async function cspReport(req: Request, ip: string): Promise<Response> {
    const type = req.headers.get('content-type') ?? '';
    if (!type.includes('application/csp-report') && !type.includes('application/reports+json')) return fail(415, 'rejected', 'Unsupported report type.');
    if (!reportLimiter.check(`${ip}:csp`).allowed) return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
    const raw = await readBody(req);
    if (raw === null) return fail(413, 'rejected', 'Report too large.');
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return fail(400, 'rejected', 'Report could not be read.'); }
    for (const r of cspReports(body)) log('warn', 'csp.violation', r);
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  }

  async function enquiries(req: Request, ip: string): Promise<Response> {
    if (!(req.headers.get('content-type') ?? '').includes('application/json')) return fail(415, 'rejected', 'Send the form as JSON.');
    const rl = formLimiter.check(`${ip}:enquiries`);
    if (!rl.allowed) return fail(429, 'rate_limited', 'Too many submissions from your connection. Please wait a few minutes and try again.', { retryAfter: rl.retryAfter }, { 'retry-after': String(rl.retryAfter) });
    const raw = await readBody(req);
    if (raw === null) return fail(413, 'rejected', 'This submission is too large. Please shorten your answers.');
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return fail(400, 'rejected', 'The submission could not be read. Please try again.'); }

    const env_ = enquiryEnvelopeSchema.safeParse(body);
    if (!env_.success) return fail(400, 'rejected', 'The submission could not be read. Please refresh the page and try again.');
    const { idempotencyKey, startedAt, website, source, payload } = env_.data;
    if (website) {
      log('warn', 'enquiry.honeypot');
      return fail(400, 'rejected', 'We could not accept this submission.');
    }
    const elapsed = Date.now() - startedAt;
    if (elapsed < env.MIN_FORM_SECONDS * 1000 || elapsed > 7 * 24 * 3600_000) {
      return fail(400, 'rejected', 'Please take a moment to review your answers, then send again.');
    }
    const schema = schemaFor((payload as { type?: unknown } | null)?.type);
    if (!schema) return fail(400, 'rejected', 'Unknown enquiry type.');
    const parsed = schema.safeParse(payload);
    if (!parsed.success) return fail(400, 'validation', 'Some answers need attention.', { fieldErrors: toFieldErrors(parsed.error) });
    const data = parsed.data as EnquiryPayload;
    const bodyHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');

    const replayed = async (ref: string, hash: string): Promise<Response> => {
      if (hash !== bodyHash) return fail(409, 'conflict', 'This form was already sent with different answers. Refresh the page to send a new enquiry.');
      const lead = await store.get(ref);
      if (!lead) return fail(503, 'unavailable', 'We could not confirm your earlier submission. Please try again.');
      return json(200, { ok: true, reference: ref, receivedAt: lead.receivedAt, pipeline: lead.pipeline, notifications: { receiptEmail: lead.downstream.receiptEmail === 'not-configured' ? 'not-configured' : 'queued', studioEmail: lead.downstream.operatorEmail === 'not-configured' ? 'not-configured' : 'queued' }, replayed: true } satisfies EnquiryAccepted);
    };

    try {
      const prior = await store.findByIdempotencyKey(idempotencyKey);
      if (prior) return replayed(prior.reference, prior.bodyHash);
      const configured = { crm: crm.configured, email: email.configured, operator: Boolean(env.OPERATOR_NOTIFICATION_EMAIL) };
      const lead = buildLead(data, newReference(data.type), { route: source?.route, utm: source?.utm }, configured);
      const result = await store.save(lead, idempotencyKey, bodyHash);
      if (result === 'duplicate') {
        const again = await store.findByIdempotencyKey(idempotencyKey);
        return again ? replayed(again.reference, again.bodyHash) : fail(503, 'unavailable', 'Please try again.');
      }
      if (configured.crm) await outbox.enqueue('crm.send', lead.reference);
      if (configured.email) await outbox.enqueue('email.receipt', lead.reference);
      if (configured.email && configured.operator) await outbox.enqueue('email.operator', lead.reference);
      log('info', 'enquiry.accepted', { reference: lead.reference, type: lead.type, pipeline: lead.pipeline, crm: lead.downstream.crm, email: lead.downstream.receiptEmail });
      return json(201, { ok: true, reference: lead.reference, receivedAt: lead.receivedAt, pipeline: lead.pipeline, notifications: { receiptEmail: configured.email ? 'queued' : 'not-configured', studioEmail: configured.email && configured.operator ? 'queued' : 'not-configured' } } satisfies EnquiryAccepted);
    } catch (e) {
      log('error', 'enquiry.store_failed', { error: e instanceof Error ? e.message.slice(0, 120) : 'unknown' });
      return fail(503, 'unavailable', 'We could not save your submission just now. Your answers are still here — please try again in a moment.');
    }
  }

  async function bookingConfig(): Promise<Response> {
    const cfg: BookingConfig = booking
      ? { mode: booking.mode, provider: booking.name, meetingTypes: await booking.meetingTypes(), notice: 'Times are offered at least 24 hours ahead, up to three weeks out.', horizonDays: 21 }
      : { mode: 'unavailable', provider: 'none', meetingTypes: [] };
    return json(200, cfg);
  }

  async function bookingRoutes(req: Request, url: URL, ip: string): Promise<Response> {
    if (!booking) return fail(503, 'unavailable', 'Online scheduling is not connected yet.');
    const path = url.pathname;
    if (req.method === 'GET' && path === '/api/booking/availability') {
      const rl = readLimiter.check(`${ip}:availability`);
      if (!rl.allowed) return fail(429, 'rate_limited', 'Too many requests. Please wait a moment.', { retryAfter: rl.retryAfter }, { 'retry-after': String(rl.retryAfter) });
      const q = availabilityQuerySchema.safeParse(Object.fromEntries(url.searchParams));
      if (!q.success) return fail(400, 'validation', 'Invalid availability request.', { fieldErrors: toFieldErrors(q.error) });
      try {
        const slots = await booking.getAvailability({ meetingTypeId: q.data.meetingType, startDate: q.data.start, endDate: q.data.end, timeZone: q.data.timeZone });
        return json(200, { ok: true, slots, provider: booking.name, mode: booking.mode });
      } catch (e) {
        log('error', 'booking.availability_failed', { error: e instanceof Error ? e.message : 'unknown' });
        return fail(502, 'unavailable', 'We could not load availability from the calendar. Please try again.');
      }
    }
    if (req.method === 'GET' && path === '/api/booking/manage') {
      const token = url.searchParams.get('token') ?? '';
      const b = token.length >= 20 ? await booking.getBooking(token) : null;
      return b ? json(200, { ok: true, booking: b, mode: booking.mode }) : fail(404, 'not_found', 'This link is invalid or has expired.');
    }
    if (req.method !== 'POST') return fail(405, 'rejected', 'Method not allowed.');
    const rl = formLimiter.check(`${ip}:booking`);
    if (!rl.allowed) return fail(429, 'rate_limited', 'Too many requests. Please wait a few minutes and try again.', { retryAfter: rl.retryAfter }, { 'retry-after': String(rl.retryAfter) });
    const raw = await readBody(req);
    if (raw === null) return fail(413, 'rejected', 'Request too large.');
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return fail(400, 'rejected', 'The request could not be read.'); }
    try {
      if (path === '/api/booking/bookings') {
        const p = bookingRequestSchema.safeParse(body);
        if (!p.success) return fail(400, 'validation', 'Some details need attention.', { fieldErrors: toFieldErrors(p.error) });
        const confirmation = await booking.createBooking(p.data);
        log('info', 'booking.confirmed', { provider: booking.name, meetingType: confirmation.meetingTypeId });
        return json(201, { ok: true, confirmation, mode: booking.mode });
      }
      if (path === '/api/booking/manage/reschedule') {
        const p = rescheduleSchema.safeParse(body);
        if (!p.success) return fail(400, 'validation', 'Invalid request.', { fieldErrors: toFieldErrors(p.error) });
        const confirmation = await booking.rescheduleBooking(p.data.token, p.data.startAt, p.data.timeZone);
        return json(200, { ok: true, confirmation, mode: booking.mode });
      }
      if (path === '/api/booking/manage/cancel') {
        const p = cancelSchema.safeParse(body);
        if (!p.success) return fail(400, 'validation', 'Invalid request.');
        const status = await booking.cancelBooking(p.data.token);
        return json(200, { ok: true, status, mode: booking.mode });
      }
    } catch (e) {
      if (e instanceof SlotUnavailableError) return fail(409, 'conflict', 'That time has just been taken. Please choose another — the list has been refreshed.');
      if (e instanceof BookingNotFoundError) return fail(404, 'not_found', 'This booking could not be found, or it has already been cancelled.');
      log('error', 'booking.provider_failed', { error: e instanceof Error ? e.message.slice(0, 120) : 'unknown' });
      return fail(502, 'unavailable', 'The calendar did not confirm the booking. Nothing has been booked — please try again.');
    }
    return fail(404, 'not_found', 'Not found.');
  }

  async function bookingWebhook(req: Request): Promise<Response> {
    if (!env.BOOKING_WEBHOOK_SECRET) return fail(503, 'unavailable', 'Webhook not configured.');
    const raw = await readBody(req);
    if (raw === null) return fail(413, 'rejected', 'Too large.');
    const v = verifySignature({ secret: env.BOOKING_WEBHOOK_SECRET, body: raw, timestamp: req.headers.get('x-wv-timestamp'), signature: req.headers.get('x-wv-signature') });
    if (!v.ok) {
      log('warn', 'webhook.rejected', { reason: v.reason });
      return fail(401, 'rejected', 'Invalid signature.');
    }
    let id = req.headers.get('x-wv-event-id') ?? '';
    try { id ||= String((JSON.parse(raw) as { id?: unknown }).id ?? ''); } catch { /* not JSON */ }
    if (!id) return fail(400, 'rejected', 'Missing event id.');
    if (!replay.claim(id)) return json(200, { ok: true, duplicate: true });
    // Map provider event → booking/CRM status here once a provider is chosen (B-08).
    log('info', 'webhook.accepted', { id: id.slice(0, 40) });
    return json(200, { ok: true });
  }

  return {
    env,
    outbox,
    async handle(req, ip) {
      const url = new URL(req.url);
      const path = url.pathname.replace(/\/+$/, '');
      try {
        // Writes come only from this site's own pages. Browsers label every request with where it
        // came from; a form or script on another site is refused even before the JSON check.
        // Signed server-to-server webhooks carry neither header and are verified separately.
        if (req.method !== 'GET' && req.method !== 'HEAD' && path !== '/api/webhooks/booking') {
          const site = req.headers.get('sec-fetch-site');
          const origin = req.headers.get('origin');
          const originHost = (() => { try { return origin && origin !== 'null' ? new URL(origin).host : null; } catch { return 'invalid'; } })();
          if (site === 'cross-site' || (originHost !== null && originHost !== (req.headers.get('host') ?? url.host))) {
            return fail(403, 'rejected', 'Requests must come from this website.');
          }
        }
        // Monitors only need "up". Which providers are configured is shown to the server itself only.
        if (path === '/api/health') {
          const local = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
          return json(200, { ok: true, time: new Date().toISOString(), ...(local ? { booking: booking ? booking.mode : 'unavailable', crm: crm.configured ? crm.name : 'not-configured', email: email.configured ? email.name : 'not-configured' } : {}) });
        }
        if (path === CSP_REPORT_PATH) return req.method === 'POST' ? cspReport(req, ip) : fail(405, 'rejected', 'Method not allowed.', {}, { allow: 'POST' });
        if (path === '/api/enquiries') return req.method === 'POST' ? enquiries(req, ip) : fail(405, 'rejected', 'Method not allowed.', {}, { allow: 'POST' });
        if (path === '/api/booking/config') return bookingConfig();
        if (path.startsWith('/api/booking/')) return bookingRoutes(req, url, ip);
        if (path === '/api/webhooks/booking' && req.method === 'POST') return bookingWebhook(req);
        return fail(404, 'not_found', 'Not found.');
      } catch (e) {
        log('error', 'api.unhandled', { path, error: e instanceof Error ? e.message.slice(0, 120) : 'unknown' });
        return fail(500, 'server_error', 'Something went wrong on our side. Please try again.');
      }
    },
  };
}
