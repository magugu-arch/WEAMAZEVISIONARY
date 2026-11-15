export type ConsentState = { necessary: true; analytics: boolean; updatedAt: string; version: 1 };
const KEY = 'wv:consent';

export function getConsent(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return parsed.version === 1 ? (parsed as ConsentState) : null;
  } catch {
    return null;
  }
}
export function setConsent(analytics: boolean): ConsentState {
  const state: ConsentState = { necessary: true, analytics, updatedAt: new Date().toISOString(), version: 1 };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: preference applies to this page view only */
  }
  window.dispatchEvent(new CustomEvent('wv:consent', { detail: state }));
  return state;
}
