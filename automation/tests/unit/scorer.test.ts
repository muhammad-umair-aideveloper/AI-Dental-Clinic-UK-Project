/**
 * tests/unit/scorer.test.ts
 */
import { describe, it, expect } from 'vitest';
import { scoreFromTimeline } from '../../src/workflows/w1-qualifier/scorer.js';

describe('scoreFromTimeline', () => {
  it('Immediately → HOT', () => {
    expect(scoreFromTimeline('Immediately')).toBe('HOT');
  });

  it('Within 3 months → WARM', () => {
    expect(scoreFromTimeline('Within 3 months')).toBe('WARM');
  });

  it('Just researching → COLD', () => {
    expect(scoreFromTimeline('Just researching')).toBe('COLD');
  });

  it('Case-insensitive: immediately → HOT', () => {
    expect(scoreFromTimeline('immediately')).toBe('HOT');
  });

  it('Case-insensitive: WITHIN 3 MONTHS → WARM', () => {
    expect(scoreFromTimeline('WITHIN 3 MONTHS')).toBe('WARM');
  });

  it('Case-insensitive: JUST RESEARCHING → COLD', () => {
    expect(scoreFromTimeline('JUST RESEARCHING')).toBe('COLD');
  });

  it('undefined → COLD (default)', () => {
    expect(scoreFromTimeline(undefined)).toBe('COLD');
  });

  it('unknown value → COLD (safe default)', () => {
    expect(scoreFromTimeline('sometime next year')).toBe('COLD');
  });

  it('empty string → COLD', () => {
    expect(scoreFromTimeline('')).toBe('COLD');
  });
});

/**
 * tests/unit/phone-validator.test.ts
 */
import { validateAndNormaliseMobile } from '../../src/workflows/w1-qualifier/phone-validator.js';

describe('validateAndNormaliseMobile', () => {
  it('accepts 07xxx format and normalises to E.164', () => {
    const result = validateAndNormaliseMobile('07700900000');
    expect(result.valid).toBe(true);
    expect(result.e164).toBe('+447700900000');
  });

  it('accepts 07xxx with spaces', () => {
    const result = validateAndNormaliseMobile('077 0090 0000');
    expect(result.valid).toBe(true);
    expect(result.e164).toBe('+447700900000');
  });

  it('accepts +447xxx format', () => {
    const result = validateAndNormaliseMobile('+447700900000');
    expect(result.valid).toBe(true);
    expect(result.e164).toBe('+447700900000');
  });

  it('accepts 00447xxx format', () => {
    const result = validateAndNormaliseMobile('00447700900000');
    expect(result.valid).toBe(true);
    expect(result.e164).toBe('+447700900000');
  });

  it('accepts 07xxx with dashes', () => {
    const result = validateAndNormaliseMobile('07700-900-000');
    expect(result.valid).toBe(true);
  });

  it('rejects UK landline (02xxx)', () => {
    const result = validateAndNormaliseMobile('02079460888');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects non-UK number', () => {
    const result = validateAndNormaliseMobile('+12025551234');
    expect(result.valid).toBe(false);
  });

  it('rejects too-short number', () => {
    const result = validateAndNormaliseMobile('0770090000'); // 10 digits, too short
    expect(result.valid).toBe(false);
  });

  it('rejects random text', () => {
    const result = validateAndNormaliseMobile('not a phone number');
    expect(result.valid).toBe(false);
  });

  it('rejects empty string', () => {
    const result = validateAndNormaliseMobile('');
    expect(result.valid).toBe(false);
  });

  it('returns error message on failure', () => {
    const result = validateAndNormaliseMobile('12345');
    expect(result.error).toBeTruthy();
    expect(typeof result.error).toBe('string');
  });
});
