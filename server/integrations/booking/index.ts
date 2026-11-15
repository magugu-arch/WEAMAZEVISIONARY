import type { ServerEnv } from '../../lib/env';
import { log } from '../../lib/log';
import { MockBookingProvider } from './mock';
import type { BookingProvider } from './provider';

/**
 * Returns the configured provider, or null when scheduling is not connected.
 * The development mock is refused outright in production builds.
 */
export function createBookingProvider(env: ServerEnv): BookingProvider | null {
  if (env.BOOKING_PROVIDER === 'mock') {
    if (env.NODE_ENV === 'production') {
      log('error', 'booking.mock_refused_in_production');
      return null;
    }
    return new MockBookingProvider({ hostTimeZone: env.BOOKING_MOCK_HOST_TZ, dayStart: 9, dayEnd: 17, slotMinutes: 30, bufferMinutes: 15, minNoticeHours: 24, horizonDays: 21, blackoutDates: [] });
  }
  return null; // B-08: no live provider chosen yet
}
