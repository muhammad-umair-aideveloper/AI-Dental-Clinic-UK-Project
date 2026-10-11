/**
 * src/app/api/cron/reminders/route.ts
 *
 * Webhook & Cron endpoint for Patient Appointment Reminders.
 * Runs every 5 minutes (via pg_cron or external scheduler).
 *
 * Security:
 *  - Protected by CRON_SECRET (Bearer token, x-cron-secret header, or ?secret= param)
 *  - Alternatively accessible with authenticated admin session
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/admin';
import { sendDuePatientReminders } from '@/lib/reminders/service';

export async function GET(request: NextRequest) {
  return handleReminderTrigger(request);
}

export async function POST(request: NextRequest) {
  return handleReminderTrigger(request);
}

async function handleReminderTrigger(request: NextRequest) {
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const cronSecretHeader = request.headers.get('x-cron-secret');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const expectedSecret = process.env.CRON_SECRET;
  let isAuthorized = false;

  // 1. Verify CRON_SECRET
  if (expectedSecret) {
    if (
      bearerToken === expectedSecret ||
      secretParam === expectedSecret ||
      cronSecretHeader === expectedSecret
    ) {
      isAuthorized = true;
    }
  } else if (process.env.NODE_ENV !== 'production') {
    isAuthorized = true;
  }

  // 2. Verify Admin Session if secret was not provided
  if (!isAuthorized) {
    const session = await verifyAdminSession(request);
    if (session.authenticated) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Missing or invalid CRON_SECRET / admin session.' },
      { status: 401 }
    );
  }

  try {
    const result = await sendDuePatientReminders();
    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal error dispatching appointment reminders',
      },
      { status: 500 }
    );
  }
}
