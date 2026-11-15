export function formatDate(iso: string, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
}
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Ends a short title with a full stop unless it already ends in punctuation (avoids “Fuel..”). */
export const withStop = (t: string) => (/[.!?…]$/.test(t) ? t : `${t}.`);
