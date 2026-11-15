/**
 * Consent-aware, PII-free analytics layer (V10 §20, V11.12).
 * No provider is configured by default, so every call is a no-op. When a
 * provider is approved, implement `dispatch` and it will only run after the
 * visitor grants the "analytics" consent category.
 */
import { ANALYTICS_PROVIDER } from './env';
import { getConsent } from './consent';

export type AnalyticsEvent =
  | { name: 'hero_primary_cta_click' | 'hero_secondary_cta_click'; props: { source_route: string } }
  | { name: 'service_view'; props: { service_slug: string } }
  | { name: 'project_view'; props: { project_slug: string; project_status: string } }
  | { name: 'work_filter_change'; props: { filter_type: string; filter_value: string; result_count: number } }
  | { name: 'project_builder_start'; props: { source_route: string } }
  | { name: 'project_builder_step_complete'; props: { step_id: string; step_index: number } }
  | { name: 'project_builder_error'; props: { step_id: string; field_code: string } }
  | { name: 'enquiry_submit_attempt'; props: { service_count: number; source_route: string } }
  | { name: 'enquiry_received'; props: { service_count: number; reference_type: string } }
  | { name: 'booking_availability_view'; props: { meeting_type: string; timezone_region: string } }
  | { name: 'booking_confirmed' | 'booking_rescheduled' | 'booking_cancelled'; props: { meeting_type: string } }
  | { name: 'film_open' | 'film_complete'; props: { source_route: string } };

const PII_PATTERN = /@|\+?\d[\d\s().-]{7,}\d/;

export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined' || ANALYTICS_PROVIDER === 'none') return;
  if (!getConsent()?.analytics) return;
  for (const v of Object.values(event.props)) {
    if (typeof v === 'string' && PII_PATTERN.test(v)) return; // never transmit anything that looks like PII
  }
  dispatch(event);
}

function dispatch(_event: AnalyticsEvent): void {
  // Intentionally empty until an analytics provider is approved (docs/BLOCKERS.md B-13).
}
