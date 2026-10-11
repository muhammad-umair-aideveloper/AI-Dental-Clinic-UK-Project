// =========================================================================
// tests/phase2-admin-rls.test.ts
// Phase 2 Automated Test Suite: Admin Dashboard, Row Level Security & PII Protection
// =========================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET, PATCH, POST } from '@/app/api/appointments/route';
import { createAppointment, updateAppointmentStatus } from '@/lib/appointments/service';

test('1. Public Access Control: Unauthenticated Requests Cannot View Appointment PII', async () => {
  // Simulate an unauthenticated public user requesting appointments list
  const publicReq = new NextRequest('http://localhost:3000/api/appointments');
  const res = await GET(publicReq);

  // Must return 401 Unauthorized
  assert.equal(res.status, 401, 'Public user should not be able to read full appointment list');
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.error.includes('Unauthorized'));
});

test('2. Public Access Control: Public Can Check Slot Availability Without PII', async () => {
  // Seed a test appointment
  const testDate = '2026-11-18';
  await createAppointment({
    patientName: 'Secret VIP Patient',
    phoneNumber: '07123 999888',
    email: 'vip@private.co.uk',
    reason: 'Emergency Crown Repair',
    date: testDate,
    time: '10:00',
    reminderConsent: true,
  });

  // Public request for slot availability
  const publicAvailReq = new NextRequest(
    `http://localhost:3000/api/appointments?checkAvailability=true&date=${testDate}`
  );
  const res = await GET(publicAvailReq);

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.availability));

  // Verify ZERO PII in payload
  const payloadStr = JSON.stringify(data);
  assert.equal(payloadStr.includes('Secret VIP Patient'), false, 'Public payload must not contain patient name');
  assert.equal(payloadStr.includes('vip@private.co.uk'), false, 'Public payload must not contain email');
  assert.equal(payloadStr.includes('07123 999888'), false, 'Public payload must not contain phone');
  assert.equal(payloadStr.includes('Emergency Crown Repair'), false, 'Public payload must not contain clinical reason');

  // Verify the 10:00 slot is marked as booked/unavailable
  const bookedSlot = data.availability.find((s: any) => s.timeStr === '10:00');
  assert.ok(bookedSlot);
  assert.equal(bookedSlot.available, false);
});

test('3. Admin Authentication: Authenticated Admin Can Query All Appointments', async () => {
  // Request with valid admin session token
  const adminReq = new NextRequest('http://localhost:3000/api/appointments', {
    headers: {
      Authorization: 'Bearer vertex_admin_session_token_secure_2026',
    },
  });

  const res = await GET(adminReq);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.appointments));
  assert.ok(data.appointments.length > 0);

  // Admin sees full appointment record
  const sample = data.appointments[0];
  assert.ok(sample.id);
  assert.ok(sample.patient_name);
  assert.ok(sample.phone_number);
  assert.ok(sample.reason);
  assert.ok(sample.slot_time);
});

test('4. Admin Actions: Mark Completed and Cancel (Slot Reclaimed)', async () => {
  const targetDate = '2026-11-20';
  const targetTime = '14:00';

  // 1. Create appointment
  const createRes = await createAppointment({
    patientName: 'Marcus Bell',
    phoneNumber: '07444 555666',
    reason: 'Laser Teeth Whitening',
    date: targetDate,
    time: targetTime,
    reminderConsent: true,
  });
  assert.equal(createRes.success, true);
  const aptId = createRes.data!.id;

  // 2. Mark as Completed (Protected admin action)
  const completeReq = new NextRequest('http://localhost:3000/api/appointments', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer vertex_admin_session_token_secure_2026',
    },
    body: JSON.stringify({ id: aptId, status: 'COMPLETED' }),
  });
  const patchRes1 = await PATCH(completeReq);
  assert.equal(patchRes1.status, 200);
  const patchData1 = await patchRes1.json();
  assert.equal(patchData1.appointment.status, 'COMPLETED');

  // 3. Mark as Cancelled (Frees the slot)
  const cancelReq = new NextRequest('http://localhost:3000/api/appointments', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer vertex_admin_session_token_secure_2026',
    },
    body: JSON.stringify({ id: aptId, status: 'CANCELLED' }),
  });
  const patchRes2 = await PATCH(cancelReq);
  assert.equal(patchRes2.status, 200);
  const patchData2 = await patchRes2.json();
  assert.equal(patchData2.appointment.status, 'CANCELLED');
  assert.equal(patchData2.slotReclaimed, true);

  // 4. Verify slot is now available again for public booking
  const availReq = new NextRequest(
    `http://localhost:3000/api/appointments?checkAvailability=true&date=${targetDate}`
  );
  const availRes = await GET(availReq);
  const availData = await availRes.json();
  const freedSlot = availData.availability.find((s: any) => s.timeStr === targetTime);
  assert.ok(freedSlot);
  assert.equal(freedSlot.available, true, 'Cancelled slot must become available again');
});
