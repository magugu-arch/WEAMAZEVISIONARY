import { describe, expect, it } from 'vitest';
import { dateKey, isValidTimeZone, offsetMinutes, zoneLabel, zonedParts, zonedTimeToUtc } from '@shared/timezone';

/** V11.08: test London, New York, Tokyo, Sydney and Johannesburg, including DST transitions. */
describe('IANA time-zone conversion', () => {
  it('validates zones without hard-coded lists', () => {
    expect(isValidTimeZone('Europe/London')).toBe(true);
    expect(isValidTimeZone('Asia/Tokyo')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it.each([
    // zone, local wall time, expected UTC instant
    ['Europe/London', [2026, 1, 15, 14, 0], '2026-01-15T14:00:00.000Z'], // GMT
    ['Europe/London', [2026, 7, 15, 14, 0], '2026-07-15T13:00:00.000Z'], // BST
    ['America/New_York', [2026, 1, 15, 9, 30], '2026-01-15T14:30:00.000Z'], // EST
    ['America/New_York', [2026, 7, 15, 9, 30], '2026-07-15T13:30:00.000Z'], // EDT
    ['Asia/Tokyo', [2026, 7, 15, 10, 0], '2026-07-15T01:00:00.000Z'], // JST, no DST
    ['Australia/Sydney', [2026, 1, 15, 10, 0], '2026-01-14T23:00:00.000Z'], // AEDT (southern summer)
    ['Australia/Sydney', [2026, 7, 15, 10, 0], '2026-07-15T00:00:00.000Z'], // AEST
    ['Africa/Johannesburg', [2026, 11, 10, 9, 0], '2026-11-10T07:00:00.000Z'], // SAST, no DST
  ] as const)('%s %j → %s', (tz, [y, m, d, h, min], iso) => {
    expect(zonedTimeToUtc(y, m, d, h, min, tz).toISOString()).toBe(iso);
  });

  it('round-trips wall time across a full year for every QA zone', () => {
    for (const tz of ['Europe/London', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney', 'Africa/Johannesburg']) {
      for (let month = 1; month <= 12; month++) {
        const utc = zonedTimeToUtc(2026, month, 12, 11, 15, tz);
        const back = zonedParts(utc, tz);
        expect([back.year, back.month, back.day, back.hour, back.minute]).toEqual([2026, month, 12, 11, 15]);
      }
    }
  });

  it('moves a non-existent local time forward in a spring-forward gap (London 29 March 2026)', () => {
    // 01:30 does not exist in London on 29 March 2026; clocks jump from 01:00 to 02:00.
    const utc = zonedTimeToUtc(2026, 3, 29, 1, 30, 'Europe/London');
    expect(utc.toISOString()).toBe('2026-03-29T01:30:00.000Z'); // 02:30 BST
    expect(zonedParts(utc, 'Europe/London').hour).toBe(2);
  });

  it('resolves an ambiguous fall-back time (New York 1 November 2026) to a valid instant', () => {
    const utc = zonedTimeToUtc(2026, 11, 1, 1, 30, 'America/New_York');
    const back = zonedParts(utc, 'America/New_York');
    expect([back.hour, back.minute]).toEqual([1, 30]);
  });

  it('reports offsets from the platform database', () => {
    expect(offsetMinutes(new Date('2026-07-01T12:00:00Z'), 'Europe/London')).toBe(60);
    expect(offsetMinutes(new Date('2026-01-01T12:00:00Z'), 'Europe/London')).toBe(0);
    expect(offsetMinutes(new Date('2026-01-01T12:00:00Z'), 'Australia/Sydney')).toBe(660);
  });

  it('groups by the local calendar date of the chosen zone', () => {
    const instant = new Date('2026-11-10T23:30:00Z');
    expect(dateKey(instant, 'Europe/London')).toBe('2026-11-10');
    expect(dateKey(instant, 'Asia/Tokyo')).toBe('2026-11-11');
  });

  it('labels the zone for the instant shown', () => {
    expect(zoneLabel('2026-07-15T13:00:00Z', 'Europe/London')).toBe('BST');
    expect(zoneLabel('2026-01-15T13:00:00Z', 'Europe/London')).toBe('GMT');
  });
});
