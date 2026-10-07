/**
 * jobs/send-reminder.ts
 * Handles SEND_REMINDER_24H and SEND_REMINDER_2H jobs.
 */
import { getLead } from '../core/firestore.js';
import { sendWhatsAppWithSmsFallback, renderTemplate } from '../core/messaging.js';
import { clinicConfig } from '../clinic.config.js';
import { logger } from '../core/logger.js';
import type { TaskPayload } from '../core/types.js';

export async function handleSendReminder(payload: TaskPayload): Promise<void> {
  const lead = await getLead(payload.leadId);
  if (!lead || !lead.mobile) return;
  if (lead.optOut || lead.doNotContact) return;

  // Skip if not confirmed (cancelled/no-show)
  if (lead.status !== 'CONFIRMED') {
    logger.info({ leadId: lead.id, status: lead.status }, 'Reminder skipped — not CONFIRMED');
    return;
  }

  // Skip if scheduled time has already passed
  const scheduledFor = new Date(payload.scheduledFor);
  if (scheduledFor < new Date()) {
    logger.warn({ leadId: lead.id, scheduledFor: payload.scheduledFor }, 'Reminder skipped — time already passed');
    return;
  }

  const is24h = payload.jobType === 'SEND_REMINDER_24H';
  const template = is24h
    ? clinicConfig.messageTemplates.reminder24h
    : clinicConfig.messageTemplates.reminder2h;

  const apptDate = lead.appointmentDateTime
    ? new Date(lead.appointmentDateTime)
    : null;

  const body = renderTemplate(template, {
    name:         lead.fullName ?? 'there',
    dentist:      clinicConfig.leadDentist,
    date:         apptDate?.toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) ?? 'your upcoming appointment',
    time:         apptDate?.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }) ?? '',
    address:      clinicConfig.address.full,
    parking:      clinicConfig.address.parking,
    mapsUrl:      clinicConfig.address.mapsUrl,
    rescheduleUrl: `${process.env['SERVICE_BASE_URL']}/reschedule/${lead.id}`,
  });

  await sendWhatsAppWithSmsFallback(
    lead.id, lead.mobile, body,
    is24h ? 'REMINDER_24H' : 'REMINDER_2H',
  );

  logger.info({ leadId: lead.id, jobType: payload.jobType }, 'Reminder sent');
}
