import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowLeft, Pencil } from 'lucide-react';
import { BUDGET_OPTIONS, INTENT_OPTIONS, projectSteps, TIMEFRAMES, toFieldErrors } from '@shared/enquiry';
import type { EnquiryAccepted, IntentOption, ProjectStepId } from '@shared/enquiry';
import { isValidTimeZone, prettyZone, timeZoneOptions } from '@shared/timezone';
import { Container, Section } from '@/components/layout/Section';
import { Checkbox, ChoiceGroup, ErrorSummary, Honeypot, SelectField, TextArea, TextField } from '@/components/forms/Field';
import { Alert } from '@/components/ui/Alert';
import { AppLink } from '@/components/ui/AppLink';
import { Button, ButtonLink } from '@/components/ui/Button';
import { publishedServices, serviceName } from '@/content/services';
import { track } from '@/lib/analytics';
import { apiRequest, newIdempotencyKey } from '@/lib/api';
import type { ApiResult } from '@/lib/api';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';
import { PageHeader } from '../shared/PageHeader';

type Draft = {
  intent: { services: IntentOption[]; outcome: string };
  context: { isIndividual: boolean; organisation: string; sector: string; audience: string; background: string };
  scope: { deliverables: string[]; channels: string; markets: string; integrations: string };
  timing: { timeframe: string; dependency: string; budget: string };
  contact: { name: string; email: string; role: string; country: string; timeZone: string; phone: string };
  consent: boolean;
};
const EMPTY: Draft = {
  intent: { services: [], outcome: '' },
  context: { isIndividual: false, organisation: '', sector: '', audience: '', background: '' },
  scope: { deliverables: [], channels: '', markets: '', integrations: '' },
  timing: { timeframe: '', dependency: '', budget: '' },
  contact: { name: '', email: '', role: '', country: '', timeZone: '', phone: '' },
  consent: false,
};
const STEPS: { id: ProjectStepId | 'review'; title: string; short: string }[] = [
  { id: 'intent', title: 'What would you like to make?', short: 'Intent' },
  { id: 'context', title: 'Tell us about the context', short: 'Context' },
  { id: 'scope', title: 'What might the work include?', short: 'Scope' },
  { id: 'timing', title: 'Timing and investment', short: 'Timing' },
  { id: 'contact', title: 'How can we reach you?', short: 'Contact' },
  { id: 'review', title: 'Review your brief', short: 'Review' },
];
const LABELS: Record<string, string> = {
  'intent.services': 'Services', 'intent.outcome': 'Outcome', 'context.organisation': 'Organisation', 'context.background': 'Background', 'context.sector': 'Sector', 'context.audience': 'Audience',
  'scope.channels': 'Channels', 'scope.markets': 'Markets', 'scope.integrations': 'Integrations', 'timing.timeframe': 'Timeframe', 'timing.dependency': 'Dependency',
  'contact.name': 'Name', 'contact.email': 'Email', 'contact.role': 'Role', 'contact.country': 'Country', 'contact.timeZone': 'Time zone', 'contact.phone': 'Phone', consent: 'Consent',
};
const KEY = 'wv:brief-draft';
type Stored = { draft: Draft; idempotencyKey: string; startedAt: number };

const INTEGRATION_SERVICES = new Set(['websites-digital-experiences', 'apps-digital-products', 'ai-solutions-automation', 'digital-innovation-technology']);

/**
 * Progressive project brief (V10 §13, V11.16). Answers persist across steps,
 * browser back/forward and recoverable failures (session storage, cleared on
 * success). Success is shown only after the server durably accepts the brief.
 */
export default function ProjectBuilderPage() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [meta, setMeta] = useState<{ idempotencyKey: string; startedAt: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResult<EnquiryAccepted> | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  const stepId = (params.get('step') as (typeof STEPS)[number]['id'] | null) ?? 'intent';
  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.id === stepId));
  const step = STEPS[stepIndex]!;

  // Restore draft, preselect a service from ?service=, detect time zone.
  useEffect(() => {
    let stored: Stored | null = null;
    try { stored = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Stored | null; } catch { /* unavailable */ }
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
    const pre = params.get('service');
    const base = stored?.draft ?? EMPTY;
    const services = pre && (INTENT_OPTIONS as readonly string[]).includes(pre) && !base.intent.services.includes(pre as IntentOption) ? [...base.intent.services, pre as IntentOption] : base.intent.services;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from session storage
    setDraft({ ...base, intent: { ...base.intent, services }, contact: { ...base.contact, timeZone: base.contact.timeZone || (isValidTimeZone(tz) ? tz : '') } });
    setMeta(stored ? { idempotencyKey: stored.idempotencyKey, startedAt: stored.startedAt } : { idempotencyKey: newIdempotencyKey(), startedAt: Date.now() });
    restored.current = true;
    if (!stored) track({ name: 'project_builder_start', props: { source_route: document.referrer ? new URL(document.referrer).pathname : 'direct' } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change (session only; cleared on success).
  useEffect(() => {
    if (!restored.current || !meta) return;
    try { sessionStorage.setItem(KEY, JSON.stringify({ draft, ...meta } satisfies Stored)); } catch { /* storage unavailable */ }
  }, [draft, meta]);

  const goTo = useCallback((id: string, focus = true) => {
    setParams((p) => { const n = new URLSearchParams(p); n.set('step', id); n.delete('service'); return n; });
    setErrors({});
    if (focus) requestAnimationFrame(() => { headingRef.current?.focus(); window.scrollTo({ top: 0 }); });
  }, [setParams]);

  const patch = <K extends keyof Draft>(k: K, v: Partial<Draft[K]> | Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: typeof v === 'object' && !Array.isArray(v) && v !== null ? { ...(d[k] as object), ...(v as object) } : v }));

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs);
    requestAnimationFrame(() => summaryRef.current?.querySelector<HTMLElement>('#error-summary')?.focus());
  };

  const validateStep = (id: ProjectStepId): Record<string, string> => {
    const r = projectSteps[id].safeParse(id === 'timing' ? { ...draft.timing, budget: draft.timing.budget || undefined } : draft[id]);
    if (r.success) return {};
    const fe = toFieldErrors(r.error);
    return Object.fromEntries(Object.entries(fe).map(([k, v]) => [`${id}.${k}`, v]));
  };

  const next = () => {
    if (step.id === 'review') return;
    const errs = validateStep(step.id);
    if (Object.keys(errs).length) {
      for (const k of Object.keys(errs)) track({ name: 'project_builder_error', props: { step_id: step.id, field_code: k.split('.').pop() ?? k } });
      return showErrors(errs);
    }
    track({ name: 'project_builder_step_complete', props: { step_id: step.id, step_index: stepIndex + 1 } });
    goTo(STEPS[stepIndex + 1]!.id);
  };

  const submit = async () => {
    if (!meta) return;
    for (const s of STEPS.slice(0, -1)) {
      const errs = validateStep(s.id as ProjectStepId);
      if (Object.keys(errs).length) { goTo(s.id); return setTimeout(() => showErrors(errs), 50); }
    }
    if (!draft.consent) return showErrors({ consent: 'Please confirm you agree so we can respond.' });
    setSubmitting(true);
    setResult(null);
    track({ name: 'enquiry_submit_attempt', props: { service_count: draft.intent.services.length, source_route: '/start-a-project' } });
    const payload = { type: 'project', ...draft, timing: { ...draft.timing, budget: draft.timing.budget || undefined }, consent: draft.consent };
    const res = await apiRequest<EnquiryAccepted>('/api/enquiries', { body: { idempotencyKey: meta.idempotencyKey, startedAt: meta.startedAt, website: honeypot, source: { route: '/start-a-project' }, payload } });
    setSubmitting(false);
    setResult(res);
    if (res.ok) {
      try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
      track({ name: 'enquiry_received', props: { service_count: draft.intent.services.length, reference_type: 'project' } });
      requestAnimationFrame(() => { document.getElementById('confirmation-title')?.focus(); window.scrollTo({ top: 0 }); });
    } else if (res.kind === 'validation' && res.fieldErrors) {
      const first = STEPS.find((s) => Object.keys(res.fieldErrors!).some((k) => k.startsWith(`${s.id}.`)));
      if (first && first.id !== 'review') goTo(first.id);
      setTimeout(() => showErrors(res.fieldErrors!), 50);
    }
  };

  const startOver = () => {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    setDraft(EMPTY);
    setMeta({ idempotencyKey: newIdempotencyKey(), startedAt: Date.now() });
    setResult(null);
    goTo('intent');
  };

  const deliverableOptions = useMemo(() => {
    const items = new Set<string>();
    for (const s of draft.intent.services) publishedServices.find((x) => x.slug === s)?.deliverables.forEach((g) => g.items.forEach((i) => items.add(i)));
    return [...items].map((i) => ({ value: i, label: i }));
  }, [draft.intent.services]);
  const zones = useMemo(() => timeZoneOptions(draft.contact.timeZone), [draft.contact.timeZone]);

  if (result?.ok) return <Confirmation data={result.data} email={draft.contact.email} onNew={startOver} />;

  const e = (k: string) => errors[k];
  return (
    <>
      <PageHeader eyebrow="Start a Project" title="Tell us what you want to make." intro="Six short steps. You can go back and change any answer, and nothing is sent until you review it. “Not sure yet” is always a good answer." />
      <Section spacing="tight" className="pt-0 md:pt-0">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
            <nav aria-label="Brief progress" className="lg:col-span-3">
              <p className="t-meta text-2" aria-live="polite">Step {stepIndex + 1} of {STEPS.length}</p>
              <div className="mt-3 flex gap-1" aria-hidden="true">
                {STEPS.map((s, i) => <span key={s.id} className={cn('h-0.5 flex-1', i <= stepIndex ? 'bg-gold' : 'bg-[color-mix(in_srgb,var(--color-ivory)_18%,transparent)]')} />)}
              </div>
              <ol role="list" className="mt-6 hidden space-y-1 lg:block">
                {STEPS.map((s, i) => (
                  <li key={s.id}>
                    {i < stepIndex ? (
                      <button type="button" onClick={() => goTo(s.id)} className="t-small flex min-h-10 w-full items-center gap-3 text-left text-platinum hover:text-ivory">
                        <span className="t-meta">{String(i + 1).padStart(2, '0')}</span>{s.short}<span className="sr-only"> (completed, edit)</span>
                      </button>
                    ) : (
                      <span aria-current={i === stepIndex ? 'step' : undefined} className={cn('t-small flex min-h-10 items-center gap-3', i === stepIndex ? 'text-ivory' : 'text-platinum')}>
                        <span className="t-meta">{String(i + 1).padStart(2, '0')}</span>{s.short}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <form className="relative lg:col-span-8 lg:col-start-5" noValidate onSubmit={(ev) => { ev.preventDefault(); if (step.id === 'review') void submit(); else next(); }}>
              <Honeypot value={honeypot} onChange={setHoneypot} />
              <h2 ref={headingRef} tabIndex={-1} className="t-display-3 outline-none">{step.title}</h2>
              <div ref={summaryRef} className="mt-8 empty:hidden">{Object.keys(errors).length ? <ErrorSummary errors={errors} labels={LABELS} /> : null}</div>

              <div className="mt-8 space-y-10">
                {step.id === 'intent' ? (
                  <>
                    <ChoiceGroup<IntentOption>
                      legend="Which capabilities are you interested in?" name="services" required multiple hint="Choose as many as apply."
                      options={[...publishedServices.map((s) => ({ value: s.slug as IntentOption, label: s.name, description: s.descriptor })), { value: 'help-me-define-it' as IntentOption, label: 'Help me define it', description: 'Not sure which fits? Describe the problem and we will suggest an approach.' }]}
                      value={draft.intent.services} onChange={(v) => patch('intent', { services: v })} error={e('intent.services')}
                    />
                    <TextArea label="What would success look like?" name="outcome" hint="One or two sentences is plenty." value={draft.intent.outcome} onChange={(ev) => patch('intent', { outcome: ev.target.value })} error={e('intent.outcome')} rows={3} maxLength={1000} />
                  </>
                ) : null}

                {step.id === 'context' ? (
                  <>
                    <Checkbox name="isIndividual" label="I’m enquiring as an individual or founder, not on behalf of an organisation" checked={draft.context.isIndividual} onChange={(v) => patch('context', { isIndividual: v })} />
                    {!draft.context.isIndividual ? (
                      <TextField label="Organisation" name="organisation" required autoComplete="organization" value={draft.context.organisation} onChange={(ev) => patch('context', { organisation: ev.target.value })} error={e('context.organisation')} maxLength={160} />
                    ) : null}
                    <TextField label="Sector or industry" name="sector" value={draft.context.sector} onChange={(ev) => patch('context', { sector: ev.target.value })} error={e('context.sector')} maxLength={120} />
                    <TextArea label="Who is the work for?" name="audience" hint="The people who will see, use or decide on it." rows={3} value={draft.context.audience} onChange={(ev) => patch('context', { audience: ev.target.value })} error={e('context.audience')} maxLength={600} />
                    <TextArea label="Background and challenge" name="background" required hint="What has led to this project, and what problem or opportunity should it address? Please do not include confidential information yet." rows={6} value={draft.context.background} onChange={(ev) => patch('context', { background: ev.target.value })} error={e('context.background')} maxLength={4000} />
                  </>
                ) : null}

                {step.id === 'scope' ? (
                  <>
                    {deliverableOptions.length ? (
                      <ChoiceGroup<string> legend="Which deliverables might be involved?" name="deliverables" multiple hint="Based on the capabilities you chose. Pick any that fit; we will refine scope together." options={deliverableOptions} value={draft.scope.deliverables} onChange={(v) => patch('scope', { deliverables: v })} />
                    ) : (
                      <Alert tone="info" title="We will shape the deliverables with you" live={false}><p>Because you asked us to help define the project, there is no list to choose from. Add anything you already know below.</p></Alert>
                    )}
                    <TextField label="Channels or platforms" name="channels" hint="For example: website, social, investor meetings, iOS and Android." value={draft.scope.channels} onChange={(ev) => patch('scope', { channels: ev.target.value })} maxLength={600} />
                    <TextField label="Markets or countries" name="markets" hint="Where will the work be used?" autoComplete="off" value={draft.scope.markets} onChange={(ev) => patch('scope', { markets: ev.target.value })} maxLength={600} />
                    {draft.intent.services.some((s) => INTEGRATION_SERVICES.has(s)) ? (
                      <TextArea label="Systems to integrate" name="integrations" hint="For example: CMS, CRM, booking, analytics or internal tools." rows={3} value={draft.scope.integrations} onChange={(ev) => patch('scope', { integrations: ev.target.value })} maxLength={800} />
                    ) : null}
                  </>
                ) : null}

                {step.id === 'timing' ? (
                  <>
                    <ChoiceGroup legend="When would you like to start?" name="timeframe" required options={TIMEFRAMES.map((t) => ({ value: t.id, label: t.label }))} value={draft.timing.timeframe ? [draft.timing.timeframe] : []} onChange={(v) => patch('timing', { timeframe: v[0] ?? '' })} error={e('timing.timeframe')} hint="This helps us plan. It is not a delivery commitment." />
                    <TextField label="Is there a date or event it depends on?" name="dependency" hint="For example: a launch, a board meeting or a funding round." value={draft.timing.dependency} onChange={(ev) => patch('timing', { dependency: ev.target.value })} maxLength={600} />
                    <ChoiceGroup legend="Investment" name="budget" options={BUDGET_OPTIONS.map((b) => ({ value: b.id, label: b.label }))} value={draft.timing.budget ? [draft.timing.budget] : []} onChange={(v) => patch('timing', { budget: v[0] ?? '' })} hint="Optional. Final scope and cost are always confirmed in a written proposal; nothing here is a quote." />
                  </>
                ) : null}

                {step.id === 'contact' ? (
                  <>
                    <div className="grid gap-8 md:grid-cols-2">
                      <TextField label="Your name" name="name" required autoComplete="name" value={draft.contact.name} onChange={(ev) => patch('contact', { name: ev.target.value })} error={e('contact.name')} maxLength={120} />
                      <TextField label="Work email" name="email" required type="email" inputMode="email" autoComplete="email" spellCheck={false} value={draft.contact.email} onChange={(ev) => patch('contact', { email: ev.target.value })} error={e('contact.email')} maxLength={254} />
                      <TextField label="Role" name="role" autoComplete="organization-title" value={draft.contact.role} onChange={(ev) => patch('contact', { role: ev.target.value })} maxLength={120} />
                      <TextField label="Country" name="country" autoComplete="country-name" value={draft.contact.country} onChange={(ev) => patch('contact', { country: ev.target.value })} maxLength={80} />
                      <SelectField label="Time zone" name="timeZone" required hint="Detected from your device. Change it if it is wrong." value={draft.contact.timeZone} onChange={(ev) => patch('contact', { timeZone: ev.target.value })} error={e('contact.timeZone')}>
                        <option value="">Choose a time zone</option>
                        {zones.map((z) => <option key={z} value={z}>{prettyZone(z)}</option>)}
                      </SelectField>
                      <TextField label="Phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" hint="Only if you would like a call. Include your country code." value={draft.contact.phone} onChange={(ev) => patch('contact', { phone: ev.target.value })} error={e('contact.phone')} maxLength={40} />
                    </div>
                  </>
                ) : null}

                {step.id === 'review' ? <Review draft={draft} onEdit={goTo} consent={draft.consent} onConsent={(v) => patch('consent', v)} consentError={e('consent')} /> : null}
              </div>

              {result && !result.ok && result.kind !== 'validation' ? (
                <div className="mt-10">
                  <Alert tone="error" title={result.kind === 'rate_limited' ? 'Please wait before sending again' : result.kind === 'conflict' ? 'This brief was already sent' : 'Your brief has not been sent'}>
                    <p>{result.message}</p>
                    {result.kind === 'conflict' ? <p><button type="button" className="underline underline-offset-4" onClick={startOver}>Start a fresh brief</button></p> : <p>Your answers are still here. Nothing has been lost.</p>}
                  </Alert>
                </div>
              ) : null}

              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-8">
                {stepIndex > 0 ? (
                  <button type="button" onClick={() => goTo(STEPS[stepIndex - 1]!.id)} className="inline-flex min-h-12 items-center gap-2 font-medium">
                    <Icon as={ArrowLeft} size={18} /> Back
                  </button>
                ) : <span />}
                {step.id === 'review' ? (
                  <Button type="submit" loading={submitting} loadingLabel="Sending securely…" icon="arrow" disabled={!meta}>
                    {result && !result.ok ? 'Try sending again' : 'Send brief'}
                  </Button>
                ) : (
                  <Button type="submit" icon="arrow">Continue</Button>
                )}
              </div>
            </form>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Review({ draft, onEdit, consent, onConsent, consentError }: { draft: Draft; onEdit: (id: string) => void; consent: boolean; onConsent: (v: boolean) => void; consentError?: string }) {
  const tf = TIMEFRAMES.find((t) => t.id === draft.timing.timeframe)?.label ?? '—';
  const budget = BUDGET_OPTIONS.find((b) => b.id === draft.timing.budget)?.label ?? 'Not given';
  const rows: { step: string; title: string; items: [string, string][] }[] = [
    { step: 'intent', title: 'Intent', items: [['Capabilities', draft.intent.services.map((s) => (s === 'help-me-define-it' ? 'Help me define it' : serviceName(s))).join(', ')], ['Success', draft.intent.outcome || '—']] },
    { step: 'context', title: 'Context', items: [['Organisation', draft.context.isIndividual ? 'Individual / founder' : draft.context.organisation], ['Sector', draft.context.sector || '—'], ['Audience', draft.context.audience || '—'], ['Background', draft.context.background]] },
    { step: 'scope', title: 'Scope', items: [['Deliverables', draft.scope.deliverables.join(', ') || '—'], ['Channels', draft.scope.channels || '—'], ['Markets', draft.scope.markets || '—'], ['Integrations', draft.scope.integrations || '—']] },
    { step: 'timing', title: 'Timing', items: [['Start', tf], ['Depends on', draft.timing.dependency || '—'], ['Investment', budget]] },
    { step: 'contact', title: 'Contact', items: [['Name', draft.contact.name], ['Email', draft.contact.email], ['Role', draft.contact.role || '—'], ['Country', draft.contact.country || '—'], ['Time zone', prettyZone(draft.contact.timeZone)], ['Phone', draft.contact.phone || '—']] },
  ];
  return (
    <div className="space-y-10">
      {rows.map((r) => (
        <section key={r.step} aria-labelledby={`review-${r.step}`} className="border-t border-rule pt-6">
          <div className="flex items-center justify-between gap-4">
            <h3 id={`review-${r.step}`} className="t-label text-2">{r.title}</h3>
            <button type="button" onClick={() => onEdit(r.step)} className="t-small inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
              <Icon as={Pencil} size={14} /> Edit <span className="sr-only">{r.title.toLowerCase()}</span>
            </button>
          </div>
          <dl className="mt-4 space-y-3">
            {r.items.map(([k, v]) => <div key={k} className="grid gap-1 md:grid-cols-[10rem_1fr] md:gap-6"><dt className="t-small text-2">{k}</dt><dd className="whitespace-pre-line break-words">{v}</dd></div>)}
          </dl>
        </section>
      ))}
      <div className="border-t border-rule pt-6">
        <p className="t-small text-2 max-w-[60ch]">We use these details only to review and respond to your brief. They are stored securely and are not used for marketing or to train AI systems. Read the <AppLink to="/privacy" className="underline underline-offset-4">privacy notice</AppLink>.</p>
        <div className="mt-6">
          <Checkbox name="consent" checked={consent} onChange={onConsent} error={consentError} label="I agree that WeAmaze Visionary may use these details to respond to my enquiry." />
        </div>
      </div>
    </div>
  );
}

function Confirmation({ data, email, onNew }: { data: EnquiryAccepted; email: string; onNew: () => void }) {
  return (
    <Section className="min-h-[70svh]">
      <Container>
        <div className="max-w-3xl">
          <p className="t-label text-gold">Brief received</p>
          <h1 id="confirmation-title" tabIndex={-1} className="t-display-1 mt-6 outline-none">Thank you. Your brief is with us.</h1>
          <dl className="mt-10 border-y border-rule py-6">
            <dt className="t-label text-2">Your reference</dt>
            <dd className="t-display-3 mt-2 font-mono tracking-normal" data-testid="enquiry-reference">{data.reference}</dd>
          </dl>
          <div className="t-body-lg text-2 mt-8 space-y-4">
            <p>It has been received and stored securely. The studio reviews every brief and will reply by email to arrange a conversation or ask what is missing.</p>
            {data.notifications.receiptEmail === 'queued' ? <p>We are sending a copy to <span className="text-ivory">{email}</span>.</p> : <p>Please keep your reference for your records.</p>}
            <p>Nothing is binding until a written proposal is agreed.</p>
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink to="/book-a-call" variant="secondary" icon="none">Book a discovery call</ButtonLink>
            <ButtonLink to="/work" variant="quiet">View our work</ButtonLink>
          </div>
          <p className="t-small text-2 mt-10"><button type="button" onClick={onNew} className="underline underline-offset-4">Start another brief</button></p>
        </div>
      </Container>
    </Section>
  );
}
