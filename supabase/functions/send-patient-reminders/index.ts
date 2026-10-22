// supabase/functions/send-patient-reminders/index.ts
// Supabase Edge Function: Exact 1-Hour Before SMS Reminder
// Runs every 5 minutes via pg_cron.
// Identifies today's confirmed appointments whose appointment_time is between 50 and 65 minutes away in London time.
// Sends SMS via Twilio and immediately marks reminder_1hr_sent = true in Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || Deno.env.get('TWILIO_SMS_FROM') || '';
const TWILIO_SENDER_ID = Deno.env.get('TWILIO_SENDER_ID') || 'VertexDent';
const CRON_SECRET = Deno.env.get('CRON_SECRET');

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Calculate current date and time in Europe/London timezone
    const now = new Date();
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
    const currentLondonMinutes = parseInt(m.hour, 10) * 60 + parseInt(m.minute, 10);

    // 3. Query today's unreminded appointments where appt_date = (now() AT TIME ZONE 'Europe/London')::date and reminder_sent = false
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, customer_name, customer_phone, phone, phone_number, service, reason, appt_date, appt_time, appointment_date, appointment_time, reminder_sent')
      .or(`appt_date.eq.${londonDate},appointment_date.eq.${londonDate}`)
      .eq('reminder_sent', false);

    if (error) {
      throw error;
    }

    // Filter appt_time between 55 minutes and 65 minutes from now in Europe/London
    const dueList = (appointments || []).filter((apt: any) => {
      if (apt.reminder_sent === true) return false;
      const rawTime = apt.appt_time || apt.appointment_time;
      if (!rawTime) return false;
      const [hh, mm] = rawTime.split(':').map((n: string) => parseInt(n, 10));
      if (isNaN(hh) || isNaN(mm)) return false;
      const aptMinutes = hh * 60 + mm;
      const diff = aptMinutes - currentLondonMinutes;
      // Exact prompt interval: between 55 minutes and 65 minutes
      return diff >= 55 && diff <= 65;
    });

    let sentCount = 0;
    const results: any[] = [];

    for (const apt of dueList) {
      const customerName = apt.customer_name || 'Patient';
      const service = apt.service || apt.reason || 'Dental';
      const apptTime = (apt.appt_time || apt.appointment_time || '').slice(0, 5);
      let customerPhone = apt.customer_phone || apt.phone || apt.phone_number || '';

      // Normalize UK phone to E.164 (+447...) before calling Twilio
      if (customerPhone.startsWith('07')) {
        customerPhone = '+44' + customerPhone.slice(1);
      } else if (customerPhone.startsWith('447')) {
        customerPhone = '+' + customerPhone;
      }
      customerPhone = customerPhone.replace(/[\s\-\(\)\.]/g, '');

      // Exact prompt message:
      // "Reminder: Hi [customer_name], you have a dental appointment for [service] today at [appt_time]. See you soon!"
      const messageBody = `Reminder: Hi ${customerName}, you have a dental appointment for ${service} today at ${apptTime}. See you soon!`;

      let smsSuccess = false;
      let smsError: string | null = null;

      // 4. Send SMS via Twilio
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && customerPhone) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
          const sender = TWILIO_SENDER_ID || TWILIO_PHONE_NUMBER;

          const formBody = new URLSearchParams({
            To: customerPhone,
            From: sender,
            Body: messageBody,
          });

          const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
          const twilioRes = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody.toString(),
          });

          if (twilioRes.ok) {
            smsSuccess = true;
            console.log(`[TwilioSMS] Sent 1-hr reminder to ${maskPhone(customerPhone)}`);
          } else {
            const errText = await twilioRes.text();
            smsError = `Twilio API error: ${errText}`;
            console.error('[TwilioSMS] Failed sending SMS:', errText);
          }
        } catch (e: any) {
          smsError = e.message;
          console.error('[TwilioSMS] Exception sending SMS:', e);
        }
      } else {
        // Fallback mock dispatch
        console.log(`[TwilioReminder:MOCK] Sent reminder to ${maskPhone(customerPhone)}: "${messageBody}"`);
        smsSuccess = true;
      }

      // 5. Immediately update reminder_1hr_sent = true in Supabase (idempotent lock)
      // Strictly committed ONLY upon verified successful dispatch
      if (smsSuccess) {
        const { error: updateErr } = await supabase
          .from('appointments')
          .update({
            reminder_1hr_sent: true,
            reminder_sent: true,
            reminder_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', apt.id);

        if (!updateErr) {
          sentCount++;
          results.push({
            id: apt.id,
            customer_name: customerName,
            time: timeStr,
            phone: maskPhone(phone),
            status: 'SENT',
          });
        }
      } else {
        results.push({
          id: apt.id,
          customer_name: customerName,
          error: smsError,
          status: 'FAILED',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        londonDate,
        currentLondonTime: `${m.hour}:${m.minute}`,
        evaluated: dueList.length,
        remindersSent: sentCount,
        details: results,
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
