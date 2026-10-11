// supabase/functions/daily-owner-report/index.ts
// Supabase Edge Function: Daily Owner Report at 08:00 AM (Europe/London)
// Runs daily via pg_cron. Automatically accounts for BST/GMT daylight saving transitions.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const CLINIC_OWNER_PHONE = Deno.env.get('CLINIC_OWNER_PHONE') || '+447946088800';
const CLINIC_OWNER_EMAIL = Deno.env.get('CLINIC_OWNER_EMAIL') || 'owner@vertexdental.co.uk';
const APP_URL = Deno.env.get('APP_URL') || Deno.env.get('NEXT_PUBLIC_SITE_URL');
const CRON_SECRET = Deno.env.get('CRON_SECRET');

function formatPatientName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Patient';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

Deno.serve(async (req) => {
  try {
    // 1. Verify authorization if CRON_SECRET is set
    const authHeader = req.headers.get('Authorization');
    if (CRON_SECRET) {
      const token = authHeader?.replace('Bearer ', '');
      if (token !== CRON_SECRET && token !== SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const now = new Date();

    // 2. Compute current Europe/London local date & hour
    const dtfLondon = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = dtfLondon.formatToParts(now);
    const m: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== 'literal') m[p.type] = p.value;
    }

    const londonDate = `${m.year}-${m.month}-${m.day}`;
    const londonHour = parseInt(m.hour, 10);

    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    // 3. Daylight Savings Safeguard:
    // If triggered by pg_cron at both 07:00 UTC and 08:00 UTC, only execute during London hour 8 (08:00 - 08:59).
    if (!force && londonHour !== 8) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: `Current London time is ${m.hour}:${m.minute}. Report executes only at 08:00 AM London.`,
          londonDate,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. If APP_URL is provided, forward to the Next.js app endpoint for unified messaging
    if (APP_URL) {
      const endpoint = `${APP_URL}/api/cron/daily-report?date=${londonDate}${force ? '&force=true' : ''}`;
      const appRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {}),
        },
      });
      const data = await appRes.json();
      return new Response(JSON.stringify(data), {
        status: appRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Fallback self-contained execution using Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check idempotency in daily_reports_log
    if (!force) {
      const { data: existing } = await supabase
        .from('daily_reports_log')
        .select('report_date, sent_at')
        .eq('report_date', londonDate)
        .eq('status', 'SENT')
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            sent: false,
            reason: `Report already sent for ${londonDate} at ${existing.sent_at}`,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch appointments for today
    const startIso = new Date(`${londonDate}T00:00:00Z`).toISOString();
    const endIso = new Date(`${londonDate}T23:59:59Z`).toISOString();

    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select('*')
      .neq('status', 'CANCELLED')
      .gte('slot_time', startIso)
      .lte('slot_time', endIso)
      .order('slot_time', { ascending: true });

    if (aptError) {
      throw aptError;
    }

    const count = appointments?.length || 0;
    let appointmentLines = 'No appointments scheduled for today.';
    if (count > 0 && appointments) {
      appointmentLines = appointments
        .map((apt: any, i: number) => {
          const ptName = formatPatientName(apt.patient_name);
          const t = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/London',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }).format(new Date(apt.slot_time));
          return `${i + 1}. ${ptName} - ${t} - ${apt.reason}`;
        })
        .join('\n');
    }

    const reportContent = [
      `📅 Vertex Dental Lab - Daily Schedule`,
      `Date: ${londonDate}`,
      `Total Appointments: ${count}`,
      '',
      appointmentLines,
    ].join('\n');

    console.log(`[DailyReport] Dispatched to owner (${CLINIC_OWNER_PHONE}):\n${reportContent}`);

    // Insert log into daily_reports_log
    await supabase.from('daily_reports_log').upsert(
      {
        report_date: londonDate,
        sent_at: new Date().toISOString(),
        appointment_count: count,
        channel: 'sms',
        recipient: CLINIC_OWNER_PHONE,
        content: reportContent,
        status: 'SENT',
      },
      { onConflict: 'report_date' }
    );

    return new Response(
      JSON.stringify({
        success: true,
        sent: true,
        londonDate,
        appointmentCount: count,
        content: reportContent,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Error executing daily owner report' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
