/**
 * jobs/task-router.ts
 * Routes incoming Cloud Tasks jobs to the appropriate handler.
 * Called from POST /webhooks/tasks (after X-Task-Secret verification).
 */
import { logger } from '../core/logger.js';
import type { TaskPayload } from '../core/types.js';
import { handleSendDepositNudge }   from './send-deposit-nudge.js';
import { handleReleaseHold }         from './release-hold.js';
import { handleSendReminder }        from './send-reminder.js';
import { handleSendReview }          from './send-review.js';
import { handleEmergencyMorningAlert } from './emergency-morning-alert.js';
import { handleDailySummary }        from './daily-summary.js';

export async function routeTask(payload: TaskPayload): Promise<void> {
  logger.info({ jobType: payload.jobType, leadId: payload.leadId }, 'Processing task');

  switch (payload.jobType) {
    case 'SEND_DEPOSIT_NUDGE':
      await handleSendDepositNudge(payload);
      break;
    case 'RELEASE_CALENDAR_HOLD':
      await handleReleaseHold(payload);
      break;
    case 'SEND_REMINDER_24H':
    case 'SEND_REMINDER_2H':
      await handleSendReminder(payload);
      break;
    case 'SEND_REVIEW_REQUEST':
    case 'SEND_REVIEW_FOLLOWUP':
      await handleSendReview(payload);
      break;
    case 'SEND_EMERGENCY_MORNING_ALERT':
      await handleEmergencyMorningAlert(payload);
      break;
    case 'SEND_DAILY_SUMMARY':
      await handleDailySummary(payload);
      break;
    default:
      logger.warn({ jobType: (payload as TaskPayload).jobType }, 'Unknown job type — ignoring');
  }
}
