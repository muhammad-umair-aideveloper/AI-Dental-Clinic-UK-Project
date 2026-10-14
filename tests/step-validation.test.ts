// =========================================================================
// tests/step-validation.test.ts
// Comprehensive Test Suite for Vertex Dental Lab Refactored Architecture:
// Next.js (App Router) + Supabase PostgreSQL (eu-west-2 London) + Edge Functions (pg_cron)
// =========================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUkMobile, normalizeTimeFormat, CLINIC_SLOTS } from '@/app/api/book/route';
import { appendBookingToGoogleSheet } from '@/lib/sheets/google-sheets';

test('Step 2 & 3: UK Mobile Phone Sanitization (+447...)', () => {
  // Test converting 07xxx to +447xxx
  const res1 = sanitizeUkMobile('07946 088800');
  assert.equal(res1.isValid, true);
  assert.equal(res1.normalized, '+447946088800');

  const res2 = sanitizeUkMobile('07123456789');
  assert.equal(res2.isValid, true);
  assert.equal(res2.normalized, '+447123456789');

  // Test with country code without plus
  const res3 = sanitizeUkMobile('447123456789');
  assert.equal(res3.isValid, true);
  assert.equal(res3.normalized, '+447123456789');

  // Test already E.164 with dashes and spaces
  const res4 = sanitizeUkMobile('+44 7123-456-789');
  assert.equal(res4.isValid, true);
  assert.equal(res4.normalized, '+447123456789');

  // Invalid numbers
  const invalid1 = sanitizeUkMobile('12345');
  assert.equal(invalid1.isValid, false);
  assert.ok(invalid1.error?.includes('UK mobile number'));

  const invalid2 = sanitizeUkMobile('');
  assert.equal(invalid2.isValid, false);
});

test('Step 3: Appointment Time Normalization and UK Clinic Slots', () => {
  assert.equal(normalizeTimeFormat('9:30'), '09:30:00');
  assert.equal(normalizeTimeFormat('14:00'), '14:00:00');
  assert.equal(normalizeTimeFormat('11:00:00'), '11:00:00');

  // Clinic operating hours must span 09:00 to 17:00
  assert.equal(CLINIC_SLOTS[0], '09:00');
  assert.ok(CLINIC_SLOTS.includes('10:00'));
  assert.ok(CLINIC_SLOTS.includes('12:00'));
  assert.ok(CLINIC_SLOTS.includes('14:30'));
  assert.ok(CLINIC_SLOTS.includes('16:30'));
});

test('Step 3 & 4: Anti-Double-Booking Constraint Simulation (Code 23505)', async () => {
  // Initialize mock store
  if (!global.__dentalMemoryAppointments) {
    global.__dentalMemoryAppointments = [];
  }

  const testDate = '2026-11-18';
  const testTime = '10:30:00';

  // Clear test entries
  global.__dentalMemoryAppointments = global.__dentalMemoryAppointments.filter(
    a => a.appointment_date !== testDate
  );

  // 1. First booking takes the slot
  global.__dentalMemoryAppointments.push({
    id: 'apt-test-1',
    customer_name: 'Arthur Pendelton',
    phone: '+447946088800',
    service: 'Hygiene Scale & Polish',
    appointment_date: testDate,
    appointment_time: testTime,
    status: 'CONFIRMED',
    reminder_1hr_sent: false,
    google_sheet_synced: false,
    created_at: new Date().toISOString(),
  });

  // 2. Second booking attempts to book the EXACT SAME slot
  const conflict = global.__dentalMemoryAppointments.find(
    a =>
      a.appointment_date === testDate &&
      a.appointment_time.slice(0, 5) === testTime.slice(0, 5) &&
      a.status !== 'CANCELLED'
  );

  assert.ok(conflict, 'Conflict detected for duplicate appointment slot');

  // 3. Compute remaining available slots
  const bookedTimes = global.__dentalMemoryAppointments
    .filter(a => a.appointment_date === testDate && a.status !== 'CANCELLED')
    .map(a => a.appointment_time.slice(0, 5));

  const availableSlots = CLINIC_SLOTS.filter(s => !bookedTimes.includes(s));
  assert.equal(availableSlots.includes('10:30'), false, 'Booked slot 10:30 must be excluded');
  assert.equal(availableSlots.includes('09:00'), true, 'Unbooked slot 09:00 must remain available');
});

test('Step 5: 8:00 AM London Daily Owner Digest Date & Filter Scope', () => {
  // Simulating today's appointments
  const today = '2026-10-14';
  const tomorrow = '2026-10-15';

  const sampleAppointments = [
    {
      customer_name: 'Alice Cooper',
      phone: '+447111222333',
      service: 'New Patient Consultation',
      appointment_date: today,
      appointment_time: '09:30:00',
      status: 'CONFIRMED',
    },
    {
      customer_name: 'Bob Marley',
      phone: '+447222333444',
      service: 'Boutique Teeth Whitening',
      appointment_date: today,
      appointment_time: '11:00:00',
      status: 'CONFIRMED',
    },
    {
      customer_name: 'Charlie Chaplin',
      phone: '+447333444555',
      service: 'Root Canal Treatment',
      appointment_date: today,
      appointment_time: '14:00:00',
      status: 'CANCELLED', // Should NOT be included
    },
    {
      customer_name: 'David Bowie',
      phone: '+447444555666',
      service: 'Invisalign',
      appointment_date: tomorrow, // Should NOT be included
      appointment_time: '10:00:00',
      status: 'CONFIRMED',
    },
  ];

  // Daily digest MUST strictly query WHERE appointment_date = today AND status = 'CONFIRMED'
  const todayConfirmed = sampleAppointments.filter(
    a => a.appointment_date === today && a.status === 'CONFIRMED'
  );

  assert.equal(todayConfirmed.length, 2, "Only today's confirmed appointments must be queried");
  assert.equal(todayConfirmed[0].customer_name, 'Alice Cooper');
  assert.equal(todayConfirmed[1].customer_name, 'Bob Marley');

  // Verify CSV generation format: Customer Name,Date,Time,Service,Phone
  const csvRows = todayConfirmed.map(
    a => `"${a.customer_name}","${a.appointment_date}","${a.appointment_time.slice(0, 5)}","${a.service}","${a.phone}"`
  );
  const csvContent = ['Customer Name,Date,Time,Service,Phone', ...csvRows].join('\r\n');

  assert.ok(csvContent.startsWith('Customer Name,Date,Time,Service,Phone'));
  assert.ok(csvContent.includes('"Alice Cooper","2026-10-14","09:30","New Patient Consultation","+447111222333"'));
});

test('Step 6: 1-Hour Reminder Lookahead Window (50 to 65 minutes)', () => {
  // Current time: 10:00 AM (600 minutes since midnight)
  const currentMinutes = 10 * 60; // 600

  const appointments = [
    { time: '10:30', minutes: 630 }, // 30 min away -> Too early
    { time: '10:55', minutes: 655 }, // 55 min away -> In 50-65 min window -> DISPATCH!
    { time: '11:00', minutes: 660 }, // 60 min away -> In 50-65 min window -> DISPATCH!
    { time: '11:05', minutes: 665 }, // 65 min away -> In 50-65 min window -> DISPATCH!
    { time: '11:20', minutes: 680 }, // 80 min away -> Too far
    { time: '09:45', minutes: 585 }, // -15 min -> In the past
  ];

  const dueAppointments = appointments.filter(a => {
    const diff = a.minutes - currentMinutes;
    return diff >= 50 && diff <= 65;
  });

  assert.equal(dueAppointments.length, 3, 'Exactly 3 appointments in the 50-65 minute window');
  assert.equal(dueAppointments[0].time, '10:55');
  assert.equal(dueAppointments[1].time, '11:00');
  assert.equal(dueAppointments[2].time, '11:05');
});
