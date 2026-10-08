/**
 * routes/widget.ts
 * Serves the compiled widget.js file.
 */
import type { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerWidgetRoutes(app: FastifyInstance): Promise<void> {
  app.get('/widget.js', async (_req, reply) => {
    const widgetPath = path.join(__dirname, '../../dist/widget.js');
    if (!fs.existsSync(widgetPath)) {
      return reply.code(404).send({ error: 'Widget bundle not found. Please run npm run build:widget.' });
    }
    const stream = fs.createReadStream(widgetPath);
    return reply
      .type('application/javascript')
      .header('Cache-Control', 'public, max-age=3600')
      .send(stream);
  });
}
