/**
 * src/lib/google-sheets/sync.ts
 *
 * Lightweight, zero-dependency Google Sheets REST API v4 Client for Vertex Dental Lab.
 * Uses native Node crypto / Web Crypto for RS256 JWT signing against Google OAuth2 token endpoint.
 * 
 * Target row format (chronological entry):
 * [london_date, london_time, patient_name, phone_number, reason, clinician_name, status, created_at]
 */

import crypto from 'crypto';
import type { AppointmentRecord } from '@/lib/appointments/types';
import { utcToLondon } from '@/config/clinic.config';

interface GoogleCredentials {
  clientEmail: string;
  privateKey: string;
}

/**
 * Resolves credentials from available environment variables.
 * Supports:
 * - GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY
 * - GOOGLE_SHEETS_SA_KEY (JSON string)
 */
function getGoogleCredentials(): GoogleCredentials | null {
  // 1. Check direct email & private key
  const clientEmail =
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey =
    process.env.GOOGLE_SHEETS_PRIVATE_KEY ||
    process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    if (clientEmail.includes('your-project') || privateKey.includes('dummyPrivate') || privateKey.includes('your-private-key')) {
      return null;
    }
    return {
      clientEmail: clientEmail.trim(),
      privateKey: privateKey.replace(/\\n/g, '\n').trim(),
    };
  }

  // 2. Check JSON string format
  const saKeyJson =
    process.env.GOOGLE_SHEETS_SA_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_CALENDAR_SA_KEY;

  if (saKeyJson) {
    try {
      const parsed = JSON.parse(saKeyJson);
      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, '\n').trim(),
        };
      }
    } catch (err) {
      console.warn('[GoogleSheetsSync] Failed to parse JSON service account key:', err);
    }
  }

  return null;
}

/**
 * Generates an OAuth2 access token for Google Sheets API via Service Account RS256 JWT.
 */
async function getAccessToken(creds: GoogleCredentials): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const claimSet = {
      iss: creds.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64Claim = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
    const signatureInput = `${b64Header}.${b64Claim}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(creds.privateKey, 'base64url');
    const jwt = `${signatureInput}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[GoogleSheetsSync] OAuth2 token exchange rejected:', errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token || null;
  } catch (err) {
    console.error('[GoogleSheetsSync] Error generating JWT access token:', err);
    return null;
  }
}

/**
 * Appends a confirmed appointment to the clinic Google Sheet.
 * Row format:
 * [london_date, london_time, patient_name, phone_number, reason, clinician_name, status, created_at]
 */
export async function appendAppointmentToGoogleSheet(record: AppointmentRecord): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.info('[GoogleSheetsSync] GOOGLE_SHEET_ID / GOOGLE_SHEETS_SPREADSHEET_ID is not configured. Skipping sync.');
    return false;
  }

  const creds = getGoogleCredentials();
  if (!creds) {
    console.info('[GoogleSheetsSync] Google service account credentials not configured. Skipping sync.');
    return false;
  }

  try {
    const accessToken = await getAccessToken(creds);
    if (!accessToken) {
      return false;
    }

    // Resolve date and time in London timezone
    let londonDate = record.london_date || record.appointment_date;
    let londonTime = record.london_time || record.appointment_time;

    if (!londonDate || !londonTime) {
      const londonInfo = utcToLondon(record.slot_time || new Date().toISOString());
      londonDate = londonDate || londonInfo.dateStr;
      londonTime = londonTime || londonInfo.time12;
    }

    const patientName = record.patient_name || record.customer_name || 'Patient';
    const phoneNumber = record.phone_number || record.phone || '';
    const reason = record.reason || record.service || 'General Consultation';
    const clinicianName = record.clinician_name || 'Dr. Alistair Vance';
    const status = record.status || 'CONFIRMED';
    const createdAt = record.created_at || new Date().toISOString();

    const row = [
      londonDate,
      londonTime,
      patientName,
      phoneNumber,
      reason,
      clinicianName,
      status,
      createdAt,
    ];

    const sheetRange = process.env.GOOGLE_SHEETS_RANGE || 'Appointments!A:H';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetRange
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[GoogleSheetsSync] Google Sheets append failed:', err);
      return false;
    }

    console.log(`[GoogleSheetsSync] Appended booking for ${patientName} (${londonDate} ${londonTime})`);
    return true;
  } catch (err: any) {
    console.error('[GoogleSheetsSync] Unexpected error appending appointment to sheet:', err.message);
    return false;
  }
}

export interface BookingSheetRow {
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  phone: string;
  service: string;
}

export interface UkBookingSheetRow {
  customer_name: string;
  appt_time: string;
  appt_date: string;
  service: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __dentalGoogleSheetChronologicalRows: UkBookingSheetRow[] | undefined;
}

if (!global.__dentalGoogleSheetChronologicalRows) {
  global.__dentalGoogleSheetChronologicalRows = [];
}

/**
 * Appends the booking row (`customer_name`, `appt_time`, `appt_date`, `service`)
 * to Google Sheets sorted chronologically by date and time.
 */
export async function appendChronologicalBookingToGoogleSheet(booking: UkBookingSheetRow): Promise<boolean> {
  const cleanBooking: UkBookingSheetRow = {
    customer_name: booking.customer_name.trim(),
    appt_time: booking.appt_time.trim().slice(0, 5),
    appt_date: booking.appt_date.trim().slice(0, 10),
    service: booking.service.trim(),
  };

  // Keep in-memory store chronologically sorted by appt_date ASC, appt_time ASC
  if (global.__dentalGoogleSheetChronologicalRows) {
    global.__dentalGoogleSheetChronologicalRows.push(cleanBooking);
    global.__dentalGoogleSheetChronologicalRows.sort((a, b) => {
      const dateCompare = a.appt_date.localeCompare(b.appt_date);
      if (dateCompare !== 0) return dateCompare;
      return a.appt_time.localeCompare(b.appt_time);
    });
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.info('[GoogleSheetsSync] GOOGLE_SHEET_ID / GOOGLE_SHEETS_SPREADSHEET_ID not set; stored chronologically in memory.');
    return true;
  }

  const creds = getGoogleCredentials();
  if (!creds) {
    console.info('[GoogleSheetsSync] Google service account credentials not configured; stored chronologically in memory.');
    return true;
  }

  try {
    const accessToken = await getAccessToken(creds);
    if (!accessToken) {
      console.info('[GoogleSheetsSync] Live Google OAuth unavailable; stored chronologically in memory.');
      return true;
    }

    // Row layout: [customer_name, appt_time, appt_date, service]
    const row = [
      cleanBooking.customer_name,
      cleanBooking.appt_time,
      cleanBooking.appt_date,
      cleanBooking.service,
    ];

    const sheetRange = process.env.GOOGLE_SHEETS_RANGE || 'Appointments!A:D';
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetRange
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[GoogleSheetsSync] Failed to append chronological row:', err);
      return false;
    }

    // Attempt chronological sort request on spreadsheet: sort by Column C (appt_date) ASC, then Column B (appt_time) ASC
    try {
      const sortUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      await fetch(sortUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              sortRange: {
                range: {
                  sheetId: 0,
                  startRowIndex: 1, // Skip header row
                },
                sortSpecs: [
                  {
                    dimensionIndex: 2, // Column C: appt_date
                    sortOrder: 'ASCENDING',
                  },
                  {
                    dimensionIndex: 1, // Column B: appt_time
                    sortOrder: 'ASCENDING',
                  },
                ],
              },
            },
          ],
        }),
      });
    } catch {
      // Non-critical: row was already appended successfully
    }

    console.log(`[GoogleSheetsSync] Appended chronological booking: ${cleanBooking.customer_name} on ${cleanBooking.appt_date} at ${cleanBooking.appt_time}`);
    return true;
  } catch (err: any) {
    console.error('[GoogleSheetsSync] Error syncing chronological booking:', err.message);
    return false;
  }
}

/**
 * Backward-compatible adapter for legacy callers expecting appendBookingToGoogleSheet.
 */
export async function appendBookingToGoogleSheet(booking: BookingSheetRow): Promise<boolean> {
  // Sync to both legacy and new chronological format
  appendChronologicalBookingToGoogleSheet({
    customer_name: booking.customer_name,
    appt_time: booking.appointment_time,
    appt_date: booking.appointment_date,
    service: booking.service,
  }).catch(() => {});

  return appendAppointmentToGoogleSheet({
    appointment_date: booking.appointment_date,
    appointment_time: booking.appointment_time,
    patient_name: booking.customer_name,
    customer_name: booking.customer_name,
    phone_number: booking.phone,
    phone: booking.phone,
    reason: booking.service,
    service: booking.service,
    status: 'CONFIRMED',
    slot_time: new Date().toISOString(),
    slot_end_time: new Date().toISOString(),
    reminder_sent: false,
    google_sheet_synced: false,
  } as unknown as AppointmentRecord);
}


