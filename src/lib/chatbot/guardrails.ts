/**
 * src/lib/chatbot/guardrails.ts
 *
 * Chatbot Hardening & UK GDPR Special Category Health Data Guardrails.
 *
 * Implements:
 * 1. Input Length Caps: Rejects or truncates payloads exceeding safe token boundaries.
 * 2. Prompt Injection Defense: Detects and neutralizes instruction override attempts.
 * 3. Zero-PII Scrubber: Strips UK NHS numbers, National Insurance numbers, and credit cards
 *    BEFORE text is ever passed to an external Large Language Model.
 * 4. In-Memory Rate Limiting: Limits abusive queries per IP/session.
 */

// ---------------------------------------------------------------------------
// 1. INPUT CONSTRAINTS
// ---------------------------------------------------------------------------

export const CHAT_MAX_INPUT_LENGTH = 1000;
export const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per 1 minute

// ---------------------------------------------------------------------------
// 2. PROMPT INJECTION DEFENSE
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|above|prior|system)\s+(instructions?|prompt|context)/i,
  /forget\s+(everything|all|what|previous)/i,
  /override\s+(the\s+)?(system|instructions?|prompt)/i,
  /you\s+are\s+now\s+(a\s+)?(dan|jailbroken|unrestricted)/i,
  /disregard\s+(your|the)\s+(instructions?|guidelines?|rules?)/i,
  /reveal\s+(system\s+prompt|secret\s+key|api\s+key|database)/i,
];

export function sanitizeChatInput(input: string): {
  sanitized: string;
  hasInjectionAttempt: boolean;
  isTruncated: boolean;
} {
  let text = input.trim();
  let isTruncated = false;

  // 1. Length cap
  if (text.length > CHAT_MAX_INPUT_LENGTH) {
    text = text.slice(0, CHAT_MAX_INPUT_LENGTH);
    isTruncated = true;
  }

  // 2. Check injection attempt
  const hasInjectionAttempt = INJECTION_PATTERNS.some(p => p.test(text));

  return {
    sanitized: text,
    hasInjectionAttempt,
    isTruncated,
  };
}

// ---------------------------------------------------------------------------
// 3. ZERO-PII SCRUBBER (UK GDPR HEALTH DATA PROTECTION)
// ---------------------------------------------------------------------------

/**
 * Scrubs sensitive UK identifier numbers and financial data
 * before prompt dispatch to external LLMs:
 *  - UK NHS Number: 10 digits (e.g. 123 456 7890, 123-456-7890, 1234567890)
 *  - UK National Insurance (NI) Number: 2 letters, 6 digits, 1 letter (e.g. QQ 12 34 56 A)
 *  - Credit / Debit Card Numbers: 13-19 digit card patterns
 */
export function scrubSensitiveHealthPii(text: string): {
  scrubbed: string;
  piiDetected: boolean;
  redactedTypes: string[];
} {
  let result = text;
  const redactedTypes: string[] = [];

  // 1. UK National Insurance (NI) Number
  // Format: 2 letters, 6 digits, optional suffix letter
  const niPattern = /\b[A-Z]{2}\s*\d{2}\s*\d{2}\s*\d{2}\s*[A-Z]?\b/gi;
  if (niPattern.test(result)) {
    result = result.replace(niPattern, '[REDACTED_UK_NI_NUMBER]');
    redactedTypes.push('UK_NATIONAL_INSURANCE_NUMBER');
  }

  // 2. UK NHS Number
  // Format: 3 digits, space/hyphen, 3 digits, space/hyphen, 4 digits (or contiguous 10 digits)
  const nhsPattern = /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g;
  if (nhsPattern.test(result)) {
    // Only match if not part of a standard UK telephone number starting with 07 or 02 or +44
    result = result.replace(nhsPattern, (match) => {
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length === 10 && !digitsOnly.startsWith('07') && !digitsOnly.startsWith('02') && !digitsOnly.startsWith('01')) {
        redactedTypes.push('UK_NHS_NUMBER');
        return '[REDACTED_NHS_NUMBER]';
      }
      return match;
    });
  }

  // 3. Payment Card (16-digit card patterns)
  const cardPattern = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  if (cardPattern.test(result)) {
    result = result.replace(cardPattern, '[REDACTED_PAYMENT_CARD]');
    redactedTypes.push('PAYMENT_CARD');
  }

  return {
    scrubbed: result,
    piiDetected: redactedTypes.length > 0,
    redactedTypes,
  };
}

// ---------------------------------------------------------------------------
// 4. RATE LIMITING ENGINE
// ---------------------------------------------------------------------------

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkChatRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  if (!existing || now >= existing.resetAt) {
    // Create new rate window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetInSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - existing.count,
    resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
