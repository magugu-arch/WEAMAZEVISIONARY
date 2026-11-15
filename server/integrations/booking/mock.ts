import { randomBytes, randomUUID } from 'node:crypto';
import type { AvailableSlot, BookingConfirmation, BookingRequest, BookingStatus, MeetingType } from '@shared/booking';
import { dateKey, zonedParts, zonedTimeToUtc } from '@shared/timezone';
import type { BookingProvider } from './provider';
import { BookingNotFoundError, SlotUnavailableError } from './provider';

/**
 * DEVELOPMENT-ONLY MOCK. It invents availability so the booking journey can be
 * built and tested. It books nothing, sends no invitation and is refused in
 * production (see createBookingProvider). The UI labels it on every screen.
 *
 * Rules mirror what a real calendar must be configured with: working hours in
 * the host's IANA zone, slot length, buffer, minimum notice, horizon, blackout
 * dates and weekends off.
 */
export type MockRules = { hostTimeZone: string; dayStart: number; dayEnd: number; slotMinutes: number; bufferMinutes: number; minNoticeHours: number; horizonDays: number; blackoutDates: string[] };

export class MockBookingProvider implements BookingProvider {
  readonly name = 'development-mock';
  readonly mode = 'mock' as const;
  private bookings = new Map<string, { id: string; token: string; startAt: string; endAt: string; meetingTypeId: string; timeZone: string; status: 'confirmed' | 'cancelled'; attendee: { name: string; email: string } }>();
  private idem = new Map<string, string>();
  constructor(private rules: MockRules, private now: () => number = Date.now) {}

  async meetingTypes(): Promise<MeetingType[]> {
    return [
      { id: 'discovery', name: 'Discovery conversation', durationMinutes: this.rules.slotMinutes, description: 'Talk through your idea, objectives and constraints, and agree sensible next steps.' },
      { id: 'partnership', name: 'Partnership conversation', durationMinutes: this.rules.slotMinutes, description: 'For agencies and production partners exploring specialist creative, AI, motion or digital support.' },
    ];
  }

  private allSlots(): AvailableSlot[] {
    const { hostTimeZone: tz, dayStart, dayEnd, slotMinutes, bufferMinutes, minNoticeHours, horizonDays, blackoutDates } = this.rules;
    const now = this.now();
    const earliest = now + minNoticeHours * 3600_000;
    const slots: AvailableSlot[] = [];
    const startDay = zonedParts(new Date(now), tz);
    for (let d = 0; d <= horizonDays; d++) {
      const probe = new Date(Date.UTC(startDay.year, startDay.month - 1, startDay.day + d, 12));
      const local = zonedParts(probe, tz);
      if (local.weekday === 0 || local.weekday === 6) continue;
      const key = `${local.year}-${String(local.month).padStart(2, '0')}-${String(local.day).padStart(2, '0')}`;
      if (blackoutDates.includes(key)) continue;
      for (let m = dayStart * 60; m + slotMinutes <= dayEnd * 60; m += slotMinutes + bufferMinutes) {
        const start = zonedTimeToUtc(local.year, local.month, local.day, Math.floor(m / 60), m % 60, tz);
        if (start.getTime() < earliest) continue;
        const end = new Date(start.getTime() + slotMinutes * 60_000);
        slots.push({ startAt: start.toISOString(), endAt: end.toISOString() });
      }
    }
    const taken = new Set([...this.bookings.values()].filter((b) => b.status === 'confirmed').map((b) => b.startAt));
    return slots.filter((s) => !taken.has(s.startAt));
  }

  async getAvailability(input: { meetingTypeId: string; startDate: string; endDate: string; timeZone: string }) {
    if (!(await this.meetingTypes()).some((m) => m.id === input.meetingTypeId)) return [];
    return this.allSlots().filter((s) => {
      const k = dateKey(new Date(s.startAt), input.timeZone);
      return k >= input.startDate && k <= input.endDate;
    });
  }

  async createBooking(input: BookingRequest): Promise<BookingConfirmation> {
    const prior = this.idem.get(input.idempotencyKey);
    if (prior) {
      const b = [...this.bookings.values()].find((x) => x.id === prior)!;
      return this.confirmation(b);
    }
    // Revalidate: the slot must still be offered at the moment of booking.
    const startIso = new Date(input.startAt).toISOString();
    const slot = this.allSlots().find((s) => s.startAt === startIso);
    if (!slot) throw new SlotUnavailableError();
    const b = { id: randomUUID(), token: randomBytes(24).toString('base64url'), startAt: slot.startAt, endAt: slot.endAt, meetingTypeId: input.meetingTypeId, timeZone: input.timeZone, status: 'confirmed' as const, attendee: { name: input.attendee.name, email: input.attendee.email } };
    this.bookings.set(b.token, b);
    this.idem.set(input.idempotencyKey, b.id);
    return this.confirmation(b);
  }

  private confirmation(b: { id: string; token: string; startAt: string; endAt: string; meetingTypeId: string; timeZone: string; attendee: { name: string; email: string } }): BookingConfirmation {
    return { bookingId: b.id, status: 'confirmed', meetingTypeId: b.meetingTypeId, startAt: b.startAt, endAt: b.endAt, timeZone: b.timeZone, attendee: b.attendee, manageToken: b.token, provider: this.name };
  }

  async getBooking(token: string) {
    const b = this.bookings.get(token);
    if (!b) return null;
    return { bookingId: b.id, status: b.status, startAt: b.startAt, endAt: b.endAt, meetingTypeId: b.meetingTypeId, timeZone: b.timeZone };
  }

  async rescheduleBooking(token: string, startAt: string, timeZone: string): Promise<BookingConfirmation> {
    const b = this.bookings.get(token);
    if (!b || b.status !== 'confirmed') throw new BookingNotFoundError();
    const iso = new Date(startAt).toISOString();
    const slot = this.allSlots().find((s) => s.startAt === iso);
    if (!slot) throw new SlotUnavailableError();
    b.startAt = slot.startAt;
    b.endAt = slot.endAt;
    b.timeZone = timeZone;
    return this.confirmation(b);
  }

  async cancelBooking(token: string): Promise<BookingStatus> {
    const b = this.bookings.get(token);
    if (!b) throw new BookingNotFoundError();
    b.status = 'cancelled';
    return { bookingId: b.id, status: 'cancelled', startAt: b.startAt, endAt: b.endAt, meetingTypeId: b.meetingTypeId };
  }
}
