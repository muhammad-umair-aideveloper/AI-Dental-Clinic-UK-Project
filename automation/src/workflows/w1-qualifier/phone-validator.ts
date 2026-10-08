/**
 * workflows/w1-qualifier/phone-validator.ts
 * UK mobile number validation and normalisation to E.164.
 * Accepts: 07xxx xxxxxx, +447xxx xxxxxx, 00447xxx xxxxxx
 */
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export interface PhoneValidationResult {
  valid: boolean;
  e164?: string;
  error?: string;
}

export function validateAndNormaliseMobile(input: string): PhoneValidationResult {
  const cleaned = input.replace(/[\s\-().]/g, '');

  // Must be a UK mobile (starts with 07 or +447 or 00447)
  const ukMobileRe = /^(\+?44|0044)?7\d{9}$|^07\d{9}$/;
  if (!ukMobileRe.test(cleaned)) {
    return {
      valid: false,
      error: 'Please enter a valid UK mobile number starting with 07 (e.g. 07700 900000).',
    };
  }

  try {
    // Normalise to E.164
    const phone = parsePhoneNumber(cleaned, 'GB');
    if (!phone.isPossible()) {
      return {
        valid: false,
        error: 'That doesn\'t look like a valid UK mobile. Please check and try again (e.g. 07700 900000).',
      };
    }
    const e164 = phone.format('E.164');
    // Ensure it's a mobile (starts with +447)
    if (!e164.startsWith('+447')) {
      return {
        valid: false,
        error: 'Please enter a UK mobile number (starting with 07).',
      };
    }
    return { valid: true, e164 };
  } catch {
    return {
      valid: false,
      error: 'I couldn\'t recognise that as a valid UK mobile. Please try again (e.g. 07700 900000).',
    };
  }
}
