/**
 * src/app/api/chat/route.ts
 *
 * Hardened Chatbot API Endpoint for Vertex Dental Lab.
 * Enforces:
 *  - Rate limiting (max 20 requests/minute per client IP)
 *  - Input length validation (max 1,000 characters)
 *  - Zero-PII health data scrubbing (removes NHS, NI, and card numbers)
 *  - Prompt injection neutralization
 *  - UK GDPR Special Category Health Data compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkChatRateLimit,
  sanitizeChatInput,
  scrubSensitiveHealthPii,
  CHAT_MAX_INPUT_LENGTH,
} from '@/lib/chatbot/guardrails';
import { processDentalTriage, SupportedLanguage } from '@/lib/triage-engine';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous-client';

    const rate = checkChatRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a moment before sending more messages.',
          retryAfter: rate.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rate.resetInSeconds),
          },
        }
      );
    }

    // 2. Parse & Validate Payload
    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload. Message string is required.' },
        { status: 400 }
      );
    }

    const rawMessage = body.message.trim();
    if (rawMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    if (rawMessage.length > CHAT_MAX_INPUT_LENGTH) {
      return NextResponse.json(
        {
          error: `Message exceeds maximum allowed length of ${CHAT_MAX_INPUT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    const language: SupportedLanguage = body.language || 'en';

    // 3. Prompt Injection Defense
    const { sanitized, hasInjectionAttempt } = sanitizeChatInput(rawMessage);
    if (hasInjectionAttempt) {
      return NextResponse.json({
        reply:
          'I am the Vertex Dental Lab clinical assistant. I am here to help you with treatment information, dental pricing, and booking appointments with our clinicians. How may I help you today?',
        intent: 'GENERAL',
        isEmergency: false,
      });
    }

    // 4. Zero-PII Scrubber for UK Health Data
    const { scrubbed, piiDetected, redactedTypes } = scrubSensitiveHealthPii(sanitized);

    // 5. Process Clinical Triage
    const triageResult = processDentalTriage(scrubbed, language);

    return NextResponse.json({
      success: true,
      ...triageResult,
      meta: {
        piiScrubbed: piiDetected,
        redactedTypes,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error processing chat message' },
      { status: 500 }
    );
  }
}
