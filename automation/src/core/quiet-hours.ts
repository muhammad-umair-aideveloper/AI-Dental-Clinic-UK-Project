/**
 * core/quiet-hours.ts
 * Enforces the quiet hours rule: no patient SMS/WhatsApp between 21:00–08:00
 * London time, except for: emergency replies, payment confirmations,
 * and booking confirmations.
 *
 * Correctly handles BST/GMT transitions using date-fns-tz.
 */
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addMinutes, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { clinicConfig } from '../clinic.config.js';

const TZ = clinicConfig.timezone; // 'Europe/London'

export type QuietHoursExemption =
  | 'EMERGENCY'
  | 'PAYMENT_CONFIRMATION'
  | 'BOOKING_CONFIRMATION';

/**
 * Returns true if `now` is within the clinic's quiet hours in London time.
 */
export function isQuietHours(now: Date = new Date()): boolean {
  const zoned = toZonedTime(now, TZ);
  const hours   = zoned.getHours();
  const minutes = zoned.getMinutes();
  const timeVal = hours * 60 + minutes;

  // Quiet: 21:00 (1260 min) → 08:00 next day (480 min)
  const quietStart = 21 * 60; // 1260
  const quietEnd   = 8  * 60; // 480

  return timeVal >= quietStart || timeVal < quietEnd;
}

/**
 * Returns true if a message should be sent now (not in quiet hours,
 * or has an exemption).
 */
export function canSendNow(
  exemption: QuietHoursExemption | null,
  now: Date = new Date(),
): boolean {
  if (exemption !== null) return true; // always exempt
  return !isQuietHours(now);
}

/**
 * If `scheduledTime` falls in quiet hours, shift it to 08:00 London time
 * on the next non-quiet morning.
 *
 * @param scheduledTime - The originally desired send time
 * @param exemption     - If set, quiet hours are skipped
 * @returns             - The adjusted send time
 */
export function adjustForQuietHours(
  scheduledTime: Date,
  exemption: QuietHoursExemption | null = null,
): Date {
  if (exemption !== null) return scheduledTime;
  if (!isQuietHours(scheduledTime)) return scheduledTime;

  // Shift to 08:00 London time on the next calendar day
  const zoned = toZonedTime(scheduledTime, TZ);
  let candidate = setMilliseconds(setSeconds(setMinutes(setHours(zoned, 8), 0), 0), 0);

  // If zoned time is already past midnight but before 08:00, same day is fine.
  // If it's after 21:00, we need next day.
  const h = toZonedTime(scheduledTime, TZ).getHours();
  if (h >= 21) {
    candidate = addDays(candidate, 1);
  }

  return fromZonedTime(candidate, TZ);
}

/**
 * Returns the next 08:00 London time moment (used for scheduled morning alerts).
 */
export function nextMorningAt(time: string = '08:15', from: Date = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  const zoned = toZonedTime(from, TZ);
  let candidate = setMilliseconds(setSeconds(setMinutes(setHours(zoned, h!), m!), 0), 0);

  // If we've already passed that time today, use tomorrow
  if (candidate <= zoned) {
    candidate = addDays(candidate, 1);
  }

  return fromZonedTime(candidate, TZ);
}

/**
 * Checks if a given Date in London time is within clinic opening hours
 * and on a working day (Mon–Fri).
 */
export function isOpeningHours(now: Date = new Date()): boolean {
  const zoned = toZonedTime(now, TZ);
  const dayOfWeek = zoned.getDay(); // 0=Sun, 1=Mon ... 6=Sat

  // Weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  const hours   = zoned.getHours();
  const minutes = zoned.getMinutes();
  const timeVal = hours * 60 + minutes;

  const open  = 8  * 60 + 30; // 08:30
  const close = 18 * 60;      // 18:00

  return timeVal >= open && timeVal < close;
}

/**
 * Computes the callback time displayed to new leads:
 * - If clinic is currently open: now + withinOpenHoursMinutes
 * - If outside hours: nextWorkingDayTime on the next working day
 */
export function computeCallbackTime(now: Date = new Date()): string {
  const { withinOpenHoursMinutes, nextWorkingDayTime } = clinicConfig.callbackPolicy;

  if (isOpeningHours(now)) {
    const callbackUtc = addMinutes(now, withinOpenHoursMinutes);
    const callbackZoned = toZonedTime(callbackUtc, TZ);
    const h = String(callbackZoned.getHours()).padStart(2, '0');
    const m = String(callbackZoned.getMinutes()).padStart(2, '0');
    return `${h}:${m} today`;
  }

  // Next working day at configured time
  const [th, tm] = nextWorkingDayTime.split(':').map(Number);
  const zoned = toZonedTime(now, TZ);
  let candidate = addDays(zoned, 1);

  // Skip weekends
  while (candidate.getDay() === 0 || candidate.getDay() === 6) {
    candidate = addDays(candidate, 1);
  }

  candidate = setMilliseconds(setSeconds(setMinutes(setHours(candidate, th!), tm!), 0), 0);
  const h = String(candidate.getHours()).padStart(2, '0');
  const m = String(candidate.getMinutes()).padStart(2, '0');

  // Day name for clarity
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[candidate.getDay()]!;

  return `${h}:${m} on ${dayName}`;
}
