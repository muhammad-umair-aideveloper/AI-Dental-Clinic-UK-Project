/**
 * core/types.ts
 * Central type definitions for the automation system.
 */

// ─── Lead State Machine ───────────────────────────────────────────────────────

export type LeadStatus =
  | 'NEW'
  | 'QUALIFYING'
  | 'QUALIFIED'
  | 'DEPOSIT_PENDING'
  | 'CONFIRMED'
  | 'ATTENDED'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'REVIEW_REQUESTED';

export type LeadScore = 'HOT' | 'WARM' | 'COLD';
export type LeadSource = 'CHAT_WIDGET' | 'CONTACT_FORM' | 'WHATSAPP' | 'SMS';
export type MessageChannel = 'WHATSAPP' | 'SMS' | 'EMAIL';
export type MessageStatus = 'SENT' | 'FAILED' | 'RETRYING' | 'DEAD_LETTER';

// ─── Lead Document (Firestore) ────────────────────────────────────────────────

export interface Lead {
  id: string;

  // State
  status: LeadStatus;
  /** True when an emergency keyword was detected — overrides qualification flow */
  emergency: boolean;
  score?: LeadScore;

  // Qualification fields
  treatment?: string;
  timeline?: string;
  history?: string;

  // Contact details
  fullName?: string;
  /** E.164 format: +447xxxxxxxxx */
  mobile?: string;
  email?: string;
  preferredDay?: string;
  preferredTimeWindow?: string;

  // Source
  source: LeadSource;
  sourcePage?: string;
  ipAddress?: string; // anonymised after 30 days

  // Consent
  consentGiven: boolean;
  consentTimestamp?: string; // ISO 8601

  // Opt-out / do-not-contact
  optOut: boolean;
  doNotContact: boolean;

  // Payment
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  depositPaidAt?: string;
  depositAmount?: number;
  depositRefunded?: boolean;

  // Calendar
  calendarEventId?: string;
  appointmentDateTime?: string; // ISO 8601

  // Review
  reviewMessageCount: number;
  reviewLinkClicked: boolean;
  reviewRequestedAt?: string;

  // Audit
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  statusHistory: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  from: LeadStatus | null;
  to: LeadStatus;
  timestamp: string;
  actor: 'SYSTEM' | 'RECEPTION' | 'PATIENT';
  note?: string;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export type ConversationStep =
  | 'GREETING'
  | 'TREATMENT'
  | 'TIMELINE'
  | 'HISTORY'
  | 'CONSENT'
  | 'NAME'
  | 'CONTACT'
  | 'SCHEDULE'
  | 'CONFIRM'
  | 'HUMAN_REQUESTED'
  | 'EMERGENCY'
  | 'DONE';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  step?: ConversationStep;
}

export interface Conversation {
  id: string;
  leadId: string;
  sessionId: string;
  currentStep: ConversationStep;
  messages: ConversationMessage[];
  extractedFields: Partial<LeadQualificationFields>;
  createdAt: string;
  updatedAt: string;
  turnCount: number;
}

export interface LeadQualificationFields {
  treatment: string;
  timeline: string;
  history: string;
  fullName: string;
  mobile: string;
  email?: string;
  preferredDay: string;
  preferredTimeWindow: string;
  consentGiven: boolean;
}

// ─── Message Log (Firestore) ──────────────────────────────────────────────────

export interface MessageLog {
  id: string;
  leadId: string;
  channel: MessageChannel;
  template: string;
  to: string;
  body: string;
  status: MessageStatus;
  providerMessageId?: string;
  errorMessage?: string;
  retryCount: number;
  sentAt?: string;
  createdAt: string;
}

// ─── Idempotency Record (Firestore) ──────────────────────────────────────────

export interface IdempotencyRecord {
  key: string;
  processedAt: string;
  result?: string;
}

// ─── Cloud Tasks Job Payloads ─────────────────────────────────────────────────

export type JobType =
  | 'SEND_DEPOSIT_NUDGE'
  | 'RELEASE_CALENDAR_HOLD'
  | 'SEND_REMINDER_24H'
  | 'SEND_REMINDER_2H'
  | 'SEND_REVIEW_REQUEST'
  | 'SEND_REVIEW_FOLLOWUP'
  | 'SEND_EMERGENCY_MORNING_ALERT'
  | 'SEND_DAILY_SUMMARY';

export interface TaskPayload {
  jobType: JobType;
  leadId: string;
  scheduledFor: string; // ISO 8601
  [key: string]: unknown;
}

// ─── API DTOs ─────────────────────────────────────────────────────────────────

export interface ChatMessageRequest {
  sessionId: string;
  message: string;
  turnstileToken: string;
  sourcePage?: string;
  metadata?: Record<string, string>;
}

export interface ChatMessageResponse {
  reply: string;
  step: ConversationStep;
  isEmergency: boolean;
  isDone: boolean;
  quickReplies?: string[];
  showConsentCheckbox?: boolean;
}

export interface ContactFormRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  treatment?: string;
  turnstileToken?: string;
  sourcePage?: string;
}

// ─── KPI Snapshot ─────────────────────────────────────────────────────────────

export interface KpiSnapshot {
  date: string;
  leadsTotal: number;
  leadsHot: number;
  leadsWarm: number;
  leadsCold: number;
  emergencies: number;
  depositsIssued: number;
  depositsPaid: number;
  depositConversionRate: number;
  confirmed: number;
  attended: number;
  noShows: number;
  noShowRate: number;
  cancelled: number;
  completed: number;
  reviewsRequested: number;
  reviewLinksClicked: number;
  remindersSent: number;
}

// ─── Review Click (Firestore) ─────────────────────────────────────────────────

export interface ReviewClick {
  id: string;
  leadId: string;
  clickedAt: string;
  userAgent?: string;
  ipAddress?: string;
}

// ─── PracticeSystemAdapter interface ─────────────────────────────────────────

/**
 * When a practice-management system (PMS) integration replaces the manual
 * admin buttons, it must implement this interface.
 */
export interface PracticeSystemAdapter {
  /** Called when the PMS reports an appointment was attended */
  onAttended(leadId: string, appointmentId: string): Promise<void>;
  /** Called when the PMS reports an appointment was completed (treatment done) */
  onCompleted(leadId: string, appointmentId: string): Promise<void>;
  /** Called when the PMS reports a no-show */
  onNoShow(leadId: string, appointmentId: string): Promise<void>;
  /** Called when the PMS reports a cancellation */
  onCancelled(leadId: string, appointmentId: string, reason?: string): Promise<void>;
  /**
   * Optional: poll for status updates (used when webhook is unavailable).
   * Returns appointments updated since `since`.
   */
  pollUpdates?(since: Date): Promise<AppointmentUpdate[]>;
}

export interface AppointmentUpdate {
  appointmentId: string;
  leadId: string;
  status: 'ATTENDED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  updatedAt: string;
}
