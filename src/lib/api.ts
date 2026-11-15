import type { ApiError } from '@shared/enquiry';

export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; kind: 'validation' | 'rate_limited' | 'conflict' | 'not_found' | 'rejected' | 'server' | 'network' | 'offline' | 'timeout'; message: string; fieldErrors?: Record<string, string>; retryAfter?: number };

/** JSON request with timeout and truthful, typed failure kinds. Never throws. */
export async function apiRequest<T>(path: string, init: { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number } = {}): Promise<ApiResult<T>> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, status: 0, kind: 'offline', message: 'You appear to be offline. Your answers are kept on this page; send again when you are reconnected.' };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 15000);
  try {
    const res = await fetch(path, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: init.body ? { 'content-type': 'application/json' } : undefined,
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: ctrl.signal,
      credentials: 'same-origin',
    });
    const json = (await res.json().catch(() => null)) as (T & { ok?: boolean }) | ApiError | null;
    if (res.ok && json) return { ok: true, status: res.status, data: json as T };
    const err = json as ApiError | null;
    const kind = res.status === 400 && err?.error === 'validation' ? 'validation' : res.status === 429 ? 'rate_limited' : res.status === 409 ? 'conflict' : res.status === 404 ? 'not_found' : res.status === 400 || res.status === 413 || res.status === 415 ? 'rejected' : 'server';
    return { ok: false, status: res.status, kind, message: err?.message ?? 'Something went wrong on our side. Please try again.', fieldErrors: err?.fieldErrors, retryAfter: err?.retryAfter };
  } catch (e) {
    const timedOut = (e as Error).name === 'AbortError';
    return { ok: false, status: 0, kind: timedOut ? 'timeout' : 'network', message: timedOut ? 'The server took too long to respond. Nothing has been confirmed yet — please try again.' : 'We could not reach the server. Check your connection and try again; your answers are kept.' };
  } finally {
    clearTimeout(timer);
  }
}

export function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
