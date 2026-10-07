/**
 * routes/health.ts
 */
import type { FastifyInstance } from 'fastify';
import { clinicConfig } from '../clinic.config.js';

export async function registerHealthRoute(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status:  'ok',
    service: 'dental-automation',
    clinic:  clinicConfig.name,
    time:    new Date().toISOString(),
  }));
}
