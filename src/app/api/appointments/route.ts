import { NextRequest, NextResponse } from 'next/server';
import {
  createAppointment,
  getAllAppointments,
  getSlotAvailability,
  updateAppointmentStatus,
} from '@/lib/appointments/service';
import { AppointmentStatus, CreateAppointmentInput } from '@/lib/appointments/types';
import { verifyAdminRequest } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const clinician = searchParams.get('clinician') || undefined;
    const status = (searchParams.get('status') as AppointmentStatus) || undefined;
    const checkAvailability = searchParams.get('checkAvailability') === 'true';

    // 1. PUBLIC ENDPOINT: Slot availability check (ZERO PII returned)
    // Used by the public website booking modal and the AI chatbot
    if (checkAvailability && date) {
      const availability = await getSlotAvailability(date, clinician);
      return NextResponse.json({
        success: true,
        date,
        clinician: clinician || 'Dr. Alistair Vance',
        availability,
      });
    }

    // 2. PROTECTED ADMIN ENDPOINT: Query full appointment list
    // Public users must NEVER see appointment data (names, phones, health reasons)
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Admin credentials or session token required to view appointment records.',
        },
        { status: 401 }
      );
    }

    const appointments = await getAllAppointments({ date, clinicianName: clinician, status });
    return NextResponse.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Map incoming payload flexibly to CreateAppointmentInput
    const appointmentInput: CreateAppointmentInput = {
      patientName: body.patientName || body.name || '',
      phoneNumber: body.phoneNumber || body.phone || '',
      email: body.email || body.patientEmail || undefined,
      reason: body.reason || body.treatmentType || body.serviceName || 'General Consultation',
      date: body.date || (body.slotTime ? body.slotTime.slice(0, 10) : ''),
      time: body.time || body.timeSlot || (body.slotTime ? body.slotTime.slice(11, 16) : ''),
      reminderConsent: !!(body.reminderConsent ?? body.consent ?? true),
      clinicianName: body.clinicianName,
      notes: body.notes,
      source: body.source || 'Website',
    };

    const result = await createAppointment(appointmentInput);

    if (!result.success) {
      const isConflict = result.code === 'DOUBLE_BOOKED' || (result as any).code === '23505';
      const statusCode =
        isConflict
          ? 409
          : result.code === 'INVALID_INPUT' || result.code === 'CLINIC_CLOSED' || result.code === 'SLOT_UNAVAILABLE'
          ? 400
          : 500;

      return NextResponse.json(
        {
          success: false,
          code: isConflict ? '23505' : result.code,
          error: result.error,
          requested_date: appointmentInput.date,
          requested_time: appointmentInput.time,
          available_slots: result.availableSlots || result.available_slots || [],
          availableSlots: result.availableSlots || result.available_slots || [],
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        appointment: result.data,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Protected admin action: only authenticated staff may update appointment status
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Admin authentication required to update appointments.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id and status are required.' },
        { status: 400 }
      );
    }

    const result = await updateAppointmentStatus(id, status as AppointmentStatus);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: result.data,
      slotReclaimed: status === 'CANCELLED',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
