/**
 * IANA time-zone utilities built on Intl only — no hard-coded UTC offsets, and
 * daylight-saving rules come from the platform's time-zone database (V10 §14).
 */
export function isValidTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number };
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return { year: +get('year'), month: +get('month'), day: +get('day'), hour: +get('hour') % 24, minute: +get('minute'), second: +get('second'), weekday: WEEKDAYS[get('weekday')] ?? 0 };
}

/** Offset of `timeZone` from UTC at instant `date`, in minutes (e.g. London summer = +60). */
export function offsetMinutes(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - (date.getTime() - date.getMilliseconds())) / 60000);
}

/**
 * Converts a wall-clock time in `timeZone` to a UTC instant. Handles DST gaps
 * (non-existent local times move forward) and overlaps (earliest instant).
 */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let ts = guess - offsetMinutes(new Date(guess), timeZone) * 60000;
  // Second pass corrects instants that crossed a transition.
  ts = guess - offsetMinutes(new Date(ts), timeZone) * 60000;
  const back = zonedParts(new Date(ts), timeZone);
  if (back.hour !== hour || back.minute !== minute) {
    // In a DST gap: apply the offset in force *before* the transition, which
    // moves the non-existent wall time forward (01:30 → 02:30 in London).
    const alt = guess - offsetMinutes(new Date(ts - 3 * 3600000), timeZone) * 60000;
    return new Date(alt);
  }
  return new Date(ts);
}

/** Local calendar date key (YYYY-MM-DD) of an instant in a zone. */
export function dateKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function formatInZone(iso: string, timeZone: string, opts: Intl.DateTimeFormatOptions, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, { timeZone, ...opts }).format(new Date(iso));
}
/** "Tuesday 10 November 2026" */
export const formatDay = (iso: string, tz: string, locale?: string) => formatInZone(iso, tz, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, locale);
/** "14:30" or "2:30 pm" depending on locale. */
export const formatTime = (iso: string, tz: string, locale?: string) => formatInZone(iso, tz, { hour: 'numeric', minute: '2-digit' }, locale);
/** Zone abbreviation or GMT offset for an instant, e.g. "GMT", "BST", "GMT+9". */
export function zoneLabel(iso: string, tz: string, locale = 'en-GB'): string {
  const parts = new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(iso));
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? tz;
}
/** Readable IANA name: "America/New_York" → "America / New York". */
export const prettyZone = (tz: string) => tz.replace(/_/g, ' ').replace(/\//g, ' / ');

/** A short, ordered list of common zones plus the visitor's own; full list where supported. */
export function timeZoneOptions(current?: string): string[] {
  let all: string[] = [];
  try {
    all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? [];
  } catch { /* older engines */ }
  if (!all.length) all = ['Africa/Johannesburg', 'America/Los_Angeles', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/London', 'UTC'];
  if (current && !all.includes(current) && isValidTimeZone(current)) all = [current, ...all];
  return all;
}
