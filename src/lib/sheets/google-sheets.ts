/**
 * src/lib/sheets/google-sheets.ts
 *
 * Real-Time Google Sheets Sync via Google Service Account JWT.
 * Appends [appointment_date, appointment_time, customer_name, phone, service]
 * directly to the clinic Google Sheet.
 */

import crypto from 'crypto';

export interface BookingSheetRow {
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  phone: string;
  service: string;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

/**
 * Parses Service Account credentials from available environment variables.
 */
function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  const saKeyJson =
    process.env.GOOGLE_SHEETS_SA_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_CALENDAR_SA_KEY;

  if (saKeyJson) {
    try {
      const parsed = JSON.parse(saKeyJson);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
        };
      }
    } catch (e) {
      console.warn('[GoogleSheets] Failed to parse Service Account JSON key:', e);
    }
  }

  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let private_key = process.env.GOOGLE_PRIVATE_KEY;

  if (client_email && private_key) {
    // Handle escaped newlines
    private_key = private_key.replace(/\\n/g, '\n');
    return { client_email, private_key };
  }

  return null;
}

/**
 * Generates an OAuth2 access token for Google Sheets API using Service Account JWT.
 */
async function getGoogleSheetsAccessToken(creds: ServiceAccountCredentials): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const claimSet = {
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const b64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64UrlClaim = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
    const signatureInput = `${b64UrlHeader}.${b64UrlClaim}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(creds.private_key, 'base64url');
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
      console.error('[GoogleSheets] Token exchange failed:', errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token || null;
  } catch (err) {
    console.error('[GoogleSheets] Error generating JWT access token:', err);
    return null;
  }
}

/**
 * Appends a booking row to Google Sheets.
 * Row format: [appointment_date, appointment_time, customer_name, phone, service]
 * Returns true if appended successfully, false otherwise.
 */
export async function appendBookingToGoogleSheet(row: BookingSheetRow): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.info('[GoogleSheets] GOOGLE_SHEETS_SPREADSHEET_ID not configured. Skipping Sheets sync.');
    return false;
  }

  const creds = getServiceAccountCredentials();
  if (!creds) {
    console.info('[GoogleSheets] Service account credentials not configured. Skipping Sheets sync.');
    return false;
  }

  try {
    const accessToken = await getGoogleSheetsAccessToken(creds);
    if (!accessToken) {
      return false;
    }

    const sheetRange = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:E';
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
        values: [
          [
            row.appointment_date,
            row.appointment_time,
            row.customer_name,
            row.phone,
            row.service,
          ],
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[GoogleSheets] Append row failed:', err);
      return false;
    }

    console.log(`[GoogleSheets] Successfully synced booking for ${row.customer_name} on ${row.appointment_date} at ${row.appointment_time}`);
    return true;
  } catch (err) {
    console.error('[GoogleSheets] Unexpected error appending to Google Sheet:', err);
    return false;
  }
}
