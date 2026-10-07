import { NextRequest, NextResponse } from 'next/server';
import { AppointmentRepository, PostOpCareService } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointmentId, treatmentType, patientName, phoneNumber } = body;

    let targetAppointment = appointmentId ? await AppointmentRepository.getById(appointmentId) : null;

    if (!targetAppointment && treatmentType && patientName && phoneNumber) {
      targetAppointment = {
        id: `mock-${Date.now()}`,
        patientName,
        phoneNumber,
        treatmentType,
        slotTime: new Date().toISOString(),
        status: 'COMPLETED',
        clinicianName: 'Dr. Alistair Vance',
        isEmergency: false,
        source: 'Reception Simulation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!targetAppointment) {
      return NextResponse.json(
        { success: false, error: 'Valid appointmentId or appointment details required.' },
        { status: 400 }
      );
    }

    const log = await PostOpCareService.dispatch(targetAppointment);

    return NextResponse.json({
      success: true,
      appointmentId: targetAppointment.id,
      patientName: targetAppointment.patientName,
      phoneNumber: targetAppointment.phoneNumber,
      treatmentType: targetAppointment.treatmentType,
      messageLogId: log.id,
      payload: log.content,
      templateName: log.templateName,
      dispatchedAt: log.sentAt,
      status: log.status,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
