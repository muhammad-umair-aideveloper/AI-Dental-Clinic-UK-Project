/**
 * workflows/w1-qualifier/state-machine.ts
 *
 * Deterministic conversation state machine for lead qualification.
 * The LLM ONLY phrases replies and extracts fields.
 * It CANNOT skip or reorder steps.
 * One question per message. Max 7 turns.
 */
import { clinicConfig } from '../../clinic.config.js';
import type {
  ConversationStep,
  LeadQualificationFields,
} from '../../core/types.js';

export interface StepDefinition {
  step:        ConversationStep;
  /** Field this step populates */
  field:       keyof LeadQualificationFields | null;
  /** Instruction to LLM: how to phrase this question */
  prompt:      string;
  /** Quick-reply button options (if any) */
  quickReplies?: readonly string[];
  /** Whether to show consent checkbox before this step */
  showConsent?: boolean;
  /** Whether this step is optional */
  optional?: boolean;
}

const { treatmentOptions, timelineOptions, historyOptions, gdpr, contact } =
  clinicConfig;

/**
 * The ordered sequence of conversation steps.
 * The state machine advances through these in order — no skipping.
 */
export const STEPS: readonly StepDefinition[] = [
  {
    step:   'GREETING',
    field:  null,
    prompt: `You are a friendly and professional dental receptionist assistant for ${clinicConfig.name}. 
Greet the patient warmly. Tell them you can help them book a consultation with ${clinicConfig.leadDentist}'s team. 
Keep it to 1–2 sentences. Do NOT make any clinical claims.`,
  },
  {
    step:        'TREATMENT',
    field:       'treatment',
    quickReplies: treatmentOptions,
    prompt: `Ask which treatment they are interested in. 
Offer exactly these options as buttons: ${treatmentOptions.join(', ')}.
Also accept free text. One question only.`,
  },
  {
    step:        'TIMELINE',
    field:       'timeline',
    quickReplies: timelineOptions,
    prompt: `Ask about their timeline for starting treatment.
Offer exactly these options: ${timelineOptions.join(', ')}.
One question only.`,
  },
  {
    step:        'HISTORY',
    field:       'history',
    quickReplies: historyOptions,
    prompt: `Ask if they have had a consultation for this treatment before.
Offer exactly these options: ${historyOptions.join(', ')}.
One question only.`,
  },
  {
    step:        'NAME',
    field:       'fullName',
    showConsent: true,
    prompt: `Before collecting their details, show the consent line:
"${gdpr.consentText}"
Then ask for their full name. One question only.
Important: make it clear their details are for booking purposes only.`,
  },
  {
    step:     'CONTACT',
    field:    'mobile',
    prompt: `Ask for their UK mobile number. 
Tell them it needs to be a UK mobile (starting with 07).
You may also ask for their email address (optional).
Keep it to one message.`,
  },
  {
    step:  'SCHEDULE',
    field: 'preferredDay',
    prompt: `Ask for their preferred consultation day and time of day (morning/afternoon/evening).
Mention that the clinic is open Monday to Friday, 08:30–18:00.
One question only.`,
  },
  {
    step:  'CONFIRM',
    field: null,
    prompt: `Thank them by name and confirm you have their details.
Tell them: "Dr ${clinicConfig.leadDentist}'s team will be in touch at {callbackTime} to confirm your slot."
Be warm and brief. Do NOT invent any other information.`,
  },
] as const;

/** Map from step name to next step */
export const NEXT_STEP: Partial<Record<ConversationStep, ConversationStep>> = {
  GREETING: 'TREATMENT',
  TREATMENT: 'TIMELINE',
  TIMELINE:  'HISTORY',
  HISTORY:   'NAME',
  NAME:      'CONTACT',
  CONTACT:   'SCHEDULE',
  SCHEDULE:  'CONFIRM',
  CONFIRM:   'DONE',
};

export function getNextStep(current: ConversationStep): ConversationStep {
  return NEXT_STEP[current] ?? 'DONE';
}

export function getStepDefinition(step: ConversationStep): StepDefinition | undefined {
  return STEPS.find((s) => s.step === step);
}

export function isTerminalStep(step: ConversationStep): boolean {
  return step === 'DONE' || step === 'EMERGENCY' || step === 'HUMAN_REQUESTED';
}

export const MAX_TURNS = 7;
