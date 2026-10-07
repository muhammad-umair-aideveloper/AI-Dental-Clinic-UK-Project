/**
 * core/signature-verifier.ts
 * Webhook signature verification for Twilio and Stripe.
 * Every inbound webhook is verified before processing — 401 on failure.
 */
import twilio from 'twilio';
import Stripe from 'stripe';
import type { FastifyRequest, FastifyReply } from 'fastify';

// ─── Twilio ───────────────────────────────────────────────────────────────────

/**
 * Fastify pre-handler that verifies Twilio webhook signatures.
 * Reads X-Twilio-Signature header against the raw body.
 */
export async function verifyTwilioSignature(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authToken = process.env['TWILIO_AUTH_TOKEN']!;
  const url       = `${process.env['SERVICE_BASE_URL']}${req.url}`;
  const signature = req.headers['x-twilio-signature'] as string | undefined;

  if (!signature) {
    reply.code(401).send({ error: 'Missing Twilio signature' });
    return;
  }

  const body = req.body as Record<string, string>;
  const valid = twilio.validateRequest(authToken, signature, url, body);

  if (!valid) {
    reply.code(401).send({ error: 'Invalid Twilio signature' });
  }
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

/**
 * Constructs and verifies a Stripe webhook event from the raw request body.
 * Returns the verified event or throws.
 */
export function constructStripeEvent(
  rawBody: Buffer,
  signature: string,
): Stripe.Event {
  const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env['STRIPE_WEBHOOK_SECRET']!,
  );
}

// ─── Cloud Tasks ──────────────────────────────────────────────────────────────

/**
 * Fastify pre-handler that verifies Cloud Tasks jobs using a shared secret.
 * Prevents spoofed task execution.
 */
export async function verifyTaskSecret(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const secret = req.headers['x-task-secret'] as string | undefined;
  if (secret !== process.env['TASK_SECRET']) {
    reply.code(401).send({ error: 'Invalid task secret' });
  }
}

// ─── Cloudflare Turnstile ─────────────────────────────────────────────────────

/**
 * Verifies a Cloudflare Turnstile token (spam protection for the widget).
 * Returns true if valid.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env['TURNSTILE_SECRET_KEY']!;
  // Skip in test mode
  if (secret === 'test-secret' || process.env['NODE_ENV'] === 'test') return true;

  const body = new URLSearchParams({
    secret,
    response: token,
    ...(ip ? { remoteip: ip } : {}),
  });

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });

  const json = (await res.json()) as { success: boolean };
  return json.success === true;
}
