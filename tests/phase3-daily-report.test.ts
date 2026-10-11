/**
 * tests/phase3-daily-report.test.ts
 *
 * Comprehensive Test Suite for Phase 3:
 * Automatic Daily Owner Report at 08:00 AM Europe/London time.
 *
 * Verifies:
 * 1. Privacy-preserving patient name formatting (First name + Surname initial).
 * 2. Report message generation for populated vs. empty schedules.
 * 3. Europe/London 08:00 AM detection across British Summer Time (BST) and GMT.
 * 4. Database / memory idempotency (strict prevention of duplicate sends per day).
 * 5. Forced manual trigger override.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPatientNameForReport,
  buildDailyReportContent,
  isLondonHourEight,
  sendDailyOwnerReport,
  resetDailyReportMockStore,
} from '../src/lib/reports/daily-report';
import { createAppointment } from '../src/lib/appointments/service';
import type { AppointmentRecord } from '../src/lib/appointments/types';

describe('Phase 3: Daily Owner Report System', () => {
  beforeEach(() => {
    resetDailyReportMockStore();
  });

  // -----------------------------------------------------------------------
  // 1. Patient Name Privacy Formatting
  // -----------------------------------------------------------------------
  it('formats patient names with privacy (First name + Surname initial)', () => {
    assert.equal(formatPatientNameForReport('Charlotte King'), 'Charlotte K.');
    assert.equal(formatPatientNameForReport('David Miller'), 'David M.');
    assert.equal(formatPatientNameForReport('Sarah Jessica Parker'), 'Sarah P.');
    assert.equal(formatPatientNameForReport('Arthur'), 'Arthur');
    assert.equal(formatPatientNameForReport('  Marcus   Rashford  '), 'Marcus R.');
    assert.equal(formatPatientNameForReport(''), 'Patient');
  });

  // -----------------------------------------------------------------------
  // 2. Report Message Content Builder
  // -----------------------------------------------------------------------
  it('builds report content accurately for an empty schedule', () => {
    const res = buildDailyReportContent('2026-10-12', []);
    assert.equal(res.count, 0);
    assert.ok(res.content.includes('Vertex Dental Lab - Daily Diary'));
    assert.ok(res.content.includes('Total Appointments: 0'));
    assert.ok(res.content.includes('No appointments scheduled for today.'));
    assert.ok(res.content.includes('Dr. Alistair Vance'));
  });

  it('builds report content accurately with formatted appointments', () => {
    const mockAppointments: AppointmentRecord[] = [
      {
        id: 'apt-1',
        patient_name: 'Charlotte King',
        phone_number: '+447911123456',
        reason: 'Routine Checkup & Scale',
        slot_time: '2026-10-12T09:30:00.000Z',
        slot_end_time: '2026-10-12T10:00:00.000Z',
        status: 'CONFIRMED',
        clinician_name: 'Dr. Alistair Vance',
        reminder_consent: true,
        reminder_sent: false,
        source: 'Website',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        london_time: '10:30 AM',
      },
      {
        id: 'apt-2',
        patient_name: 'David Miller',
        phone_number: '+447911987654',
        reason: 'Crown Consultation',
        slot_time: '2026-10-12T11:00:00.000Z',
        slot_end_time: '2026-10-12T11:30:00.000Z',
        status: 'CONFIRMED',
        clinician_name: 'Dr. Alistair Vance',
        reminder_consent: true,
        reminder_sent: false,
        source: 'Chatbot',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        london_time: '12:00 PM',
      },
      {
        id: 'apt-3',
        patient_name: 'Cancelled Patient',
        phone_number: '+447911000000',
        reason: 'Cancelled Appointment',
        slot_time: '2026-10-12T14:00:00.000Z',
        slot_end_time: '2026-10-12T14:30:00.000Z',
        status: 'CANCELLED',
        clinician_name: 'Dr. Alistair Vance',
        reminder_consent: false,
        reminder_sent: false,
        source: 'Website',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const res = buildDailyReportContent('2026-10-12', mockAppointments);
    // Cancelled appointments must be omitted from total count and body
    assert.equal(res.count, 2);
    assert.ok(res.content.includes('Total Appointments: 2'));
    assert.ok(res.content.includes('1. Charlotte K. - 10:30 AM - Routine Checkup & Scale'));
    assert.ok(res.content.includes('2. David M. - 12:00 PM - Crown Consultation'));
    assert.ok(!res.content.includes('Cancelled Patient'));
  });

  // -----------------------------------------------------------------------
  // 3. Europe/London 08:00 AM Detection Across BST & GMT
  // -----------------------------------------------------------------------
  it('correctly evaluates 08:00 AM London in British Summer Time (BST: UTC+1)', () => {
    // In BST (e.g., July 15), 07:00 UTC corresponds to 08:00 BST
    const summerDateAt8AmLondon = new Date('2026-07-15T07:15:00.000Z');
    assert.equal(isLondonHourEight(summerDateAt8AmLondon), true);

    // 08:00 UTC in summer is 09:00 BST -> false
    const summerDateAt9AmLondon = new Date('2026-07-15T08:15:00.000Z');
    assert.equal(isLondonHourEight(summerDateAt9AmLondon), false);
  });

  it('correctly evaluates 08:00 AM London in Greenwich Mean Time (GMT: UTC+0)', () => {
    // In GMT (e.g., January 15), 08:00 UTC corresponds to 08:00 GMT
    const winterDateAt8AmLondon = new Date('2026-01-15T08:15:00.000Z');
    assert.equal(isLondonHourEight(winterDateAt8AmLondon), true);

    // 07:00 UTC in winter is 07:00 GMT -> false
    const winterDateAt7AmLondon = new Date('2026-01-15T07:15:00.000Z');
    assert.equal(isLondonHourEight(winterDateAt7AmLondon), false);
  });

  // -----------------------------------------------------------------------
  // 4. Idempotency & Double-Send Prevention
  // -----------------------------------------------------------------------
  it('prevents sending duplicate reports on the same day unless forced', async () => {
    const testDate = '2026-11-20';

    // First send: should succeed
    const firstResult = await sendDailyOwnerReport({ date: testDate });
    assert.equal(firstResult.success, true);
    assert.equal(firstResult.sent, true);
    assert.equal(firstResult.reportDate, testDate);
    assert.ok(firstResult.messageId);

    // Second send on the same date: should be skipped idempotently
    const secondResult = await sendDailyOwnerReport({ date: testDate });
    assert.equal(secondResult.success, true);
    assert.equal(secondResult.sent, false);
    assert.ok(secondResult.reason?.includes('already sent'));

    // Third send with force = true: should bypass idempotency check
    const forceResult = await sendDailyOwnerReport({ date: testDate, force: true });
    assert.equal(forceResult.success, true);
    assert.equal(forceResult.sent, true);
    assert.ok(forceResult.messageId);
  });

  // -----------------------------------------------------------------------
  // 5. Integration with Live Appointments Service
  // -----------------------------------------------------------------------
  it('queries real booked appointments for the day and includes them in the report', async () => {
    const testDate = '2026-11-23'; // Monday (open day)

    // Book an appointment for testDate
    await createAppointment({
      patientName: 'Emma Watson',
      phoneNumber: '07123456789',
      reason: 'Composite Bonding Consultation',
      date: testDate,
      time: '11:00',
      reminderConsent: true,
    });

    const reportRes = await sendDailyOwnerReport({ date: testDate, force: true });
    assert.equal(reportRes.success, true);
    assert.equal(reportRes.sent, true);
    assert.ok(reportRes.appointmentCount >= 1);
    assert.ok(reportRes.content?.includes('Emma W.'));
    assert.ok(reportRes.content?.includes('Composite Bonding Consultation'));
  });
});
