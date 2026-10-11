// =========================================================================
// tests/phase1-booking.test.mjs
// Phase 1 Automated Test Suite: Double-Booking, Timezone BST/GMT, UK Phone & Holiday Rules
// =========================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clinicConfig,
  isBankHoliday,
  isClinicOpenOnDate,
  londonTimeToUtcIso,
  utcToLondon,
  generateDaySlots,
} from '../src/config/clinic.config.ts';
import { normalizeUkPhone } from '../src/lib/appointments/phone.ts';
import {
  createAppointment,
  getSlotAvailability,
  updateAppointmentStatus,
  validateAppointmentInput,
} from '../src/lib/appointments/service.ts';

test('1. UK Phone Number Normalization to E.164 (+447XXXXXXXXX)', () => {
  // Mobile numbers with various spacings and formats
  const res1 = normalizeUkPhone('07123 456789');
  assert.equal(res1.isValid, true);
  assert.equal(res1.normalized, '+447123456789');

  const res2 = normalizeUkPhone('07123456789');
  assert.equal(res2.isValid, true);
  assert.equal(res2.normalized, '+447123456789');

  const res3 = normalizeUkPhone('+44 7123 456 789');
  assert.equal(res3.isValid, true);
  assert.equal(res3.normalized, '+447123456789');

  // Landline or other valid UK format
  const res4 = normalizeUkPhone('020 7946 0888');
  assert.equal(res4.isValid, true);
  assert.equal(res4.normalized, '+442079460888');

  // Invalid numbers
  const invalid1 = normalizeUkPhone('12345');
  assert.equal(invalid1.isValid, false);

  const invalid2 = normalizeUkPhone('');
  assert.equal(invalid2.isValid, false);
});

test('2. Europe/London Timezone & BST / GMT Daylight Saving Fidelity', () => {
  // A. British Summer Time (BST, UTC+1) — e.g. 15 July 2026 at 10:00 AM London
  // 10:00 BST = 09:00 UTC
  const summerDate = '2026-07-15';
  const summerTime = '10:00';
  const summerUtc = londonTimeToUtcIso(summerDate, summerTime);
  assert.equal(summerUtc, '2026-07-15T09:00:00.000Z');

  const summerRoundtrip = utcToLondon(summerUtc);
  assert.equal(summerRoundtrip.dateStr, '2026-07-15');
  assert.equal(summerRoundtrip.timeStr, '10:00');
  assert.equal(summerRoundtrip.time12, '10:00 AM');
  assert.equal(summerRoundtrip.isBst, true);

  // B. Greenwich Mean Time (GMT, UTC+0) — e.g. 15 January 2026 at 10:00 AM London
  // 10:00 GMT = 10:00 UTC
  const winterDate = '2026-01-15';
  const winterTime = '10:00';
  const winterUtc = londonTimeToUtcIso(winterDate, winterTime);
  assert.equal(winterUtc, '2026-01-15T10:00:00.000Z');

  const winterRoundtrip = utcToLondon(winterUtc);
  assert.equal(winterRoundtrip.dateStr, '2026-01-15');
  assert.equal(winterRoundtrip.timeStr, '10:00');
  assert.equal(winterRoundtrip.time12, '10:00 AM');
  assert.equal(winterRoundtrip.isBst, false);

  // C. BST Clock Change Days
  // Spring forward: Sunday 29 March 2026
  // Before change (28 March 2026): GMT (UTC+0)
  const preChange = londonTimeToUtcIso('2026-03-28', '12:00');
  assert.equal(utcToLondon(preChange).isBst, false);

  // After change (30 March 2026): BST (UTC+1) -> 12:00 London = 11:00 UTC
  const postChange = londonTimeToUtcIso('2026-03-30', '12:00');
  assert.equal(postChange, '2026-03-30T11:00:00.000Z');
  assert.equal(utcToLondon(postChange).isBst, true);
});

test('3. Closed Days and UK Bank Holidays Enforcement', () => {
  // Weekend closure: Sunday 2026-10-18
  assert.equal(isClinicOpenOnDate('2026-10-18'), false);

  // UK Bank Holiday: Christmas Day 2026-12-25
  assert.equal(isBankHoliday('2026-12-25'), true);
  assert.equal(isClinicOpenOnDate('2026-12-25'), false);

  // Standard Open Weekday: Tuesday 2026-10-20
  assert.equal(isClinicOpenOnDate('2026-10-20'), true);
  const slots = generateDaySlots('2026-10-20');
  assert.ok(slots.length > 0);
  assert.equal(slots[0].timeStr, '09:00');
  // With 30 min slots from 09:00 to 17:00 -> 16 slots
  assert.equal(slots.length, 16);
});

test('4. Double-Booking Prevention under Concurrent Requests', async () => {
  const targetDate = '2026-11-10'; // Future open weekday
  const targetTime = '11:00';
  const clinician = 'Dr. Alistair Vance';

  // Two simultaneous booking attempts for the exact same slot and clinician
  const attempt1Promise = createAppointment({
    patientName: 'Charlotte Kensington',
    phoneNumber: '07123 456789',
    email: 'charlotte@example.co.uk',
    reason: 'Invisalign Consultation',
    date: targetDate,
    time: targetTime,
    reminderConsent: true,
    clinicianName: clinician,
  });

  const attempt2Promise = createAppointment({
    patientName: 'Marcus Sterling',
    phoneNumber: '07987 654321',
    email: 'marcus@example.co.uk',
    reason: 'Dental Implant Consultation',
    date: targetDate,
    time: targetTime,
    reminderConsent: true,
    clinicianName: clinician,
  });

  const [result1, result2] = await Promise.all([attempt1Promise, attempt2Promise]);

  // Exactly ONE request must succeed, and the other MUST fail with DOUBLE_BOOKED!
  const successes = [result1, result2].filter(r => r.success);
  const failures = [result1, result2].filter(r => !r.success);

  assert.equal(successes.length, 1, 'Exactly one concurrent booking must succeed');
  assert.equal(failures.length, 1, 'Exactly one concurrent booking must be rejected');
  assert.equal(failures[0].code, 'DOUBLE_BOOKED', 'Failure code must be DOUBLE_BOOKED');
  assert.ok(
    failures[0].error?.includes('booked by another patient'),
    'Friendly error message must explain slot was taken'
  );

  // Subsequent third attempt must also fail
  const attempt3 = await createAppointment({
    patientName: 'Oliver Wright',
    phoneNumber: '07555 123456',
    reason: 'Routine Checkup',
    date: targetDate,
    time: targetTime,
    reminderConsent: true,
    clinicianName: clinician,
  });
  assert.equal(attempt3.success, false);
  assert.equal(attempt3.code, 'DOUBLE_BOOKED');

  // Verify slot is marked unavailable
  const availability = await getSlotAvailability(targetDate, clinician);
  const targetSlot = availability.find(s => s.timeStr === targetTime);
  assert.ok(targetSlot, 'Target slot should exist in day schedule');
  assert.equal(targetSlot.available, false, 'Target slot should be marked unavailable');

  // Cancellation frees the slot again
  const bookedId = successes[0].data.id;
  const cancelRes = await updateAppointmentStatus(bookedId, 'CANCELLED');
  assert.equal(cancelRes.success, true);
  assert.equal(cancelRes.data.status, 'CANCELLED');

  // After cancellation, re-booking the slot now succeeds!
  const rebookAttempt = await createAppointment({
    patientName: 'Oliver Wright',
    phoneNumber: '07555 123456',
    reason: 'Routine Checkup (Re-booked)',
    date: targetDate,
    time: targetTime,
    reminderConsent: true,
    clinicianName: clinician,
  });
  assert.equal(rebookAttempt.success, true, 'Freed slot should be bookable again');
  assert.equal(rebookAttempt.data.status, 'CONFIRMED');
});

test('5. Bank Holiday and Closed Day Booking Rejection', async () => {
  // Booking attempt on Christmas Day (UK Bank Holiday)
  const holidayAttempt = await createAppointment({
    patientName: 'Fiona Gallagher',
    phoneNumber: '07111 222333',
    reason: 'Tooth whitening',
    date: '2026-12-25',
    time: '10:00',
    reminderConsent: true,
  });

  assert.equal(holidayAttempt.success, false);
  assert.equal(holidayAttempt.code, 'CLINIC_CLOSED');
  assert.ok(holidayAttempt.error?.includes('UK Bank Holiday'));
});

test('6. Consent Timestamp Tracking under UK GDPR', async () => {
  const consentAttempt = await createAppointment({
    patientName: 'Amara Khan',
    phoneNumber: '07222 333444',
    reason: 'Hygiene airflow clean',
    date: '2026-11-12',
    time: '14:30',
    reminderConsent: true,
  });

  assert.equal(consentAttempt.success, true);
  assert.equal(consentAttempt.data.reminder_consent, true);
  assert.ok(consentAttempt.data.consent_timestamp, 'Consent timestamp must be recorded');
  assert.ok(new Date(consentAttempt.data.consent_timestamp).getTime() > 0);
});
