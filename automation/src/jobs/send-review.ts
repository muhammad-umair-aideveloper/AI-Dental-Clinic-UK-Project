/**
 * jobs/send-review.ts
 * Handles SEND_REVIEW_REQUEST and SEND_REVIEW_FOLLOWUP jobs.
 */
import { getLead, updateLead, countReviewClicks } from '../core/firestore.js';
import { sendWhatsAppWithSmsFallback, renderTemplate } from '../core/messaging.js';
import { scheduleJob } from '../core/scheduler.js';
import { clinicConfig } from '../clinic.config.js';
import { buildReviewShortUrl } from '../workflows/w4-review/short-link.js';
import { computeFollowUpSendTime } from '../workflows/w4-review/scheduler.js';
import { logger } from '../core/logger.js';
import type { TaskPayload } from '../core/types.js';

export async function handleSendReview(payload: TaskPayload): Promise<void> {
  const lead = await getLead(payload.leadId);
  if (!lead || !lead.mobile) return;

  // Honour opt-out / do-not-contact
  if (lead.optOut || lead.doNotContact) {
    logger.info({ leadId: lead.id }, 'Review message skipped — opt-out');
    return;
  }

  // Never more than 2 messages total
  if (lead.reviewMessageCount >= 2) {
    logger.info({ leadId: lead.id }, 'Review message skipped — max 2 already sent');
    return;
  }

  const isFirstMessage = payload.jobType === 'SEND_REVIEW_REQUEST';

  // Follow-up check: skip if link already clicked
  if (!isFirstMessage) {
    const clicks = await countReviewClicks(lead.id);
    if (clicks > 0) {
      logger.info({ leadId: lead.id }, 'Review follow-up skipped — link already clicked');
      return;
    }
  }

  const reviewUrl = buildReviewShortUrl(lead.id);
  const template  = isFirstMessage
    ? clinicConfig.messageTemplates.reviewRequest
    : clinicConfig.messageTemplates.reviewFollowUp;

  const body = renderTemplate(template, {
    name:      lead.fullName ?? 'there',
    dentist:   clinicConfig.leadDentist,
    reviewUrl,
  });

  await sendWhatsAppWithSmsFallback(
    lead.id, lead.mobile, body,
    isFirstMessage ? 'REVIEW_REQUEST' : 'REVIEW_FOLLOWUP',
  );

  // Increment counter
  await updateLead(lead.id, {
    reviewMessageCount: (lead.reviewMessageCount ?? 0) + 1,
    reviewRequestedAt:  lead.reviewRequestedAt ?? new Date().toISOString(),
  });

  logger.info({ leadId: lead.id, messageNumber: (lead.reviewMessageCount ?? 0) + 1 }, 'Review message sent');

  // If first message, schedule follow-up at T+48h (if not already 2 messages)
  if (isFirstMessage && (lead.reviewMessageCount ?? 0) + 1 < 2) {
    const followUpTime = computeFollowUpSendTime(new Date());
    await scheduleJob(
      { jobType: 'SEND_REVIEW_FOLLOWUP', leadId: lead.id, scheduledFor: followUpTime.toISOString() },
      'automation-reviews',
      followUpTime,
    );
    logger.info({ leadId: lead.id, followUpTime: followUpTime.toISOString() }, 'Review follow-up scheduled');
  }
}
