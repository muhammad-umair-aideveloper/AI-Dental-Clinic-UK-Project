/**
 * core/logger.ts
 * Structured pino logger. Health/PII data is NEVER passed to the logger —
 * only IDs and non-sensitive metadata.
 */
import pino from 'pino';

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  base:  { service: 'dental-automation' },
  ...(process.env['NODE_ENV'] !== 'production'
    ? {
        transport: {
          target:  'pino-pretty',
          options: { colorize: true },
        },
      }
    : {}),
  // Redact any field that might accidentally contain PII
  redact: {
    paths: ['body', 'message', 'text', 'content', 'req.body', 'res.body'],
    censor: '[REDACTED]',
  },
});
