import { describe, expect, it } from 'vitest';
import { contactEnquirySchema } from '@shared/enquiry';
import { buildLead } from '@server/lib/leadStore';
import { operatorMessage } from '@server/integrations/email';
import { mailtoHref, PASTE_PROMPT, requestSubject, requestText } from '@/lib/mailto';
import type { RequestDraft } from '@/lib/mailto';
import { publicEmail } from '@/content/settings';

const TO = 'weamazevisionary@gmail.com';
const draft: RequestDraft = { topic: 'project', name: 'Ama Owusu', email: 'ama@example.com', organisation: 'Example Studio', subject: '', message: 'We would like a short film for a product launch in March.', capability: '' };
const parse = (href: string) => {
  const u = new URL(href);
  return { to: u.pathname, subject: u.searchParams.get('subject') ?? '', body: u.searchParams.get('body') ?? '' };
};

describe('Contact request box', () => {
  it('addresses requests to the studio inbox the owner supplied', () => {
    expect(publicEmail()).toBe(TO);
  });

  it('builds a ready-to-send email: subject from the topic and name, message first, CRLF line breaks', () => {
    expect(requestSubject(draft)).toBe('A project request from Ama Owusu');
    expect(requestSubject({ ...draft, subject: '  Launch film  ' })).toBe('Launch film');
    const text = requestText(draft);
    expect(text.startsWith(draft.message)).toBe(true);
    expect(text).toContain('\r\nName: Ama Owusu\r\nEmail: ama@example.com\r\nOrganisation: Example Studio\r\nTopic: A project');
    expect(text).not.toContain('Capability');
    expect(requestText({ ...draft, topic: 'partnership', capability: 'Motion design' })).toContain('Capability needed: Motion design');
    const { href, truncated } = mailtoHref(TO, draft);
    expect(truncated).toBe(false);
    const m = parse(href);
    expect(m.to).toBe(TO);
    expect(m.subject).toBe('A project request from Ama Owusu');
    expect(m.body).toBe(text);
    expect(href).not.toContain('+'); // spaces are %20, never a literal plus
  });

  it('moves long requests to the clipboard instead of a link some email apps would cut short', () => {
    const long = { ...draft, message: 'A considered brief. '.repeat(150) };
    const { href, truncated } = mailtoHref(TO, long);
    expect(truncated).toBe(true);
    expect(href.length).toBeLessThan(1800);
    expect(parse(href).body).toBe(PASTE_PROMPT);
  });

  it('the studio email carries the whole request, and Reply goes to the sender', () => {
    const payload = contactEnquirySchema.parse({ type: 'general', topic: 'press', subject: 'Interview request', name: 'Lee Chen', email: 'lee@paper.example', organisation: 'The Paper', capability: '', message: 'Could we interview the founder about creative technology?', consent: true });
    const lead = buildLead(payload, 'WV-GEN-2026-ABCDEF', { route: '/contact' }, { crm: false, email: true, operator: true });
    const msg = operatorMessage(lead, TO);
    expect(msg.to).toBe(TO);
    expect(msg.replyTo).toBe('lee@paper.example');
    expect(msg.subject).toBe('Interview request — Lee Chen (WV-GEN-2026-ABCDEF)');
    expect(msg.text).toContain('From: Lee Chen <lee@paper.example>');
    expect(msg.text).toContain('Topic: Press or speaking');
    expect(msg.text).toContain('Could we interview the founder about creative technology?');
  });

  it('project briefs still alert with reference and routing only', () => {
    const lead = buildLead({ type: 'call-request', name: 'A', email: 'a@example.com', organisation: '', timeZone: 'Europe/London', windows: ['weekday-morning'], notes: '', consent: true } as never, 'WV-CAL-2026-ABCDEF', { route: '/book-a-call' }, { crm: false, email: true, operator: true });
    const msg = operatorMessage(lead, TO);
    expect(msg.replyTo).toBeUndefined();
    expect(msg.text).toContain('Reference: WV-CAL-2026-ABCDEF');
  });
});
