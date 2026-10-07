import { NextRequest, NextResponse } from 'next/server';
import { MessageLogRepository, AppointmentRepository } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';

export async function GET() {
  try {
    const logs = await MessageLogRepository.getAll(100);
    return NextResponse.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, appointmentId } = body;

    const apt = await AppointmentRepository.getById(appointmentId);
    if (!apt) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    let log;
    if (action === 'SEND_T24') {
      log = await WhatsAppService.sendT24Reminder(apt);
    } else if (action === 'SEND_T2') {
      log = await WhatsAppService.sendT2FinalAlert(apt);
    } else if (action === 'SEND_POST_OP') {
      log = await WhatsAppService.sendPostOpCare(apt);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, action, log });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
