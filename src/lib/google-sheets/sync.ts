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
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.info('[GoogleSheetsSync] GOOGLE_SHEETS_SPREADSHEET_ID is not configured. Skipping sync.');
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

/**
 * Backward-compatible adapter for legacy callers expecting appendBookingToGoogleSheet.
 */
export async function appendBookingToGoogleSheet(booking: BookingSheetRow): Promise<boolean> {
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

