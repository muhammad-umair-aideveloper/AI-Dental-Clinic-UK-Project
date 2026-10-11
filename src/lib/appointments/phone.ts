/**
 * src/lib/appointments/phone.ts
 *
 * Phone Number Normalization & Validation using libphonenumber-js
 * Formats UK mobile numbers to E.164 international standard: +447XXXXXXXXX
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string; // E.164 formatted (+447...)
  isUkMobile: boolean;
  error?: string;
}

/**
 * Normalizes a phone number to UK international format (+447XXXXXXXXX).
 * Accepts various input formats:
 * - "07123 456789" -> "+447123456789"
 * - "07123456789" -> "+447123456789"
 * - "+44 7123 456 789" -> "+447123456789"
 * - "447123456789" -> "+447123456789"
 */
export function normalizeUkPhone(input: string): PhoneValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      normalized: '',
      isUkMobile: false,
      error: 'Phone number is required.',
    };
  }

  const raw = input.trim();
  // Attempt parse with 'GB' default country
  const parsed = parsePhoneNumberFromString(raw, 'GB');

  if (!parsed || !parsed.isValid()) {
    return {
      isValid: false,
      normalized: raw,
      isUkMobile: false,
      error: 'Please enter a valid UK mobile or phone number (e.g. 07123 456789 or +447123456789).',
    };
  }

  const e164 = parsed.number; // e.g. "+447123456789"
  const isUkMobile = parsed.country === 'GB' && parsed.getType() === 'MOBILE';

  return {
    isValid: true,
    normalized: e164,
    isUkMobile,
  };
}
