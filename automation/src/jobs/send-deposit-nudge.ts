/**
 * jobs/send-deposit-nudge.ts
 */
import { getLead } from '../core/firestore.js';
import { sendWhatsAppWithSmsFallback, renderTemplate } from '../core/messaging.js';
import { clinicConfig } from '../clinic.config.js';
import { logger } from '../core/logger.js';
import type { TaskPayload } from '../core/types.js';

export async function handleSendDepositNudge(payload: TaskPayload): Promise<void> {
  const lead = await getLead(payload.leadId);
  if (!lead || !lead.mobile) return;

  // If already paid, skip
  if (lead.status === 'CONFIRMED' || lead.status === 'ATTENDED' || lead.status === 'COMPLETED') {
    logger.info({ leadId: lead.id }, 'Deposit nudge skipped — already confirmed');
    return;
  }

  // If the trigger type is INITIAL, this is the first deposit link send
  const isInitial = (payload['triggerType'] as string) === 'INITIAL';
  if (isInitial) {
    const { sendDepositLink } = await import('../workflows/w3-deposit/stripe.js');
    await sendDepositLink(lead.id);
    return;
  }

  // NUDGE — check if still pending
  if (lead.status !== 'DEPOSIT_PENDING') return;

  const body = renderTemplate(clinicConfig.messageTemplates.depositNudge, {
    name:    lead.fullName ?? 'there',
    dentist: clinicConfig.leadDentist,
    amount:  String(clinicConfig.fees.depositDefault),
    url:     `${process.env['SERVICE_BASE_URL']}/deposit/retry/${lead.id}`,
  });

  await sendWhatsAppWithSmsFallback(lead.id, lead.mobile, body, 'DEPOSIT_NUDGE');
  logger.info({ leadId: lead.id }, 'Deposit nudge sent');
}
