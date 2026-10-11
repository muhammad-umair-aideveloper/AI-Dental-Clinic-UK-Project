/**
 * src/app/api/cron/daily-report/route.ts
 *
 * Daily Owner Report Webhook & Cron Trigger Endpoint.
 *
 * Security:
 *  - Protected by CRON_SECRET (Bearer token, x-cron-secret header, or ?secret= query param)
 *  - Alternatively accessible by logged-in admin session (for manual dispatch from dashboard)
 *
 * Parameters:
 *  - force=true (Bypasses the "already sent today" idempotency check)
 *  - date=YYYY-MM-DD (Override target date, defaults to today in Europe/London)
 *  - check_hour=true (Verifies Europe/London current hour is 08:00 AM before executing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/admin';
import {
  isLondonHourEight,
  sendDailyOwnerReport,
} from '@/lib/reports/daily-report';

export async function GET(request: NextRequest) {
  return handleReportTrigger(request);
}

export async function POST(request: NextRequest) {
  return handleReportTrigger(request);
}

async function handleReportTrigger(request: NextRequest) {
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const cronSecretHeader = request.headers.get('x-cron-secret');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const expectedSecret = process.env.CRON_SECRET;
  let isAuthorized = false;

  // 1. Check Cron Secret
  if (expectedSecret) {
    if (
      bearerToken === expectedSecret ||
      secretParam === expectedSecret ||
      cronSecretHeader === expectedSecret
    ) {
      isAuthorized = true;
    }
  } else if (process.env.NODE_ENV !== 'production') {
    // In dev without CRON_SECRET configured, allow testing
    isAuthorized = true;
  }

  // 2. Check Admin Session if not authorized by secret
  if (!isAuthorized) {
    const adminSession = await verifyAdminSession(request);
    if (adminSession.authenticated) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or missing CRON_SECRET / admin session.' },
      { status: 401 }
    );
  }

  // Parse options
  const force = url.searchParams.get('force') === 'true';
  const targetDate = url.searchParams.get('date') || undefined;
  const checkHour = url.searchParams.get('check_hour') === 'true';

  // If check_hour is requested (e.g. pg_cron running at both 07:00 and 08:00 UTC)
  if (checkHour && !force) {
    if (!isLondonHourEight()) {
      return NextResponse.json({
        skipped: true,
        reason: 'Current Europe/London hour is not 08:00 AM. Skipping execution.',
      });
    }
  }

  try {
    const result = await sendDailyOwnerReport({
      date: targetDate,
      force,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error dispatching daily report' },
      { status: 500 }
    );
  }
}
