/**
 * src/lib/reports/daily-report.ts
 *
 * Daily Owner Report Generator & Dispatcher for Vertex Dental Lab.
 * Runs at 08:00 AM Europe/London time every day.
 *
 * Features:
 *  - Formats patient names with privacy helper for text summary
 *  - Generates comprehensive operational HTML table with full patient details
 *  - Attaches Google Sheet compatible CSV (Appointments_${targetDateStr}.csv)
 *  - Handles UK BST / GMT time zone conversions
 *  - Double-send protection & idempotency via daily_reports_log table
 *  - Dispatches via Resend Email adapter by default
 */

import { clinicConfig, utcToLondon } from '@/config/clinic.config';
import { getAllAppointments } from '@/lib/appointments/service';
import type { AppointmentRecord } from '@/lib/appointments/types';
import { sendMessage, type MessageChannel, type SendOptions } from '@/lib/messaging';
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
 * Generates the clean text summary of the daily summary report.
 * (Preserved for backward compatibility with existing tests and SMS fallback)
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
        const patientFormatted = formatPatientNameForReport(apt.patient_name || apt.customer_name || 'Patient');
        const timeFormatted = apt.london_time || utcToLondon(apt.slot_time).time12;
        return `${index + 1}. ${patientFormatted} - ${timeFormatted} - ${apt.reason || apt.service}`;
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
 * Builds full operational CSV spreadsheet content for the clinic owner.
 * Contains unmasked Patient Full Name, Phone, Date, Time, Reason, and Clinician.
 */
export function buildDailyReportCsv(
  dateStr: string,
  appointments: AppointmentRecord[]
): string {
  const active = appointments
    .filter(a => a.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime());

  const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const rows = active.map(apt => {
    const name = apt.patient_name || apt.customer_name || 'Patient';
    const phone = apt.phone_number || apt.phone || '';
    const date = apt.london_date || apt.appointment_date || dateStr;
    const time = apt.london_time || (apt.appointment_time || '').slice(0, 5) || utcToLondon(apt.slot_time).time12;
    const reason = apt.reason || apt.service || 'General Consultation';
    const clinician = apt.clinician_name || clinicConfig.leadDentist;

    return `${escape(name)},${escape(phone)},${escape(date)},${escape(time)},${escape(reason)},${escape(clinician)}`;
  });

  return ['Patient Name,Phone Number,Appointment Date,Appointment Time,Service,Clinician', ...rows].join('\r\n');
}

/**
 * Builds a styled HTML table email body for the owner's daily report.
 */
export function buildDailyReportHtml(
  dateStr: string,
  appointments: AppointmentRecord[]
): string {
  const active = appointments
    .filter(a => a.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime());

  const count = active.length;

  const tableRows =
    count === 0
      ? `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">No appointments scheduled for today.</td></tr>`
      : active
          .map((apt, idx) => {
            const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            const name = apt.patient_name || apt.customer_name || 'Patient';
            const phone = apt.phone_number || apt.phone || '';
            const date = apt.london_date || apt.appointment_date || dateStr;
            const time = apt.london_time || (apt.appointment_time || '').slice(0, 5) || utcToLondon(apt.slot_time).time12;
            const reason = apt.reason || apt.service || 'General Consultation';
            const clinician = apt.clinician_name || clinicConfig.leadDentist;

            return `
              <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600; color: #0f172a;">${name}</td>
                <td style="padding: 10px 14px; font-family: monospace; color: #0284c7;">${phone}</td>
                <td style="padding: 10px 14px; color: #475569;">${date}</td>
                <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${time}</td>
                <td style="padding: 10px 14px; color: #334155;">${reason}</td>
                <td style="padding: 10px 14px; color: #64748b;">${clinician}</td>
              </tr>`;
          })
          .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Daily Clinic Appointments — ${dateStr}</title>
  </head>
  <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a;">
    <div style="max-width: 760px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background-color: #0f172a; padding: 24px 32px; color: #ffffff;">
        <div style="font-size: 12px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.1em;">Vertex Dental Lab — London</div>
        <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 700;">Owner Daily Diary &amp; Patient Sheet</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #94a3b8;">Date: <strong>${dateStr}</strong> (08:00 AM London Time) • ${count} Confirmed Appointments</p>
      </div>

      <div style="padding: 24px 32px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 10px 14px; color: #475569; font-size: 11px; text-transform: uppercase;">Patient Name</th>
              <th style="padding: 10px 14px; color: #475569; font-size: 11px; text-transform: uppercase;">Phone</th>
              <th style="padding: 10px 14px; color: #475569; font-size: 11px; text-transform: uppercase;">Date</th>
              <th style="padding: 10px 14px; color: #475569; font-size: 11px; text-transform: uppercase;">Time</th>
              <th style="padding: 10px 14px; color: #475569; font-size: 11px; text-transform: uppercase;">Service</th>
              <th style="padding: 10px 14px; color: #475569; font-size: 11px; text-transform: uppercase;">Clinician</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 12px 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 12px; color: #166534;">
          📎 <strong>Appointments_${dateStr}.csv</strong> is attached to this email. You can open it in Excel, Numbers, or import directly to Google Sheets.
        </div>
      </div>

      <div style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Vertex Dental Lab • Harley Street, London • Automated 08:00 AM Daily Dispatch
      </div>
    </div>
  </body>
  </html>
  `;
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
 * Defaults to 'email' channel with HTML body and CSV sheet attachment.
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
  // 1. Determine London date (Strictly target today's appointments in Europe/London timezone)
  const now = new Date();
  const currentLondon = utcToLondon(now);
  const targetDateStr = options?.date ? options.date.trim().slice(0, 10) : currentLondon.dateStr;

  // Default dispatch channel is 'email'
  const channel: MessageChannel =
    options?.channel || (process.env.DAILY_REPORT_CHANNEL as MessageChannel) || 'email';
  const recipient =
    channel === 'email'
      ? process.env.CLINIC_OWNER_EMAIL || clinicConfig.ownerContact.email
      : process.env.CLINIC_OWNER_PHONE || clinicConfig.ownerContact.phone;

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

  // 3. Query all non-cancelled appointments strictly for THIS London date
  const allAppointments = await getAllAppointments({ date: targetDateStr, status: 'CONFIRMED' });
  const activeAppointments = allAppointments.filter(a => a.status !== 'CANCELLED');

  const { content, count } = buildDailyReportContent(targetDateStr, activeAppointments);
  const html = buildDailyReportHtml(targetDateStr, activeAppointments);
  const csvContent = buildDailyReportCsv(targetDateStr, activeAppointments);
  const csvBase64 = Buffer.from(csvContent, 'utf-8').toString('base64');

  // 4. Dispatch via Messaging Engine with HTML & CSV Attachment
  const subject = `${clinicConfig.name} - Daily Report (${targetDateStr}) [${count} Appointments]`;
  const sendOptions: SendOptions = {
    html,
    attachments: [
      {
        filename: `Appointments_${targetDateStr}.csv`,
        content: csvBase64,
        contentType: 'text/csv',
      },
    ],
  };

  const sendRes = await sendMessage(channel, recipient, content, subject, sendOptions);

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
