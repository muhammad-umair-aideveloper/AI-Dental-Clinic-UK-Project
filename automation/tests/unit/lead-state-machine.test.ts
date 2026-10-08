/**
 * tests/unit/lead-state-machine.test.ts
 */
import { describe, it, expect } from 'vitest';
import {
  assertValidTransition,
  isValidTransition,
  isTerminalStatus,
  makeHistoryEntry,
  InvalidTransitionError,
} from '../../src/core/lead-state-machine.js';
import type { LeadStatus } from '../../src/core/types.js';

describe('assertValidTransition — valid paths', () => {
  const validTransitions: [LeadStatus, LeadStatus][] = [
    ['NEW',             'QUALIFYING'],
    ['QUALIFYING',      'QUALIFIED'],
    ['QUALIFYING',      'CANCELLED'],
    ['QUALIFIED',       'DEPOSIT_PENDING'],
    ['QUALIFIED',       'CANCELLED'],
    ['DEPOSIT_PENDING', 'CONFIRMED'],
    ['DEPOSIT_PENDING', 'CANCELLED'],
    ['CONFIRMED',       'ATTENDED'],
    ['CONFIRMED',       'NO_SHOW'],
    ['CONFIRMED',       'CANCELLED'],
    ['ATTENDED',        'COMPLETED'],
    ['COMPLETED',       'REVIEW_REQUESTED'],
  ];

  for (const [from, to] of validTransitions) {
    it(`allows ${from} → ${to}`, () => {
      expect(() => assertValidTransition(from, to)).not.toThrow();
    });
  }
});

describe('assertValidTransition — invalid paths (must throw)', () => {
  const invalidTransitions: [LeadStatus, LeadStatus][] = [
    ['NEW',              'CONFIRMED'],        // skip steps
    ['NEW',              'COMPLETED'],        // skip steps
    ['QUALIFYING',       'CONFIRMED'],        // skip QUALIFIED + DEPOSIT_PENDING
    ['QUALIFIED',        'ATTENDED'],         // skip DEPOSIT_PENDING + CONFIRMED
    ['CONFIRMED',        'REVIEW_REQUESTED'], // skip COMPLETED
    ['NO_SHOW',          'CONFIRMED'],        // terminal state
    ['CANCELLED',        'QUALIFYING'],       // terminal state
    ['COMPLETED',        'QUALIFYING'],       // backwards
    ['REVIEW_REQUESTED', 'COMPLETED'],        // backwards
    ['ATTENDED',         'QUALIFYING'],       // backwards
  ];

  for (const [from, to] of invalidTransitions) {
    it(`rejects ${from} → ${to}`, () => {
      expect(() => assertValidTransition(from, to)).toThrow(InvalidTransitionError);
    });
  }
});

describe('isValidTransition', () => {
  it('returns true for valid transition', () => {
    expect(isValidTransition('NEW', 'QUALIFYING')).toBe(true);
  });

  it('returns false for invalid transition', () => {
    expect(isValidTransition('NEW', 'COMPLETED')).toBe(false);
  });
});

describe('isTerminalStatus', () => {
  const terminalStatuses: LeadStatus[] = ['NO_SHOW', 'CANCELLED', 'REVIEW_REQUESTED'];
  const nonTerminal: LeadStatus[] = ['NEW', 'QUALIFYING', 'QUALIFIED', 'DEPOSIT_PENDING', 'CONFIRMED', 'ATTENDED', 'COMPLETED'];

  for (const status of terminalStatuses) {
    it(`${status} is terminal`, () => {
      expect(isTerminalStatus(status)).toBe(true);
    });
  }

  for (const status of nonTerminal) {
    it(`${status} is NOT terminal`, () => {
      expect(isTerminalStatus(status)).toBe(false);
    });
  }
});

describe('makeHistoryEntry', () => {
  it('creates entry with correct shape', () => {
    const entry = makeHistoryEntry('NEW', 'QUALIFYING', 'SYSTEM', 'Test note');
    expect(entry.from).toBe('NEW');
    expect(entry.to).toBe('QUALIFYING');
    expect(entry.actor).toBe('SYSTEM');
    expect(entry.note).toBe('Test note');
    expect(new Date(entry.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('accepts null from (initial state)', () => {
    const entry = makeHistoryEntry(null, 'NEW', 'SYSTEM');
    expect(entry.from).toBeNull();
  });
});
