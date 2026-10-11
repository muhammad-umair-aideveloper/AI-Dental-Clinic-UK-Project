// supabase/functions/send-patient-reminders/index.ts
// Supabase Edge Function: Patient Appointment Reminders (~1 Hour Before)
// Triggered every 5 minutes by pg_cron.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const APP_URL = Deno.env.get('APP_URL') || Deno.env.get('NEXT_PUBLIC_SITE_URL');
const CRON_SECRET = Deno.env.get('CRON_SECRET');
const CLINIC_NAME = 'Vertex Dental Lab';
const CLINIC_PHONE = Deno.env.get('CLINIC_OWNER_PHONE') || '+447946088800';

function maskPhone(p: string): string {
  if (p.length <= 6) return '******';
  return `${p.slice(0, 5)}***${p.slice(-3)}`;
}

Deno.serve(async (req) => {
  try {
    // 1. Authorization check
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

    // 2. Forward to Next.js API if APP_URL is configured
    if (APP_URL) {
      const endpoint = `${APP_URL}/api/cron/reminders`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {}),
        },
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Fallback direct execution via Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000); // 65-min lookahead window

    const { data: dueAppointments, error } = await supabase
      .from('appointments')
      .select('*')
      .neq('status', 'CANCELLED')
      .eq('reminder_consent', true)
      .eq('reminder_sent', false)
      .gte('slot_time', now.toISOString())
      .lte('slot_time', windowEnd.toISOString())
      .order('slot_time', { ascending: true });

    if (error) {
      throw error;
    }

    let sent = 0;
    const count = dueAppointments?.length || 0;

    for (const apt of dueAppointments || []) {
      const masked = maskPhone(apt.phone_number);
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(apt.slot_time));

      const firstName = apt.patient_name.split(' ')[0] || 'there';
      const body = `Hi ${firstName}, reminder of your appointment at ${CLINIC_NAME} today at ${timeStr} for ${apt.reason}. Please arrive 5 mins early. Need to change? Call ${CLINIC_PHONE}.`;

      console.log(`[PatientReminder] Sending to ${masked}: ${body}`);

      // Atomically mark reminder_sent = true
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          reminder_sent: true,
          reminder_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', apt.id)
        .eq('reminder_sent', false);

      if (!updateError) {
        sent++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: count,
        sent,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Error processing patient reminders' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
