/**
 * index.ts — Fastify server entry point
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { clinicConfig } from './clinic.config.js';
import { logger } from './core/logger.js';
import { registerChatRoutes }    from './routes/chat.js';
import { registerWebhookRoutes } from './routes/webhooks.js';
import { registerAdminRoutes }   from './routes/admin.js';
import { registerWidgetRoutes }  from './routes/widget.js';
import { registerReviewRoutes }  from './routes/review.js';
import { registerHealthRoute }   from './routes/health.js';

async function bootstrap() {
  const app = Fastify({
    logger: false, // We use pino directly
    trustProxy: true, // Cloud Run sits behind a load balancer
  });

  // ── CORS — locked to clinic domain ────────────────────────────────────────
  await app.register(cors, {
    origin: [
      `https://${clinicConfig.contact.domain}`,
      `https://www.${clinicConfig.contact.domain}`,
      // Allow localhost in development
      ...(process.env['NODE_ENV'] !== 'production'
        ? ['http://localhost:3000', 'http://localhost:3001']
        : []),
    ],
    methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ── Rate Limiting ──────────────────────────────────────────────────────────
  await app.register(rateLimit, {
    global:   false, // Applied per-route
    max:      100,
    timeWindow: '1 minute',
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  await registerHealthRoute(app);
  await registerWidgetRoutes(app);
  await registerChatRoutes(app);
  await registerWebhookRoutes(app);
  await registerAdminRoutes(app);
  await registerReviewRoutes(app);

  // ── Start ─────────────────────────────────────────────────────────────────
  const port = Number(process.env['PORT'] ?? 8080);
  const host = process.env['HOST'] ?? '0.0.0.0';

  try {
    await app.listen({ port, host });
    logger.info({ port, host }, 'Dental automation server started');
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
