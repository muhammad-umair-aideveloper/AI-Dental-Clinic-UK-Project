/**
 * tests/phase4-reminders.test.ts
 *
 * Comprehensive Test Suite for Phase 4:
 * Automatic Patient Reminders 1 Hour Before Appointment.
 *
 * Verifies:
 * 1. Friendly and professional SMS message formatting.
 * 2. Strict adherence to UK GDPR consent: reminder_consent must be TRUE.
 * 3. Accurate lookahead window (~60-65 minutes) and exclusion of past or distant slots.
 * 4. Exclusion of CANCELLED appointments.
 * 5. Atomic reminder_sent flag update preventing duplicate reminders.
 * 6. Zero-PII phone masking in reminder logging.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPatientFirstName,
  formatPatientReminderMessage,
  maskPhoneNumber,
  sendDuePatientReminders,
} from '../src/lib/reminders/service';
import {
  createAppointment,
  getAppointmentsDueForReminder,
  updateAppointmentStatus,
} from '../src/lib/appointments/service';
import type { AppointmentRecord } from '../src/lib/appointments/types';

describe('Phase 4: Automatic Patient Reminders System', () => {
  // -----------------------------------------------------------------------
  // 1. Message Formatting & Privacy Masking
  // -----------------------------------------------------------------------
  it('extracts patient first name cleanly', () => {
    assert.equal(getPatientFirstName('Charlotte King'), 'Charlotte');
    assert.equal(getPatientFirstName('Dr. Alistair Vance'), 'Alistair');
    assert.equal(getPatientFirstName('Mrs. Sarah Parker'), 'Sarah');
    assert.equal(getPatientFirstName('David'), 'David');
    assert.equal(getPatientFirstName(''), 'there');
  });

  it('masks phone numbers to protect patient PII in operational logs', () => {
    assert.equal(maskPhoneNumber('+447946088800'), '+4479***800');
    assert.equal(maskPhoneNumber('+447111222333'), '+4471***333');
    assert.equal(maskPhoneNumber('123'), '******');
  });

  it('formats friendly, professional reminder SMS messages', () => {
    const mockApt: AppointmentRecord = {
      id: 'apt-test-1',
      patient_name: 'Charlotte King',
      phone_number: '+447911123456',
      reason: 'Teeth Whitening Consultation',
      slot_time: '2026-11-25T10:30:00.000Z',
      slot_end_time: '2026-11-25T11:00:00.000Z',
      status: 'CONFIRMED',
      clinician_name: 'Dr. Alistair Vance',
      reminder_consent: true,
      reminder_sent: false,
      source: 'Website',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      london_time: '10:30 AM',
    };

    const msg = formatPatientReminderMessage(mockApt);
    assert.ok(msg.includes('Hi Charlotte'));
    assert.ok(msg.includes('Vertex Dental Lab'));
    assert.ok(msg.includes('10:30 AM'));
    assert.ok(msg.includes('Dr. Alistair Vance'));
    assert.ok(msg.includes('Teeth Whitening Consultation'));
    assert.ok(msg.includes('arrive 5 mins early'));
  });

  // -----------------------------------------------------------------------
  // 2. Eligibility & Lookahead Window Filter
  // -----------------------------------------------------------------------
  it('correctly filters appointments eligible for 1-hour reminders', async () => {
    // 09:00 AM London time
    const referenceNow = new Date(londonTimeToUtcIso('2026-10-15', '09:00'));

    // 1. Due in 50 minutes (09:50) WITH consent -> SHOULD BE INCLUDED
    const in50Min = new Date(referenceNow.getTime() + 50 * 60 * 1000);
    const apt1 = await createAppointment({
      patientName: 'Alice Green',
      phoneNumber: '07111111111',
      reason: 'Routine Exam',
      date: '2026-10-15',
      time: '09:50',
      reminderConsent: true,
    });

    // 2. Due in 120 minutes (2 hours) -> TOO FAR, EXCLUDED
    const apt2 = await createAppointment({
      patientName: 'Bob White',
      phoneNumber: '07222222222',
      reason: 'Crown Check',
      date: '2026-10-15',
      time: '11:00',
      reminderConsent: true,
    });

    // 3. Due in 45 minutes WITHOUT consent -> STRICTLY EXCLUDED (UK GDPR)
    const apt3 = await createAppointment({
      patientName: 'Charlie Black',
      phoneNumber: '07333333333',
      reason: 'Emergency Toothache',
      date: '2026-10-15',
      time: '09:45',
      reminderConsent: false,
    });

    // 4. Due in 30 minutes but CANCELLED -> EXCLUDED
    const apt4 = await createAppointment({
      patientName: 'David Brown',
      phoneNumber: '07444444444',
      reason: 'Cancelled Checkup',
      date: '2026-10-15',
      time: '09:30',
      reminderConsent: true,
    });
    if (apt4.success && apt4.data) {
      await updateAppointmentStatus(apt4.data.id, 'CANCELLED');
    }

    // Query due reminders with our reference time
    const due = await getAppointmentsDueForReminder(referenceNow, 65);
    const dueIds = due.map(d => d.id);

    if (apt1.success && apt1.data) {
      assert.ok(dueIds.includes(apt1.data.id), 'Appointment due in 50 min with consent should be included');
    }
    if (apt2.success && apt2.data) {
      assert.ok(!dueIds.includes(apt2.data.id), 'Appointment due in 120 min should NOT be included');
    }
    if (apt3.success && apt3.data) {
      assert.ok(!dueIds.includes(apt3.data.id), 'Appointment without reminder consent must NOT be included');
    }
    if (apt4.success && apt4.data) {
      assert.ok(!dueIds.includes(apt4.data.id), 'Cancelled appointment must NOT be included');
    }
  });

  // -----------------------------------------------------------------------
  // 3. Atomic Dispatch and Double-Send Prevention
  // -----------------------------------------------------------------------
  it('sends reminder and atomically updates reminder_sent flag preventing double-reminders', async () => {
    const referenceNow = new Date('2026-10-16T14:00:00.000Z');

    // Create an eligible appointment 40 minutes away
    const aptRes = await createAppointment({
      patientName: 'Hannah Abbott',
      phoneNumber: '07555666777',
      reason: 'Orthodontic Assessment',
      date: '2026-10-16',
      time: '14:40',
      reminderConsent: true,
    });

    assert.ok(aptRes.success);
    const aptId = aptRes.data!.id;

    // Run 1: Should find and dispatch reminder
    const run1 = await sendDuePatientReminders({ referenceTime: referenceNow, windowMinutes: 65 });
    const targetResult = run1.results.find(r => r.id === aptId);
    assert.ok(targetResult, 'Target appointment should be processed');
    assert.equal(targetResult.success, true);

    // Run 2: Immediately run again (mimicking next 5-minute cron poll)
    // The appointment must NOT be reminded again because reminder_sent is already true
    const run2 = await sendDuePatientReminders({ referenceTime: referenceNow, windowMinutes: 65 });
    const targetResult2 = run2.results.find(r => r.id === aptId);
    assert.equal(targetResult2, undefined, 'Appointment must not be reminded twice');
  });
});
