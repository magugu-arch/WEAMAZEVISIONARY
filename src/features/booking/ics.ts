/** Builds a minimal RFC 5545 calendar file from a provider-confirmed booking. */
export function icsFor(b: { bookingId: string; startAt: string; endAt: string; title: string; description: string }): string {
  const fmt = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WeAmaze Visionary//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${b.bookingId}@weamazevisionary`, `DTSTAMP:${fmt(new Date().toISOString())}`, `DTSTART:${fmt(b.startAt)}`, `DTEND:${fmt(b.endAt)}`,
    `SUMMARY:${esc(b.title)}`, `DESCRIPTION:${esc(b.description)}`, 'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}
export function downloadIcs(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
