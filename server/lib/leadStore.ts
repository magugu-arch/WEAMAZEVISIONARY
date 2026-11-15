import { createHash, randomBytes } from 'node:crypto';
import { join } from 'node:path';
import type { EnquiryPayload } from '@shared/enquiry';
import { pipelineFor } from '@shared/enquiry';
import { createExclusive, readJson, remove, writeJsonDurable } from './fsStore';

export type LeadRecord = {
  reference: string;
  receivedAt: string;
  type: EnquiryPayload['type'];
  pipeline: 'projects' | 'partners' | 'general';
  status: 'new';
  owner: null;
  payload: EnquiryPayload;
  source: { route?: string; utm?: Record<string, string> };
  downstream: { crm: 'pending' | 'sent' | 'failed' | 'not-configured'; receiptEmail: 'pending' | 'sent' | 'failed' | 'not-configured'; operatorEmail: 'pending' | 'sent' | 'failed' | 'not-configured' };
};

/** Human-readable, non-sequential reference, e.g. WV-ENQ-2026-7KQ4M9. */
export function newReference(type: EnquiryPayload['type'], now = new Date()): string {
  const prefix = type === 'partnership' ? 'WV-PTR' : type === 'call-request' ? 'WV-CALL' : type === 'general' ? 'WV-MSG' : 'WV-ENQ';
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = randomBytes(6);
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `${prefix}-${now.getUTCFullYear()}-${code}`;
}

export interface LeadStore {
  /** Returns the existing reference if this idempotency key was already accepted with the same body. */
  findByIdempotencyKey(key: string): Promise<{ reference: string; bodyHash: string } | null>;
  /** Durably stores the lead. Throws on failure; never resolves before the write is on disk. */
  save(lead: LeadRecord, idempotencyKey: string, bodyHash: string): Promise<'created' | 'duplicate'>;
  get(reference: string): Promise<LeadRecord | null>;
  update(reference: string, patch: Partial<LeadRecord['downstream']>): Promise<void>;
}

/**
 * File-backed store for a single Node host (one JSON file per lead, mode 0600).
 * Swap for a database adapter when the host is chosen (B-07).
 */
export class FileLeadStore implements LeadStore {
  constructor(private dir: string) {}
  private idemPath(key: string) {
    return join(this.dir, 'idempotency', `${createHash('sha256').update(key).digest('hex')}.json`);
  }
  private leadPath(ref: string) {
    return join(this.dir, 'leads', `${ref}.json`);
  }
  async findByIdempotencyKey(key: string) {
    return readJson<{ reference: string; bodyHash: string }>(this.idemPath(key));
  }
  async save(lead: LeadRecord, key: string, bodyHash: string) {
    const claimed = await createExclusive(this.idemPath(key), { reference: lead.reference, bodyHash, at: lead.receivedAt });
    if (!claimed) return 'duplicate';
    try {
      await writeJsonDurable(this.leadPath(lead.reference), lead);
    } catch (e) {
      await remove(this.idemPath(key)); // release the claim so the visitor can retry safely
      throw e;
    }
    return 'created';
  }
  async get(ref: string) {
    return readJson<LeadRecord>(this.leadPath(ref));
  }
  async update(ref: string, patch: Partial<LeadRecord['downstream']>) {
    const lead = await this.get(ref);
    if (!lead) return;
    lead.downstream = { ...lead.downstream, ...patch };
    await writeJsonDurable(this.leadPath(ref), lead);
  }
}

export function buildLead(payload: EnquiryPayload, reference: string, source: LeadRecord['source'], configured: { crm: boolean; email: boolean; operator: boolean }): LeadRecord {
  return {
    reference,
    receivedAt: new Date().toISOString(),
    type: payload.type,
    pipeline: pipelineFor(payload.type),
    status: 'new',
    owner: null,
    payload,
    source,
    downstream: {
      crm: configured.crm ? 'pending' : 'not-configured',
      receiptEmail: configured.email ? 'pending' : 'not-configured',
      operatorEmail: configured.email && configured.operator ? 'pending' : 'not-configured',
    },
  };
}
