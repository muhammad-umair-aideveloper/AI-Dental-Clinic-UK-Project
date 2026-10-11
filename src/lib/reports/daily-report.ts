/**
 * src/lib/reports/daily-report.ts
 *
 * Daily Owner Report Generator & Dispatcher for Vertex Dental Lab.
 * Runs at 08:00 AM Europe/London time every day.
 *
 * Features:
 *  - Formats patient names with privacy (First name + Surname initial e.g., 'Charlotte K.')
 *  - Handles UK BST / GMT time zone conversions
 *  - Double-send protection & idempotency via daily_reports_log table
 *  - Provider-agnostic messaging layer dispatch (SMS / Email)
 *  - Empty day handling ("No appointments scheduled for today.")
 */

import { clinicConfig, utcToLondon } from '@/config/clinic.config';
import { getAllAppointments } from '@/lib/appointments/service';
import type { AppointmentRecord } from '@/lib/appointments/types';
import { sendMessage, type MessageChannel } from '@/lib/messaging';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export interface DailyReportLogEntry {
  report_date: string;
  sent_at: string;
  appointment_count: number;
  channel: string;
  recipient: string;
  content: string;
  status: string;
}

// In-memory store for test suite and offline local development
interface DailyReportMockStore {
  logs: DailyReportLogEntry[];
}

declare global {
  // eslint-disable-next-line no-var
  var __dentalDailyReportMockStore: DailyReportMockStore | undefined;
}

if (!global.__dentalDailyReportMockStore) {
  global.__dentalDailyReportMockStore = {
    logs: [],
  };
}

const reportMockStore = global.__dentalDailyReportMockStore;

/**
 * Format patient name into privacy-preserving 'First name + Last initial'
 * e.g., "Charlotte King" -> "Charlotte K."
 * "David" -> "David"
 * "Alice Mary Smith" -> "Alice S."
 */
export function formatPatientNameForReport(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Patient';
  if (parts.length === 1) return parts[0];

  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

/**
 * Generates the clean text content of the daily summary report.
 */
export function buildDailyReportContent(
  dateStr: string,
  appointments: AppointmentRecord[]
): { content: string; count: number } {
  // Filter out any cancelled appointments
  const activeAppointments = appointments
    .filter(a => a.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime());

  const count = activeAppointments.length;

  // Format date display (e.g., Monday 12 October 2026)
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dateDisplay = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);

  let body: string;
  if (count === 0) {
    body = 'No appointments scheduled for today.';
  } else {
    body = activeAppointments
      .map((apt, index) => {
        const patientFormatted = formatPatientNameForReport(apt.patient_name);
        const timeFormatted = apt.london_time || utcToLondon(apt.slot_time).time12;
        return `${index + 1}. ${patientFormatted} - ${timeFormatted} - ${apt.reason}`;
      })
      .join('\n');
  }

  const content = [
    `📅 ${clinicConfig.name} - Daily Diary`,
    `${dateDisplay}`,
    `Total Appointments: ${count}`,
    '',
    body,
    '',
    `Lead Clinician: ${clinicConfig.leadDentist}`,
  ].join('\n');

  return { content, count };
}

/**
 * Check if the current London time is in the 8:00 AM hour (08:00 to 08:59).
 */
export function isLondonHourEight(date: Date = new Date()): boolean {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: clinicConfig.timezone,
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(dtf.format(date), 10);
  return hour === 8;
}

/**
 * Send the daily report to the clinic owner.
 * Ensures strict idempotency: will not send twice for the same date unless force = true.
 */
export async function sendDailyOwnerReport(options?: {
  date?: string;
  force?: boolean;
  channel?: MessageChannel;
}): Promise<{
  success: boolean;
  sent: boolean;
  reportDate: string;
  appointmentCount: number;
  messageId?: string;
  content?: string;
  error?: string;
  reason?: string;
}> {
  // 1. Determine London date
  const now = new Date();
  const currentLondon = utcToLondon(now);
  const targetDateStr = options?.date ? options.date.trim().slice(0, 10) : currentLondon.dateStr;

  const channel: MessageChannel =
    options?.channel || (process.env.DAILY_REPORT_CHANNEL as MessageChannel) || 'sms';
  const recipient =
    channel === 'email' ? clinicConfig.ownerContact.email : clinicConfig.ownerContact.phone;

  // 2. Idempotency Check: Has report already been sent today?
  if (!options?.force) {
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      const { data: existing } = await supabase
        .from('daily_reports_log')
        .select('report_date, sent_at')
        .eq('report_date', targetDateStr)
        .eq('status', 'SENT')
        .maybeSingle();

      if (existing) {
        return {
          success: true,
          sent: false,
          reportDate: targetDateStr,
          appointmentCount: 0,
          reason: `Report already sent for ${targetDateStr} at ${existing.sent_at}`,
        };
      }
    } else {
      const existingMock = reportMockStore.logs.find(
        l => l.report_date === targetDateStr && l.status === 'SENT'
      );
      if (existingMock) {
        return {
          success: true,
          sent: false,
          reportDate: targetDateStr,
          appointmentCount: existingMock.appointment_count,
          reason: `Report already sent for ${targetDateStr} at ${existingMock.sent_at}`,
        };
      }
    }
  }

  // 3. Query all non-cancelled appointments for this London date
  const allAppointments = await getAllAppointments({ date: targetDateStr });
  const { content, count } = buildDailyReportContent(targetDateStr, allAppointments);

  // 4. Dispatch via Messaging Engine
  const subject = `${clinicConfig.name} - Daily Report (${targetDateStr}) [${count} Appointments]`;
  const sendRes = await sendMessage(channel, recipient, content, subject);

  if (!sendRes.success) {
    return {
      success: false,
      sent: false,
      reportDate: targetDateStr,
      appointmentCount: count,
      content,
      error: sendRes.error || 'Failed to dispatch message to clinic owner',
    };
  }

  // 5. Record log into daily_reports_log
  const nowIso = new Date().toISOString();
  const logEntry: DailyReportLogEntry = {
    report_date: targetDateStr,
    sent_at: nowIso,
    appointment_count: count,
    channel,
    recipient,
    content,
    status: 'SENT',
  };

  const supabase = getSupabaseServerClient();
  if (supabase && isSupabaseConfigured()) {
    await supabase.from('daily_reports_log').upsert(logEntry, { onConflict: 'report_date' });
  } else {
    const existingIdx = reportMockStore.logs.findIndex(l => l.report_date === targetDateStr);
    if (existingIdx >= 0) {
      reportMockStore.logs[existingIdx] = logEntry;
    } else {
      reportMockStore.logs.push(logEntry);
    }
  }

  return {
    success: true,
    sent: true,
    reportDate: targetDateStr,
    appointmentCount: count,
    messageId: sendRes.messageId,
    content,
  };
}

/**
 * Resets the in-memory mock logs (useful for unit tests)
 */
export function resetDailyReportMockStore(): void {
  reportMockStore.logs = [];
}
