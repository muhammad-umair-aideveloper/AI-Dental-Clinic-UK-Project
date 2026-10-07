/**
 * jobs/release-hold.ts
 */
import { getLead, updateLead } from '../core/firestore.js';
import { releaseHoldEvent } from '../workflows/w3-deposit/calendar.js';
import { sendReceptionEmail } from '../core/messaging.js';
import { logger } from '../core/logger.js';
import type { TaskPayload } from '../core/types.js';

export async function handleReleaseHold(payload: TaskPayload): Promise<void> {
  const lead = await getLead(payload.leadId);
  if (!lead) return;

  // If already confirmed, skip release
  if (lead.status !== 'DEPOSIT_PENDING') {
    logger.info({ leadId: lead.id, status: lead.status }, 'Hold release skipped — not pending');
    return;
  }

  logger.info({ leadId: lead.id }, 'Releasing calendar hold — deposit not paid in 24h');

  // Release calendar event
  if (lead.calendarEventId) {
    await releaseHoldEvent(lead.calendarEventId, lead.id);
  }

  // Update lead status
  await updateLead(lead.id, {
    status:          'CANCELLED',
    calendarEventId: undefined,
  });

  // Alert reception
  await sendReceptionEmail({
    leadId:   lead.id,
    subject:  `⚠️ Slot released — ${lead.fullName ?? 'Unknown'} did not pay deposit`,
    body:     `${lead.fullName ?? 'A patient'} did not pay the deposit within 24 hours. The slot has been released.\n\nLead ID: ${lead.id}\nTreatment: ${lead.treatment}\nMobile: [secured in Firestore]`,
    template: 'HOLD_RELEASED_ALERT',
  });
}
