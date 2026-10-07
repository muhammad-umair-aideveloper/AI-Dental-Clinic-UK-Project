/**
 * workflows/w4-review/scheduler.ts
 * Schedules review request messages after COMPLETED status.
 *
 * Rules:
 *   - Schedule at completed_at + 2h
 *   - If that time is outside 09:00–20:00 London → shift to 09:00 next day
 *   - Max 2 messages total per patient
 *   - Honour STOP/opt-out immediately
 *   - Skip do-not-contact patients
 *   - Send to ALL completed patients — no sentiment gating
 */
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addHours, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { clinicConfig } from '../../clinic.config.js';
import { scheduleJob } from '../../core/scheduler.js';
import { logger } from '../../core/logger.js';
import type { Lead } from '../../core/types.js';

const TZ = clinicConfig.timezone;

/**
 * Computes the send time for the first review message (completed_at + 2h,
 * clamped to 09:00–20:00 window).
 */
export function computeReviewSendTime(completedAt: Date): Date {
  const candidate = addHours(completedAt, 2);
  return clampToReviewWindow(candidate);
}

/**
 * Computes the send time for the follow-up (first_message_at + 48h,
 * clamped to 09:00–20:00 window).
 */
export function computeFollowUpSendTime(firstSentAt: Date): Date {
  const candidate = addHours(firstSentAt, 48);
  return clampToReviewWindow(candidate);
}

function clampToReviewWindow(date: Date): Date {
  const zoned = toZonedTime(date, TZ);
  const hours = zoned.getHours();
  const WINDOW_START = 9;  // 09:00
  const WINDOW_END   = 20; // 20:00

  if (hours >= WINDOW_START && hours < WINDOW_END) {
    return date; // Already in window
  }

  // Before 09:00 → send at 09:00 same day
  if (hours < WINDOW_START) {
    const adjusted = setMilliseconds(setSeconds(setMinutes(setHours(zoned, WINDOW_START), 0), 0), 0);
    return fromZonedTime(adjusted, TZ);
  }

  // After 20:00 → send at 09:00 next day
  const nextDay   = addDays(zoned, 1);
  const adjusted  = setMilliseconds(setSeconds(setMinutes(setHours(nextDay, WINDOW_START), 0), 0), 0);
  return fromZonedTime(adjusted, TZ);
}

/**
 * Schedules the review request for a completed lead.
 * Called when a lead transitions to COMPLETED.
 */
export async function scheduleReviewRequest(lead: Lead): Promise<void> {
  if (lead.optOut || lead.doNotContact) {
    logger.info({ leadId: lead.id }, 'Skipping review request — opt-out or do-not-contact');
    return;
  }

  if (!lead.mobile) {
    logger.warn({ leadId: lead.id }, 'Cannot schedule review — no mobile number');
    return;
  }

  const completedAt  = new Date(); // now
  const sendTime     = computeReviewSendTime(completedAt);

  await scheduleJob(
    {
      jobType:      'SEND_REVIEW_REQUEST',
      leadId:       lead.id,
      scheduledFor: sendTime.toISOString(),
    },
    'automation-reviews',
    sendTime,
  );

  logger.info(
    { leadId: lead.id, sendTime: sendTime.toISOString() },
    'Review request scheduled',
  );
}
