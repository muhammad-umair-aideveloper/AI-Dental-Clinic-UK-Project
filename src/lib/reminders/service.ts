/**
 * src/lib/reminders/service.ts
 *
 * Patient Appointment Reminder Service for Vertex Dental Lab.
 * Runs on a 5-minute schedule via pg_cron (*/5 * * * *).
 *
 * Requirements:
 *  - Dispatches reminders ~1 hour before appointment time (0..65 minute window)
 *  - Enforces UK GDPR consent check: reminder_consent must be TRUE
 *  - Ignores CANCELLED appointments
 *  - Idempotent and atomic: sets reminder_sent = true upon successful dispatch
 *  - Safe retry: on dispatch error, leaves reminder_sent = false for next poll
 *  - Data privacy: logs masked phone numbers without leaking PII
 */

import { clinicConfig, utcToLondon } from '@/config/clinic.config';
import {
  getAppointmentsDueForReminder,
  markReminderAsSent,
} from '@/lib/appointments/service';
import type { AppointmentRecord } from '@/lib/appointments/types';
import { sendMessage, type MessageChannel } from '@/lib/messaging';

/**
 * Format patient first name for friendly salutation.
 * e.g. "Charlotte King" -> "Charlotte"
 * "Dr. John Doe" -> "John"
 */
export function getPatientFirstName(fullName: string): string {
  const clean = fullName.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Miss)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[0] : 'there';
}

/**
 * Format the reminder SMS message text.
 */
export function formatPatientReminderMessage(appointment: AppointmentRecord): string {
  const firstName = getPatientFirstName(appointment.patient_name);
  const timeFormatted = appointment.london_time || utcToLondon(appointment.slot_time).time12;
  const clinician = appointment.clinician_name || clinicConfig.leadDentist;

  return (
    `Hi ${firstName}, reminder of your appointment at ${clinicConfig.name} today at ${timeFormatted} ` +
    `with ${clinician} for ${appointment.reason}. ` +
    `Please arrive 5 mins early. Need to change? Call ${clinicConfig.ownerContact.phone}.`
  );
}

export interface ReminderProcessResult {
  processed: number;
  sent: number;
  failed: number;
  results: Array<{
    id: string;
    success: boolean;
    maskedPhone: string;
    error?: string;
  }>;
}

/**
 * Mask phone number for zero-PII logging (e.g. +447946088800 -> +4479***800).
 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length <= 6) return '******';
  return `${phone.slice(0, 5)}***${phone.slice(-3)}`;
}

/**
 * Core Reminder Dispatch Engine.
 * Fetches due appointments, checks consent, sends message, and flips reminder_sent atomically.
 */
export async function sendDuePatientReminders(options?: {
  referenceTime?: Date;
  windowMinutes?: number;
  channel?: MessageChannel;
}): Promise<ReminderProcessResult> {
  const referenceTime = options?.referenceTime || new Date();
  const windowMinutes = options?.windowMinutes ?? 65; // ~1 hour before appointment (with 5-minute cron buffer)
  const channel: MessageChannel = options?.channel || 'sms';

  // 1. Query appointments that are due, have consent, and haven't had a reminder sent yet
  const dueAppointments = await getAppointmentsDueForReminder(referenceTime, windowMinutes);

  const results: ReminderProcessResult['results'] = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const apt of dueAppointments) {
    const maskedPhone = maskPhoneNumber(apt.phone_number);
    const messageText = formatPatientReminderMessage(apt);
    const subject = `${clinicConfig.name} Appointment Reminder`;

    try {
      // 2. Dispatch via provider-agnostic messaging layer
      const sendRes = await sendMessage(channel, apt.phone_number, messageText, subject);

      if (sendRes.success) {
        // 3. Atomically update reminder_sent flag in database/store
        const marked = await markReminderAsSent(apt.id);
        if (marked) {
          sentCount++;
          results.push({
            id: apt.id,
            success: true,
            maskedPhone,
          });
        } else {
          // Flag could not be updated (e.g. concurrent race)
          results.push({
            id: apt.id,
            success: false,
            maskedPhone,
            error: 'Failed to update reminder_sent flag (already marked or cancelled).',
          });
        }
      } else {
        // Sending failed: keep reminder_sent = false for next poll retry
        failedCount++;
        console.warn(
          `[ReminderService] Failed to send reminder to ${maskedPhone}: ${sendRes.error || 'Unknown messaging error'}`
        );
        results.push({
          id: apt.id,
          success: false,
          maskedPhone,
          error: sendRes.error,
        });
      }
    } catch (err: any) {
      // Unhandled dispatch exception: keep reminder_sent = false for retry
      failedCount++;
      console.error(
        `[ReminderService] Exception while dispatching reminder to ${maskedPhone}: ${err.message}`
      );
      results.push({
        id: apt.id,
        success: false,
        maskedPhone,
        error: err.message,
      });
    }
  }

  return {
    processed: dueAppointments.length,
    sent: sentCount,
    failed: failedCount,
    results,
  };
}
