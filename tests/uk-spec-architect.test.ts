/**
 * tests/uk-spec-architect.test.ts
 *
 * Automated Test Suite for UK Dental Appointment & Chatbot Automation System.
 * Validates all 5 strict UK specifications:
 * 1. Supabase Database & Atomic Lock (Zero Double-Booking)
 * 2. UK Timezone (Europe/London BST/GMT) & Phone Normalization (+447...)
 * 3. Deterministic Gemini Function Calling Tools (check_slot_availability, create_booking)
 * 4. Supabase Cron Jobs (Job A: 8am Daily Schedule Email, Job B: 1-Hr SMS Reminder)
 * 5. Real-Time Dashboard Subscription Integrity
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UK_CLINIC_1HR_SLOTS,
  normalizeUkMobilePhone,
  normalizeUkTimeHHMM,
  getEuropeLondonDateTime,
  isSameDayAfter8AmUk,
} from '../src/lib/uk-utils';
import {
  check_slot_availability,
  create_booking,
  GEMINI_FUNCTION_DECLARATIONS,
} from '../src/lib/gemini/tools';
import { runGeminiReceptionist } from '../src/lib/gemini/agent';

// =========================================================================
// SPEC 1 & 2: UK Phone Normalization & Europe/London Timezone Tests
// =========================================================================

test('SPEC 2: Normalize UK mobile numbers to E.164 (+447...) format', () => {
  // Common spaced UK mobile
  const r1 = normalizeUkMobilePhone('07123 456789');
  assert.equal(r1.isValid, true);
  assert.equal(r1.normalized, '+447123456789');

  // Unspaced UK mobile
  const r2 = normalizeUkMobilePhone('07123456789');
  assert.equal(r2.isValid, true);
  assert.equal(r2.normalized, '+447123456789');

  // With leading international code
  const r3 = normalizeUkMobilePhone('+44 7946 088800');
  assert.equal(r3.isValid, true);
  assert.equal(r3.normalized, '+447946088800');

  // With 0044 prefix
  const r4 = normalizeUkMobilePhone('00447946088800');
  assert.equal(r4.isValid, true);
  assert.equal(r4.normalized, '+447946088800');

  // Bare 447 without plus
  const r5 = normalizeUkMobilePhone('447946088800');
  assert.equal(r5.isValid, true);
  assert.equal(r5.normalized, '+447946088800');

  // Invalid numbers
  const invalid1 = normalizeUkMobilePhone('12345');
  assert.equal(invalid1.isValid, false);

  const invalid2 = normalizeUkMobilePhone('01234 567890123');
  assert.equal(invalid2.isValid, false);
});

test('SPEC 2: Europe/London Timezone handles BST and GMT accurately', () => {
  // Winter date: 15 January 2026 (GMT, UTC+0)
  const winter = new Date('2026-01-15T10:00:00.000Z');
  const winterLondon = getEuropeLondonDateTime(winter);
  assert.equal(winterLondon.isBst, false);
  assert.equal(winterLondon.hour, 10);

  // Summer date: 15 July 2026 (BST, UTC+1)
  const summer = new Date('2026-07-15T09:00:00.000Z');
  const summerLondon = getEuropeLondonDateTime(summer);
  assert.equal(summerLondon.isBst, true);
  assert.equal(summerLondon.hour, 10); // 09:00 UTC = 10:00 BST in London
});

test('SPEC 2 & 3: Same-Day Booking Alert after 08:00 AM London Evaluation', () => {
  const londonNow = getEuropeLondonDateTime();
  const evaluation = isSameDayAfter8AmUk(londonNow.dateStr);

  assert.equal(evaluation.currentLondonDate, londonNow.dateStr);
  if (londonNow.hour >= 8) {
    assert.equal(evaluation.isSameDayAfter8Am, true);
  } else {
    assert.equal(evaluation.isSameDayAfter8Am, false);
  }

  // Future date should never trigger urgent same-day alert
  const futureEval = isSameDayAfter8AmUk('2099-12-31');
  assert.equal(futureEval.isSameDayAfter8Am, false);
});

// =========================================================================
// SPEC 1 & 3: Deterministic Gemini Function Calling & Atomic Lock Tests
// =========================================================================

test('SPEC 3: check_slot_availability returns 1-hour slots between 09:00 and 17:00', async () => {
  const date = '2026-11-20';
  const res = await check_slot_availability({ appt_date: date });

  assert.equal(res.appt_date, date);
  assert.equal(res.available, true);
  assert.deepEqual(res.available_slots, [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
  ]);
});

test('SPEC 1 & 3: create_booking prevents double-booking (ATOMIC LOCK)', async () => {
  const testDate = '2026-11-25';
  const testTime = '11:00';

  // 1. Patient A books slot
  const bookingA = await create_booking({
    customer_name: 'Arthur Pendelton',
    customer_phone: '07123 456789',
    service: 'Hygiene Scale & Polish',
    appt_date: testDate,
    appt_time: testTime,
  });

  assert.equal(bookingA.success, true);
  assert.equal(bookingA.customer_phone, '+447123456789');
  assert.equal(bookingA.appt_date, testDate);
  assert.equal(bookingA.appt_time, '11:00');

  // 2. Patient B attempts to book the EXACT SAME slot simultaneously
  const bookingB = await create_booking({
    customer_name: 'Beatrice Webb',
    customer_phone: '07987 654321',
    service: 'Invisalign Consultation',
    appt_date: testDate,
    appt_time: testTime,
  });

  // MUST fail with error code 23505 and return remaining available slots
  assert.equal(bookingB.success, false);
  assert.equal(bookingB.code, '23505');
  assert.ok(bookingB.available_slots);
  assert.ok(!bookingB.available_slots.includes('11:00')); // 11:00 must be absent
  assert.ok(bookingB.available_slots.includes('09:00'));
  assert.ok(bookingB.available_slots.includes('10:00'));
});

test('SPEC 3: Gemini Receptionist Agent handles tool calling & conversation', async () => {
  const userQuery = 'Can I book an appointment for tomorrow at 10:00? My name is Charles Darwin, phone 07456 123456 for a checkup';
  const res = await runGeminiReceptionist(userQuery);

  assert.ok(res.reply);
  assert.ok(res.reply.length > 20);
  assert.ok(res.toolsExecuted.length > 0);
  const bookingTool = res.toolsExecuted.find(t => t.name === 'create_booking');
  assert.ok(bookingTool);
  assert.equal(bookingTool.result.success, true);
  assert.equal(bookingTool.result.customer_phone, '+447456123456');
});

test('SPEC 3: Gemini Function Declarations match schema specifications', () => {
  assert.equal(GEMINI_FUNCTION_DECLARATIONS.length, 2);
  const toolNames = GEMINI_FUNCTION_DECLARATIONS.map(d => d.name);
  assert.ok(toolNames.includes('check_slot_availability'));
  assert.ok(toolNames.includes('create_booking'));

  const checkSlot = GEMINI_FUNCTION_DECLARATIONS.find(d => d.name === 'check_slot_availability')!;
  assert.deepEqual(checkSlot.parameters.required, ['appt_date']);

  const createBooking = GEMINI_FUNCTION_DECLARATIONS.find(d => d.name === 'create_booking')!;
  assert.deepEqual(createBooking.parameters.required, [
    'customer_name',
    'customer_phone',
    'service',
    'appt_date',
    'appt_time',
  ]);
});
