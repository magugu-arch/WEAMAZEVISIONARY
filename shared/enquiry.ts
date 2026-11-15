import './zodConfig';
import { z } from 'zod';
import { isValidTimeZone } from './timezone';

/** Shared by the browser (inline validation) and the server (authoritative validation). */
export const SERVICE_SLUGS = [
  'ai-creative-studio', 'ai-presentations-pitch-decks', 'websites-digital-experiences', 'apps-digital-products',
  'ai-solutions-automation', '3d-animation-motion-design', 'brand-strategy-creative-direction', 'digital-innovation-technology',
] as const;
export const INTENT_OPTIONS = [...SERVICE_SLUGS, 'help-me-define-it'] as const;
export type IntentOption = (typeof INTENT_OPTIONS)[number];

export const TIMEFRAMES = [
  { id: 'asap', label: 'As soon as possible' },
  { id: 'within-3-months', label: 'Within three months' },
  { id: '3-6-months', label: 'In three to six months' },
  { id: '6-plus-months', label: 'More than six months away' },
  { id: 'not-sure', label: 'Not sure yet' },
] as const;
/** Owner has not approved budget ranges (B-17); only non-binding preferences are offered. */
export const BUDGET_OPTIONS = [
  { id: 'not-sure', label: 'Not sure yet' },
  { id: 'prefer-to-discuss', label: 'I’d prefer to discuss it' },
] as const;
export const CALL_WINDOWS = [
  { id: 'weekday-morning', label: 'Weekday mornings' },
  { id: 'weekday-afternoon', label: 'Weekday afternoons' },
  { id: 'weekday-evening', label: 'Weekday early evenings' },
] as const;

const ids = <T extends readonly { id: string }[]>(arr: T) => arr.map((x) => x.id) as unknown as [T[number]['id'], ...T[number]['id'][]];
const str = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);
const optStr = (max: number) => str(max).optional().default('');
export const timeZoneField = z.string().trim().refine(isValidTimeZone, 'Choose a valid time zone.');
const emailField = z.string().trim().max(254).pipe(z.email('Enter an email address in the format name@example.com.'));
const nameField = str(120).min(2, 'Enter your name.');
const phoneField = z.string().trim().max(40).refine((v) => v === '' || /^\+?[0-9][0-9\s().-]{5,}$/.test(v), 'Enter a phone number using digits, spaces and an optional +.').optional().default('');
const consentField = z.literal(true, 'Please confirm you agree so we can respond.');

/** Step schemas let the builder validate one step at a time with the same rules the server applies. */
export const projectSteps = {
  intent: z.object({
    services: z.array(z.enum(INTENT_OPTIONS)).min(1, 'Choose at least one option, or “Help me define it”.').max(INTENT_OPTIONS.length),
    outcome: optStr(1000),
  }),
  context: z
    .object({
      isIndividual: z.boolean().default(false),
      organisation: optStr(160),
      sector: optStr(120),
      audience: optStr(600),
      background: str(4000).min(20, 'Tell us a little more about the project (at least 20 characters).'),
    })
    .superRefine((v, ctx) => {
      if (!v.isIndividual && v.organisation.length < 2) {
        ctx.addIssue({ code: 'custom', path: ['organisation'], message: 'Enter your organisation, or tick “I’m enquiring as an individual”.' });
      }
    }),
  scope: z.object({
    deliverables: z.array(str(160)).max(60).default([]),
    channels: optStr(600),
    markets: optStr(600),
    integrations: optStr(800),
  }),
  timing: z.object({
    timeframe: z.enum(ids(TIMEFRAMES), 'Choose a timeframe, or “Not sure yet”.'),
    dependency: optStr(600),
    budget: z.enum(ids(BUDGET_OPTIONS)).optional(),
  }),
  contact: z.object({
    name: nameField,
    email: emailField,
    role: optStr(120),
    country: optStr(80),
    timeZone: timeZoneField,
    phone: phoneField,
  }),
} as const;
export type ProjectStepId = keyof typeof projectSteps;

export const projectEnquirySchema = z.object({
  type: z.literal('project'),
  ...projectSteps,
  consent: consentField,
});

/** Topics offered in the Contact request box; partnerships route to their own pipeline. */
export const CONTACT_TOPICS = ['project', 'partnership', 'press', 'other'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];
export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = { project: 'A project', partnership: 'A partnership', press: 'Press or speaking', other: 'Something else' };

export const contactEnquirySchema = z.object({
  type: z.enum(['general', 'partnership']),
  topic: z.enum(CONTACT_TOPICS).optional(),
  subject: optStr(140),
  name: nameField,
  email: emailField,
  organisation: optStr(160),
  capability: optStr(600),
  message: str(4000).min(10, 'Please add a short message (at least 10 characters).'),
  consent: consentField,
});

export const callRequestSchema = z.object({
  type: z.literal('call-request'),
  name: nameField,
  email: emailField,
  organisation: optStr(160),
  timeZone: timeZoneField,
  windows: z.array(z.enum(ids(CALL_WINDOWS))).min(1, 'Choose at least one time that could work.'),
  topic: z.enum(INTENT_OPTIONS).optional(),
  notes: optStr(2000),
  consent: consentField,
});

export const enquiryPayloadSchema = z.union([projectEnquirySchema, contactEnquirySchema, callRequestSchema]);
export type ProjectEnquiry = z.infer<typeof projectEnquirySchema>;
export type ContactEnquiry = z.infer<typeof contactEnquirySchema>;
export type CallRequest = z.infer<typeof callRequestSchema>;
export type EnquiryPayload = ProjectEnquiry | ContactEnquiry | CallRequest;
export type EnquiryKind = EnquiryPayload['type'];

/** Envelope adds anti-abuse metadata that never reaches the CRM. */
export const enquiryEnvelopeSchema = z.object({
  idempotencyKey: z.string().regex(/^[A-Za-z0-9-]{16,80}$/, 'Invalid request key.'),
  startedAt: z.number().int().positive(),
  website: z.string().max(200).optional().default(''), // honeypot: real people leave it empty
  source: z.object({ route: str(200), utm: z.record(z.string().max(40), z.string().max(120)).optional() }).optional(),
  payload: z.unknown(),
});

export function schemaFor(type: unknown) {
  if (type === 'project') return projectEnquirySchema;
  if (type === 'call-request') return callRequestSchema;
  if (type === 'general' || type === 'partnership') return contactEnquirySchema;
  return null;
}

/** Pipeline routing (V10 §13): partner enquiries never mix with client opportunities. */
export function pipelineFor(type: EnquiryKind): 'projects' | 'partners' | 'general' {
  if (type === 'partnership') return 'partners';
  if (type === 'general') return 'general';
  return 'projects';
}

export type FieldErrors = Record<string, string>;
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export type EnquiryAccepted = {
  ok: true;
  reference: string;
  receivedAt: string;
  pipeline: 'projects' | 'partners' | 'general';
  /** Truthful downstream status: "queued" means accepted for sending, not delivered. */
  notifications: { receiptEmail: 'queued' | 'not-configured'; studioEmail: 'queued' | 'not-configured' };
  replayed?: boolean;
};
export type ApiError = { ok: false; error: 'validation' | 'rate_limited' | 'rejected' | 'unavailable' | 'not_found' | 'conflict' | 'server_error'; message: string; fieldErrors?: FieldErrors; retryAfter?: number };
