import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { CrmAdapter } from '../integrations/crm';
import type { EmailAdapter } from '../integrations/email';
import { failureAlert, operatorMessage, receiptMessage } from '../integrations/email';
import type { LeadStore } from './leadStore';
import { listJson, readJson, remove, writeJsonDurable } from './fsStore';
import { log } from './log';

export type JobKind = 'crm.send' | 'email.receipt' | 'email.operator';
export type Job = { id: string; kind: JobKind; reference: string; attempts: number; nextAttemptAt: number; lastError?: string; createdAt: string };

/** Bounded retry schedule: immediately, 1 min, 5 min, 15 min, 1 h, 6 h — then dead-letter + operator alert. */
export const BACKOFF_MS = [0, 60_000, 300_000, 900_000, 3_600_000, 21_600_000];

/**
 * Durable outbox. Downstream CRM and email work happens after the enquiry is
 * safely stored, so a provider outage never loses a lead (V11.16).
 */
export class Outbox {
  private running = false;
  private timer: NodeJS.Timeout | null = null;
  constructor(
    private dir: string,
    private deps: { store: LeadStore; crm: CrmAdapter; email: EmailAdapter; operatorEmail?: string },
  ) {}
  private path(id: string) {
    return join(this.dir, 'outbox', `${id}.json`);
  }
  async enqueue(kind: JobKind, reference: string) {
    const job: Job = { id: randomUUID(), kind, reference, attempts: 0, nextAttemptAt: Date.now(), createdAt: new Date().toISOString() };
    await writeJsonDurable(this.path(job.id), job);
    setImmediate(() => void this.drain());
  }
  start(intervalMs = 15_000) {
    this.timer = setInterval(() => void this.drain(), intervalMs);
    this.timer.unref();
    void this.drain();
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
  }
  async drain(now = Date.now()) {
    if (this.running) return;
    this.running = true;
    try {
      for (const file of await listJson(join(this.dir, 'outbox'))) {
        const job = await readJson<Job>(file);
        if (!job || job.nextAttemptAt > now) continue;
        await this.run(job);
      }
    } finally {
      this.running = false;
    }
  }
  private async run(job: Job) {
    const lead = await this.deps.store.get(job.reference);
    if (!lead) {
      log('error', 'outbox.lead_missing', { job: job.kind, reference: job.reference });
      await remove(this.path(job.id));
      return;
    }
    const field = job.kind === 'crm.send' ? 'crm' : job.kind === 'email.receipt' ? 'receiptEmail' : 'operatorEmail';
    try {
      if (job.kind === 'crm.send') await this.deps.crm.send(lead);
      else if (job.kind === 'email.receipt') await this.deps.email.send(receiptMessage(lead));
      else if (this.deps.operatorEmail) await this.deps.email.send(operatorMessage(lead, this.deps.operatorEmail));
      await this.deps.store.update(job.reference, { [field]: 'sent' });
      await remove(this.path(job.id));
      log('info', 'outbox.sent', { job: job.kind, reference: job.reference, attempts: job.attempts + 1 });
    } catch (e) {
      job.attempts += 1;
      job.lastError = e instanceof Error ? e.message.slice(0, 200) : 'unknown';
      if (job.attempts >= BACKOFF_MS.length) {
        await this.deps.store.update(job.reference, { [field]: 'failed' });
        await writeJsonDurable(join(this.dir, 'outbox-dead', `${job.id}.json`), job);
        await remove(this.path(job.id));
        log('error', 'outbox.dead_letter', { job: job.kind, reference: job.reference, attempts: job.attempts, error: job.lastError });
        if (this.deps.operatorEmail && this.deps.email.configured && job.kind !== 'email.operator') {
          await this.deps.email.send(failureAlert(this.deps.operatorEmail, { ...job, lastError: job.lastError ?? 'unknown' })).catch(() => {});
        }
      } else {
        job.nextAttemptAt = Date.now() + (BACKOFF_MS[job.attempts] ?? BACKOFF_MS[BACKOFF_MS.length - 1]!);
        await writeJsonDurable(this.path(job.id), job);
        log('warn', 'outbox.retry_scheduled', { job: job.kind, reference: job.reference, attempts: job.attempts, error: job.lastError });
      }
    }
  }
}
