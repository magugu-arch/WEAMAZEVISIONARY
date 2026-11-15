import type { AvailableSlot, BookingConfirmation, BookingRequest, BookingStatus, MeetingType } from '@shared/booking';

/** Provider-neutral scheduling interface (V11.17). A real adapter (Cal.com, Calendly, Google, Microsoft) implements this. */
export interface BookingProvider {
  readonly name: string;
  readonly mode: 'live' | 'mock';
  meetingTypes(): Promise<MeetingType[]>;
  getAvailability(input: { meetingTypeId: string; startDate: string; endDate: string; timeZone: string }): Promise<AvailableSlot[]>;
  /** Must re-validate the slot with the provider and only resolve once the provider confirms. */
  createBooking(input: BookingRequest): Promise<BookingConfirmation>;
  getBooking(token: string): Promise<BookingStatus & { timeZone: string } | null>;
  rescheduleBooking(token: string, startAt: string, timeZone: string): Promise<BookingConfirmation>;
  cancelBooking(token: string): Promise<BookingStatus>;
}

export class SlotUnavailableError extends Error {
  constructor() { super('slot_unavailable'); }
}
export class BookingNotFoundError extends Error {
  constructor() { super('booking_not_found'); }
}
