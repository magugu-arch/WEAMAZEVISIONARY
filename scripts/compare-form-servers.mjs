/**
 * Checks that the PHP form handler (Hostinger web hosting) answers exactly like the Node.js
 * server: node scripts/compare-form-servers.mjs <node-base-url> <php-base-url>
 *
 * Both must run with generous rate limits (RATE_LIMIT_MAX=1000 for Node; rate_limit_max and
 * global_limit_max of 1000 in api/config.local.php for PHP). Each case is sent to both;
 * the status, error kind, message, field errors and (for accepted forms) the stored
 * answers must match. Exits 1 on any difference.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [nodeBase, phpBase] = process.argv.slice(2);
const readers = { node: process.env.NODE_LEADS, php: process.env.PHP_LEADS }; // optional: how to read a stored lead
let n = 0;
const key = () => `key-compare-${Date.now()}-${String(++n).padStart(4, '0')}`;
const ago = (ms) => Date.now() - ms;

const project = () => ({
  type: 'project',
  intent: { services: ['websites-digital-experiences', 'help-me-define-it'], outcome: '  A clearer site  ' },
  context: { isIndividual: false, organisation: 'Example Ltd', sector: 'Retail', audience: 'Shoppers', background: 'We need a new website that explains our services clearly.' },
  scope: { deliverables: ['Website', ' Brand film '], channels: 'Web', markets: 'UK, ZA', integrations: '' },
  timing: { timeframe: 'within-3-months', dependency: 'Launch in March', budget: 'prefer-to-discuss' },
  contact: { name: 'Test Person', email: 'test@example.com', role: 'Marketing lead', country: 'South Africa', timeZone: 'Africa/Johannesburg', phone: '+27 11 555 0100' },
  consent: true,
});
const contact = () => ({ type: 'general', topic: 'project', subject: 'A question', name: 'Test Person', email: 'test@example.com', organisation: '', capability: '', message: 'Hello, this is a short message.', consent: true });
const call = () => ({ type: 'call-request', name: 'Test Person', email: 'test@example.com', organisation: 'Example Ltd', timeZone: 'Europe/London', windows: ['weekday-morning', 'weekday-evening'], topic: 'ai-creative-studio', notes: 'After 10 if possible.', consent: true });
const env = (payload, over = {}) => ({ idempotencyKey: key(), startedAt: ago(60_000), website: '', source: { route: '/start-a-project', utm: { utm_source: 'test' } }, payload, ...over });
const set = (obj, path, value) => { const o = structuredClone(obj); const parts = path.split('.'); let t = o; for (const p of parts.slice(0, -1)) t = t[p]; if (value === undefined) delete t[parts.at(-1)]; else t[parts.at(-1)] = value; return o; };

const cases = [
  ['project brief, complete', () => env(project())],
  ['project brief, individual with only required answers', () => env({ type: 'project', intent: { services: ['help-me-define-it'] }, context: { isIndividual: true, background: 'I would like a short film for my shop.' }, scope: {}, timing: { timeframe: 'not-sure' }, contact: { name: 'Al', email: "o'neil+x@example.co.za", timeZone: 'UTC' }, consent: true }, { source: undefined, website: undefined })],
  ['contact request', () => env(contact(), { source: { route: '/contact' } })],
  ['partnership request without topic or subject', () => env({ type: 'partnership', name: 'Partner Person', email: 'p@example.org', message: 'We would like to work together.', capability: 'Motion design', consent: true })],
  ['call request', () => env(call())],
  ['call request without topic', () => env(set(call(), 'topic', undefined))],
  ['answers are trimmed, non-breaking spaces included', () => env(set(set(contact(), 'name', '\u00a0 Test Person \u2003'), 'message', '\n\t Hello, this is a short message. \u00a0'))],
  ['unknown extra fields are dropped', () => env({ ...contact(), admin: true, reference: 'WV-HACK' })],
  ['emoji and accents are kept', () => env(set(set(contact(), 'name', 'Zoë 🎬 Ndlovu'), 'message', 'Ünïcödé message with “quotes” and emoji 🎥🎥'))],
  ['message of exactly 4000 characters, ending in an emoji (one character)', () => env(set(contact(), 'message', 'a'.repeat(3999) + '🎥'))],
  ['message one character too long', () => env(set(contact(), 'message', 'a'.repeat(4000) + '🎥'))],
  ['message of 2000 emoji (2000 characters, 4000 bytes in a browser)', () => env(set(contact(), 'message', '🎥'.repeat(2000)))],
  ['no consent', () => env(set(project(), 'consent', false))],
  ['consent as text', () => env(set(contact(), 'consent', 'true'))],
  ['consent missing', () => env(set(call(), 'consent', undefined))],
  ['background too short', () => env(set(project(), 'context.background', 'Too short'))],
  ['organisation missing for a company', () => env(set(project(), 'context.organisation', ''))],
  ['email without a domain', () => env(set(project(), 'contact.email', 'test@example'))],
  ['email carrying an injected mail header', () => env(set(contact(), 'email', 'a@example.com\r\nBcc: victim@example.org'))],
  ['email with a space', () => env(set(call(), 'email', 'a b@example.com'))],
  ['email missing', () => env(set(contact(), 'email', undefined))],
  ['time zone that does not exist', () => env(set(project(), 'contact.timeZone', 'Mars/Olympus'))],
  ['time zone missing', () => env(set(call(), 'timeZone', undefined))],
  ['phone with letters', () => env(set(project(), 'contact.phone', 'call me'))],
  ['no services chosen', () => env(set(project(), 'intent.services', []))],
  ['a service that does not exist', () => env(set(project(), 'intent.services', ['websites-digital-experiences', 'free-money']))],
  ['timeframe missing', () => env(set(project(), 'timing.timeframe', undefined))],
  ['budget option that does not exist', () => env(set(project(), 'timing.budget', '1-million'))],
  ['name of one letter', () => env(set(project(), 'contact.name', 'A'))],
  ['name missing', () => env(set(contact(), 'name', undefined))],
  ['outcome too long', () => env(set(project(), 'intent.outcome', 'x'.repeat(1001)))],
  ['a deliverable too long', () => env(set(project(), 'scope.deliverables', ['ok', 'y'.repeat(161)]))],
  ['a whole step missing', () => env(set(project(), 'scope', undefined))],
  ['contact step is null', () => env(set(project(), 'contact', null))],
  ['individual flag as text', () => env(set(project(), 'context.isIndividual', 'yes'))],
  ['several problems at once', () => env(set(set(set(project(), 'contact.email', 'nope'), 'context.background', ''), 'consent', false))],
  ['message too short', () => env(set(contact(), 'message', 'Hi'))],
  ['message of spaces only', () => env(set(contact(), 'message', '            '))],
  ['topic that does not exist', () => env(set(contact(), 'topic', 'sales'))],
  ['subject too long', () => env(set(contact(), 'subject', 's'.repeat(141)))],
  ['no call times chosen', () => env(set(call(), 'windows', []))],
  ['a call time that does not exist', () => env(set(call(), 'windows', ['midnight']))],
  ['notes too long', () => env(set(call(), 'notes', 'n'.repeat(2001)))],
  ['request key too short', () => env(contact(), { idempotencyKey: 'short' })],
  ['request key with odd characters', () => env(contact(), { idempotencyKey: '../../../../etc/passwd-000000' })],
  ['start time as text', () => env(contact(), { startedAt: 'yesterday' })],
  ['sent too fast to be a person', () => env(contact(), { startedAt: Date.now() })],
  ['form opened more than a week ago', () => env(contact(), { startedAt: ago(8 * 24 * 3600_000) })],
  ['hidden field filled in (a robot)', () => env(contact(), { website: 'https://spam.example' })],
  ['hidden field not text', () => env(contact(), { website: 5 })],
  ['page address too long', () => env(contact(), { source: { route: '/'.padEnd(201, 'x') } })],
  ['campaign tag too long', () => env(contact(), { source: { route: '/contact', utm: { utm_source: 'x'.repeat(121) } } })],
  ['no answers at all', () => env(undefined)],
  ['unknown kind of enquiry', () => env({ type: 'invoice', name: 'x' })],
  ['answers as a list', () => env([contact()])],
  ['a list instead of a form', () => [1, 2, 3]],
  ['not JSON', () => '{"idempotencyKey": '],
  ['wrong content type', () => env(contact()), { headers: { 'content-type': 'text/plain' } }],
  ['body too large', () => env(set(contact(), 'message', 'z'.repeat(70_000)))],
  ['sent from another website (browser label)', () => env(contact()), { headers: { 'sec-fetch-site': 'cross-site' } }],
  ['sent from another website (origin)', () => env(contact()), { headers: { origin: 'https://evil.example' } }],
  ['wrong method', () => null, { method: 'GET' }],
];

async function send(base, body, opts = {}) {
  const headers = { 'content-type': 'application/json', origin: base, 'sec-fetch-site': 'same-origin', ...(opts.headers ?? {}) };
  const res = await fetch(base + '/api/enquiries', { method: opts.method ?? 'POST', headers, body: body === null ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, allow: res.headers.get('allow'), cache: res.headers.get('cache-control'), type: res.headers.get('content-type') };
}
const storedLead = (which, reference) => {
  const how = readers[which];
  if (!how) return null;
  const raw = how.startsWith('docker:') ? execFileSync('docker', ['exec', how.slice(7).split(':')[0], 'cat', `${how.slice(7).split(':').slice(1).join(':')}/${reference}.json`], { encoding: 'utf8' }) : readFileSync(`${how}/${reference}.json`, 'utf8');
  return JSON.parse(raw);
};
const shape = (r) => r.json && r.json.ok
  ? { status: r.status, ok: true, pipeline: r.json.pipeline, reference: String(r.json.reference).replace(/[2-9A-HJ-NP-Z]{6}$/, 'XXXXXX'), replayed: r.json.replayed, receivedAt: /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(r.json.receivedAt) }
  : { status: r.status, error: r.json?.error, message: r.json?.message, fieldErrors: r.json?.fieldErrors, retryAfter: r.json?.retryAfter, allow: r.allow };

const problems = [];
let accepted = 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const [name, build, opts] of cases) {
  const body = build();
  const a = await send(nodeBase, body, opts);
  const b = await send(phpBase, body, opts);
  const [sa, sb] = [shape(a), shape(b)];
  // Wording for answers of the wrong kind (which the pages cannot send) may differ; the fields named must not.
  const generic = (s) => s.fieldErrors && Object.fromEntries(Object.entries(s.fieldErrors).map(([k, v]) => [k, /^(Invalid|Too big|Too small)/.test(v) ? '(wrong kind of value)' : v]));
  if (!same({ ...sa, fieldErrors: generic(sa) }, { ...sb, fieldErrors: generic(sb) })) problems.push(`${name}\n    node: ${JSON.stringify(sa)}\n    php:  ${JSON.stringify(sb)}`);
  if (b.cache !== 'no-store' || !String(b.type).startsWith('application/json')) problems.push(`${name}: PHP reply headers ${b.cache} ${b.type}`);
  if (a.json?.ok && b.json?.ok) {
    accepted += 1;
    const [la, lb] = [storedLead('node', a.json.reference), storedLead('php', b.json.reference)];
    if (la && lb) {
      const pick = (l) => ({ type: l.type, pipeline: l.pipeline, status: l.status, owner: l.owner, payload: l.payload, source: l.source });
      if (!same(pick(la), pick(lb))) problems.push(`${name}: stored answers differ\n    node: ${JSON.stringify(pick(la))}\n    php:  ${JSON.stringify(pick(lb))}`);
    }
  }
}

// The same form sent twice gets its first answer again; a changed form with the same key is refused.
for (const [which, base] of [['node', nodeBase], ['php', phpBase]]) {
  const first = env(contact());
  const r1 = await send(base, first);
  const r2 = await send(base, first);
  const r3 = await send(base, { ...first, payload: set(contact(), 'message', 'A different message entirely.') });
  if (!(r1.status === 201 && r2.status === 200 && r2.json.replayed === true && r2.json.reference === r1.json.reference && r3.status === 409 && r3.json.error === 'conflict')) problems.push(`${which}: repeat handling ${r1.status} ${r2.status} ${r3.status}`);
  const burst = env(call());
  const both = await Promise.all([send(base, burst), send(base, burst), send(base, burst), send(base, burst)]);
  const refs = new Set(both.filter((r) => r.json?.ok).map((r) => r.json.reference));
  if (refs.size !== 1 || both.some((r) => ![200, 201, 503].includes(r.status))) problems.push(`${which}: four at once gave ${both.map((r) => r.status).join(' ')} with ${refs.size} references`);
}

console.log(`${cases.length} cases sent to both servers · ${accepted} accepted by both`);
if (problems.length) { console.log(`DIFFERENCES (${problems.length}):`); for (const p of problems) console.log('  ' + p); process.exitCode = 1; } else console.log('NO DIFFERENCES');
