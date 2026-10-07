/**
 * workflows/w3-deposit/calendar.ts
 * Google Calendar integration via service account.
 * Creates HOLD events and confirms them on deposit payment.
 */
import { google } from 'googleapis';
import { clinicConfig } from '../../clinic.config.js';
import { updateLead } from '../../core/firestore.js';
import { logger } from '../../core/logger.js';
import type { Lead } from '../../core/types.js';

const CALENDAR_ID = () => process.env['GOOGLE_CALENDAR_ID']!;

function getCalendarClient() {
  const credentials = JSON.parse(process.env['GOOGLE_CALENDAR_SA_KEY']!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

// ─── Create Hold Event ────────────────────────────────────────────────────────

/**
 * Checks free/busy and creates a "HOLD - awaiting deposit" calendar event.
 * Returns the event ID.
 */
export async function createHoldEvent(
  lead: Lead,
  preferredStart: Date,
): Promise<string | null> {
  const calendar = getCalendarClient();

  // 1h consultation
  const end = new Date(preferredStart.getTime() + 60 * 60 * 1000);

  // Check free/busy
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin:   preferredStart.toISOString(),
      timeMax:   end.toISOString(),
      timeZone:  clinicConfig.timezone,
      items:     [{ id: CALENDAR_ID() }],
    },
  });

  const busy = freeBusy.data.calendars?.[CALENDAR_ID()]?.busy ?? [];
  if (busy.length > 0) {
    logger.warn(
      { leadId: lead.id, preferredStart: preferredStart.toISOString() },
      'Slot busy — cannot create hold event',
    );
    return null;
  }

  // Create the hold event
  const event = await calendar.events.insert({
    calendarId: CALENDAR_ID(),
    requestBody: {
      summary:     `HOLD — ${lead.fullName ?? 'Awaiting name'} (${lead.treatment ?? 'Consultation'})`,
      description:
        `Awaiting deposit payment\n\n` +
        `Lead ID: ${lead.id}\n` +
        `Treatment: ${lead.treatment}\n` +
        `Timeline: ${lead.timeline}\n` +
        `Score: ${lead.score}`,
      start:  { dateTime: preferredStart.toISOString(), timeZone: clinicConfig.timezone },
      end:    { dateTime: end.toISOString(),             timeZone: clinicConfig.timezone },
      status: 'tentative',
      colorId: '5', // Yellow = tentative
      reminders: { useDefault: false, overrides: [] },
    },
  });

  const eventId = event.data.id!;

  // Save on lead
  await updateLead(lead.id, {
    calendarEventId:     eventId,
    appointmentDateTime: preferredStart.toISOString(),
  });

  logger.info({ leadId: lead.id, eventId }, 'Calendar hold event created');

  return eventId;
}

// ─── Confirm Event ────────────────────────────────────────────────────────────

/**
 * Converts a HOLD event to CONFIRMED after deposit payment.
 */
export async function confirmCalendarEvent(
  eventId: string,
  lead: Lead,
): Promise<void> {
  const calendar = getCalendarClient();

  await calendar.events.patch({
    calendarId: CALENDAR_ID(),
    eventId,
    requestBody: {
      summary:     `CONFIRMED — ${lead.fullName} (${lead.treatment ?? 'Consultation'})`,
      description:
        `Deposit paid ✅\n\n` +
        `Lead ID: ${lead.id}\n` +
        `Treatment: ${lead.treatment}\n` +
        `Mobile: [secured]\n` +
        `Score: ${lead.score}`,
      status:  'confirmed',
      colorId: '2', // Green = confirmed
      reminders: {
        useDefault: false,
        overrides: [{ method: 'email', minutes: 1440 }], // 24h email reminder
      },
    },
  });

  logger.info({ leadId: lead.id, eventId }, 'Calendar event confirmed');
}

// ─── Release Hold ─────────────────────────────────────────────────────────────

/**
 * Deletes the HOLD event when deposit is not paid within 24h.
 */
export async function releaseHoldEvent(eventId: string, leadId: string): Promise<void> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({
      calendarId: CALENDAR_ID(),
      eventId,
    });
    logger.info({ leadId, eventId }, 'Calendar hold released (deposit not paid)');
  } catch (err) {
    logger.warn({ leadId, eventId, err: String(err) }, 'Calendar event delete failed — may already be deleted');
  }
}

// ─── Cancel Event ─────────────────────────────────────────────────────────────

export async function cancelCalendarEvent(eventId: string, leadId: string): Promise<void> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.patch({
      calendarId: CALENDAR_ID(),
      eventId,
      requestBody: {
        status:  'cancelled',
        summary: `CANCELLED — ${eventId}`,
        colorId: '11', // Red
      },
    });
    logger.info({ leadId, eventId }, 'Calendar event cancelled');
  } catch (err) {
    logger.warn({ leadId, eventId, err: String(err) }, 'Calendar event cancel failed');
  }
}
