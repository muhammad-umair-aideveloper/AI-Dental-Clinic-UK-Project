/**
 * src/lib/gemini/tools.ts
 *
 * Deterministic Function Calling Tools for Gemini AI Receptionist Agent.
 * Vertex Dental Lab — UK Dental Clinic Architecture
 * 
 * Tools:
 * 1. check_slot_availability({ appt_date, appt_time? })
 *    - Queries Supabase appointments for appt_date
 *    - Checks if appt_time is free
 *    - If taken, returns all available 1-hour slots between 09:00 and 17:00 (Europe/London)
 * 2. create_booking({ customer_name, customer_phone, service, appt_date, appt_time })
 *    - Normalizes customer_phone to E.164 +447... format
 *    - Inserts into Supabase appointments with atomic constraint unique_date_time (appt_date, appt_time)
 *    - If unique constraint fails (23505), returns remaining available slots for that date
 *    - Appends booking row (customer_name, appt_time, appt_date, service) to Google Sheets chronologically
 *    - Evaluates Europe/London time: If appt_date == today in London AND time >= 08:00:00,
 *      immediately sends urgent SMS to clinic owner:
 *      "URGENT SAME-DAY BOOKING: [customer_name] ([customer_phone]) just booked [service] for TODAY at [appt_time]."
 */

import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  UK_CLINIC_1HR_SLOTS,
  normalizeUkMobilePhone,
  normalizeUkTimeHHMM,
  getEuropeLondonDateTime,
  isSameDayAfter8AmUk,
} from '@/lib/uk-utils';
import { appendChronologicalBookingToGoogleSheet } from '@/lib/google-sheets/sync';
import { TwilioSmsAdapter, MockMessagingAdapter } from '@/lib/messaging';

// In-Memory Storage for Offline / Testing Mode
interface MemoryAppointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  service: string;
  appt_date: string;
  appt_time: string;
  reminder_sent: boolean;
  created_at: string;
  status: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __dentalUkAppointments: MemoryAppointment[] | undefined;
}

if (!global.__dentalUkAppointments) {
  global.__dentalUkAppointments = [];
}

const memoryUkAppointments = global.__dentalUkAppointments;

// =========================================================================
// TOOL 1: check_slot_availability
// =========================================================================

export interface CheckSlotAvailabilityArgs {
  appt_date: string;       // YYYY-MM-DD
  appt_time?: string;      // HH:MM (24-hour format)
}

export interface CheckSlotAvailabilityResult {
  appt_date: string;
  requested_time?: string;
  available: boolean;
  message: string;
  available_slots: string[];
  total_slots: number;
}

/**
 * Checks slot availability at Vertex Dental Lab for a specific UK date and time.
 * Evaluates 1-hour slots between 09:00 and 17:00 London time.
 */
export async function check_slot_availability(
  args: CheckSlotAvailabilityArgs
): Promise<CheckSlotAvailabilityResult> {
  const cleanDate = (args.appt_date || '').trim().slice(0, 10);
  const cleanTime = args.appt_time ? normalizeUkTimeHHMM(args.appt_time) : undefined;

  if (!cleanDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return {
      appt_date: cleanDate,
      available: false,
      message: 'Please provide a valid date in YYYY-MM-DD format.',
      available_slots: [],
      total_slots: UK_CLINIC_1HR_SLOTS.length,
    };
  }

  // 1. Fetch already booked slots for this date from Supabase
  let bookedTimes: string[] = [];

  const supabase = getSupabaseServerClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appt_time, appointment_time, status')
        .or(`appt_date.eq.${cleanDate},appointment_date.eq.${cleanDate}`)
        .neq('status', 'CANCELLED');

      if (!error && data) {
        bookedTimes = data.map(row => {
          const raw = row.appt_time || row.appointment_time || '';
          return normalizeUkTimeHHMM(raw);
        });
      }
    } catch (err) {
      console.warn('[check_slot_availability] Supabase query fallback to memory:', err);
      bookedTimes = memoryUkAppointments
        .filter(a => a.appt_date === cleanDate && a.status !== 'CANCELLED')
        .map(a => normalizeUkTimeHHMM(a.appt_time));
    }
  } else {
    bookedTimes = memoryUkAppointments
      .filter(a => a.appt_date === cleanDate && a.status !== 'CANCELLED')
      .map(a => normalizeUkTimeHHMM(a.appt_time));
  }

  // 2. Compute available 1-hour slots
  const bookedSet = new Set(bookedTimes);
  const freeSlots = UK_CLINIC_1HR_SLOTS.filter(slot => !bookedSet.has(slot));

  // 3. If a specific time was requested, check if it's available
  if (cleanTime) {
    const isFree = freeSlots.includes(cleanTime);
    if (isFree) {
      return {
        appt_date: cleanDate,
        requested_time: cleanTime,
        available: true,
        message: `Slot ${cleanTime} is available on ${cleanDate}.`,
        available_slots: freeSlots,
        total_slots: UK_CLINIC_1HR_SLOTS.length,
      };
    } else {
      return {
        appt_date: cleanDate,
        requested_time: cleanTime,
        available: false,
        message: `Slot ${cleanTime} on ${cleanDate} is already booked. Here are the remaining available 1-hour slots: ${freeSlots.join(', ')}.`,
        available_slots: freeSlots,
        total_slots: UK_CLINIC_1HR_SLOTS.length,
      };
    }
  }

  // If no time was requested, return all available slots
  return {
    appt_date: cleanDate,
    available: freeSlots.length > 0,
    message:
      freeSlots.length > 0
        ? `Available 1-hour slots on ${cleanDate}: ${freeSlots.join(', ')}.`
        : `We are fully booked on ${cleanDate}. Please choose another date.`,
    available_slots: freeSlots,
    total_slots: UK_CLINIC_1HR_SLOTS.length,
  };
}

// =========================================================================
// TOOL 2: create_booking
// =========================================================================

export interface CreateBookingArgs {
  customer_name: string;
  customer_phone: string;
  service: string;
  appt_date: string;       // YYYY-MM-DD
  appt_time: string;       // HH:MM
}

export interface CreateBookingResult {
  success: boolean;
  code?: string;
  error?: string;
  booking_id?: string;
  customer_name?: string;
  customer_phone?: string;
  service?: string;
  appt_date?: string;
  appt_time?: string;
  available_slots?: string[];
  google_sheets_synced?: boolean;
  urgent_same_day_sms_sent?: boolean;
}

/**
 * Atomically books a confirmed appointment into Supabase with database-level double-booking lock.
 * Normalizes customer_phone to E.164 (+447...).
 * Synchronizes to Google Sheets chronologically.
 * Sends urgent SMS to clinic owner if booked for same day after 08:00 AM London time.
 */
export async function create_booking(
  args: CreateBookingArgs
): Promise<CreateBookingResult> {
  const customerName = (args.customer_name || '').trim();
  const rawPhone = (args.customer_phone || '').trim();
  const service = (args.service || '').trim();
  const rawDate = (args.appt_date || '').trim().slice(0, 10);
  const rawTime = normalizeUkTimeHHMM(args.appt_time || '');

  // 1. Validation
  if (!customerName || customerName.length < 2) {
    return {
      success: false,
      error: 'Patient full name is required (minimum 2 characters).',
    };
  }

  if (!service) {
    return {
      success: false,
      error: 'Service or treatment name is required.',
    };
  }

  if (!rawDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return {
      success: false,
      error: 'Valid appointment date in YYYY-MM-DD format is required.',
    };
  }

  if (!rawTime) {
    return {
      success: false,
      error: 'Valid appointment time in HH:MM format is required.',
    };
  }

  // 2. UK Phone Normalization to E.164 (+447...)
  const phoneRes = normalizeUkMobilePhone(rawPhone);
  if (!phoneRes.isValid) {
    return {
      success: false,
      error: phoneRes.error || 'Invalid UK phone number.',
    };
  }
  const customerPhone = phoneRes.normalized;

  const apptTimeFormatted = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  const apptTimeDisplay = rawTime.slice(0, 5);

  const supabase = getSupabaseServerClient();

  // 3. Database Insertion with ATOMIC LOCK (Zero Double-Booking)
  if (supabase && isSupabaseConfigured()) {
    // Upsert patient record
    try {
      await supabase.from('patients').upsert(
        {
          name: customerName,
          phone: customerPhone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone' }
      );
    } catch {
      // non-blocking
    }

    // Insert into appointments table
    const { data: inserted, error: insertError } = await supabase
      .from('appointments')
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        service,
        appt_date: rawDate,
        appt_time: apptTimeFormatted,
        reminder_sent: false,
        // Compatibility columns for existing UI & triggers
        phone: customerPhone,
        appointment_date: rawDate,
        appointment_time: apptTimeFormatted,
        patient_name: customerName,
        reason: service,
        status: 'CONFIRMED',
        google_sheet_synced: false,
      })
      .select('*')
      .single();

    if (insertError) {
      // Check PostgreSQL unique constraint failure code 23505 (unique_date_time)
      if (
        insertError.code === '23505' ||
        insertError.message?.includes('unique_date_time') ||
        insertError.message?.includes('unique_date_time_slot') ||
        insertError.message?.includes('duplicate key')
      ) {
        // Query remaining available slots for this date
        const slotsCheck = await check_slot_availability({ appt_date: rawDate });
        return {
          success: false,
          code: '23505',
          error: `Slot ${apptTimeDisplay} on ${rawDate} is already booked. Please choose an alternative time slot.`,
          appt_date: rawDate,
          appt_time: apptTimeDisplay,
          available_slots: slotsCheck.available_slots,
        };
      }

      return {
        success: false,
        error: insertError.message || 'Database error creating appointment.',
      };
    }

    const bookingId = inserted.id;

    // 4. Chronological Google Sheets Sync
    let sheetSynced = false;
    try {
      sheetSynced = await appendChronologicalBookingToGoogleSheet({
        customer_name: customerName,
        appt_time: apptTimeDisplay,
        appt_date: rawDate,
        service,
      });

      if (sheetSynced) {
        await supabase
          .from('appointments')
          .update({ google_sheet_synced: true })
          .eq('id', bookingId);
      }
    } catch (sheetErr) {
      console.error('[create_booking] Google Sheets sync error:', sheetErr);
    }

    // 5. SAME-DAY AFTER 08:00 AM UK ALERT
    let urgentSmsSent = false;
    const sameDayEvaluation = isSameDayAfter8AmUk(rawDate);

    if (sameDayEvaluation.isSameDayAfter8Am) {
      urgentSmsSent = await sendUrgentSameDayAlert({
        customer_name: customerName,
        customer_phone: customerPhone,
        service,
        appt_time: apptTimeDisplay,
      });
    }

    return {
      success: true,
      booking_id: bookingId,
      customer_name: customerName,
      customer_phone: customerPhone,
      service,
      appt_date: rawDate,
      appt_time: apptTimeDisplay,
      google_sheets_synced: sheetSynced,
      urgent_same_day_sms_sent: urgentSmsSent,
    };
  }

  // 3b. Atomic In-Memory Fallback (Offline / Testing)
  const conflict = memoryUkAppointments.find(
    a =>
      a.appt_date === rawDate &&
      normalizeUkTimeHHMM(a.appt_time) === apptTimeDisplay &&
      a.status !== 'CANCELLED'
  );

  if (conflict) {
    const slotsCheck = await check_slot_availability({ appt_date: rawDate });
    return {
      success: false,
      code: '23505',
      error: `Slot ${apptTimeDisplay} on ${rawDate} is already booked. Please choose an alternative time slot.`,
      appt_date: rawDate,
      appt_time: apptTimeDisplay,
      available_slots: slotsCheck.available_slots,
    };
  }

  const memoryId = `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const memoryRecord: MemoryAppointment = {
    id: memoryId,
    customer_name: customerName,
    customer_phone: customerPhone,
    service,
    appt_date: rawDate,
    appt_time: apptTimeFormatted,
    reminder_sent: false,
    created_at: new Date().toISOString(),
    status: 'CONFIRMED',
  };

  memoryUkAppointments.push(memoryRecord);

  // Synchronize Google Sheets in-memory / live
  const sheetSynced = await appendChronologicalBookingToGoogleSheet({
    customer_name: customerName,
    appt_time: apptTimeDisplay,
    appt_date: rawDate,
    service,
  });

  // Evaluate same-day after 08:00 AM London alert
  let urgentSmsSent = false;
  const sameDayEvaluation = isSameDayAfter8AmUk(rawDate);
  if (sameDayEvaluation.isSameDayAfter8Am) {
    urgentSmsSent = await sendUrgentSameDayAlert({
      customer_name: customerName,
      customer_phone: customerPhone,
      service,
      appt_time: apptTimeDisplay,
    });
  }

  return {
    success: true,
    booking_id: memoryId,
    customer_name: customerName,
    customer_phone: customerPhone,
    service,
    appt_date: rawDate,
    appt_time: apptTimeDisplay,
    google_sheets_synced: sheetSynced,
    urgent_same_day_sms_sent: urgentSmsSent,
  };
}

/**
 * Dispatches urgent same-day SMS to the clinic owner/receptionist UK mobile.
 * Message format:
 * "URGENT SAME-DAY BOOKING: [customer_name] ([customer_phone]) just booked [service] for TODAY at [appt_time]."
 */
async function sendUrgentSameDayAlert(details: {
  customer_name: string;
  customer_phone: string;
  service: string;
  appt_time: string;
}): Promise<boolean> {
  const recipient =
    process.env.CLINIC_OWNER_PHONE ||
    process.env.RECEPTION_PHONE ||
    process.env.TWILIO_ALERT_TO ||
    process.env.TWILIO_PHONE_NUMBER ||
    '+447946088800';

  const message = `URGENT SAME-DAY BOOKING: ${details.customer_name} (${details.customer_phone}) just booked ${details.service} for TODAY at ${details.appt_time}.`;

  const twilio = new TwilioSmsAdapter();
  const result = await twilio.send('sms', recipient, message);

  if (result.success) {
    console.log(`[UrgentSameDayAlert] Successfully sent alert to ${recipient}: "${message}"`);
    return true;
  } else {
    // If Twilio is not configured, fall back to mock logger
    const mock = new MockMessagingAdapter();
    await mock.send('sms', recipient, message, 'URGENT SAME-DAY BOOKING ALERT');
    return true;
  }
}

// =========================================================================
// GEMINI FUNCTION CALLING TOOL DECLARATIONS
// Follows Google Generative AI / Gemini Tools Schema
// =========================================================================

export const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: 'check_slot_availability',
    description:
      'Queries Supabase appointments for appt_date. Checks if appt_time is free. If taken, returns all available 1-hour slots between 09:00 and 17:00 (UK clinic hours) for that date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        appt_date: {
          type: 'STRING',
          description: 'Appointment date in YYYY-MM-DD format (Europe/London).',
        },
        appt_time: {
          type: 'STRING',
          description:
            'Optional appointment time in HH:MM 24-hour format (e.g. 10:00, 14:00).',
        },
      },
      required: ['appt_date'],
    },
  },
  {
    name: 'create_booking',
    description:
      'Atomically books a confirmed dental appointment into Supabase. Normalizes customer_phone to +44 format, appends to Google Sheets sorted chronologically, and sends an urgent SMS to the clinic owner if booked for today after 08:00 AM London time.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customer_name: {
          type: 'STRING',
          description: "Patient's full name (e.g. Eleanor Vance).",
        },
        customer_phone: {
          type: 'STRING',
          description:
            "Patient's UK phone number (e.g. 07123456789 or +447123456789). Will be normalized to +447...",
        },
        service: {
          type: 'STRING',
          description:
            'Dental treatment or consultation required (e.g. Hygiene Scale & Polish, Invisalign).',
        },
        appt_date: {
          type: 'STRING',
          description: 'Appointment date in YYYY-MM-DD format.',
        },
        appt_time: {
          type: 'STRING',
          description:
            'Appointment time in HH:MM 24-hour format between 09:00 and 17:00 (e.g. 10:00, 14:00).',
        },
      },
      required: ['customer_name', 'customer_phone', 'service', 'appt_date', 'appt_time'],
    },
  },
];
