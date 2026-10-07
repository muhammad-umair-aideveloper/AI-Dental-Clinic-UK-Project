/**
 * workflows/w3-deposit/trigger.ts
 * Triggers the deposit workflow for a qualified lead.
 * Called from W1 on qualification completion.
 */
import { getLead } from '../../core/firestore.js';
import { scheduleImmediate } from '../../core/scheduler.js';
import { logger } from '../../core/logger.js';

export async function triggerDepositWorkflow(leadId: string): Promise<void> {
  const lead = await getLead(leadId);
  if (!lead) {
    logger.error({ leadId }, 'Cannot trigger W3: lead not found');
    return;
  }
  if (!lead.mobile && !lead.email) {
    logger.warn({ leadId }, 'Cannot trigger W3: no contact details');
    return;
  }

  // Schedule immediately — the job handler creates the Stripe session + calendar event
  await scheduleImmediate(
    {
      jobType:      'SEND_DEPOSIT_NUDGE', // repurposed as initial trigger
      leadId,
      scheduledFor: new Date().toISOString(),
      triggerType:  'INITIAL',
    },
    'automation-reminders',
  );

  logger.info({ leadId }, 'W3 deposit workflow triggered');
}
