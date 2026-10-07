import { NextRequest, NextResponse } from 'next/server';
import { AppointmentRepository, DBAppointmentStatus } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const clinician = searchParams.get('clinician') || undefined;
    const status = (searchParams.get('status') as DBAppointmentStatus) || undefined;
    const checkAvailability = searchParams.get('checkAvailability') === 'true';

    // Slot availability check for interactive calendar
    if (checkAvailability && date) {
      const availability = await AppointmentRepository.getAvailability(date, clinician);
      return NextResponse.json({ success: true, date, clinician, availability });
    }

    const appointments = await AppointmentRepository.getAll({ date, clinician, status });
    return NextResponse.json({ success: true, count: appointments.length, appointments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.patientName || !body.phoneNumber || !body.treatmentType || !body.slotTime) {
      return NextResponse.json(
        { success: false, error: 'patientName, phoneNumber, treatmentType, and slotTime are required.' },
        { status: 400 }
      );
    }

    const newAppointment = await AppointmentRepository.create({
      patientName: body.patientName,
      phoneNumber: body.phoneNumber,
      treatmentType: body.treatmentType,
      slotTime: body.slotTime,
      clinicianName: body.clinicianName,
      notes: body.notes,
      isEmergency: body.isEmergency,
      source: body.source,
    });

    // Automatically send T-24h reminder interactive template if requested or for future slots
    if (body.sendImmediateConfirmation !== false) {
      await WhatsAppService.sendT24Reminder(newAppointment);
    }

    return NextResponse.json({ success: true, appointment: newAppointment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, triggerAutomations } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'id and status are required.' }, { status: 400 });
    }

    const result = await AppointmentRepository.updateStatus(id, status, { triggerAutomations: !!triggerAutomations });

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
      reclaimedSlot: result.reclaimedSlot,
      waitlistAlerted: result.waitlistAlerted,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required.' }, { status: 400 });
    }

    const deleted = await AppointmentRepository.delete(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
