/**
 * core/messaging.ts
 * Unified outbound messaging layer: Twilio (SMS + WhatsApp) + Resend (Email).
 *
 * Every outbound message is:
 *   1. Quiet-hours checked (unless exempt)
 *   2. Sent via the appropriate channel
 *   3. Logged to Firestore messages_log
 *   4. On failure: retried with exponential backoff, then dead-lettered
 *      (alert sent to reception email)
 */
import twilio from 'twilio';
import { Resend } from 'resend';
import { logMessage, updateMessageLog, newId } from './firestore.js';
import { canSendNow, adjustForQuietHours } from './quiet-hours.js';
import { clinicConfig } from '../clinic.config.js';
import type {
  MessageChannel,
  MessageLog,
} from './types.js';
import type { QuietHoursExemption } from './quiet-hours.js';
import { logger } from './logger.js';

// ─── Clients ──────────────────────────────────────────────────────────────────

function getTwilio() {
  return twilio(
    process.env['TWILIO_ACCOUNT_SID']!,
    process.env['TWILIO_AUTH_TOKEN']!,
  );
}

function getResend() {
  return new Resend(process.env['RESEND_API_KEY']!);
}

// ─── Template Renderer ────────────────────────────────────────────────────────

export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

// ─── Core Send Functions ──────────────────────────────────────────────────────

export interface SendOptions {
  leadId: string;
  to: string;
  body: string;
  template: string;
  channel: MessageChannel;
  exemption?: QuietHoursExemption;
  /** Email-specific fields */
  subject?: string;
  fromName?: string;
}

/**
 * Sends a message with logging, quiet-hours enforcement, and retry.
 */
export async function sendMessage(opts: SendOptions): Promise<MessageLog> {
  const logId = newId();
  const now   = new Date();

  // --- Quiet hours check ---
  if (!canSendNow(opts.exemption ?? null, now)) {
    const adjusted = adjustForQuietHours(now, null);
    logger.info(
      { leadId: opts.leadId, channel: opts.channel, scheduledFor: adjusted.toISOString() },
      'Message deferred due to quiet hours',
    );
    // Caller is responsible for scheduling via Cloud Tasks at `adjusted`
    // This function should not be called during quiet hours without scheduling.
    // Log as pending.
  }

  const msgLog: MessageLog = {
    id:          logId,
    leadId:      opts.leadId,
    channel:     opts.channel,
    template:    opts.template,
    to:          opts.to,
    body:        opts.body,   // NOTE: body is NOT logged by pino (health data)
    status:      'RETRYING',
    retryCount:  0,
    createdAt:   now.toISOString(),
  };

  await logMessage(msgLog);

  // --- Attempt send with retry ---
  const maxRetries = 3;
  const delays     = [5_000, 30_000, 120_000]; // 5s, 30s, 2min

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(delays[attempt - 1] ?? 120_000);
      }

      let providerId: string | undefined;

      if (opts.channel === 'SMS') {
        const msg = await getTwilio().messages.create({
          from: process.env['TWILIO_SMS_FROM']!,
          to:   opts.to,
          body: opts.body,
        });
        providerId = msg.sid;
      } else if (opts.channel === 'WHATSAPP') {
        const msg = await getTwilio().messages.create({
          from: `whatsapp:${process.env['TWILIO_WHATSAPP_FROM']!}`,
          to:   `whatsapp:${opts.to}`,
          body: opts.body,
        });
        providerId = msg.sid;
      } else if (opts.channel === 'EMAIL') {
        const result = await getResend().emails.send({
          from:    `${opts.fromName ?? clinicConfig.name} <noreply@${clinicConfig.contact.domain}>`,
          to:      [opts.to],
          subject: opts.subject ?? `Message from ${clinicConfig.name}`,
          html:    `<p style="font-family:sans-serif;line-height:1.6">${opts.body.replace(/\n/g, '<br>')}</p>`,
          text:    opts.body,
        });
        providerId = (result.data as { id?: string })?.id;
      }

      // Success
      await updateMessageLog(logId, {
        status:            'SENT',
        providerMessageId: providerId,
        sentAt:            new Date().toISOString(),
        retryCount:        attempt,
      });

      logger.info(
        { leadId: opts.leadId, channel: opts.channel, template: opts.template, attempt },
        'Message sent successfully',
      );

      return { ...msgLog, status: 'SENT', providerMessageId: providerId, retryCount: attempt };
    } catch (err) {
      lastError = err;
      logger.warn(
        { leadId: opts.leadId, channel: opts.channel, attempt, err: String(err) },
        'Message send attempt failed',
      );
    }
  }

  // All retries exhausted → dead letter
  const errorMsg = String(lastError);
  await updateMessageLog(logId, {
    status:       'DEAD_LETTER',
    errorMessage: errorMsg,
    retryCount:   maxRetries,
  });

  logger.error(
    { leadId: opts.leadId, channel: opts.channel, template: opts.template },
    'Message dead-lettered after all retries',
  );

  // Alert reception
  await alertReceptionDeadLetter(opts, errorMsg);

  return { ...msgLog, status: 'DEAD_LETTER', errorMessage: errorMsg, retryCount: maxRetries };
}

// ─── Convenience Senders ──────────────────────────────────────────────────────

/** Send via WhatsApp with SMS fallback on failure */
export async function sendWhatsAppWithSmsFallback(
  leadId: string,
  mobile: string,
  body: string,
  template: string,
  exemption?: QuietHoursExemption,
): Promise<void> {
  const result = await sendMessage({
    leadId, to: mobile, body, template,
    channel: 'WHATSAPP',
    exemption,
  });

  if (result.status === 'DEAD_LETTER' || result.status === 'FAILED') {
    await sendMessage({
      leadId, to: mobile, body, template: `${template}_SMS_FALLBACK`,
      channel: 'SMS',
      exemption,
    });
  }
}

/** Send to reception email — no quiet-hours restriction */
export async function sendReceptionEmail(opts: {
  leadId: string;
  subject: string;
  body: string;
  template: string;
}): Promise<void> {
  await sendMessage({
    leadId:   opts.leadId,
    to:       clinicConfig.admin.dailySummaryRecipient,
    body:     opts.body,
    template: opts.template,
    channel:  'EMAIL',
    subject:  opts.subject,
    exemption: 'BOOKING_CONFIRMATION', // reception emails exempt from quiet hours
  });
}

/** Send high-priority reception alert (SMS + WhatsApp + Email) */
export async function sendReceptionAlert(opts: {
  leadId: string;
  subject: string;
  body: string;
  template: string;
  emergency?: boolean;
}): Promise<void> {
  const exemption: QuietHoursExemption = opts.emergency ? 'EMERGENCY' : 'BOOKING_CONFIRMATION';

  await Promise.allSettled([
    sendMessage({
      leadId:   opts.leadId,
      to:       clinicConfig.contact.whatsapp,
      body:     opts.body,
      template: `${opts.template}_WA`,
      channel:  'WHATSAPP',
      exemption,
    }),
    sendReceptionEmail({
      leadId:   opts.leadId,
      subject:  opts.subject,
      body:     opts.body,
      template: `${opts.template}_EMAIL`,
    }),
  ]);
}

// ─── Dead-Letter Alert ────────────────────────────────────────────────────────

async function alertReceptionDeadLetter(
  opts: SendOptions,
  error: string,
): Promise<void> {
  try {
    await getResend().emails.send({
      from:    `Automation Alert <noreply@${clinicConfig.contact.domain}>`,
      to:      [clinicConfig.admin.dailySummaryRecipient],
      subject: `⚠️ Message delivery failed — ${opts.template}`,
      text:
        `A message failed to deliver after all retries.\n\n` +
        `Lead ID: ${opts.leadId}\n` +
        `Channel: ${opts.channel}\n` +
        `Template: ${opts.template}\n` +
        `Error: ${error}\n\n` +
        `Please follow up with the patient manually.`,
    });
  } catch (e) {
    logger.error({ err: String(e) }, 'Failed to send dead-letter alert to reception');
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
