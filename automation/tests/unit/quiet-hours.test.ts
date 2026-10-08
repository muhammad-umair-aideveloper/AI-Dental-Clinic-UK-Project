/**
 * tests/unit/quiet-hours.test.ts
 * Tests BST/GMT boundary cases, DST transitions, and scheduling logic.
 */
import { describe, it, expect } from 'vitest';
import {
  isQuietHours,
  canSendNow,
  adjustForQuietHours,
  computeCallbackTime,
  isOpeningHours,
  nextMorningAt,
} from '../../src/core/quiet-hours.js';

// Helper: create a Date at a given London time
function londonTime(dateStr: string, timeStr: string): Date {
  // e.g. londonTime('2024-03-31', '21:30') → correct UTC for BST
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}

// Helper: create UTC moment that corresponds to London local time
function utcForLondon(iso: string): Date {
  return new Date(iso);
}

describe('isQuietHours — GMT winter (UTC = London)', () => {
  it('22:00 GMT is quiet', () => {
    // Jan 15 22:00 London = Jan 15 22:00 UTC
    expect(isQuietHours(new Date('2024-01-15T22:00:00Z'))).toBe(true);
  });

  it('21:00 GMT is quiet (boundary)', () => {
    expect(isQuietHours(new Date('2024-01-15T21:00:00Z'))).toBe(true);
  });

  it('07:59 GMT is quiet (pre-08:00)', () => {
    expect(isQuietHours(new Date('2024-01-15T07:59:00Z'))).toBe(true);
  });

  it('08:00 GMT is NOT quiet', () => {
    expect(isQuietHours(new Date('2024-01-15T08:00:00Z'))).toBe(false);
  });

  it('12:00 GMT is NOT quiet', () => {
    expect(isQuietHours(new Date('2024-01-15T12:00:00Z'))).toBe(false);
  });

  it('20:59 GMT is NOT quiet', () => {
    expect(isQuietHours(new Date('2024-01-15T20:59:00Z'))).toBe(false);
  });
});

describe('isQuietHours — BST summer (London = UTC+1)', () => {
  it('21:00 BST (20:00 UTC) is quiet', () => {
    // Aug 15 21:00 BST = 20:00 UTC
    expect(isQuietHours(new Date('2024-08-15T20:00:00Z'))).toBe(true);
  });

  it('08:00 BST (07:00 UTC) is NOT quiet', () => {
    // Aug 15 08:00 BST = 07:00 UTC
    expect(isQuietHours(new Date('2024-08-15T07:00:00Z'))).toBe(false);
  });

  it('07:59 BST (06:59 UTC) is quiet', () => {
    expect(isQuietHours(new Date('2024-08-15T06:59:00Z'))).toBe(true);
  });

  it('20:59 BST (19:59 UTC) is NOT quiet', () => {
    expect(isQuietHours(new Date('2024-08-15T19:59:00Z'))).toBe(false);
  });
});

describe('DST transition day — clocks spring forward (last Sunday March 2024 = March 31)', () => {
  it('01:00 London on March 31 (clocks skip to 02:00) — before 08:00 is still quiet', () => {
    // At the transition, 01:00 doesn't exist in BST — but pre-transition GMT 01:00
    // London = 01:00 UTC on March 31 (still GMT until 01:00)
    expect(isQuietHours(new Date('2024-03-31T05:00:00Z'))).toBe(true); // 05:00 UTC = 06:00 BST
  });

  it('After transition, 08:00 BST = 07:00 UTC is NOT quiet', () => {
    expect(isQuietHours(new Date('2024-03-31T07:00:00Z'))).toBe(false);
  });
});

describe('DST transition day — clocks fall back (last Sunday Oct 2024 = Oct 27)', () => {
  it('21:00 BST (20:00 UTC) on Oct 27 is quiet', () => {
    expect(isQuietHours(new Date('2024-10-27T20:00:00Z'))).toBe(true);
  });

  it('21:00 GMT (21:00 UTC) on Oct 27 is quiet', () => {
    expect(isQuietHours(new Date('2024-10-27T21:00:00Z'))).toBe(true);
  });
});

describe('canSendNow', () => {
  it('returns true during quiet hours with EMERGENCY exemption', () => {
    expect(canSendNow('EMERGENCY', new Date('2024-01-15T22:00:00Z'))).toBe(true);
  });

  it('returns true during quiet hours with PAYMENT_CONFIRMATION exemption', () => {
    expect(canSendNow('PAYMENT_CONFIRMATION', new Date('2024-01-15T23:00:00Z'))).toBe(true);
  });

  it('returns false during quiet hours with no exemption', () => {
    expect(canSendNow(null, new Date('2024-01-15T22:00:00Z'))).toBe(false);
  });

  it('returns true outside quiet hours with no exemption', () => {
    expect(canSendNow(null, new Date('2024-01-15T12:00:00Z'))).toBe(true);
  });
});

describe('adjustForQuietHours', () => {
  it('passes through a time outside quiet hours unchanged', () => {
    const input = new Date('2024-01-15T12:00:00Z'); // 12:00 GMT — not quiet
    const result = adjustForQuietHours(input);
    expect(result.getTime()).toBe(input.getTime());
  });

  it('shifts a post-21:00 time to 08:00 next day (GMT)', () => {
    const input  = new Date('2024-01-15T21:30:00Z'); // 21:30 GMT
    const result = adjustForQuietHours(input);
    // Should be Jan 16 08:00 GMT
    expect(result.getUTCHours()).toBe(8);
    expect(result.getUTCDate()).toBe(16);
  });

  it('shifts a pre-08:00 time to 08:00 same day (GMT)', () => {
    const input  = new Date('2024-01-15T05:00:00Z'); // 05:00 GMT
    const result = adjustForQuietHours(input);
    expect(result.getUTCHours()).toBe(8);
    expect(result.getUTCDate()).toBe(15);
  });

  it('passes through with EMERGENCY exemption even during quiet hours', () => {
    const input  = new Date('2024-01-15T23:00:00Z');
    const result = adjustForQuietHours(input, 'EMERGENCY');
    expect(result.getTime()).toBe(input.getTime());
  });
});

describe('isOpeningHours', () => {
  it('Monday 09:00 GMT is open', () => {
    // Jan 15 2024 = Monday; 09:00 UTC = 09:00 GMT
    expect(isOpeningHours(new Date('2024-01-15T09:00:00Z'))).toBe(true);
  });

  it('Friday 17:00 GMT is open', () => {
    // Jan 19 2024 = Friday
    expect(isOpeningHours(new Date('2024-01-19T17:00:00Z'))).toBe(true);
  });

  it('Friday 18:00 GMT is closed (closing time)', () => {
    expect(isOpeningHours(new Date('2024-01-19T18:00:00Z'))).toBe(false);
  });

  it('Monday 08:29 GMT is closed (before opening)', () => {
    expect(isOpeningHours(new Date('2024-01-15T08:29:00Z'))).toBe(false);
  });

  it('Saturday is always closed', () => {
    // Jan 20 2024 = Saturday
    expect(isOpeningHours(new Date('2024-01-20T12:00:00Z'))).toBe(false);
  });

  it('Sunday is always closed', () => {
    // Jan 21 2024 = Sunday
    expect(isOpeningHours(new Date('2024-01-21T10:00:00Z'))).toBe(false);
  });
});

describe('computeCallbackTime', () => {
  it('during open hours returns "within 1 hour today"', () => {
    // Monday 10:00 GMT
    const result = computeCallbackTime(new Date('2024-01-15T10:00:00Z'));
    expect(result).toContain('today');
    expect(result).toContain('11:00'); // 10:00 + 60 min = 11:00
  });

  it('after hours returns next working day at 09:00', () => {
    // Monday 19:00 GMT — after hours
    const result = computeCallbackTime(new Date('2024-01-15T19:00:00Z'));
    expect(result).toContain('09:00');
    expect(result).toContain('Tuesday');
  });

  it('Friday after hours → Monday at 09:00 (skips weekend)', () => {
    // Friday 20:00 GMT
    const result = computeCallbackTime(new Date('2024-01-19T20:00:00Z'));
    expect(result).toContain('Monday');
    expect(result).toContain('09:00');
  });

  it('Saturday → Monday at 09:00', () => {
    const result = computeCallbackTime(new Date('2024-01-20T12:00:00Z'));
    expect(result).toContain('Monday');
  });
});
