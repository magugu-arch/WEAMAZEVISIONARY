import { CONTACT_TOPIC_LABELS } from '@shared/enquiry';
import type { ContactTopic } from '@shared/enquiry';

/** What a visitor has written in the Contact request box. */
export type RequestDraft = { topic: ContactTopic; name: string; email: string; organisation: string; subject: string; message: string; capability: string };

/** The subject line: the visitor's own, or the topic and their name. */
export function requestSubject(d: RequestDraft): string {
  const own = d.subject.trim();
  if (own) return own;
  const name = d.name.trim();
  return `${CONTACT_TOPIC_LABELS[d.topic]} request${name ? ` from ${name}` : ''}`;
}

/** The email body: the message first, then who it is from, as plain text. */
export function requestText(d: RequestDraft): string {
  const lines = [d.message.trim(), '', '—'];
  if (d.name.trim()) lines.push(`Name: ${d.name.trim()}`);
  if (d.email.trim()) lines.push(`Email: ${d.email.trim()}`);
  if (d.organisation.trim()) lines.push(`Organisation: ${d.organisation.trim()}`);
  lines.push(`Topic: ${CONTACT_TOPIC_LABELS[d.topic]}`);
  if (d.topic === 'partnership' && d.capability.trim()) lines.push(`Capability needed: ${d.capability.trim()}`);
  return lines.join('\r\n'); // RFC 6068: line breaks in a mailto body are CRLF
}

/** Clipboard prompt used when the request is too long to travel inside a mailto link. */
export const PASTE_PROMPT = 'My request was copied to the clipboard. It is pasted below.\r\n\r\n';

/**
 * A mailto link addressed to the studio. Some email apps cut long links short, so above
 * `max` characters the body becomes a paste prompt and `truncated` tells the caller to
 * copy the full request to the clipboard first.
 */
export function mailtoHref(to: string, d: RequestDraft, max = 1800): { href: string; truncated: boolean } {
  const head = `mailto:${to}?subject=${encodeURIComponent(requestSubject(d))}`;
  const full = `${head}&body=${encodeURIComponent(requestText(d))}`;
  if (full.length <= max) return { href: full, truncated: false };
  return { href: `${head}&body=${encodeURIComponent(PASTE_PROMPT)}`, truncated: true };
}
