/**
 * src/lib/appointments/service.ts
 *
 * THE SINGLE AUTHORITATIVE SOURCE OF TRUTH for Appointment Booking.
 * Both the public website form (BookingModal) and the AI Chatbot MUST call this service.
 * Enforces:
 *   - Client + Server validation
 *   - UK E.164 phone normalization (+447XXXXXXXXX)
 *   - Server-side slot availability verification
 *   - Europe/London <-> UTC timestamptz conversion
 *   - Database-level exclusion rule / double-booking prevention
 *   - Reminder consent timestamp tracking (UK GDPR)
 */

import {
  clinicConfig,
  generateDaySlots,
  isClinicOpenOnDate,
  londonTimeToUtcIso,
  utcToLondon,
} from '@/config/clinic.config';
import { normalizeUkPhone } from './phone';
import type {
  AppointmentRecord,
  AppointmentServiceResponse,
  AppointmentStatus,
  CreateAppointmentInput,
  SlotAvailability,
} from './types';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { appendBookingToGoogleSheet } from '@/lib/sheets/google-sheets';

// =========================================================================
// IN-MEMORY CONCURRENT SIMULATOR
// Used when Supabase credentials are being initialized or for fast offline testing.
// Accurately replicates PostgreSQL btree_gist exclusion constraint on (slot_time, clinician_name) WHERE status != 'CANCELLED'.
// =========================================================================

interface MockStore {
  appointments: AppointmentRecord[];
}

declare global {
  // eslint-disable-next-line no-var
  var __dentalAppointmentsMockStore: MockStore | undefined;
}

if (!global.__dentalAppointmentsMockStore) {
  global.__dentalAppointmentsMockStore = {
    appointments: [],
  };
}

const mockStore = global.__dentalAppointmentsMockStore;

// =========================================================================
// INPUT VALIDATION
// =========================================================================

export function validateAppointmentInput(input: CreateAppointmentInput): {
  valid: boolean;
  normalizedPhone?: string;
  error?: string;
} {
  if (!input.patientName || input.patientName.trim().length < 2) {
    return { valid: false, error: 'Full patient name is required (at least 2 characters).' };
  }

  const phoneRes = normalizeUkPhone(input.phoneNumber);
  if (!phoneRes.isValid) {
    return { valid: false, error: phoneRes.error || 'A valid UK phone number is required.' };
  }

  if (input.email && input.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
  }

  if (!input.reason || input.reason.trim().length < 3) {
    return { valid: false, error: 'Please specify the reason for your appointment or required treatment.' };
  }

  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date.trim())) {
    return { valid: false, error: 'A valid appointment date in YYYY-MM-DD format is required.' };
  }

  if (!input.time || input.time.trim().length === 0) {
    return { valid: false, error: 'An appointment time slot is required.' };
  }

  return {
    valid: true,
    normalizedPhone: phoneRes.normalized,
  };
}

// =========================================================================
// SLOT AVAILABILITY CHECK
// =========================================================================

/**
 * Returns all generated slots for a given date in Europe/London,
 * marking booked slots, past slots, and closed days.
 * Never trusts the client for availability.
 */
export async function getSlotAvailability(
  dateStr: string,
  clinicianName: string = clinicConfig.leadDentist
): Promise<SlotAvailability[]> {
  const cleanDate = dateStr.trim().slice(0, 10);

  // 1. Check if clinic is open (handles closed days and UK bank holidays)
  if (!isClinicOpenOnDate(cleanDate)) {
    return [];
  }

  // 2. Generate standard slots for the day
  const baseSlots = generateDaySlots(cleanDate, clinicConfig.slotLengthMinutes);
  if (baseSlots.length === 0) {
    return [];
  }

  // 3. Query existing booked (non-cancelled) appointments for this date and clinician
  const bookedUtcTimes = new Set<string>();

  const supabase = getSupabaseServerClient();
  if (supabase && isSupabaseConfigured()) {
    // Query day boundary in UTC
    const dayStartUtc = londonTimeToUtcIso(cleanDate, '00:00');
    const dayEndUtc = londonTimeToUtcIso(cleanDate, '23:59');

    const { data, error } = await supabase
      .from('appointments')
      .select('slot_time')
      .eq('clinician_name', clinicianName)
      .neq('status', 'CANCELLED')
      .gte('slot_time', dayStartUtc)
      .lte('slot_time', dayEndUtc);

    if (!error && data) {
      data.forEach((row: { slot_time: string }) => {
        bookedUtcTimes.add(new Date(row.slot_time).toISOString());
      });
    }
  } else {
    // Fallback to in-memory store
    mockStore.appointments
      .filter(
        a =>
          a.status !== 'CANCELLED' &&
          a.clinician_name === clinicianName &&
          utcToLondon(a.slot_time).dateStr === cleanDate
      )
      .forEach(a => {
        bookedUtcTimes.add(new Date(a.slot_time).toISOString());
      });
  }

  // 4. Map each slot and determine availability (checking booked and past slots)
  const now = new Date();

  return baseSlots.map(slot => {
    const slotDate = new Date(slot.utcIso);
    const isPast = slotDate.getTime() <= now.getTime();
    const isBooked = bookedUtcTimes.has(slotDate.toISOString());

    let reasonDisabled: 'booked' | 'past' | undefined;
    if (isBooked) {
      reasonDisabled = 'booked';
    } else if (isPast) {
      reasonDisabled = 'past';
    }

    return {
      timeStr: slot.timeStr,
      time12: slot.time12,
      utcIso: slot.utcIso,
      available: !isBooked && !isPast,
      reasonDisabled,
    };
  });
}

// =========================================================================
// CREATE APPOINTMENT (SINGLE SOURCE OF TRUTH)
// =========================================================================

/**
 * Creates an appointment with server-side availability validation,
 * UK phone normalization, and database-level double-booking prevention.
 */
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<AppointmentServiceResponse<AppointmentRecord>> {
  // 1. Validate fields on the server
  const val = validateAppointmentInput(input);
  if (!val.valid) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      error: val.error,
    };
  }

  const patientName = input.patientName.trim();
  const phoneNumber = val.normalizedPhone!;
  const email = input.email ? input.email.trim() : null;
  const reason = input.reason.trim();
  const dateStr = input.date.trim().slice(0, 10);
  const timeStr = input.time.trim();
  const clinicianName = (input.clinicianName || clinicConfig.leadDentist).trim();
  const reminderConsent = !!input.reminderConsent;
  const consentTimestamp = reminderConsent ? new Date().toISOString() : null;
  const source = input.source || 'Website';
  const notes = input.notes ? input.notes.trim() : null;

  // 2. Verify clinic is open on requested date (not closed, not bank holiday)
  if (!isClinicOpenOnDate(dateStr)) {
    return {
      success: false,
      code: 'CLINIC_CLOSED',
      error: `Vertex Dental Lab is closed on ${dateStr} (weekend or official UK Bank Holiday). Please choose an open clinic day.`,
    };
  }

  // 3. Compute slot_time and slot_end_time in UTC
  const slotTimeUtcIso = londonTimeToUtcIso(dateStr, timeStr);
  const slotStartDate = new Date(slotTimeUtcIso);
  const slotEndDate = new Date(slotStartDate.getTime() + clinicConfig.slotLengthMinutes * 60 * 1000);
  const slotEndTimeUtcIso = slotEndDate.toISOString();

  // 4. Past slot prevention
  if (slotStartDate.getTime() <= Date.now()) {
    return {
      success: false,
      code: 'SLOT_UNAVAILABLE',
      error: 'The requested appointment slot is in the past. Please select an upcoming slot.',
    };
  }

  // 5. Server-side availability re-check
  const availability = await getSlotAvailability(dateStr, clinicianName);
  const targetSlot = availability.find(s => s.utcIso === slotTimeUtcIso || s.timeStr === timeStr || s.time12 === timeStr);

  if (targetSlot && !targetSlot.available) {
    return {
      success: false,
      code: 'DOUBLE_BOOKED',
      error: 'This appointment slot is no longer available. Please select another time.',
    };
  }

  // 6. Database Insertion with Double-Booking Prevention
  const supabase = getSupabaseServerClient();
  const nowUtcIso = new Date().toISOString();

  if (supabase && isSupabaseConfigured()) {
    // 6a. Live Supabase Query
    // Insert into patients table first (or update)
    let patientId: string | null = null;
    try {
      const { data: patientData } = await supabase
        .from('patients')
        .upsert(
          {
            name: patientName,
            phone_number: phoneNumber,
            email,
            updated_at: nowUtcIso,
          },
          { onConflict: 'phone_number' }
        )
        .select('id')
        .single();

      if (patientData) {
        patientId = patientData.id;
      }
    } catch {
      // Patient table upsert non-blocking
    }

    // Insert into appointments table
    const timeFormatted = time.length === 5 ? `${time}:00` : time;
    const { data: insertedApt, error: insertError } = await supabase
      .from('appointments')
      .insert({
        customer_name: patientName,
        phone: phoneNumber,
        service: reason,
        appointment_date: date,
        appointment_time: timeFormatted,
        patient_id: patientId,
        patient_name: patientName,
        phone_number: phoneNumber,
        email,
        reason,
        slot_time: slotTimeUtcIso,
        slot_end_time: slotEndTimeUtcIso,
        status: 'CONFIRMED',
        clinician_name: clinicianName,
        reminder_consent: reminderConsent,
        consent_timestamp: consentTimestamp,
        reminder_sent: false,
        google_sheet_synced: false,
        notes,
        source,
      })
      .select('*')
      .single();

    if (insertError) {
      // PostgreSQL unique constraint (23505) or exclusion violation (23P01)
      if (
        insertError.code === '23505' ||
        insertError.code === '23P01' ||
        insertError.message?.includes('unique_date_time_slot') ||
        insertError.message?.includes('prevent_double_booking') ||
        insertError.message?.includes('duplicate key')
      ) {
        return {
          success: false,
          code: 'DOUBLE_BOOKED',
          error: 'This appointment slot has just been booked by another patient. Please select another available time.',
        };
      }

      return {
        success: false,
        code: 'SERVER_ERROR',
        error: insertError.message || 'Failed to save appointment in database.',
      };
    }

    // Attempt Google Sheets Sync
    let sheetSynced = false;
    try {
      sheetSynced = await appendBookingToGoogleSheet({
        appointment_date: date,
        appointment_time: time.slice(0, 5),
        customer_name: patientName,
        phone: phoneNumber,
        service: reason,
      });

      if (sheetSynced && insertedApt?.id) {
        await supabase
          .from('appointments')
          .update({ google_sheet_synced: true })
          .eq('id', insertedApt.id);
      }
    } catch (sheetErr) {
      console.error('[Service] Google Sheets sync error:', sheetErr);
    }

    const londonInfo = utcToLondon(insertedApt.slot_time);
    return {
      success: true,
      data: {
        ...insertedApt,
        google_sheet_synced: sheetSynced,
        london_date: londonInfo.dateStr,
        london_time: londonInfo.time12,
        london_display: londonInfo.display,
      },
    };
  }

  // 6b. Atomic In-Memory Fallback Engine
  // Mimics the exact database exclusion constraint:
  // EXCLUDE USING gist (slot_time WITH =, clinician_name WITH =) WHERE (status != 'CANCELLED')
  const conflict = mockStore.appointments.find(
    a =>
      a.status !== 'CANCELLED' &&
      a.clinician_name === clinicianName &&
      new Date(a.slot_time).toISOString() === slotTimeUtcIso
  );

  if (conflict) {
    return {
      success: false,
      code: 'DOUBLE_BOOKED',
      error: 'This appointment slot has just been booked by another patient. Please select another available time.',
    };
  }

  const newRecord: AppointmentRecord = {
    id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    patient_name: patientName,
    phone_number: phoneNumber,
    email,
    reason,
    slot_time: slotTimeUtcIso,
    slot_end_time: slotEndTimeUtcIso,
    status: 'CONFIRMED',
    clinician_name: clinicianName,
    reminder_consent: reminderConsent,
    consent_timestamp: consentTimestamp,
    reminder_sent: false,
    notes,
    source,
    created_at: nowUtcIso,
    updated_at: nowUtcIso,
  };

  mockStore.appointments.unshift(newRecord);

  const londonInfo = utcToLondon(newRecord.slot_time);
  return {
    success: true,
    data: {
      ...newRecord,
      london_date: londonInfo.dateStr,
      london_time: londonInfo.time12,
      london_display: londonInfo.display,
    },
  };
}

// =========================================================================
// QUERY & UPDATE APPOINTMENTS
// =========================================================================

export async function getAllAppointments(filters?: {
  date?: string;
  clinicianName?: string;
  status?: AppointmentStatus;
}): Promise<AppointmentRecord[]> {
  const supabase = getSupabaseServerClient();
  if (supabase && isSupabaseConfigured()) {
    let query = supabase.from('appointments').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.clinicianName && filters.clinicianName !== 'All Clinicians') {
      query = query.eq('clinician_name', filters.clinicianName);
    }
    if (filters?.date) {
      const dayStartUtc = londonTimeToUtcIso(filters.date, '00:00');
      const dayEndUtc = londonTimeToUtcIso(filters.date, '23:59');
      query = query.gte('slot_time', dayStartUtc).lte('slot_time', dayEndUtc);
    }

    const { data } = await query.order('slot_time', { ascending: true });
    return (data || []).map((row: AppointmentRecord) => {
      const london = utcToLondon(row.slot_time);
      return {
        ...row,
        london_date: london.dateStr,
        london_time: london.time12,
        london_display: london.display,
      };
    });
  }

  let list = [...mockStore.appointments];
  if (filters?.status) {
    list = list.filter(a => a.status === filters.status);
  }
  if (filters?.clinicianName && filters.clinicianName !== 'All Clinicians') {
    list = list.filter(a => a.clinician_name === filters.clinicianName);
  }
  if (filters?.date) {
    list = list.filter(a => utcToLondon(a.slot_time).dateStr === filters.date);
  }

  return list
    .sort((a, b) => new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime())
    .map(row => {
      const london = utcToLondon(row.slot_time);
      return {
        ...row,
        london_date: london.dateStr,
        london_time: london.time12,
        london_display: london.display,
      };
    });
}

export async function updateAppointmentStatus(
  id: string,
  newStatus: AppointmentStatus
): Promise<AppointmentServiceResponse<AppointmentRecord>> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: newStatus, updated_at: now })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Appointment not found.' };
    }
    const london = utcToLondon(data.slot_time);
    return {
      success: true,
      data: {
        ...data,
        london_date: london.dateStr,
        london_time: london.time12,
        london_display: london.display,
      },
    };
  }

  const idx = mockStore.appointments.findIndex(a => a.id === id);
  if (idx === -1) {
    return { success: false, error: 'Appointment not found.' };
  }

  mockStore.appointments[idx].status = newStatus;
  mockStore.appointments[idx].updated_at = now;
  const updated = mockStore.appointments[idx];
  const london = utcToLondon(updated.slot_time);

  return {
    success: true,
    data: {
      ...updated,
      london_date: london.dateStr,
      london_time: london.time12,
      london_display: london.display,
    },
  };
}

// =========================================================================
// REMINDER POLLING & ATOMIC UPDATE
// =========================================================================

/**
 * Queries appointments that are due for a reminder.
 * Conditions:
 *  - status != 'CANCELLED'
 *  - reminder_consent = true
 *  - reminder_sent = false
 *  - slot_time is between now and (now + windowMinutes)
 */
export async function getAppointmentsDueForReminder(
  referenceTime: Date = new Date(),
  windowMinutes: number = 65
): Promise<AppointmentRecord[]> {
  const windowStartIso = referenceTime.toISOString();
  const windowEndDate = new Date(referenceTime.getTime() + windowMinutes * 60 * 1000);
  const windowEndIso = windowEndDate.toISOString();

  const supabase = getSupabaseServerClient();
  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .neq('status', 'CANCELLED')
      .eq('reminder_consent', true)
      .eq('reminder_sent', false)
      .gte('slot_time', windowStartIso)
      .lte('slot_time', windowEndIso)
      .order('slot_time', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row: AppointmentRecord) => {
      const london = utcToLondon(row.slot_time);
      return {
        ...row,
        london_date: london.dateStr,
        london_time: london.time12,
        london_display: london.display,
      };
    });
  }

  // Fallback to in-memory store
  return mockStore.appointments
    .filter(a => {
      if (a.status === 'CANCELLED') return false;
      if (!a.reminder_consent) return false;
      if (a.reminder_sent) return false;
      const aptTime = new Date(a.slot_time).getTime();
      return (
        aptTime >= referenceTime.getTime() &&
        aptTime <= windowEndDate.getTime()
      );
    })
    .sort((a, b) => new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime())
    .map(row => {
      const london = utcToLondon(row.slot_time);
      return {
        ...row,
        london_date: london.dateStr,
        london_time: london.time12,
        london_display: london.display,
      };
    });
}

/**
 * Atomically marks an appointment reminder as sent.
 * Returns true if the status was successfully flipped from false to true.
 */
export async function markReminderAsSent(id: string): Promise<boolean> {
  const now = new Date().toISOString();
  const supabase = getSupabaseServerClient();

  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        reminder_sent: true,
        reminder_sent_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .eq('reminder_sent', false)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      return false;
    }
    return true;
  }

  const apt = mockStore.appointments.find(a => a.id === id);
  if (!apt || apt.reminder_sent) {
    return false;
  }

  apt.reminder_sent = true;
  apt.reminder_sent_at = now;
  apt.updated_at = now;
  return true;
}

