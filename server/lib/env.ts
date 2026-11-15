import { z } from 'zod';

/**
 * Server environment, validated at start-up. Secrets are read here only and
 * never sent to the browser. See .env.example for names and meaning.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(4173),
  PUBLIC_SITE_ENV: z.enum(['development', 'staging', 'production']).default('staging'),
  PUBLIC_SITE_URL: z.string().url().default('https://weamazevisionary.com'),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(1).max(5).default(1),
  FORCE_HSTS: z.enum(['true', 'false']).default('false'),

  // Set by Fly.io on every machine (server/lib/region.ts). Unset elsewhere: single primary.
  PRIMARY_REGION: z.string().max(12).optional(),
  FLY_REGION: z.string().max(12).optional(),
  FLY_PROCESS_GROUP: z.string().max(40).optional(),

  LEAD_STORE_DIR: z.string().default('data'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(600),
  MIN_FORM_SECONDS: z.coerce.number().int().nonnegative().default(3),

  CRM_PROVIDER: z.enum(['none', 'webhook']).default('none'),
  CRM_WEBHOOK_URL_PROJECTS: z.string().url().optional(),
  CRM_WEBHOOK_URL_PARTNERS: z.string().url().optional(),
  CRM_WEBHOOK_URL_GENERAL: z.string().url().optional(),
  CRM_WEBHOOK_SECRET: z.string().min(16).optional(),

  EMAIL_PROVIDER: z.enum(['none', 'log', 'resend']).default('none'),
  RESEND_API_KEY: z.string().min(10).optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_REPLY_TO: z.string().optional(),
  OPERATOR_NOTIFICATION_EMAIL: z.string().optional(),

  BOOKING_PROVIDER: z.enum(['none', 'mock']).default('none'),
  BOOKING_MOCK_HOST_TZ: z.string().default('Africa/Johannesburg'),
  BOOKING_WEBHOOK_SECRET: z.string().min(16).optional(),
});

export type ServerEnv = z.infer<typeof schema>;
let cached: ServerEnv | null = null;

/** Parses an explicit source (tests, tooling). Throws on invalid values. */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return schema.parse(source);
}

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid server environment: ${problems}`);
  }
  cached = parsed.data;
  return cached;
}
/** Test hook. */
export function resetEnvCache() {
  cached = null;
}
