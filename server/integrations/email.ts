import type { LeadRecord } from '../lib/leadStore';
import type { ServerEnv } from '../lib/env';
import { log } from '../lib/log';
import { CONTACT_TOPIC_LABELS } from '@shared/enquiry';

/**
 * Transactional email. "resend" calls the Resend HTTP API and requires a
 * verified sender domain; it is implemented but UNTESTED until credentials are
 * supplied (B-10). "log" is for development only and sends nothing.
 */
export type EmailMessage = { to: string; subject: string; text: string; replyTo?: string };
export interface EmailAdapter {
  readonly name: string;
  readonly configured: boolean;
  send(msg: EmailMessage): Promise<void>;
}

class ResendEmail implements EmailAdapter {
  readonly name = 'resend';
  constructor(private env: ServerEnv) {}
  get configured() {
    return Boolean(this.env.RESEND_API_KEY && this.env.EMAIL_FROM);
  }
  async send(msg: EmailMessage) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: this.env.EMAIL_FROM, to: [msg.to], subject: msg.subject, text: msg.text, ...(msg.replyTo || this.env.EMAIL_REPLY_TO ? { reply_to: msg.replyTo ?? this.env.EMAIL_REPLY_TO } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`email_http_${res.status}`);
  }
}
class LogEmail implements EmailAdapter {
  readonly name = 'log';
  constructor(private env: ServerEnv) {}
  get configured() {
    return this.env.NODE_ENV !== 'production';
  }
  async send(msg: EmailMessage) {
    log('info', 'email.dev_log_only', { subject: msg.subject, bytes: msg.text.length });
  }
}
class NoEmail implements EmailAdapter {
  readonly name = 'none';
  readonly configured = false;
  async send() {
    throw new Error('email_not_configured');
  }
}
export function createEmail(env: ServerEnv): EmailAdapter {
  if (env.EMAIL_PROVIDER === 'resend') return new ResendEmail(env);
  if (env.EMAIL_PROVIDER === 'log') return new LogEmail(env);
  return new NoEmail();
}

const LABEL: Record<LeadRecord['type'], string> = { project: 'project brief', 'call-request': 'call request', general: 'message', partnership: 'partnership enquiry' };
function visitorEmail(lead: LeadRecord): { email: string; name: string } {
  const p = lead.payload;
  return p.type === 'project' ? { email: p.contact.email, name: p.contact.name } : { email: p.email, name: p.name };
}

/** Receipt to the visitor. States only what is true: received and stored. */
export function receiptMessage(lead: LeadRecord): EmailMessage {
  const v = visitorEmail(lead);
  return {
    to: v.email,
    subject: `We received your ${LABEL[lead.type]} — ${lead.reference}`,
    text: [
      `Hello ${v.name},`,
      '',
      `Thank you for your ${LABEL[lead.type]}. It has been received and stored securely under reference ${lead.reference}.`,
      'The studio will review it and reply by email. Nothing is binding until a written proposal is agreed.',
      '',
      'WeAmaze Visionary',
      'Creative Intelligence, Made Real.',
    ].join('\n'),
  };
}
const TOPIC = CONTACT_TOPIC_LABELS;

/**
 * Studio alert. A request written in the Contact box arrives as a complete email the
 * studio can answer with Reply (reply-to is the sender). Project briefs and call
 * requests carry reference and routing only; the full brief stays in the store/CRM.
 */
export function operatorMessage(lead: LeadRecord, to: string): EmailMessage {
  const p = lead.payload;
  if (p.type === 'general' || p.type === 'partnership') {
    const topic = p.topic ? TOPIC[p.topic] : p.type === 'partnership' ? TOPIC.partnership : 'General';
    return {
      to,
      replyTo: p.email,
      subject: `${p.subject ? p.subject : `${topic} request`} — ${p.name} (${lead.reference})`,
      text: [
        `New request from the website Contact page.`,
        '',
        `From: ${p.name} <${p.email}>`,
        ...(p.organisation ? [`Organisation: ${p.organisation}`] : []),
        `Topic: ${topic}`,
        ...(p.subject ? [`Subject: ${p.subject}`] : []),
        `Reference: ${lead.reference}`,
        `Received: ${lead.receivedAt}`,
        '',
        p.message,
        ...(p.capability ? ['', `Capability needed: ${p.capability}`] : []),
        '',
        '—',
        'Reply to this email to answer the sender directly. The request is also stored in the lead store.',
      ].join('\n'),
    };
  }
  return {
    to,
    subject: `[${lead.pipeline}] New ${LABEL[lead.type]} ${lead.reference}`,
    text: [`New ${LABEL[lead.type]} received.`, `Reference: ${lead.reference}`, `Pipeline: ${lead.pipeline}`, `Received: ${lead.receivedAt}`, `CRM status: ${lead.downstream.crm}`, '', 'Open the CRM or lead store to review and assign an owner.'].join('\n'),
  };
}
export function failureAlert(to: string, job: { kind: string; reference: string; attempts: number; lastError: string }): EmailMessage {
  return { to, subject: `[action needed] ${job.kind} failed for ${job.reference}`, text: `Job ${job.kind} for ${job.reference} failed ${job.attempts} times and has stopped retrying.\nLast error: ${job.lastError}\nThe enquiry itself is stored safely; resend it manually from the lead store.` };
}
