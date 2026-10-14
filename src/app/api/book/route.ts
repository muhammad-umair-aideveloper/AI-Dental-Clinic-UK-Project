/**
 * src/app/api/book/route.ts
 *
 * Core Booking API Endpoint for Vertex Dental Lab.
 * Used by both the public website booking form and the AI Chatbot tool call.
 * 
 * Enforces:
 * 1. UK Mobile Phone Sanitization (auto converts 07xxx to +447xxx)
 * 2. Supabase PostgreSQL booking insertion
 * 3. PostgreSQL 23505 unique constraint handler with 409 Conflict + Available Slots (09:00-17:00)
 * 4. Real-time Google Sheets sync via Service Account JWT, setting google_sheet_synced = true
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { appendBookingToGoogleSheet } from '@/lib/sheets/google-sheets';

// Standard UK Clinic Slots (09:00 to 17:00, 30-minute intervals)
export const CLINIC_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
];

/**
 * Sanitizes UK mobile numbers into E.164 (+447XXXXXXXXX).
 */
export function sanitizeUkMobile(raw: string): { isValid: boolean; normalized: string; error?: string } {
  if (!raw || typeof raw !== 'string') {
    return { isValid: false, normalized: '', error: 'Mobile number is required.' };
  }

  // Remove spaces, hyphens, brackets, dots
  let cleaned = raw.replace(/[\s\-\(\)\.]/g, '').trim();

  // Handle leading 0044
  if (cleaned.startsWith('0044')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Handle leading 447 without plus
  if (cleaned.startsWith('447')) {
    cleaned = '+' + cleaned;
  }

  // Convert 07XXX to +447XXX
  if (cleaned.startsWith('07')) {
    cleaned = '+44' + cleaned.slice(1);
  }

  // Validate E.164 format: +447 followed by 9 digits (total 13 chars)
  const ukMobileRegex = /^\+447\d{9}$/;
  if (!ukMobileRegex.test(cleaned)) {
    // If it's a UK landline (+441, +442, etc.), accept if standard 10-11 digits or require mobile
    if (/^\+44[12389]\d{8,9}$/.test(cleaned)) {
      return { isValid: true, normalized: cleaned };
    }
    return {
      isValid: false,
      normalized: cleaned,
      error: 'Please enter a valid UK mobile number starting with 07 or +447 (e.g., 07123 456789).',
    };
  }

  return { isValid: true, normalized: cleaned };
}

/**
 * Normalizes appointment time into HH:MM:00 format.
 */
export function normalizeTimeFormat(rawTime: string): string {
  const trimmed = rawTime.trim();
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].slice(0, 2).padStart(2, '0');
    return `${hh}:${mm}:00`;
  }
  return trimmed;
}

// In-Memory Fallback Store (for offline testing / initial setup without live credentials)
interface StoredBooking {
  id: string;
  customer_name: string;
  phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reminder_1hr_sent: boolean;
  google_sheet_synced: boolean;
  created_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __dentalMemoryAppointments: StoredBooking[] | undefined;
}

if (!global.__dentalMemoryAppointments) {
  global.__dentalMemoryAppointments = [];
}

const memoryAppointments = global.__dentalMemoryAppointments;

/**
 * Computes available slots for a given date by subtracting booked slots from clinic hours.
 */
async function getAvailableSlots(dateStr: string): Promise<string[]> {
  const supabase = getSupabaseServerClient();

  let bookedTimes: string[] = [];

  if (supabase && isSupabaseConfigured()) {
    const { data: booked } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', dateStr)
      .neq('status', 'CANCELLED');

    if (booked) {
      bookedTimes = booked.map(b => (b.appointment_time || '').slice(0, 5));
    }
  } else {
    bookedTimes = memoryAppointments
      .filter(a => a.appointment_date === dateStr && a.status !== 'CANCELLED')
      .map(a => a.appointment_time.slice(0, 5));
  }

  return CLINIC_SLOTS.filter(slot => !bookedTimes.includes(slot));
}

// GET: Check available slots for a given date
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Query parameter date (YYYY-MM-DD) is required.' },
        { status: 400 }
      );
    }

    const availableSlots = await getAvailableSlots(date);

    return NextResponse.json({
      success: true,
      appointment_date: date,
      clinic_hours: '09:00 - 17:00 (Europe/London)',
      total_slots: CLINIC_SLOTS.length,
      available_slots: availableSlots,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Book an appointment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    // Flexible mapping for parameters from website or chatbot
    const customerName = (body.customer_name || body.customerName || body.patientName || body.name || '').trim();
    const rawPhone = (body.phone || body.phoneNumber || body.mobile || '').trim();
    const service = (body.service || body.treatment || body.reason || body.treatmentType || '').trim();
    const rawDate = (body.appointment_date || body.date || '').trim();
    const rawTime = (body.appointment_time || body.time || body.slot || '').trim();

    // 1. Validate required fields
    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Dental service/treatment is required.' },
        { status: 400 }
      );
    }

    if (!rawDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      return NextResponse.json(
        { success: false, error: 'Valid appointment date (YYYY-MM-DD) is required.' },
        { status: 400 }
      );
    }

    if (!rawTime) {
      return NextResponse.json(
        { success: false, error: 'Appointment time is required.' },
        { status: 400 }
      );
    }

    // 2. Sanitize UK Phone Number to E.164 (+447XXXXXXXXX)
    const phoneResult = sanitizeUkMobile(rawPhone);
    if (!phoneResult.isValid) {
      return NextResponse.json(
        { success: false, error: phoneResult.error },
        { status: 400 }
      );
    }
    const phone = phoneResult.normalized;

    // Normalize time to HH:MM:00
    const appointmentTime = normalizeTimeFormat(rawTime);
    const appointmentDate = rawDate;

    // 3. Insert into Supabase PostgreSQL
    const supabase = getSupabaseServerClient();

    if (supabase && isSupabaseConfigured()) {
      // Upsert patient record for contact tracking
      try {
        await supabase
          .from('patients')
          .upsert(
            { name: customerName, phone, updated_at: new Date().toISOString() },
            { onConflict: 'phone' }
          );
      } catch (err) {
        console.warn('[Booking] Non-critical error updating patient table:', err);
      }

      // Insert appointment with database-level UNIQUE lock
      const { data: inserted, error: insertError } = await supabase
        .from('appointments')
        .insert({
          customer_name: customerName,
          phone,
          service,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: 'CONFIRMED',
          reminder_1hr_sent: false,
          google_sheet_synced: false,
        })
        .select()
        .single();

      if (insertError) {
        // PostgreSQL error code 23505 = unique_violation (unique_date_time_slot constraint)
        if (
          insertError.code === '23505' ||
          insertError.message?.includes('unique_date_time_slot') ||
          insertError.message?.includes('duplicate key')
        ) {
          const availableSlots = await getAvailableSlots(appointmentDate);
          return NextResponse.json(
            {
              success: false,
              code: '23505',
              error: `Slot ${appointmentTime.slice(0, 5)} on ${appointmentDate} is already booked. Please choose an alternative time.`,
              requested_date: appointmentDate,
              requested_time: appointmentTime.slice(0, 5),
              available_slots: availableSlots,
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { success: false, error: insertError.message || 'Database error creating appointment.' },
          { status: 500 }
        );
      }

      // 4. Real-time Google Sheets Sync
      let sheetSynced = false;
      try {
        sheetSynced = await appendBookingToGoogleSheet({
          appointment_date: appointmentDate,
          appointment_time: appointmentTime.slice(0, 5),
          customer_name: customerName,
          phone,
          service,
        });

        if (sheetSynced && inserted?.id) {
          await supabase
            .from('appointments')
            .update({ google_sheet_synced: true })
            .eq('id', inserted.id);
        }
      } catch (sheetErr) {
        console.error('[Booking] Google Sheets sync error:', sheetErr);
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Appointment confirmed successfully.',
          appointment: {
            ...inserted,
            google_sheet_synced: sheetSynced,
          },
        },
        { status: 201 }
      );
    }

    // 5. In-Memory Fallback (Replicates PostgreSQL 23505 unique constraint)
    const existingConflict = memoryAppointments.find(
      a =>
        a.appointment_date === appointmentDate &&
        a.appointment_time.slice(0, 5) === appointmentTime.slice(0, 5) &&
        a.status !== 'CANCELLED'
    );

    if (existingConflict) {
      const availableSlots = await getAvailableSlots(appointmentDate);
      return NextResponse.json(
        {
          success: false,
          code: '23505',
          error: `Slot ${appointmentTime.slice(0, 5)} on ${appointmentDate} is already booked. Please choose an alternative time.`,
          requested_date: appointmentDate,
          requested_time: appointmentTime.slice(0, 5),
          available_slots: availableSlots,
        },
        { status: 409 }
      );
    }

    // Append to Google Sheets if configured
    let sheetSynced = false;
    try {
      sheetSynced = await appendBookingToGoogleSheet({
        appointment_date: appointmentDate,
        appointment_time: appointmentTime.slice(0, 5),
        customer_name: customerName,
        phone,
        service,
      });
    } catch (sheetErr) {
      console.error('[Booking] Google Sheets sync error:', sheetErr);
    }

    const memoryRecord: StoredBooking = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customer_name: customerName,
      phone,
      service,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status: 'CONFIRMED',
      reminder_1hr_sent: false,
      google_sheet_synced: sheetSynced,
      created_at: new Date().toISOString(),
    };

    memoryAppointments.push(memoryRecord);

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment confirmed successfully.',
        appointment: memoryRecord,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while processing booking.' },
      { status: 500 }
    );
  }
}
