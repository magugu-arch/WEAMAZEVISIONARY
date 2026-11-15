import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { AvailableSlot } from '@shared/booking';
import { dateKey, formatInZone, formatTime, prettyZone, timeZoneOptions, zoneLabel } from '@shared/timezone';
import { SelectField } from '@/components/forms/Field';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { apiRequest } from '@/lib/api';
import { Icon } from '@/lib/icon';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';

export function detectTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}
function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12));
  return dt.toISOString().slice(0, 10);
}

/**
 * Live availability from the provider, grouped by day in the visitor's chosen
 * IANA zone. Slots are never invented client-side. Changing the zone refetches.
 */
export function SlotPicker({ meetingTypeId, timeZone, onTimeZone, selected, onSelect, refreshKey = 0, notice }: { meetingTypeId: string; timeZone: string; onTimeZone: (tz: string) => void; selected: AvailableSlot | null; onSelect: (s: AvailableSlot | null) => void; refreshKey?: number; notice?: string }) {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; slots: AvailableSlot[] }>({ status: 'loading' });
  const [day, setDay] = useState<string | null>(null);
  const zones = useMemo(() => timeZoneOptions(timeZone), [timeZone]);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const start = dateKey(new Date(), timeZone);
    const end = addDays(start, 22);
    const res = await apiRequest<{ slots: AvailableSlot[] }>(`/api/booking/availability?${new URLSearchParams({ meetingType: meetingTypeId, start, end, timeZone })}`);
    if (!res.ok) return setState({ status: 'error', message: res.message });
    setState({ status: 'ready', slots: res.data.slots });
    track({ name: 'booking_availability_view', props: { meeting_type: meetingTypeId, timezone_region: timeZone.split('/')[0] ?? timeZone } });
  }, [meetingTypeId, timeZone]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on inputs change
    void load();
  }, [load, refreshKey]);

  const byDay = useMemo(() => {
    const map = new Map<string, AvailableSlot[]>();
    if (state.status === 'ready') for (const s of state.slots) {
      const k = dateKey(new Date(s.startAt), timeZone);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return map;
  }, [state, timeZone]);
  const days = [...byDay.keys()];
  const activeDay = day && byDay.has(day) ? day : days[0] ?? null;

  return (
    <div className="space-y-8">
      <SelectField label="Your time zone" name="timeZone" required hint="All times below are shown in this zone, with daylight saving applied." value={timeZone} onChange={(e) => { onSelect(null); onTimeZone(e.target.value); }}>
        {zones.map((z) => <option key={z} value={z}>{prettyZone(z)}</option>)}
      </SelectField>
      {notice ? <p className="t-small text-2">{notice}</p> : null}

      {state.status === 'loading' ? (
        <p className="t-small text-2 flex items-center gap-3" role="status"><Spinner /> Loading live availability…</p>
      ) : state.status === 'error' ? (
        <Alert tone="error" title="Availability could not be loaded">
          <p>{state.message}</p>
          <p><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 underline underline-offset-4"><Icon as={RefreshCw} size={14} /> Try again</button></p>
        </Alert>
      ) : days.length === 0 ? (
        <Alert tone="info" title="No times are available in the next three weeks">
          <p>You can send a call request instead and we will propose a time.</p>
        </Alert>
      ) : (
        <>
          <fieldset>
            <legend className="font-medium">Choose a day</legend>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
              {days.map((k) => {
                const iso = byDay.get(k)![0]!.startAt;
                const active = k === activeDay;
                return (
                  <button key={k} type="button" aria-pressed={active} onClick={() => { setDay(k); onSelect(null); }} className={cn('flex min-w-[5.5rem] shrink-0 flex-col items-start border px-3 py-3 text-left transition-colors', active ? 'border-ivory bg-ivory text-onyx' : 'border-rule-strong hover:border-ivory')}>
                    <span className="t-label">{formatInZone(iso, timeZone, { weekday: 'short' })}</span>
                    <span className="t-display-3 mt-1 leading-none">{formatInZone(iso, timeZone, { day: 'numeric' })}</span>
                    <span className="t-caption mt-1">{formatInZone(iso, timeZone, { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          {activeDay ? (
            <fieldset>
              <legend className="font-medium">
                Times on {formatInZone(byDay.get(activeDay)![0]!.startAt, timeZone, { weekday: 'long', day: 'numeric', month: 'long' })}
                <span className="t-small text-2 ml-2 font-normal">({zoneLabel(byDay.get(activeDay)![0]!.startAt, timeZone)})</span>
              </legend>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {byDay.get(activeDay)!.map((s) => {
                  const active = selected?.startAt === s.startAt;
                  return (
                    <button key={s.startAt} type="button" aria-pressed={active} onClick={() => onSelect(s)} className={cn('t-meta min-h-12 border px-2 text-sm transition-colors', active ? 'border-ivory bg-ivory text-onyx' : 'border-rule-strong hover:border-ivory')}>
                      {formatTime(s.startAt, timeZone)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
        </>
      )}
    </div>
  );
}
