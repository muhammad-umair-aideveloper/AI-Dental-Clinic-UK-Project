/**
 * routes/webhooks.ts
 * Inbound webhooks: Twilio (WhatsApp + SMS) + Stripe + Cloud Tasks
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyTwilioSignature, verifyTaskSecret } from '../core/signature-verifier.js';
import { handleStripeWebhook } from '../workflows/w3-deposit/stripe.js';
import { routeTask } from '../jobs/task-router.js';
import { handleChatMessage } from '../workflows/w1-qualifier/handler.js';
import { detectEmergency } from '../workflows/w2-emergency/detector.js';
import { logger } from '../core/logger.js';
import type { TaskPayload } from '../core/types.js';
import { newId } from '../core/firestore.js';

export async function registerWebhookRoutes(app: FastifyInstance): Promise<void> {

  // ── Twilio WhatsApp / SMS inbound ──────────────────────────────────────────
  const twilioHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    await verifyTwilioSignature(req, reply);
    if (reply.sent) return;

    const body = req.body as Record<string, string>;
    const from  = body['From']  ?? '';
    const text  = body['Body']  ?? '';

    // Strip WhatsApp prefix
    const mobile = from.replace('whatsapp:', '');

    logger.info({ from: mobile.slice(-4), channel: 'TWILIO' }, 'Inbound message received');

    // Route through W1 handler using mobile as session ID
    try {
      const response = await handleChatMessage({
        sessionId:      `twilio_${mobile}`,
        message:        text,
        turnstileToken: 'TWILIO_BYPASS', // Twilio webhooks are signature-verified
        sourcePage:     'whatsapp',
      });

      // Reply via Twilio TwiML
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(response.reply)}</Message>
</Response>`;

      return reply.type('text/xml').send(twiml);
    } catch (err) {
      logger.error({ err: String(err) }, 'Twilio handler error');
      return reply.type('text/xml').send(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, something went wrong. Please call us on ${process.env['CLINIC_EMERGENCY_NUMBER'] ?? '+442079460888'}.</Message></Response>`,
      );
    }
  };

  app.post('/webhooks/twilio/whatsapp', twilioHandler);
  app.post('/webhooks/twilio/sms',      twilioHandler);

  // ── Stripe webhook ──────────────────────────────────────────────────────────
  // Stripe requires the RAW body — Fastify must not parse it
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => {
    done(null, body);
  });

  app.post('/webhooks/stripe', async (req: FastifyRequest, reply: FastifyReply) => {
    const signature = req.headers['stripe-signature'] as string | undefined;
    if (!signature) return reply.code(400).send({ error: 'Missing signature' });

    try {
      await handleStripeWebhook(req.body as Buffer, signature);
      return reply.send({ received: true });
    } catch (err) {
      logger.error({ err: String(err) }, 'Stripe webhook error');
      return reply.code(400).send({ error: 'Webhook error' });
    }
  });

  // ── Cloud Tasks jobs ───────────────────────────────────────────────────────
  app.post('/webhooks/tasks', async (req: FastifyRequest, reply: FastifyReply) => {
    await verifyTaskSecret(req, reply);
    if (reply.sent) return;

    try {
      const payload = req.body as TaskPayload;
      await routeTask(payload);
      return reply.send({ ok: true });
    } catch (err) {
      logger.error({ err: String(err) }, 'Task handler error');
      // Return 200 to prevent Cloud Tasks from retrying on handler errors
      // (retries are handled internally by the messaging module)
      return reply.code(200).send({ ok: false, error: String(err) });
    }
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
