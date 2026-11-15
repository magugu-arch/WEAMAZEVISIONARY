import './zodConfig';
import { z } from 'zod';
import { timeZoneField } from './enquiry';

/** Provider-neutral booking contract (V11.17). */
export type MeetingType = { id: string; name: string; durationMinutes: number; description: string };
export type AvailableSlot = { startAt: string; endAt: string };
export type BookingConfirmation = {
  bookingId: string;
  status: 'confirmed';
  meetingTypeId: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  attendee: { name: string; email: string };
  manageToken: string;
  provider: string;
};
export type BookingStatus = { bookingId: string; status: 'confirmed' | 'cancelled'; startAt: string; endAt: string; meetingTypeId: string };
export type BookingMode = 'live' | 'mock' | 'unavailable';
export type BookingConfig = { mode: BookingMode; provider: string; meetingTypes: MeetingType[]; notice?: string; horizonDays?: number };

export const availabilityQuerySchema = z.object({
  meetingType: z.string().min(1).max(60),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: timeZoneField,
});

export const bookingRequestSchema = z.object({
  meetingTypeId: z.string().min(1).max(60),
  startAt: z.iso.datetime({ offset: true }),
  timeZone: timeZoneField,
  attendee: z.object({
    name: z.string().trim().min(2, 'Enter your name.').max(120),
    email: z.string().trim().max(254).pipe(z.email('Enter an email address in the format name@example.com.')),
    company: z.string().trim().max(160).optional().default(''),
  }),
  notes: z.string().trim().max(1500).optional().default(''),
  consent: z.literal(true, 'Please confirm you agree so we can arrange the call.'),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9-]{16,80}$/),
});
export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const rescheduleSchema = z.object({ token: z.string().min(20).max(200), startAt: z.iso.datetime({ offset: true }), timeZone: timeZoneField });
export const cancelSchema = z.object({ token: z.string().min(20).max(200) });
