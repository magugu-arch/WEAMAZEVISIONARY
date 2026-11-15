import { useEffect, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { CONTACT_TOPICS, CONTACT_TOPIC_LABELS, contactEnquirySchema, toFieldErrors } from '@shared/enquiry';
import type { ContactTopic, EnquiryAccepted } from '@shared/enquiry';
import { Checkbox, ChoiceGroup, ErrorSummary, Honeypot, TextArea, TextField } from '@/components/forms/Field';
import { Alert } from '@/components/ui/Alert';
import { AppLink } from '@/components/ui/AppLink';
import { Button } from '@/components/ui/Button';
import { apiRequest, newIdempotencyKey } from '@/lib/api';
import type { ApiResult } from '@/lib/api';
import { Icon } from '@/lib/icon';
import { mailtoHref, requestText } from '@/lib/mailto';
import type { RequestDraft } from '@/lib/mailto';

const KEY = 'wv:contact-request';
const MAX = 4000;
const LABELS: Record<string, string> = { topic: 'Topic', name: 'Your name', email: 'Email', organisation: 'Organisation', subject: 'Subject', capability: 'Capability you need', message: 'Your request', consent: 'Consent' };
const EMPTY: RequestDraft = { topic: 'project', name: '', email: '', organisation: '', subject: '', message: '', capability: '' };
const HINTS: Record<ContactTopic, string> = {
  project: 'What you want to make, who it is for, and any timing that matters. For a fuller brief, use Start a project.',
  partnership: 'Agencies and production partners: the work, the capability you need and any confidentiality requirements.',
  press: 'The publication or event, the date and what you would like from us.',
  other: 'Anything else you would like to ask.',
};

/**
 * The Contact page's request box: a calm, email-like composer addressed to the studio.
 * - Send request: stored by the server under a reference; the studio inbox gets the full
 *   request with Reply set to the sender once email is configured (B-10).
 * - Open in your email app: the same request as a mailto link to the studio address,
 *   which also works when the server cannot be reached. Long requests are copied to the
 *   clipboard first, because some email apps cut long links short.
 * The draft is kept in session storage (this tab only) until it is sent.
 */
export function RequestComposer({ to }: { to: string }) {
  const [draft, setDraft] = useState<RequestDraft>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResult<EnquiryAccepted> | null>(null);
  const [hp, setHp] = useState('');
  const [note, setNote] = useState('');
  const meta = useRef<{ key: string; startedAt: number } | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    meta.current = { key: newIdempotencyKey(), startedAt: Date.now() };
    let saved: Partial<RequestDraft> | null = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Partial<RequestDraft> | null; } catch { /* storage unavailable */ }
    const deepLink = new URLSearchParams(window.location.search).get('type') === 'partnership';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore a draft or deep link after hydration
    setDraft((d) => ({ ...d, ...(saved ?? {}), ...(deepLink ? { topic: 'partnership' as const } : {}) }));
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try { sessionStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* storage unavailable */ }
  }, [draft]);

  const set = <K extends keyof RequestDraft>(k: K, v: RequestDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const mail = mailtoHref(to, draft);
  const announce = (text: string) => { setNote(text); window.setTimeout(() => setNote(''), 6000); };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  };
  // Long requests travel on the clipboard; the link itself still opens a new email.
  const onMail = async () => {
    if (!mail.truncated) return;
    const ok = await copy(requestText(draft));
    announce(ok ? 'Your request is long, so it has been copied. Paste it into the email.' : 'Your request is too long for some email apps. Copy it from the box and paste it into the email.');
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = {
      type: draft.topic === 'partnership' ? 'partnership' : 'general',
      topic: draft.topic,
      subject: draft.subject,
      name: draft.name,
      email: draft.email,
      organisation: draft.organisation,
      capability: draft.topic === 'partnership' ? draft.capability : '',
      message: draft.message,
      consent,
    };
    const v = contactEnquirySchema.safeParse(payload);
    if (!v.success) {
      setErrors(toFieldErrors(v.error));
      requestAnimationFrame(() => document.getElementById('error-summary')?.focus());
      return;
    }
    setErrors({});
    setSubmitting(true);
    const res = await apiRequest<EnquiryAccepted>('/api/enquiries', { body: { idempotencyKey: meta.current!.key, startedAt: meta.current!.startedAt, website: hp, source: { route: '/contact' }, payload: v.data } });
    setSubmitting(false);
    setResult(res);
    if (!res.ok && res.kind === 'validation' && res.fieldErrors) setErrors(res.fieldErrors);
    if (res.ok) {
      try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
      requestAnimationFrame(() => document.getElementById('contact-done')?.focus());
    }
  };

  const reset = () => {
    setDraft(EMPTY);
    setConsent(false);
    setResult(null);
    meta.current = { key: newIdempotencyKey(), startedAt: Date.now() };
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[name="topic"]')?.focus());
  };

  const left = MAX - draft.message.length;
  const mailLink = (label: string) => (
    <a href={mail.href} onClick={() => void onMail()} className="t-small inline-flex min-h-11 items-center gap-2 font-medium underline-offset-4 hover:underline">
      <Icon as={Mail} size={16} /> {label}
    </a>
  );

  return (
    <div className="border border-rule-strong">
      {/* The envelope: who the request is going to, before a single field is filled. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule px-5 py-4 md:px-8">
        <p className="t-label text-2">New request</p>
        <p className="t-small min-w-0"><span className="text-2 mr-3">To</span><span className="[overflow-wrap:anywhere]">WeAmaze Visionary &lt;{to}&gt;</span></p>
      </div>

      {result?.ok ? (
        <div id="contact-done" tabIndex={-1} className="space-y-6 px-5 py-8 outline-none md:px-8">
          <Alert tone="success" title="Request sent">
            <p>
              Reference <span className="font-mono text-ivory" data-testid="contact-reference">{result.data.reference}</span>. It is stored securely and will be read by the studio.
              {result.data.notifications.studioEmail === 'queued' ? ` A copy is on its way to ${to}.` : ''}
              {result.data.notifications.receiptEmail === 'queued' ? ' A confirmation is on its way to your inbox.' : ''}
            </p>
          </Alert>
          <Button variant="secondary" icon="none" onClick={reset}>Write another request</Button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} aria-labelledby="form-title" className="relative space-y-8 px-5 py-8 md:px-8">
          <Honeypot value={hp} onChange={setHp} />
          {Object.keys(errors).length ? <ErrorSummary errors={errors} labels={LABELS} /> : null}
          <ChoiceGroup<ContactTopic>
            legend="What is it about?"
            name="topic"
            required
            options={CONTACT_TOPICS.map((t) => ({ value: t, label: CONTACT_TOPIC_LABELS[t] }))}
            value={[draft.topic]}
            onChange={(v) => set('topic', v[0] ?? 'project')}
          />
          <div className="grid gap-8 md:grid-cols-2">
            <TextField label="Your name" name="name" required autoComplete="name" value={draft.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={120} />
            <TextField label="Email" name="email" type="email" inputMode="email" required autoComplete="email" spellCheck={false} value={draft.email} onChange={(e) => set('email', e.target.value)} error={errors.email} maxLength={254} />
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <TextField label="Organisation" name="organisation" autoComplete="organization" value={draft.organisation} onChange={(e) => set('organisation', e.target.value)} maxLength={160} />
            <TextField label="Subject" name="subject" placeholder={`${CONTACT_TOPIC_LABELS[draft.topic]} request`} value={draft.subject} onChange={(e) => set('subject', e.target.value)} error={errors.subject} maxLength={140} />
          </div>
          {draft.topic === 'partnership' ? (
            <TextArea label="Capability you need" name="capability" rows={3} hint="For example: AI-assisted film production, motion design or web build support." value={draft.capability} onChange={(e) => set('capability', e.target.value)} maxLength={600} />
          ) : null}
          <div>
            <TextArea label="Your request" name="message" required rows={8} hint={`${HINTS[draft.topic]} Please keep confidential details for a later conversation.`} value={draft.message} onChange={(e) => set('message', e.target.value)} error={errors.message} maxLength={MAX} />
            <p aria-hidden="true" className={`t-meta mt-2 text-right ${left < 200 ? 'text-ivory' : 'text-2'}`}>{draft.message.length.toLocaleString('en-GB')} / {MAX.toLocaleString('en-GB')}</p>
            <p role="status" className="sr-only">{left < 200 ? `${left} characters left` : ''}</p>
          </div>
          <Checkbox name="consent" checked={consent} onChange={setConsent} error={errors.consent} label={<>I agree that WeAmaze Visionary may use these details to respond. See the <AppLink to="/privacy" className="underline underline-offset-4">privacy notice</AppLink>.</>} />
          {result && !result.ok && result.kind !== 'validation' ? (
            <Alert tone="error" title="Your request has not been sent">
              <p>{result.message} What you wrote is still here.</p>
              <p className="mt-2">{mailLink('Send it from your email app instead')}</p>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" loading={submitting} loadingLabel="Sending…" icon="arrow">{result && !result.ok ? 'Try again' : 'Send request'}</Button>
            {mailLink('Open in your email app')}
          </div>
          {note ? <p className="t-small border-l border-gold pl-4" role="status">{note}</p> : null}
          <p className="t-caption text-2">Your draft stays in this browser tab until you send it.</p>
        </form>
      )}
    </div>
  );
}
