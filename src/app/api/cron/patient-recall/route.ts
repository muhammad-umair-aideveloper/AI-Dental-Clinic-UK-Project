import { NextRequest, NextResponse } from 'next/server';
import { PatientRepository } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';

export async function GET(req: NextRequest) {
  return handleRecallExecution(req);
}

export async function POST(req: NextRequest) {
  return handleRecallExecution(req);
}

async function handleRecallExecution(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceAll = searchParams.get('force') === 'true';

    // 1. Query patients due or overdue for 6-month preventive recall (180 days)
    const overduePatients = await PatientRepository.findOverdueRecalls(180);

    const qualifiedPatients = forceAll
      ? overduePatients
      : overduePatients.filter(p => {
          const t = (p.treatmentType || '').toLowerCase();
          return t.includes('scaling') || t.includes('checkup') || t.includes('exam') || t.includes('hygiene') || t.includes('airflow');
        });

    const dispatchedResults = [];

    // 2. Dispatch personalized WhatsApp recall invitation with 1-click booking link
    for (const patient of qualifiedPatients) {
      const log = await WhatsAppService.sendRecallInvitation(patient);
      dispatchedResults.push({
        patientId: patient.id,
        patientName: patient.name,
        phoneNumber: patient.phoneNumber,
        lastVisitDate: patient.lastVisitDate,
        treatmentType: patient.treatmentType,
        messageId: log.id,
        status: log.status,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cronJob: '6-Month Patient Retention & Preventive Recall',
      scannedPatientsCount: (await PatientRepository.getAll()).length,
      qualifiedOverdueCount: qualifiedPatients.length,
      dispatchedCount: dispatchedResults.length,
      dispatches: dispatchedResults,
    });
  } catch (err: any) {
    console.error('Patient Recall Cron Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error executing 6-month patient recall cron' },
      { status: 500 }
    );
  }
}
