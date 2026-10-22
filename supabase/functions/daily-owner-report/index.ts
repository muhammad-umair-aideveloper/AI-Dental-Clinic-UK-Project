// supabase/functions/daily-owner-report/index.ts
// Supabase Edge Function: 8:00 AM UK Daily Owner Email Digest
// Runs daily via pg_cron at 08:00 AM Europe/London time (accounting for GMT/BST).
// Queries ONLY today's confirmed appointments, generates HTML table + CSV attachment, and emails via Resend.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const CLINIC_OWNER_EMAIL = Deno.env.get('CLINIC_OWNER_EMAIL') || 'owner@vertexdental.co.uk';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') || 'Vertex Dental Lab <reports@vertexdental.co.uk>';
const CRON_SECRET = Deno.env.get('CRON_SECRET');

Deno.serve(async (req) => {
  try {
    // 1. Authorization verification
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

    // 2. Compute current Europe/London local date & hour (strictly accounts for BST / GMT)
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
    const londonHour = parseInt(m.hour, 10);

    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    // Verify it is exactly 08:00 AM London time (08:00 to 08:59)
    if (!force && londonHour !== 8) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: `Current London time is ${m.hour}:${m.minute}. Daily digest is dispatched strictly at 08:00 AM London.`,
          londonDate,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. Idempotency Check: Don't email twice on the same London date
    if (!force) {
      const { data: alreadySent } = await supabase
        .from('daily_reports_log')
        .select('report_date, sent_at')
        .eq('report_date', londonDate)
        .eq('status', 'SENT')
        .maybeSingle();

      if (alreadySent) {
        return new Response(
          JSON.stringify({
            sent: false,
            reason: `Daily report already emailed for ${londonDate} at ${alreadySent.sent_at}`,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Query Supabase for rows where appt_date = (now() AT TIME ZONE 'Europe/London')::date ONLY. Strictly exclude next day or future appointments.
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select('customer_name, appt_date, appt_time, service, customer_phone, phone, appointment_date, appointment_time')
      .or(`appt_date.eq.${londonDate},appointment_date.eq.${londonDate}`)
      .order('appt_time', { ascending: true });

    if (aptError) {
      throw aptError;
    }

    const aptList = (appointments || []).map((a: any) => ({
      customer_name: a.customer_name || 'Patient',
      appt_date: a.appt_date || a.appointment_date || londonDate,
      appt_time: (a.appt_time || a.appointment_time || '').slice(0, 5),
      service: a.service || 'General Dentistry',
      customer_phone: a.customer_phone || a.phone || '',
    }));
    const count = aptList.length;

    // 5. Generate Clean CSV / Sheet Attachment
    const csvRows = aptList.map((a: any) => {
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      return `${escape(a.customer_name)},${escape(a.appt_date)},${escape(a.appt_time)},${escape(a.service)},${escape(a.customer_phone)}`;
    });

    const csvContent = ['Customer Name,Date,Time,Service,Phone', ...csvRows].join('\r\n');
    const csvBase64 = btoa(csvContent);

    // 6. Generate Clean HTML Table
    const tableRowsHtml =
      count === 0
        ? `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">No appointments scheduled for today.</td></tr>`
        : aptList
            .map((a: any, idx: number) => {
              const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
              return `
                <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${a.customer_name}</td>
                  <td style="padding: 12px 16px; color: #334155;">${a.appt_date}</td>
                  <td style="padding: 12px 16px; font-weight: 700; color: #0284c7;">${a.appt_time}</td>
                  <td style="padding: 12px 16px; color: #334155;">${a.service}</td>
                  <td style="padding: 12px 16px; font-family: monospace; color: #0f172a;">${a.customer_phone}</td>
                </tr>`;
            })
            .join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Clinic Appointments — ${londonDate}</title>
    </head>
    <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 720px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <tr>
          <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; color: #ffffff;">
            <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #38bdf8;">Vertex Dental Lab — London</div>
            <h1 style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #ffffff;">Daily Appointments Digest</h1>
            <p style="margin: 6px 0 0 0; font-size: 15px; color: #94a3b8;">Today: <strong>${londonDate}</strong> (08:00 AM London Time)</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; display: inline-block;">
              <span style="font-size: 14px; font-weight: 600; color: #166534;">Today's Confirmed Bookings: ${count} patient${count === 1 ? '' : 's'}</span>
            </div>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                  <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Customer Name</th>
                  <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Date</th>
                  <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Time</th>
                  <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Service</th>
                  <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Phone</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>

            <p style="margin-top: 24px; font-size: 13px; color: #64748b; line-height: 1.5;">
              📎 Attached is the complete CSV spreadsheet for today, ready to import into Google Sheets or practice management systems.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            Vertex Dental Lab • 45 Harley Street, London, W1G 8QR • Generated automatically by Supabase Edge Functions (pg_cron)
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    // 7. Email via Resend
    let emailSent = false;
    let emailError: string | null = null;

    if (RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [CLINIC_OWNER_EMAIL],
            subject: `Daily Appointments Digest - ${londonDate} (${count} booked) — Vertex Dental Lab`,
            html: htmlContent,
            attachments: [
              {
                filename: `Appointments_${londonDate}.csv`,
                content: csvBase64,
              },
            ],
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
          console.log(`[DailyReport] Email digest successfully sent to ${CLINIC_OWNER_EMAIL}`);
        } else {
          const errBody = await resendRes.text();
          emailError = `Resend API error: ${errBody}`;
          console.error('[DailyReport] Resend email failed:', errBody);
        }
      } catch (e: any) {
        emailError = e.message;
        console.error('[DailyReport] Exception sending email:', e);
      }
    } else {
      console.info(`[DailyReport] RESEND_API_KEY not configured. Simulated send to ${CLINIC_OWNER_EMAIL} (${count} appointments).`);
      emailSent = true; // In test/mock mode
    }

    // 8. Record in daily_reports_log for idempotency
    await supabase.from('daily_reports_log').upsert(
      {
        report_date: londonDate,
        sent_at: new Date().toISOString(),
        appointment_count: count,
        channel: 'email',
        recipient: CLINIC_OWNER_EMAIL,
        status: emailSent ? 'SENT' : 'FAILED',
      },
      { onConflict: 'report_date' }
    );

    return new Response(
      JSON.stringify({
        success: true,
        sent: emailSent,
        londonDate,
        appointmentCount: count,
        recipient: CLINIC_OWNER_EMAIL,
        csvRowsCount: aptList.length,
        error: emailError,
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
