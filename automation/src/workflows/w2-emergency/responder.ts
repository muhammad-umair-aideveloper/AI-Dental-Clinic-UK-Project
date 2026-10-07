/**
 * workflows/w2-emergency/responder.ts
 *
 * Emergency response handler.
 * Uses ONLY pre-approved text from clinic.config.ts — never LLM-generated.
 * Alerts reception immediately via SMS + WhatsApp + email.
 */
import { clinicConfig } from '../../clinic.config.js';
import {
  sendWhatsAppWithSmsFallback,
  sendReceptionAlert,
  renderTemplate,
} from '../../core/messaging.js';
import { scheduleJob } from '../../core/scheduler.js';
import { getLead, updateLead } from '../../core/firestore.js';
import { logger } from '../../core/logger.js';
import { isOpeningHours, nextMorningAt } from '../../core/quiet-hours.js';
import type { EmergencyCategory } from './detector.js';
import type { Lead } from '../../core/types.js';

const { emergencyMessages, nearestAE, contact } = clinicConfig;

// ─── Build the fixed emergency reply ─────────────────────────────────────────

export function buildEmergencyReply(category: EmergencyCategory): string {
  if (category === 'RED_FLAG') {
    return renderTemplate(emergencyMessages.redFlag, {
      aeName:    nearestAE.name,
      aeAddress: nearestAE.address,
    });
  }

  return renderTemplate(emergencyMessages.standard, {
    emergencyLine: contact.emergencyLine,
    aeName:        nearestAE.name,
    aeAddress:     nearestAE.address,
  });
}

export function buildFollowOnMessage(): string {
  return emergencyMessages.followOn;
}

// ─── Handle Emergency Lead ────────────────────────────────────────────────────

export interface EmergencyHandlerInput {
  leadId: string;
  patientMessage: string;
  category: EmergencyCategory;
  matchedPhrase?: string;
  /** Already-known contact details (may be partial) */
  contact?: {
    name?: string;
    mobile?: string;
  };
  now?: Date;
}

export interface EmergencyHandlerResult {
  replyToPatient: string;
  followOnMessage: string;
}

/**
 * Handles an emergency detection:
 * 1. Marks lead as emergency
 * 2. Sends pre-approved reply to patient (WhatsApp → SMS fallback)
 * 3. Alerts reception immediately (high-priority: SMS + WA + email)
 * 4. If out of hours: schedules 08:15 morning reminder for reception
 */
export async function handleEmergency(
  input: EmergencyHandlerInput,
): Promise<EmergencyHandlerResult> {
  const now = input.now ?? new Date();
  const { leadId, category, matchedPhrase, patientMessage } = input;

  logger.warn(
    { leadId, category, matchedPhrase },
    'Emergency detected — stopping qualification',
  );

  // Mark lead as emergency in Firestore
  await updateLead(leadId, {
    emergency: true,
    status:    'QUALIFYING', // stays here — no further qualification
    updatedAt: new Date().toISOString(),
  });

  // Build the fixed reply
  const replyToPatient = buildEmergencyReply(category);
  const followOn       = buildFollowOnMessage();

  // Send emergency info to patient if we have their number
  if (input.contact?.mobile) {
    await sendWhatsAppWithSmsFallback(
      leadId,
      input.contact.mobile,
      replyToPatient,
      'EMERGENCY_REPLY',
      'EMERGENCY',
    );
  }

  // Build reception alert body
  const lead = await getLead(leadId);
  const receptionBody = buildReceptionAlertBody(lead, patientMessage, category, matchedPhrase, now);

  // Alert reception immediately
  await sendReceptionAlert({
    leadId,
    subject:   `${emergencyMessages.receptionAlertSubject} — ${input.contact?.name ?? 'Unknown patient'}`,
    body:      receptionBody,
    template:  'EMERGENCY_RECEPTION_ALERT',
    emergency: true,
  });

  // If out of hours: schedule 08:15 morning reminder for reception
  if (!isOpeningHours(now)) {
    const reminderTime = nextMorningAt('08:15', now);
    await scheduleJob(
      {
        jobType:       'SEND_EMERGENCY_MORNING_ALERT',
        leadId,
        scheduledFor:  reminderTime.toISOString(),
        patientMessage,
        category:      category ?? 'STANDARD',
        contactName:   input.contact?.name,
        contactMobile: input.contact?.mobile,
      },
      'automation-jobs',
      reminderTime,
    );

    logger.info(
      { leadId, reminderTime: reminderTime.toISOString() },
      'Scheduled 08:15 emergency morning reminder for reception',
    );
  }

  return { replyToPatient, followOnMessage: followOn };
}

// ─── Reception Alert Body ─────────────────────────────────────────────────────

function buildReceptionAlertBody(
  lead: Lead | null,
  patientMessage: string,
  category: EmergencyCategory,
  matchedPhrase: string | undefined,
  now: Date,
): string {
  const severity = category === 'RED_FLAG' ? '🚨 RED FLAG (999/A&E)' : '⚠️ URGENT (Emergency line + 111)';

  const lines = [
    `🚨 EMERGENCY PATIENT — IMMEDIATE ACTION REQUIRED`,
    ``,
    `Severity:    ${severity}`,
    `Time:        ${now.toLocaleString('en-GB', { timeZone: 'Europe/London' })}`,
    `Lead ID:     ${lead?.id ?? 'unknown'}`,
    `Name:        ${lead?.fullName ?? 'Not yet collected'}`,
    `Mobile:      ${lead?.mobile ?? 'Not yet collected'}`,
    `Email:       ${lead?.email ?? 'Not collected'}`,
    ``,
    `Patient's exact words:`,
    `"${patientMessage}"`,
    ``,
    `Matched keyword: ${matchedPhrase ?? 'N/A'}`,
    ``,
    `ACTION: Offer first 08:30 slot. Call the patient as soon as clinic opens.`,
  ];

  return lines.join('\n');
}
