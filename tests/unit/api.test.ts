import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApi } from '@server/api/router';
import { parseServerEnv } from '@server/lib/env';
import { sign } from '@server/lib/signature';

let dir: string;
const base = (extra: Record<string, string> = {}) => parseServerEnv({ NODE_ENV: 'test', LEAD_STORE_DIR: dir, MIN_FORM_SECONDS: '0', RATE_LIMIT_MAX: '50', ...extra });
const post = (path: string, body: unknown) => new Request(`http://test${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const get = (path: string) => new Request(`http://test${path}`);

const project = {
  type: 'project',
  intent: { services: ['websites-digital-experiences'], outcome: 'A clearer site' },
  context: { isIndividual: false, organisation: 'Example Ltd', sector: '', audience: '', background: 'We need a new website that explains our services clearly.' },
  scope: { deliverables: [], channels: '', markets: '', integrations: '' },
  timing: { timeframe: 'not-sure', dependency: '' },
  contact: { name: 'Test Person', email: 'test@example.com', role: '', country: '', timeZone: 'Europe/London', phone: '' },
  consent: true,
};
const envelope = (payload: unknown, key = 'key-0123456789abcdef', extra: Record<string, unknown> = {}) => ({ idempotencyKey: key, startedAt: Date.now() - 60_000, website: '', source: { route: '/start-a-project' }, payload, ...extra });

beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'wv-api-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); vi.unstubAllGlobals(); });

describe('POST /api/enquiries', () => {
  it('durably accepts a valid project brief and returns a reference', async () => {
    const api = createApi(base());
    const res = await api.handle(post('/api/enquiries', envelope(project)), '1.1.1.1');
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.reference).toMatch(/^WV-ENQ-2026-[2-9A-Z]{6}$/);
    expect(body.pipeline).toBe('projects');
    // Truthful: no email provider configured, so nothing is claimed as queued.
    expect(body.notifications.receiptEmail).toBe('not-configured');
    expect(body.notifications.studioEmail).toBe('not-configured');
    expect(readdirSync(join(dir, 'leads'))).toHaveLength(1);
  });

  it('is idempotent: the same key and body return the same reference', async () => {
    const api = createApi(base());
    const a = await (await api.handle(post('/api/enquiries', envelope(project)), '1.1.1.1')).json();
    const res = await api.handle(post('/api/enquiries', envelope(project)), '1.1.1.1');
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.reference).toBe(a.reference);
    expect(b.replayed).toBe(true);
    expect(readdirSync(join(dir, 'leads'))).toHaveLength(1);
  });

  it('rejects reuse of a key with different answers', async () => {
    const api = createApi(base());
    await api.handle(post('/api/enquiries', envelope(project)), '1.1.1.1');
    const res = await api.handle(post('/api/enquiries', envelope({ ...project, intent: { services: ['ai-creative-studio'], outcome: '' } })), '1.1.1.1');
    expect(res.status).toBe(409);
  });

  it('returns field errors with server-side validation', async () => {
    const api = createApi(base());
    const res = await api.handle(post('/api/enquiries', envelope({ ...project, contact: { ...project.contact, email: 'nope', timeZone: 'Nowhere/City' }, consent: false })), '1.1.1.1');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('validation');
    expect(Object.keys(body.fieldErrors)).toEqual(expect.arrayContaining(['contact.email', 'contact.timeZone', 'consent']));
  });

  it('requires an organisation unless the visitor is an individual', async () => {
    const api = createApi(base());
    const missing = await api.handle(post('/api/enquiries', envelope({ ...project, context: { ...project.context, organisation: '' } }, 'key-aaaaaaaaaaaaaaaa')), '1.1.1.1');
    expect((await missing.json()).fieldErrors).toHaveProperty('context.organisation');
    const individual = await api.handle(post('/api/enquiries', envelope({ ...project, context: { ...project.context, organisation: '', isIndividual: true } }, 'key-bbbbbbbbbbbbbbbb')), '1.1.1.1');
    expect(individual.status).toBe(201);
  });

  it('routes partnership enquiries to a separate pipeline', async () => {
    const api = createApi(base());
    const res = await api.handle(post('/api/enquiries', envelope({ type: 'partnership', name: 'Agency Lead', email: 'lead@agency.example', organisation: 'Agency', capability: 'Motion', message: 'We need motion design support for a client.', consent: true })), '1.1.1.1');
    const body = await res.json();
    expect(body.pipeline).toBe('partners');
    expect(body.reference).toMatch(/^WV-PTR-/);
  });

  it('rejects honeypot and too-fast submissions without storing anything', async () => {
    const api = createApi(base({ MIN_FORM_SECONDS: '3' }));
    const bot = await api.handle(post('/api/enquiries', envelope(project, 'key-cccccccccccccccc', { website: 'http://spam' })), '1.1.1.1');
    expect(bot.status).toBe(400);
    const fast = await api.handle(post('/api/enquiries', envelope(project, 'key-dddddddddddddddd', { startedAt: Date.now() })), '1.1.1.1');
    expect(fast.status).toBe(400);
    expect(() => readdirSync(join(dir, 'leads'))).toThrow();
  });

  it('rate-limits per client', async () => {
    const api = createApi(base({ RATE_LIMIT_MAX: '2' }));
    const statuses = [];
    for (let i = 0; i < 3; i++) statuses.push((await api.handle(post('/api/enquiries', envelope(project, `key-rate-${i}-aaaaaaaaaa`)), '9.9.9.9')).status);
    expect(statuses).toEqual([201, 201, 429]);
    const other = await api.handle(post('/api/enquiries', envelope(project, 'key-rate-other-aaaaaa')), '8.8.8.8');
    expect(other.status).toBe(201);
  });

  it('queues CRM delivery when configured and retries on failure without losing the lead', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('down', { status: 503 })).mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const api = createApi(base({ CRM_PROVIDER: 'webhook', CRM_WEBHOOK_URL_PROJECTS: 'https://crm.example/hook', CRM_WEBHOOK_SECRET: 'secret-secret-secret' }));
    const res = await api.handle(post('/api/enquiries', envelope(project)), '1.1.1.1');
    const { reference } = await res.json();
    await api.outbox.drain();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).toMatchObject({ 'idempotency-key': reference });
    const outboxFiles = readdirSync(join(dir, 'outbox'));
    expect(outboxFiles).toHaveLength(1); // retry scheduled, lead safe
    await api.outbox.drain(Date.now() + 10 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readdirSync(join(dir, 'outbox'))).toHaveLength(0);
  });
});

describe('booking API', () => {
  it('reports scheduling as unavailable when no provider is connected', async () => {
    const api = createApi(base());
    const cfg = await (await api.handle(get('/api/booking/config'), '1.1.1.1')).json();
    expect(cfg.mode).toBe('unavailable');
    const avail = await api.handle(get('/api/booking/availability?meetingType=discovery&start=2026-11-10&end=2026-11-20&timeZone=Europe/London'), '1.1.1.1');
    expect(avail.status).toBe(503);
  });

  it('refuses the development mock in production', async () => {
    const api = createApi(base({ NODE_ENV: 'production', BOOKING_PROVIDER: 'mock' }));
    const cfg = await (await api.handle(get('/api/booking/config'), '1.1.1.1')).json();
    expect(cfg.mode).toBe('unavailable');
  });

  it('runs the full mock lifecycle: availability, book, stale slot, reschedule, cancel', async () => {
    const api = createApi(base({ BOOKING_PROVIDER: 'mock' }));
    const cfg = await (await api.handle(get('/api/booking/config'), '1.1.1.1')).json();
    expect(cfg.mode).toBe('mock');
    const start = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 22 * 86400_000).toISOString().slice(0, 10);
    const { slots } = await (await api.handle(get(`/api/booking/availability?meetingType=discovery&start=${start}&end=${end}&timeZone=Asia/Tokyo`), '1.1.1.1')).json();
    expect(slots.length).toBeGreaterThan(10);
    // Minimum notice of 24 hours is respected.
    expect(new Date(slots[0].startAt).getTime()).toBeGreaterThan(Date.now() + 23.9 * 3600_000);

    const req = (startAt: string, key: string) => post('/api/booking/bookings', { meetingTypeId: 'discovery', startAt, timeZone: 'Asia/Tokyo', attendee: { name: 'Test Person', email: 't@example.com' }, notes: '', consent: true, idempotencyKey: key });
    const booked = await api.handle(req(slots[0].startAt, 'book-key-aaaaaaaaaaaa'), '1.1.1.1');
    expect(booked.status).toBe(201);
    const { confirmation } = await booked.json();
    expect(confirmation.status).toBe('confirmed');

    // A second visitor trying the same slot gets a stale-slot conflict, never a fake success.
    const stale = await api.handle(req(slots[0].startAt, 'book-key-bbbbbbbbbbbb'), '1.1.1.2');
    expect(stale.status).toBe(409);

    const moved = await api.handle(post('/api/booking/manage/reschedule', { token: confirmation.manageToken, startAt: slots[1].startAt, timeZone: 'Asia/Tokyo' }), '1.1.1.1');
    expect(moved.status).toBe(200);
    expect((await moved.json()).confirmation.startAt).toBe(slots[1].startAt);

    const cancelled = await api.handle(post('/api/booking/manage/cancel', { token: confirmation.manageToken }), '1.1.1.1');
    expect((await cancelled.json()).status.status).toBe('cancelled');

    const bad = await api.handle(get('/api/booking/manage?token=not-a-real-token-xxxxxxxx'), '1.1.1.1');
    expect(bad.status).toBe(404);
  });
});

describe('booking webhooks', () => {
  it('verifies signatures, rejects tampering and ignores replays', async () => {
    const secret = 'webhook-secret-123456';
    const api = createApi(base({ BOOKING_WEBHOOK_SECRET: secret }));
    const body = JSON.stringify({ id: 'evt_1', type: 'booking.created' });
    const ts = Math.floor(Date.now() / 1000);
    const send = (sig: string, t = ts) => api.handle(new Request('http://test/api/webhooks/booking', { method: 'POST', headers: { 'x-wv-timestamp': String(t), 'x-wv-signature': sig, 'content-type': 'application/json' }, body }), '1.1.1.1');
    expect((await send(`sha256=${sign(secret, ts, body)}`)).status).toBe(200);
    expect((await (await send(`sha256=${sign(secret, ts, body)}`)).json()).duplicate).toBe(true);
    expect((await send(`sha256=${sign('wrong-secret-0000000', ts, body)}`)).status).toBe(401);
    expect((await send(`sha256=${sign(secret, ts - 3600, body)}`, ts - 3600)).status).toBe(401);
  });
});

describe('hardening', () => {
  const report = (type: string, body: string) => new Request('http://test/api/csp-report', { method: 'POST', headers: { 'content-type': type, host: 'test' }, body });
  it('accepts browser security reports quietly and refuses anything else', async () => {
    const api = createApi(base());
    expect((await api.handle(report('application/csp-report', JSON.stringify({ 'csp-report': { 'blocked-uri': 'inline' } })), '1.1.1.1')).status).toBe(204);
    expect((await api.handle(report('application/reports+json', JSON.stringify([{ type: 'csp-violation', body: {} }])), '1.1.1.1')).status).toBe(204);
    expect((await api.handle(report('text/plain', 'x'), '1.1.1.1')).status).toBe(415);
    expect((await api.handle(report('application/csp-report', '{not json'), '1.1.1.1')).status).toBe(400);
    expect((await api.handle(get('/api/csp-report'), '1.1.1.1')).status).toBe(405);
    // A flood is absorbed without logging: still 204, so a sender learns nothing.
    for (let i = 0; i < 40; i++) await api.handle(report('application/csp-report', '{}'), '9.9.9.9');
    expect((await api.handle(report('application/csp-report', '{}'), '9.9.9.9')).status).toBe(204);
  });

  const contact = { type: 'general', name: 'Ama', email: 'ama@example.com', organisation: '', capability: '', message: 'A request about a brand film.', consent: true };
  const postFrom = (headers: Record<string, string>) => new Request('http://test/api/enquiries', { method: 'POST', headers: { 'content-type': 'application/json', host: 'test', ...headers }, body: JSON.stringify(envelope(contact, 'key-hardening-0123456789')) });
  it('refuses writes from other websites, and accepts the site’s own', async () => {
    const api = createApi(base());
    expect((await api.handle(postFrom({ origin: 'https://evil.example' }), '1.1.1.1')).status).toBe(403);
    expect((await api.handle(postFrom({ 'sec-fetch-site': 'cross-site' }), '1.1.1.1')).status).toBe(403);
    expect((await api.handle(postFrom({ origin: 'not a url' }), '1.1.1.1')).status).toBe(403);
    expect((await api.handle(postFrom({ origin: 'http://test', 'sec-fetch-site': 'same-origin' }), '1.1.1.1')).status).toBe(201);
  });
  it('tells the public only that the site is up', async () => {
    const api = createApi(base());
    const pub = await (await api.handle(get('/api/health'), '203.0.113.9')).json();
    expect(Object.keys(pub).sort()).toEqual(['ok', 'time']);
    const local = await (await api.handle(get('/api/health'), '127.0.0.1')).json();
    expect(local).toHaveProperty('email');
  });
});
