/**
 * jobs/emergency-morning-alert.ts
 * 08:15 morning reminder to reception for out-of-hours emergencies.
 */
import { getLead } from '../core/firestore.js';
import { sendReceptionAlert } from '../core/messaging.js';
import { logger } from '../core/logger.js';
import type { TaskPayload } from '../core/types.js';

export async function handleEmergencyMorningAlert(payload: TaskPayload): Promise<void> {
  const lead = await getLead(payload.leadId);

  const body = [
    `🚨 MORNING EMERGENCY REMINDER`,
    ``,
    `A patient contacted us after hours with a dental emergency.`,
    ``,
    `Patient:  ${(payload['contactName'] as string) ?? lead?.fullName ?? 'Name not collected'}`,
    `Mobile:   ${(payload['contactMobile'] as string) ? '[secured]' : 'Not collected'}`,
    `Message:  ${(payload['patientMessage'] as string) ?? 'No message stored'}`,
    `Category: ${(payload['category'] as string) ?? 'STANDARD'}`,
    `Lead ID:  ${payload.leadId}`,
    ``,
    `ACTION: Offer first 08:30 slot. Call the patient now.`,
  ].join('\n');

  await sendReceptionAlert({
    leadId:   payload.leadId,
    subject:  `🚨 MORNING EMERGENCY REMINDER — Call patient now`,
    body,
    template: 'EMERGENCY_MORNING_ALERT',
    emergency: true,
  });

  logger.info({ leadId: payload.leadId }, 'Emergency morning alert sent to reception');
}
