/**
 * routes/admin.ts
 * Secured admin API routes — Google OAuth required (allow-list checked server-side).
 * Implements the PracticeSystemAdapter status update endpoint.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { clinicConfig } from '../clinic.config.js';
import {
  getLead,
  updateLead,
  getLeadsForDashboard,
  getLeadsByStatus,
  getTodaysLeads,
  deletePii,
  exportLeadData,
  newId,
} from '../core/firestore.js';
import { assertValidTransition, makeHistoryEntry } from '../core/lead-state-machine.js';
import { scheduleReviewRequest } from '../workflows/w4-review/scheduler.js';
import { cancelCalendarEvent } from '../workflows/w3-deposit/calendar.js';
import { sendReceptionEmail } from '../core/messaging.js';
import { logger } from '../core/logger.js';
import type { LeadStatus } from '../core/types.js';

const oauthClient = new OAuth2Client(process.env['GOOGLE_OAUTH_CLIENT_ID']!);

// ─── Auth Middleware ──────────────────────────────────────────────────────────

async function verifyGoogleToken(req: Parameters<Parameters<typeof FastifyInstance.prototype.get>[2]>[0], reply: Parameters<Parameters<typeof FastifyInstance.prototype.get>[2]>[1]): Promise<string | null> {
  const authHeader = req.headers['authorization'] as string | undefined;
  const token      = authHeader?.replace('Bearer ', '');

  if (!token) {
    reply.code(401).send({ error: 'Unauthorized' });
    return null;
  }

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken:  token,
      audience: process.env['GOOGLE_OAUTH_CLIENT_ID']!,
    });
    const payload = ticket.getPayload();
    const email   = payload?.email;

    if (!email || !clinicConfig.admin.allowedEmails.includes(email)) {
      reply.code(403).send({ error: 'Forbidden — email not in allow-list' });
      return null;
    }

    return email;
  } catch {
    reply.code(401).send({ error: 'Invalid token' });
    return null;
  }
}

// ─── Status Patch Schema ──────────────────────────────────────────────────────

const StatusPatchSchema = z.object({
  status: z.enum(['ATTENDED', 'NO_SHOW', 'CANCELLED', 'COMPLETED']),
  note:   z.string().max(500).optional(),
});

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/admin/leads — all leads for dashboard
  app.get('/api/admin/leads', async (req, reply) => {
    const email = await verifyGoogleToken(req as Parameters<typeof verifyGoogleToken>[0], reply);
    if (!email) return;

    const leads = await getLeadsForDashboard(200);
    return reply.send({ leads });
  });

  // GET /api/admin/leads/today — today's appointments
  app.get('/api/admin/leads/today', async (req, reply) => {
    const email = await verifyGoogleToken(req as Parameters<typeof verifyGoogleToken>[0], reply);
    if (!email) return;

    const leads = await getTodaysLeads();
    return reply.send({ leads });
  });

  // GET /api/admin/leads/:id
  app.get('/api/admin/leads/:id', async (req, reply) => {
    const email = await verifyGoogleToken(req as Parameters<typeof verifyGoogleToken>[0], reply);
    if (!email) return;

    const { id } = req.params as { id: string };
    const lead   = await getLead(id);
    if (!lead) return reply.code(404).send({ error: 'Not found' });
    return reply.send({ lead });
  });

  // PATCH /api/admin/leads/:id/status — mark attended/no-show/completed/etc.
  app.patch('/api/admin/leads/:id/status', async (req, reply) => {
    const email = await verifyGoogleToken(req as Parameters<typeof verifyGoogleToken>[0], reply);
    if (!email) return;

    const { id } = req.params as { id: string };
    const parsed = StatusPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid status', details: parsed.error.issues });
    }

    const { status, note } = parsed.data;
    const lead = await getLead(id);
    if (!lead) return reply.code(404).send({ error: 'Lead not found' });

    // Validate transition
    try {
      assertValidTransition(lead.status, status as LeadStatus);
    } catch (err) {
      return reply.code(422).send({ error: (err as Error).message });
    }

    const historyEntry = makeHistoryEntry(lead.status, status as LeadStatus, 'RECEPTION', note);
    await updateLead(id, {
      status:        status as LeadStatus,
      statusHistory: [...(lead.statusHistory ?? []), historyEntry],
    });

    // Side effects
    if (status === 'COMPLETED') {
      // Trigger W4 review
      await scheduleReviewRequest(lead);

      // Deposit: credit or refund (per config)
      if (lead.stripePaymentIntentId && clinicConfig.fees.depositCreditedOnAttendance) {
        // Note: actual refund is via Stripe API — triggered manually or by PMS
        logger.info({ leadId: id }, 'Patient attended — deposit credited toward treatment');
      }
    }

    if (status === 'NO_SHOW') {
      logger.info({ leadId: id }, 'No-show — deposit retained per T&Cs');
    }

    if (status === 'CANCELLED') {
      if (lead.calendarEventId) {
        await cancelCalendarEvent(lead.calendarEventId, id);
      }
    }

    logger.info({ leadId: id, status, actor: email }, 'Lead status updated by reception');
    return reply.send({ ok: true, newStatus: status });
  });

  // GET /api/admin/kpis
  app.get('/api/admin/kpis', async (req, reply) => {
    const email = await verifyGoogleToken(req as Parameters<typeof verifyGoogleToken>[0], reply);
    if (!email) return;

    const { getKpiSnapshot } = await import('../core/firestore.js');
    const today = new Date().toISOString().slice(0, 10);
    const kpi   = await getKpiSnapshot(today);
    return reply.send({ kpi });
  });

  // DELETE /api/admin/leads/:id — GDPR deletion
  app.delete('/api/admin/leads/:id', async (req, reply) => {
    const email = await verifyGoogleToken(req as Parameters<typeof verifyGoogleToken>[0], reply);
    if (!email) return;

    const { id } = req.params as { id: string };
    await deletePii(id);
    logger.info({ leadId: id, requestedBy: email }, 'GDPR deletion performed');
    return reply.send({ ok: true });
  });

  // GET /api/admin/leads/:id/export — GDPR subject access request
  app.get('/api/admin/leads/:id/export', async (req, reply) => {
    const email = await verifyGoogleToken(req as Parameters<typeof verifyGoogleToken>[0], reply);
    if (!email) return;

    const { id } = req.params as { id: string };
    const data   = await exportLeadData(id);
    return reply
      .header('Content-Disposition', `attachment; filename="lead-export-${id}.json"`)
      .type('application/json')
      .send(data);
  });

  // ── PracticeSystemAdapter webhook endpoint ────────────────────────────────
  // When a PMS sends a status update, it POSTs here instead of using the admin buttons.
  app.post('/api/pms/webhook', async (req, reply) => {
    // PMS uses a shared secret, not Google OAuth
    const secret = req.headers['x-pms-secret'] as string | undefined;
    if (secret !== process.env['PMS_WEBHOOK_SECRET']) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { leadId, appointmentId, status } = req.body as {
      leadId: string;
      appointmentId: string;
      status: string;
    };

    logger.info({ leadId, appointmentId, status }, 'PMS webhook received');

    const lead = await getLead(leadId);
    if (!lead) return reply.code(404).send({ error: 'Lead not found' });

    try {
      assertValidTransition(lead.status, status as LeadStatus);
      await updateLead(leadId, {
        status: status as LeadStatus,
        statusHistory: [
          ...(lead.statusHistory ?? []),
          makeHistoryEntry(lead.status, status as LeadStatus, 'SYSTEM', `PMS webhook: ${appointmentId}`),
        ],
      });

      if (status === 'COMPLETED') {
        await scheduleReviewRequest(lead);
      }

      return reply.send({ ok: true });
    } catch (err) {
      return reply.code(422).send({ error: (err as Error).message });
    }
  });
}
