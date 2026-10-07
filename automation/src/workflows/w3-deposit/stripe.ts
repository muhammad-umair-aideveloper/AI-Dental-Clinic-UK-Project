/**
 * workflows/w3-deposit/stripe.ts
 * Stripe Checkout session creation and webhook handling.
 */
import Stripe from 'stripe';
import { clinicConfig } from '../../clinic.config.js';
import { getLead, updateLead, checkAndMarkIdempotent } from '../../core/firestore.js';
import { constructStripeEvent } from '../../core/signature-verifier.js';
import { scheduleJob, cancelJob } from '../../core/scheduler.js';
import {
  sendWhatsAppWithSmsFallback,
  sendReceptionEmail,
  renderTemplate,
} from '../../core/messaging.js';
import { logger } from '../../core/logger.js';
import { makeHistoryEntry } from '../../core/lead-state-machine.js';
import { confirmCalendarEvent } from './calendar.js';
import { adjustForQuietHours } from '../../core/quiet-hours.js';
import type { Lead } from '../../core/types.js';

const BASE_URL = () => process.env['SERVICE_BASE_URL']!;

function getStripe(): Stripe {
  return new Stripe(process.env['STRIPE_SECRET_KEY']!);
}

// ─── Create Checkout Session ──────────────────────────────────────────────────

export async function createDepositSession(leadId: string): Promise<string> {
  const lead = await getLead(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const { fees, cancellationPolicy } = clinicConfig;
  const amount = fees.depositDefault;

  const session = await getStripe().checkout.sessions.create({
    mode:         'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency:    'gbp',
          unit_amount: amount * 100, // pence
          product_data: {
            name:        `Refundable Consultation Deposit — ${clinicConfig.name}`,
            description:
              `Secures your consultation with ${clinicConfig.leadDentist}. ` +
              `${cancellationPolicy.shortText}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      lead_id:    leadId,
      lead_name:  lead.fullName ?? '',
      treatment:  lead.treatment ?? '',
    },
    customer_email:  lead.email ?? undefined,
    success_url: `${BASE_URL()}/deposit/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${BASE_URL()}/deposit/cancelled?lead_id=${leadId}`,
    expires_at:  Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h
    payment_intent_data: {
      metadata: { lead_id: leadId },
    },
    // Show cancellation policy on the Stripe-hosted page
    custom_text: {
      submit: {
        message: `${cancellationPolicy.text} The deposit will be credited toward your treatment cost when you attend.`,
      },
    },
  });

  // Save session ID on lead
  await updateLead(leadId, { stripeSessionId: session.id, depositAmount: amount });

  logger.info({ leadId, sessionId: session.id, amount }, 'Stripe Checkout session created');

  return session.url!;
}

// ─── Send Deposit Link ────────────────────────────────────────────────────────

export async function sendDepositLink(leadId: string): Promise<void> {
  const lead = await getLead(leadId);
  if (!lead?.mobile && !lead?.email) return;

  const checkoutUrl = await createDepositSession(leadId);

  const body = renderTemplate(clinicConfig.messageTemplates.depositLink, {
    name:    lead?.fullName ?? 'there',
    dentist: clinicConfig.leadDentist,
    amount:  String(clinicConfig.fees.depositDefault),
    url:     checkoutUrl,
  });

  if (lead?.mobile) {
    await sendWhatsAppWithSmsFallback(
      leadId, lead.mobile, body, 'DEPOSIT_LINK',
    );
  }

  if (lead?.email) {
    const { Resend } = await import('resend');
    const resend = new (Resend as unknown as new (key: string) => InstanceType<typeof Resend>)(
      process.env['RESEND_API_KEY']!,
    );
    await resend.emails.send({
      from:    `${clinicConfig.name} <noreply@${clinicConfig.contact.domain}>`,
      to:      [lead.email],
      subject: `Your consultation deposit link — ${clinicConfig.name}`,
      html:    `<p>${body.replace(/\n/g, '<br>')}</p>
                <p><a href="${checkoutUrl}" style="background:#0284C7;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Pay £${clinicConfig.fees.depositDefault} Deposit</a></p>
                <p style="font-size:12px;color:#666">${clinicConfig.cancellationPolicy.text}</p>`,
      text:    body,
    });
  }

  // Schedule nudge at T+2h
  const nudgeTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  await scheduleJob(
    { jobType: 'SEND_DEPOSIT_NUDGE', leadId, scheduledFor: nudgeTime.toISOString(), triggerType: 'NUDGE' },
    'automation-reminders',
    nudgeTime,
  );

  // Schedule hold release at T+24h
  const releaseTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await scheduleJob(
    { jobType: 'RELEASE_CALENDAR_HOLD', leadId, scheduledFor: releaseTime.toISOString() },
    'automation-reminders',
    releaseTime,
  );

  // Mark lead as DEPOSIT_PENDING
  const current = await getLead(leadId);
  if (current) {
    await updateLead(leadId, {
      status: 'DEPOSIT_PENDING',
      statusHistory: [
        ...(current.statusHistory ?? []),
        makeHistoryEntry(current.status, 'DEPOSIT_PENDING', 'SYSTEM'),
      ],
    });
  }

  logger.info({ leadId }, 'Deposit link sent, nudge + hold-release scheduled');
}

// ─── Stripe Webhook Handler ───────────────────────────────────────────────────

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<void> {
  const event = constructStripeEvent(rawBody, signature);

  // Idempotency check
  const alreadyProcessed = await checkAndMarkIdempotent(`stripe_${event.id}`);
  if (alreadyProcessed) {
    logger.info({ eventId: event.id }, 'Stripe event already processed — skipping');
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await onDepositPaid(session);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      logger.warn({ piId: pi.id }, 'Payment failed');
      break;
    }
    default:
      logger.info({ eventType: event.type }, 'Unhandled Stripe event — ignoring');
  }
}

async function onDepositPaid(session: Stripe.Checkout.Session): Promise<void> {
  const leadId = session.metadata?.['lead_id'];
  if (!leadId) {
    logger.error({ sessionId: session.id }, 'No lead_id in Stripe session metadata');
    return;
  }

  const lead = await getLead(leadId);
  if (!lead) {
    logger.error({ leadId }, 'Lead not found after deposit payment');
    return;
  }

  logger.info({ leadId, sessionId: session.id }, 'Deposit paid — confirming booking');

  // Mark confirmed
  await updateLead(leadId, {
    status:               'CONFIRMED',
    depositPaidAt:        new Date().toISOString(),
    stripePaymentIntentId: session.payment_intent as string,
    statusHistory: [
      ...(lead.statusHistory ?? []),
      makeHistoryEntry(lead.status, 'CONFIRMED', 'PATIENT', 'Deposit paid via Stripe'),
    ],
  });

  // Confirm calendar event
  if (lead.calendarEventId) {
    await confirmCalendarEvent(lead.calendarEventId, lead);
  }

  // Send booking confirmation to patient
  if (lead.mobile) {
    const body = renderTemplate(clinicConfig.messageTemplates.bookingConfirmation, {
      name:         lead.fullName ?? 'there',
      dentist:      clinicConfig.leadDentist,
      date:         lead.appointmentDateTime
        ? new Date(lead.appointmentDateTime).toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'TBC',
      time:         lead.appointmentDateTime
        ? new Date(lead.appointmentDateTime).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })
        : 'TBC',
      address:      clinicConfig.address.full,
      parking:      clinicConfig.address.parking,
      mapsUrl:      clinicConfig.address.mapsUrl,
      rescheduleUrl: `${BASE_URL()}/reschedule/${leadId}`,
    });

    await sendWhatsAppWithSmsFallback(
      leadId, lead.mobile, body, 'BOOKING_CONFIRMATION', 'BOOKING_CONFIRMATION',
    );
  }

  // Schedule T-24h and T-2h reminders
  await scheduleReminders(lead);

  // Alert reception
  await sendReceptionEmail({
    leadId,
    subject: `✅ Deposit paid — ${lead.fullName} confirmed`,
    body: `${lead.fullName} has paid their deposit and is CONFIRMED for their consultation.\n\nLead ID: ${leadId}\nTreatment: ${lead.treatment}\nTime: ${lead.appointmentDateTime ?? 'TBC'}`,
    template: 'DEPOSIT_PAID_RECEPTION_ALERT',
  });
}

async function scheduleReminders(lead: Lead): Promise<void> {
  if (!lead.appointmentDateTime) return;
  const apptTime = new Date(lead.appointmentDateTime);
  const now      = new Date();

  const t24 = new Date(apptTime.getTime() - 24 * 60 * 60 * 1000);
  const t2  = new Date(apptTime.getTime() -  2 * 60 * 60 * 1000);

  if (t24 > now) {
    const adjusted24 = adjustForQuietHours(t24);
    await scheduleJob(
      { jobType: 'SEND_REMINDER_24H', leadId: lead.id, scheduledFor: adjusted24.toISOString() },
      'automation-reminders',
      adjusted24,
    );
  }

  if (t2 > now) {
    const adjusted2 = adjustForQuietHours(t2);
    await scheduleJob(
      { jobType: 'SEND_REMINDER_2H', leadId: lead.id, scheduledFor: adjusted2.toISOString() },
      'automation-reminders',
      adjusted2,
    );
  }
}
