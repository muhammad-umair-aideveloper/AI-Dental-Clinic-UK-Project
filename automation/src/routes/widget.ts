/**
 * routes/widget.ts
 * Serves the compiled widget.js file.
 */
import type { FastifyInstance } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerWidgetRoutes(app: FastifyInstance): Promise<void> {
  app.get('/widget.js', async (req, reply) => {
    const widgetPath = path.join(__dirname, '../../dist/widget.js');
    return reply
      .type('application/javascript')
      .header('Cache-Control', 'public, max-age=3600')
      .sendFile(widgetPath);
  });
}
