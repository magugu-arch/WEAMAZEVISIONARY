import type { LeadRecord } from '../lib/leadStore';
import type { ServerEnv } from '../lib/env';
import { sign } from '../lib/signature';

/**
 * CRM adapter. The "webhook" adapter posts a signed, mapped lead to a URL per
 * pipeline (HubSpot workflows, Pipedrive, Zapier, Make, n8n…). A lead is only
 * marked "sent" when the endpoint answers 2xx (V10 §13: no false claims).
 */
export interface CrmAdapter {
  readonly name: string;
  readonly configured: boolean;
  send(lead: LeadRecord): Promise<void>;
}

export function mapLeadForCrm(lead: LeadRecord) {
  const p = lead.payload;
  const base = { reference: lead.reference, received_at: lead.receivedAt, pipeline: lead.pipeline, stage: 'New', enquiry_type: lead.type, source_route: lead.source.route ?? null, utm: lead.source.utm ?? null };
  switch (p.type) {
    case 'project':
      return { ...base, contact: { name: p.contact.name, email: p.contact.email, role: p.contact.role, phone: p.contact.phone, country: p.contact.country, time_zone: p.contact.timeZone }, organisation: p.context.isIndividual ? null : p.context.organisation, services: p.intent.services, outcome: p.intent.outcome, sector: p.context.sector, audience: p.context.audience, background: p.context.background, deliverables: p.scope.deliverables, channels: p.scope.channels, markets: p.scope.markets, integrations: p.scope.integrations, timeframe: p.timing.timeframe, launch_dependency: p.timing.dependency, budget_preference: p.timing.budget ?? null };
    case 'call-request':
      return { ...base, contact: { name: p.name, email: p.email, time_zone: p.timeZone }, organisation: p.organisation, preferred_windows: p.windows, topic: p.topic ?? null, notes: p.notes };
    default:
      return { ...base, contact: { name: p.name, email: p.email }, organisation: p.organisation, capability: p.capability, message: p.message };
  }
}

class WebhookCrm implements CrmAdapter {
  readonly name = 'webhook';
  constructor(private env: ServerEnv) {}
  get configured() {
    return Boolean(this.env.CRM_WEBHOOK_SECRET && (this.env.CRM_WEBHOOK_URL_PROJECTS || this.env.CRM_WEBHOOK_URL_PARTNERS || this.env.CRM_WEBHOOK_URL_GENERAL));
  }
  private urlFor(pipeline: LeadRecord['pipeline']) {
    return pipeline === 'partners' ? this.env.CRM_WEBHOOK_URL_PARTNERS : pipeline === 'general' ? (this.env.CRM_WEBHOOK_URL_GENERAL ?? this.env.CRM_WEBHOOK_URL_PROJECTS) : this.env.CRM_WEBHOOK_URL_PROJECTS;
  }
  async send(lead: LeadRecord) {
    const url = this.urlFor(lead.pipeline);
    if (!url || !this.env.CRM_WEBHOOK_SECRET) throw new Error('crm_not_configured_for_pipeline');
    const body = JSON.stringify(mapLeadForCrm(lead));
    const ts = Math.floor(Date.now() / 1000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-wv-timestamp': String(ts), 'x-wv-signature': `sha256=${sign(this.env.CRM_WEBHOOK_SECRET, ts, body)}`, 'idempotency-key': lead.reference },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`crm_http_${res.status}`);
  }
}

class NoCrm implements CrmAdapter {
  readonly name = 'none';
  readonly configured = false;
  async send() {
    throw new Error('crm_not_configured');
  }
}

export function createCrm(env: ServerEnv): CrmAdapter {
  return env.CRM_PROVIDER === 'webhook' ? new WebhookCrm(env) : new NoCrm();
}
