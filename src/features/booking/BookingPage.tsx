import { useEffect, useRef, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import type { AvailableSlot, BookingConfig, BookingConfirmation } from '@shared/booking';
import { CALL_WINDOWS, INTENT_OPTIONS, callRequestSchema, toFieldErrors } from '@shared/enquiry';
import type { EnquiryAccepted, IntentOption } from '@shared/enquiry';
import { formatDay, formatTime, prettyZone, timeZoneOptions, zoneLabel } from '@shared/timezone';
import { Container, Section } from '@/components/layout/Section';
import { Checkbox, ChoiceGroup, ErrorSummary, Honeypot, SelectField, TextArea, TextField } from '@/components/forms/Field';
import { Alert } from '@/components/ui/Alert';
import { AppLink } from '@/components/ui/AppLink';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { serviceName } from '@/content/serviceIndex';
import { track } from '@/lib/analytics';
import { apiRequest, newIdempotencyKey } from '@/lib/api';
import type { ApiResult } from '@/lib/api';
import { Icon } from '@/lib/icon';
import { PageHeader } from '../shared/PageHeader';
import { downloadIcs, icsFor } from './ics';
import { MockBanner } from './MockBanner';
import { detectTimeZone, SlotPicker } from './SlotPicker';

/**
 * Book a call (V10 §14, V11.17). Uses live provider availability; never invents
 * slots and never shows success before the provider confirms. When no provider
 * is connected, it offers a server-accepted call request instead of a fake booking.
 */
export default function BookingPage() {
  const [config, setConfig] = useState<{ status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; config: BookingConfig }>({ status: 'loading' });
  const load = async () => {
    setConfig({ status: 'loading' });
    const res = await apiRequest<BookingConfig>('/api/booking/config');
    setConfig(res.ok ? { status: 'ready', config: res.data } : { status: 'error', message: res.message });
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, []);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Book a call', to: '/book-a-call' }]}
        eyebrow="Book a call"
        title="Start with a conversation."
        intro="A discovery call is a chance to talk through your idea, objectives and constraints, and agree sensible next steps. Times are always shown in your own time zone."
      />
      <Section spacing="tight" className="pt-0 md:pt-0">
        <Container>
          <div className="max-w-3xl">
            {config.status === 'loading' ? (
              <p className="t-small text-2 flex items-center gap-3" role="status"><Spinner /> Checking scheduling…</p>
            ) : config.status === 'error' ? (
              <div className="space-y-10">
                <Alert tone="error" title="Scheduling could not be reached"><p>{config.message}</p><p><button type="button" className="underline underline-offset-4" onClick={() => void load()}>Try again</button>, or send a call request below.</p></Alert>
                <CallRequestForm />
              </div>
            ) : config.config.mode === 'unavailable' ? (
              <div className="space-y-10">
                <Alert tone="info" title="Online scheduling is not connected yet" live={false}>
                  <p>Tell us when suits you and we will reply by email with a proposed time in your time zone. This is a request, not a confirmed booking.</p>
                </Alert>
                <CallRequestForm />
              </div>
            ) : (
              <BookingFlow config={config.config} />
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

function BookingFlow({ config }: { config: BookingConfig }) {
  const [meetingTypeId, setMeetingTypeId] = useState(config.meetingTypes[0]?.id ?? '');
  const [timeZone, setTimeZone] = useState('UTC');
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', notes: '', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<'choose' | 'details' | 'review'>('choose');
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [confirmed, setConfirmed] = useState<BookingConfirmation | null>(null);
  const key = useRef(newIdempotencyKey());
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detect browser zone after hydration
    setTimeZone(detectTimeZone());
  }, []);
  const meeting = config.meetingTypes.find((m) => m.id === meetingTypeId);
  const go = (s: typeof stage) => { setStage(s); requestAnimationFrame(() => heading.current?.focus()); };

  const toReview = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter an email address in the format name@example.com.';
    if (!form.consent) e.consent = 'Please confirm you agree so we can arrange the call.';
    setErrors(e);
    if (Object.keys(e).length) return requestAnimationFrame(() => document.getElementById('error-summary')?.focus());
    go('review');
  };

  const confirm = async () => {
    if (!slot || !meeting) return;
    setSubmitting(true);
    setFailure(null);
    const res = await apiRequest<{ confirmation: BookingConfirmation }>('/api/booking/bookings', {
      body: { meetingTypeId, startAt: slot.startAt, timeZone, attendee: { name: form.name, email: form.email, company: form.company }, notes: form.notes, consent: form.consent, idempotencyKey: key.current },
    });
    setSubmitting(false);
    if (res.ok) {
      setConfirmed(res.data.confirmation);
      track({ name: 'booking_confirmed', props: { meeting_type: meetingTypeId } });
      requestAnimationFrame(() => document.getElementById('booking-confirmed')?.focus());
      return;
    }
    if (res.kind === 'conflict') {
      setSlot(null);
      setRefresh((r) => r + 1);
      setFailure(res.message);
      go('choose');
      return;
    }
    if (res.kind === 'validation' && res.fieldErrors) { setErrors(Object.fromEntries(Object.entries(res.fieldErrors).map(([k, v]) => [k.replace('attendee.', ''), v]))); go('details'); return; }
    setFailure(res.message);
  };

  if (confirmed && meeting) {
    const manage = `/book-a-call/manage?token=${encodeURIComponent(confirmed.manageToken)}`;
    return (
      <div id="booking-confirmed" tabIndex={-1} className="space-y-8 outline-none">
        {config.mode === 'mock' ? <MockBanner /> : null}
        <p className="t-label text-gold">{config.mode === 'mock' ? 'Mock confirmation' : 'Confirmed by the calendar'}</p>
        <h2 className="t-display-2">{config.mode === 'mock' ? 'Simulated booking created.' : 'Your call is booked.'}</h2>
        <dl className="border-y border-rule py-6 space-y-3">
          <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">Meeting</dt><dd>{meeting.name} · {meeting.durationMinutes} minutes</dd></div>
          <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">When</dt><dd data-testid="booking-when">{formatDay(confirmed.startAt, timeZone)}, {formatTime(confirmed.startAt, timeZone)}–{formatTime(confirmed.endAt, timeZone)} {zoneLabel(confirmed.startAt, timeZone)}</dd></div>
          <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">Time zone</dt><dd>{prettyZone(timeZone)}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => downloadIcs('weamaze-visionary-call.ics', icsFor({ bookingId: confirmed.bookingId, startAt: confirmed.startAt, endAt: confirmed.endAt, title: `${meeting.name} — WeAmaze Visionary`, description: `Manage: ${window.location.origin}${manage}` }))}>
            <Icon as={CalendarPlus} size={18} /> Add to calendar
          </Button>
          <ButtonLink to={manage} variant="quiet">Reschedule or cancel</ButtonLink>
        </div>
        <p className="t-small text-2">Keep the reschedule link private: anyone with it can change this booking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {config.mode === 'mock' ? <MockBanner /> : null}
      <p className="t-meta text-2" aria-live="polite">Step {stage === 'choose' ? 1 : stage === 'details' ? 2 : 3} of 3</p>
      <h2 ref={heading} tabIndex={-1} className="t-display-3 outline-none">{stage === 'choose' ? 'Choose a meeting and a time' : stage === 'details' ? 'Your details' : 'Review and confirm'}</h2>
      {failure ? <Alert tone={stage === 'choose' ? 'warning' : 'error'} title={stage === 'choose' ? 'That time is no longer available' : 'Nothing has been booked'}><p>{failure}</p></Alert> : null}

      {stage === 'choose' ? (
        <>
          <ChoiceGroup legend="Meeting type" name="meetingType" required columns={1} options={config.meetingTypes.map((m) => ({ value: m.id, label: `${m.name} · ${m.durationMinutes} min`, description: m.description }))} value={[meetingTypeId]} onChange={(v) => { setMeetingTypeId(v[0] ?? ''); setSlot(null); }} />
          {meetingTypeId ? <SlotPicker meetingTypeId={meetingTypeId} timeZone={timeZone} onTimeZone={setTimeZone} selected={slot} onSelect={(s) => { setSlot(s); setFailure(null); }} refreshKey={refresh} notice={config.notice} /> : null}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-8">
            <p className="t-small text-2" aria-live="polite">{slot ? <>Selected: <span className="text-ivory">{formatDay(slot.startAt, timeZone)}, {formatTime(slot.startAt, timeZone)} {zoneLabel(slot.startAt, timeZone)}</span></> : 'No time selected yet.'}</p>
            <Button icon="arrow" disabled={!slot} onClick={() => go('details')}>Continue</Button>
          </div>
        </>
      ) : null}

      {stage === 'details' ? (
        <form noValidate className="space-y-8" onSubmit={(e) => { e.preventDefault(); toReview(); }}>
          {Object.keys(errors).length ? <ErrorSummary errors={errors} labels={{ name: 'Name', email: 'Email', consent: 'Consent' }} /> : null}
          <div className="grid gap-8 md:grid-cols-2">
            <TextField label="Your name" name="name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <TextField label="Email" name="email" required type="email" inputMode="email" autoComplete="email" spellCheck={false} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          </div>
          <TextField label="Organisation" name="company" autoComplete="organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <TextArea label="Anything we should know beforehand?" name="notes" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1500} />
          <Checkbox name="consent" checked={form.consent} onChange={(v) => setForm({ ...form, consent: v })} error={errors.consent} label={<>I agree that WeAmaze Visionary may use these details to arrange the call. See the <AppLink to="/privacy" className="underline underline-offset-4">privacy notice</AppLink>.</>} />
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-8">
            <button type="button" className="inline-flex min-h-12 items-center font-medium" onClick={() => go('choose')}>Back</button>
            <Button type="submit" icon="arrow">Review</Button>
          </div>
        </form>
      ) : null}

      {stage === 'review' && slot && meeting ? (
        <div className="space-y-8">
          <dl className="space-y-3 border-y border-rule py-6">
            <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">Meeting</dt><dd>{meeting.name}</dd></div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">Duration</dt><dd>{meeting.durationMinutes} minutes</dd></div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">Date and time</dt><dd>{formatDay(slot.startAt, timeZone)}, {formatTime(slot.startAt, timeZone)}–{formatTime(slot.endAt, timeZone)} {zoneLabel(slot.startAt, timeZone)}</dd></div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">Time zone</dt><dd>{prettyZone(timeZone)}</dd></div>
            <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">Attendee</dt><dd className="break-words">{form.name} · {form.email}</dd></div>
          </dl>
          <p className="t-small text-2">You will be able to reschedule or cancel using the private link shown after confirmation. The time is checked again with the calendar before it is booked.</p>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-8">
            <button type="button" className="inline-flex min-h-12 items-center font-medium" onClick={() => go('details')}>Back</button>
            <Button icon="arrow" loading={submitting} loadingLabel="Confirming with the calendar…" onClick={() => void confirm()}>{config.mode === 'mock' ? 'Confirm (mock)' : 'Confirm booking'}</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Production fallback while no scheduler is connected: a durable, server-accepted request — clearly not a booking. */
export function CallRequestForm() {
  const [form, setForm] = useState({ name: '', email: '', organisation: '', timeZone: '', windows: [] as string[], topic: '' as '' | IntentOption, notes: '', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hp, setHp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResult<EnquiryAccepted> | null>(null);
  const meta = useRef<{ key: string; startedAt: number } | null>(null);
  useEffect(() => {
    meta.current = { key: newIdempotencyKey(), startedAt: Date.now() };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detect browser zone after hydration
    setForm((f) => ({ ...f, timeZone: f.timeZone || detectTimeZone() }));
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { type: 'call-request' as const, ...form, topic: form.topic || undefined };
    const v = callRequestSchema.safeParse(payload);
    if (!v.success) { setErrors(toFieldErrors(v.error)); requestAnimationFrame(() => document.getElementById('error-summary')?.focus()); return; }
    setErrors({});
    setSubmitting(true);
    const res = await apiRequest<EnquiryAccepted>('/api/enquiries', { body: { idempotencyKey: meta.current!.key, startedAt: meta.current!.startedAt, website: hp, source: { route: '/book-a-call' }, payload } });
    setSubmitting(false);
    setResult(res);
    if (!res.ok && res.kind === 'validation' && res.fieldErrors) setErrors(res.fieldErrors);
  };
  if (result?.ok) {
    return (
      <Alert tone="success" title="Call request received">
        <p>Reference <span className="font-mono text-ivory" data-testid="call-reference">{result.data.reference}</span>. This is a request, not a booking: we will reply by email with a proposed time in {prettyZone(form.timeZone)}.</p>
      </Alert>
    );
  }
  return (
    <form noValidate onSubmit={submit} className="relative space-y-8" aria-label="Call request">
      <Honeypot value={hp} onChange={setHp} />
      {Object.keys(errors).length ? <ErrorSummary errors={errors} labels={{ name: 'Name', email: 'Email', timeZone: 'Time zone', windows: 'Preferred times', consent: 'Consent' }} /> : null}
      <div className="grid gap-8 md:grid-cols-2">
        <TextField label="Your name" name="name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <TextField label="Email" name="email" type="email" inputMode="email" required autoComplete="email" spellCheck={false} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
      </div>
      <TextField label="Organisation" name="organisation" autoComplete="organization" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
      <SelectField label="Your time zone" name="timeZone" required value={form.timeZone} onChange={(e) => setForm({ ...form, timeZone: e.target.value })} error={errors.timeZone}>
        {timeZoneOptions(form.timeZone).map((z) => <option key={z} value={z}>{prettyZone(z)}</option>)}
      </SelectField>
      <ChoiceGroup legend="When could a call work?" name="windows" required multiple columns={3} hint="In your time zone." options={CALL_WINDOWS.map((w) => ({ value: w.id, label: w.label }))} value={form.windows} onChange={(v) => setForm({ ...form, windows: v })} error={errors.windows} />
      <SelectField label="Topic" name="topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value as IntentOption })}>
        <option value="">Not sure yet</option>
        {INTENT_OPTIONS.filter((o) => o !== 'help-me-define-it').map((o) => <option key={o} value={o}>{serviceName(o)}</option>)}
      </SelectField>
      <TextArea label="Anything we should know?" name="notes" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={2000} />
      <Checkbox name="consent" checked={form.consent} onChange={(v) => setForm({ ...form, consent: v })} error={errors.consent} label={<>I agree that WeAmaze Visionary may use these details to arrange a call. See the <AppLink to="/privacy" className="underline underline-offset-4">privacy notice</AppLink>.</>} />
      {result && !result.ok && result.kind !== 'validation' ? <Alert tone="error" title="Your request has not been sent"><p>{result.message}</p></Alert> : null}
      <Button type="submit" loading={submitting} loadingLabel="Sending…" icon="arrow">Send call request</Button>
    </form>
  );
}
