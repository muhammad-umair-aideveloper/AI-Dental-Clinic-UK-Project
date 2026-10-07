/**
 * routes/chat.ts
 * POST /api/chat — chat widget messages
 * POST /api/contact-form — website contact form
 * Both feed the same W1 qualification pipeline.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyTurnstile } from '../core/signature-verifier.js';
import { handleChatMessage } from '../workflows/w1-qualifier/handler.js';
import { logger } from '../core/logger.js';
import { newId, createLead, getLead, updateLead } from '../core/firestore.js';
import { detectEmergencyInFields } from '../workflows/w2-emergency/detector.js';
import { handleEmergency } from '../workflows/w2-emergency/responder.js';
import { makeHistoryEntry } from '../core/lead-state-machine.js';
import { sendDepositLink } from '../workflows/w3-deposit/stripe.js';

const ChatSchema = z.object({
  sessionId:     z.string().min(1).max(128),
  message:       z.string().min(1).max(2000),
  turnstileToken: z.string().min(1),
  sourcePage:    z.string().max(500).optional(),
});

const ContactFormSchema = z.object({
  name:           z.string().min(1).max(200),
  email:          z.string().email().max(320),
  phone:          z.string().max(20).optional(),
  message:        z.string().min(1).max(5000),
  treatment:      z.string().max(100).optional(),
  turnstileToken: z.string().optional(),
  sourcePage:     z.string().max(500).optional(),
});

export async function registerChatRoutes(app: FastifyInstance): Promise<void> {

  // ── POST /api/chat ─────────────────────────────────────────────────────────
  app.post('/api/chat', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { sessionId, message, turnstileToken, sourcePage } = parsed.data;

    // Turnstile verification
    const ip = req.headers['x-forwarded-for'] as string | undefined;
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk) {
      logger.warn({ ip }, 'Turnstile verification failed');
      return reply.code(403).send({ error: 'Spam check failed' });
    }

    try {
      const response = await handleChatMessage({ sessionId, message, turnstileToken, sourcePage });
      return reply.send(response);
    } catch (err) {
      logger.error({ err: String(err), sessionId }, 'Chat handler error');
      return reply.code(500).send({ error: 'An error occurred. Please try again.' });
    }
  });

  // ── POST /api/contact-form ─────────────────────────────────────────────────
  app.post('/api/contact-form', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const parsed = ContactFormSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid form data', details: parsed.error.issues });
    }

    const { name, email, phone, message, treatment, sourcePage } = parsed.data;

    // Emergency detection on ALL fields
    const detection = detectEmergencyInFields({ name, email, message, phone });

    const leadId = newId();
    const now    = new Date().toISOString();
    const lead = {
      id: leadId,
      status: 'NEW' as const,
      emergency: detection.isEmergency,
      source: 'CONTACT_FORM' as const,
      sourcePage,
      fullName: name,
      email,
      mobile: phone,
      treatment,
      consentGiven: true, // form has consent checkbox
      consentTimestamp: now,
      optOut: false,
      doNotContact: false,
      reviewMessageCount: 0,
      reviewLinkClicked: false,
      createdAt: now,
      updatedAt: now,
      statusHistory: [makeHistoryEntry(null, 'NEW', 'SYSTEM')],
    };

    await createLead(lead);

    if (detection.isEmergency) {
      await handleEmergency({
        leadId,
        patientMessage: message,
        category: detection.category,
        matchedPhrase: detection.matchedPhrase,
        contact: { name, mobile: phone },
      });
      return reply.send({ received: true, emergency: true });
    }

    // Non-emergency: qualify and trigger deposit if enough info
    await updateLead(leadId, { status: 'QUALIFYING' });
    if (phone) {
      await updateLead(leadId, { status: 'QUALIFIED', score: 'WARM' });
      await sendDepositLink(leadId);
    }

    return reply.send({ received: true, emergency: false });
  });
}
