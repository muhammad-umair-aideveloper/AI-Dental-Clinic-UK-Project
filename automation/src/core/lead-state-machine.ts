/**
 * core/lead-state-machine.ts
 * Enforces valid state transitions for the Lead entity.
 * Invalid transitions throw — never silently accepted.
 */
import type { LeadStatus, StatusHistoryEntry } from './types.js';

// Allowed forward transitions
const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW:              ['QUALIFYING'],
  QUALIFYING:       ['QUALIFIED', 'CANCELLED'],
  QUALIFIED:        ['DEPOSIT_PENDING', 'CANCELLED'],
  DEPOSIT_PENDING:  ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['ATTENDED', 'NO_SHOW', 'CANCELLED'],
  ATTENDED:         ['COMPLETED'],
  NO_SHOW:          [],
  CANCELLED:        [],
  COMPLETED:        ['REVIEW_REQUESTED'],
  REVIEW_REQUESTED: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: LeadStatus, to: LeadStatus) {
    super(`Invalid lead state transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Validates that the given transition is allowed.
 * Throws InvalidTransitionError if not.
 */
export function assertValidTransition(from: LeadStatus, to: LeadStatus): void {
  const allowed = TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/**
 * Returns true if the transition is allowed.
 */
export function isValidTransition(from: LeadStatus, to: LeadStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * Creates a status history entry for a state change.
 */
export function makeHistoryEntry(
  from: LeadStatus | null,
  to: LeadStatus,
  actor: StatusHistoryEntry['actor'],
  note?: string,
): StatusHistoryEntry {
  return {
    from,
    to,
    timestamp: new Date().toISOString(),
    actor,
    note,
  };
}

/**
 * Returns terminal states (no outgoing transitions).
 */
export function isTerminalStatus(status: LeadStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
