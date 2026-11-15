import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { AvailableSlot, BookingConfirmation, BookingStatus } from '@shared/booking';
import { formatDay, formatTime, prettyZone, zoneLabel } from '@shared/timezone';
import { Container, Section } from '@/components/layout/Section';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { track } from '@/lib/analytics';
import { apiRequest } from '@/lib/api';
import { PageHeader } from '../shared/PageHeader';
import { MockBanner } from './MockBanner';
import { SlotPicker } from './SlotPicker';

type Booking = BookingStatus & { timeZone: string };

/** Secure reschedule/cancel via the private token from the confirmation (V11.08). */
export default function ManageBookingPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<{ s: 'loading' } | { s: 'missing'; message: string } | { s: 'ready'; booking: Booking; mock: boolean }>({ s: 'loading' });
  const [mode, setMode] = useState<'view' | 'reschedule' | 'confirm-cancel'>('view');
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [tz, setTz] = useState('UTC');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    // Without the private link there is nothing to look up: say so instead of asking the server.
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the token is only known after hydration
      setState({ s: 'missing', message: 'Open this page from the link in your booking confirmation email to change or cancel your call.' });
      return;
    }
    let alive = true;
    void (async () => {
      const res = await apiRequest<{ booking: Booking; mode: string }>(`/api/booking/manage?token=${encodeURIComponent(token)}`);
      if (!alive) return;
      if (res.ok) { setState({ s: 'ready', booking: res.data.booking, mock: res.data.mode === 'mock' }); setTz(res.data.booking.timeZone); }
      else setState({ s: 'missing', message: res.kind === 'not_found' ? 'This link is invalid, has expired or the booking was already cancelled.' : res.message });
    })();
    return () => { alive = false; };
  }, [token]);

  const reschedule = async () => {
    if (!slot || state.s !== 'ready') return;
    setBusy(true);
    const res = await apiRequest<{ confirmation: BookingConfirmation }>('/api/booking/manage/reschedule', { body: { token, startAt: slot.startAt, timeZone: tz } });
    setBusy(false);
    if (res.ok) {
      setState({ ...state, booking: { ...state.booking, startAt: res.data.confirmation.startAt, endAt: res.data.confirmation.endAt, timeZone: tz } });
      setMode('view'); setSlot(null);
      setMessage({ tone: 'success', text: 'Rescheduled. The calendar confirmed the new time.' });
      track({ name: 'booking_rescheduled', props: { meeting_type: state.booking.meetingTypeId } });
    } else {
      if (res.kind === 'conflict') { setSlot(null); setRefresh((r) => r + 1); }
      setMessage({ tone: 'error', text: res.message });
    }
  };
  const cancel = async () => {
    if (state.s !== 'ready') return;
    setBusy(true);
    const res = await apiRequest<{ status: BookingStatus }>('/api/booking/manage/cancel', { body: { token } });
    setBusy(false);
    if (res.ok) {
      setState({ ...state, booking: { ...state.booking, status: 'cancelled' } });
      setMode('view');
      setMessage({ tone: 'success', text: 'Cancelled. The calendar confirmed the cancellation.' });
      track({ name: 'booking_cancelled', props: { meeting_type: state.booking.meetingTypeId } });
    } else setMessage({ tone: 'error', text: res.message });
  };

  return (
    <>
      <PageHeader eyebrow="Your booking" title="Manage your call." />
      <Section spacing="tight" className="pt-0 md:pt-0">
        <Container>
          <div className="max-w-3xl space-y-8">
            {state.s === 'loading' ? <p className="t-small text-2 flex items-center gap-3" role="status"><Spinner /> Loading your booking…</p> : null}
            {state.s === 'missing' ? (
              <>
                <Alert tone="error" title="Booking not found"><p>{state.message}</p></Alert>
                <ButtonLink to="/book-a-call" variant="secondary">Book a new call</ButtonLink>
              </>
            ) : null}
            {state.s === 'ready' ? (
              <>
                {state.mock ? <MockBanner /> : null}
                {message ? <Alert tone={message.tone} title={message.tone === 'success' ? 'Done' : 'Nothing has changed'}><p>{message.text}</p></Alert> : null}
                <dl className="space-y-3 border-y border-rule py-6">
                  <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">Status</dt><dd className="font-medium">{state.booking.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}</dd></div>
                  <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">When</dt><dd>{formatDay(state.booking.startAt, tz)}, {formatTime(state.booking.startAt, tz)}–{formatTime(state.booking.endAt, tz)} {zoneLabel(state.booking.startAt, tz)}</dd></div>
                  <div className="grid gap-1 md:grid-cols-[10rem_1fr]"><dt className="text-2">Time zone</dt><dd>{prettyZone(tz)}</dd></div>
                </dl>
                {state.booking.status === 'confirmed' && mode === 'view' ? (
                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => { setMode('reschedule'); setMessage(null); }}>Reschedule</Button>
                    <Button variant="secondary" onClick={() => { setMode('confirm-cancel'); setMessage(null); }}>Cancel call</Button>
                  </div>
                ) : null}
                {mode === 'reschedule' ? (
                  <div className="space-y-8 border-t border-rule pt-8">
                    <h2 className="t-h3">Choose a new time</h2>
                    <SlotPicker meetingTypeId={state.booking.meetingTypeId} timeZone={tz} onTimeZone={setTz} selected={slot} onSelect={setSlot} refreshKey={refresh} />
                    <div className="flex flex-wrap gap-3">
                      <Button icon="arrow" disabled={!slot} loading={busy} loadingLabel="Confirming…" onClick={() => void reschedule()}>Confirm new time</Button>
                      <Button variant="quiet" onClick={() => setMode('view')}>Keep current time</Button>
                    </div>
                  </div>
                ) : null}
                {mode === 'confirm-cancel' ? (
                  <div className="space-y-6 border-t border-rule pt-8" role="group" aria-labelledby="cancel-title">
                    <h2 id="cancel-title" className="t-h3">Cancel this call?</h2>
                    <p className="text-2">This cannot be undone. You can always book a new time.</p>
                    <div className="flex flex-wrap gap-3">
                      <Button loading={busy} loadingLabel="Cancelling…" onClick={() => void cancel()}>Yes, cancel the call</Button>
                      <Button variant="secondary" onClick={() => setMode('view')}>Keep the call</Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </Container>
      </Section>
    </>
  );
}
