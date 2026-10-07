/**
 * routes/review.ts
 * GET /r/:id — tracked review short link
 */
import type { FastifyInstance } from 'fastify';
import { handleReviewClick } from '../workflows/w4-review/short-link.js';
import { logger } from '../core/logger.js';

export async function registerReviewRoutes(app: FastifyInstance): Promise<void> {
  app.get('/r/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const ip        = req.headers['x-forwarded-for'] as string | undefined;
    const userAgent = req.headers['user-agent'] as string | undefined;

    try {
      const redirectUrl = await handleReviewClick(id, userAgent, ip?.split(',')[0]);
      return reply.redirect(302, redirectUrl);
    } catch (err) {
      logger.error({ err: String(err), leadId: id }, 'Review click error');
      return reply.redirect(302, 'https://google.com'); // safe fallback
    }
  });
}
