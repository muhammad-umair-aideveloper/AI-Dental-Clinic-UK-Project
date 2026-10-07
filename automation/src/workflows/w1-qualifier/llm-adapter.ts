/**
 * workflows/w1-qualifier/llm-adapter.ts
 *
 * Wraps Gemini API for structured field extraction and reply phrasing.
 *
 * The LLM has exactly two jobs:
 *   1. Phrase the next step's question naturally
 *   2. Extract the user's answer into a typed field
 *
 * Security:
 *   - System prompt injection guard: if user input contains "ignore", "system",
 *     "forget", "override", or "instructions" in a suspicious pattern,
 *     log and ignore — return to the current step.
 *   - LLM has NO tool access.
 *   - LLM cannot override the step machine.
 *   - FAQ answers only come from clinicConfig.faq — the LLM formats them.
 */
import {
  GoogleGenerativeAI,
  type GenerateContentRequest,
  SchemaType,
} from '@google/generative-ai';
import { clinicConfig } from '../../clinic.config.js';
import { logger } from '../../core/logger.js';
import type { ConversationMessage, LeadQualificationFields } from '../../core/types.js';
import type { ConversationStep } from '../../core/types.js';
import type { StepDefinition } from './state-machine.js';

const MODEL_NAME = () => process.env['GEMINI_MODEL'] ?? 'gemini-1.5-flash';

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY']!);
  return genAI.getGenerativeModel({ model: MODEL_NAME() });
}

// ─── Prompt Injection Guard ───────────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|above|prior|system)\s+(instructions?|prompt|context)/i,
  /forget\s+(everything|all|what|previous)/i,
  /override\s+(the\s+)?(system|instructions?|prompt)/i,
  /you\s+are\s+now\s+a?\s*\w+/i,
  /act\s+as\s+(a\s+)?(different|new|another)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /disregard\s+(your|the)\s+(instructions?|guidelines?|rules?)/i,
];

function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

// ─── FAQ Lookup ───────────────────────────────────────────────────────────────

const faqText = clinicConfig.faq
  .map((f, i) => `${i + 1}. Q: ${f.q}\n   A: ${f.a}`)
  .join('\n');

/**
 * Finds the most relevant FAQ entry for a given question.
 * Returns null if no relevant entry found (the LLM must then say it doesn't know).
 */
function findFaqAnswer(question: string): string | null {
  const lq = question.toLowerCase();
  const entry = clinicConfig.faq.find((f) => {
    const keywords = f.q.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    return keywords.some((kw) => lq.includes(kw));
  });
  return entry?.a ?? null;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a professional and warm dental receptionist assistant for ${clinicConfig.name}, London.

CRITICAL RULES — follow these exactly:
1. You are conducting a structured conversation to help patients book a consultation.
2. You MUST follow the conversation step you are given. Do NOT skip steps or ask multiple questions.
3. NEVER invent prices, treatment outcomes, clinical claims, or medical advice.
4. NEVER generate emergency responses — those are handled separately.
5. If the patient asks an off-topic question, check the FAQ below and answer BRIEFLY from it only.
   If the answer is not in the FAQ, say "I don't have that information — our team will be happy to help when they call you."
   Then return to the current conversation step.
6. If the patient asks to speak to a human, say "Of course! Leave your name and number and we'll call you right away." 
   Then collect their name and number only.
7. Keep messages SHORT (2–4 sentences max). Use British English.
8. NEVER say anything that could be medical advice.

CLINIC FACTS (only use these, nothing else):
- Name: ${clinicConfig.name}
- Lead dentist: ${clinicConfig.leadDentist}
- Address: ${clinicConfig.address.full}
- Hours: Monday–Friday, 08:30–18:00 (closed weekends)
- Consultation fee: £${clinicConfig.fees.consultationFee} (refundable deposit: £${clinicConfig.fees.depositDefault})

APPROVED FAQ:
${faqText}

PRIVACY: Do NOT log or repeat back the patient's full phone number in messages.`;
}

// ─── Phrase a Step Reply ──────────────────────────────────────────────────────

export interface PhraseReplyInput {
  stepDef:       StepDefinition;
  history:       ConversationMessage[];
  callbackTime:  string;
  extractedFields: Partial<LeadQualificationFields>;
}

export async function phraseStepReply(input: PhraseReplyInput): Promise<string> {
  const { stepDef, history, callbackTime, extractedFields } = input;

  const historyParts = history.slice(-6).map((m) => ({
    role:  m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const userPrompt =
    `CURRENT STEP: ${stepDef.step}\n` +
    `STEP INSTRUCTIONS: ${stepDef.prompt.replace('{callbackTime}', callbackTime)}\n` +
    (extractedFields.fullName ? `Patient name: ${extractedFields.fullName}\n` : '') +
    `Please write the assistant message for this step now.`;

  const request: GenerateContentRequest = {
    systemInstruction: { role: 'system', parts: [{ text: buildSystemPrompt() }] },
    contents: [
      ...historyParts,
      { role: 'user', parts: [{ text: userPrompt }] },
    ],
  };

  const model = getModel();
  const result = await model.generateContent(request);
  const text   = result.response.text();

  return text.trim();
}

// ─── Handle Off-Script Question ───────────────────────────────────────────────

export async function handleOffScript(
  userMessage: string,
  currentStep: ConversationStep,
  patientName?: string,
): Promise<string> {
  // Injection guard
  if (detectInjection(userMessage)) {
    logger.warn({ currentStep }, 'Prompt injection attempt detected — returning to step');
    return `I'm here to help you book a consultation. Let me continue — ${getReturnPrompt(currentStep, patientName)}`;
  }

  // FAQ lookup
  const faqAnswer = findFaqAnswer(userMessage);

  const prompt = faqAnswer
    ? `The patient asked: "${userMessage}"\n\n` +
      `The approved answer is: "${faqAnswer}"\n\n` +
      `Rephrase this answer warmly in 1–2 sentences using British English. ` +
      `Do NOT add any extra information. ` +
      `Then briefly return to the current step: ${currentStep}.`
    : `The patient asked: "${userMessage}"\n\n` +
      `This is not covered in the FAQ. ` +
      `Respond briefly: "I don't have that information — our team will be happy to help when they call you." ` +
      `Then return to the current step: ${currentStep}.`;

  const model = getModel();
  const result = await model.generateContent({
    systemInstruction: { role: 'system', parts: [{ text: buildSystemPrompt() }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  return result.response.text().trim();
}

function getReturnPrompt(step: ConversationStep, name?: string): string {
  const greet = name ? `${name}, ` : '';
  const map: Partial<Record<ConversationStep, string>> = {
    TREATMENT: `${greet}which treatment were you interested in?`,
    TIMELINE:  `${greet}what's your timeline for starting?`,
    HISTORY:   `have you had a consultation for this treatment before?`,
    NAME:      `${greet}could I take your full name?`,
    CONTACT:   `${greet}could I take your UK mobile number?`,
    SCHEDULE:  `${greet}what day and time works best for your consultation?`,
  };
  return map[step] ?? 'shall we continue with your booking?';
}

// ─── Extract Field from User Message ─────────────────────────────────────────

export interface ExtractionResult {
  value:      string | null;
  confidence: 'HIGH' | 'LOW';
  raw:        string;
}

const EXTRACTION_SCHEMAS: Partial<Record<ConversationStep, object>> = {
  TREATMENT: {
    type: SchemaType.OBJECT,
    properties: {
      treatment: { type: SchemaType.STRING, description: 'The treatment the patient chose. One of: Invisalign, Veneers, Implants, Other' },
      confidence: { type: SchemaType.STRING, enum: ['HIGH', 'LOW'] },
    },
    required: ['treatment', 'confidence'],
  },
  TIMELINE: {
    type: SchemaType.OBJECT,
    properties: {
      timeline: { type: SchemaType.STRING, description: 'One of: Immediately, Within 3 months, Just researching' },
      confidence: { type: SchemaType.STRING, enum: ['HIGH', 'LOW'] },
    },
    required: ['timeline', 'confidence'],
  },
  HISTORY: {
    type: SchemaType.OBJECT,
    properties: {
      history: { type: SchemaType.STRING, description: 'One of: Yes — here at Vertex, Yes — elsewhere, No' },
      confidence: { type: SchemaType.STRING, enum: ['HIGH', 'LOW'] },
    },
    required: ['history', 'confidence'],
  },
  NAME: {
    type: SchemaType.OBJECT,
    properties: {
      fullName: { type: SchemaType.STRING, description: 'The patient\'s full name as given' },
      consentGiven: { type: SchemaType.BOOLEAN, description: 'Whether the patient agreed to the privacy consent' },
      confidence: { type: SchemaType.STRING, enum: ['HIGH', 'LOW'] },
    },
    required: ['fullName', 'consentGiven', 'confidence'],
  },
  SCHEDULE: {
    type: SchemaType.OBJECT,
    properties: {
      preferredDay: { type: SchemaType.STRING, description: 'The patient\'s preferred consultation day' },
      preferredTimeWindow: { type: SchemaType.STRING, description: 'Morning, afternoon, or evening' },
      confidence: { type: SchemaType.STRING, enum: ['HIGH', 'LOW'] },
    },
    required: ['preferredDay', 'confidence'],
  },
};

/**
 * Uses Gemini structured output to extract a typed field from user input.
 */
export async function extractField(
  step: ConversationStep,
  userMessage: string,
  previousFields: Partial<LeadQualificationFields>,
): Promise<ExtractionResult & { extra?: Partial<LeadQualificationFields> }> {
  const schema = EXTRACTION_SCHEMAS[step];
  if (!schema) {
    // For steps like CONTACT that need custom parsing, return raw
    return { value: userMessage, confidence: 'HIGH', raw: userMessage };
  }

  const model = getModel();
  const genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY']!);
  const structuredModel = genAI.getGenerativeModel({
    model: MODEL_NAME(),
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema:   schema as Parameters<typeof structuredModel.generateContent>[0] extends never ? never : object,
    },
  });

  const prompt =
    `Extract the patient's answer from this message.\n` +
    `Step: ${step}\n` +
    `Patient message: "${userMessage}"\n` +
    `Previous known fields: ${JSON.stringify(previousFields)}\n\n` +
    `Return a JSON object with the extracted field(s) and confidence level.`;

  try {
    const result = await structuredModel.generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as Record<string, unknown>;
    const confidence = (parsed['confidence'] as 'HIGH' | 'LOW') ?? 'LOW';

    // Determine primary field value
    let value: string | null = null;
    const extra: Partial<LeadQualificationFields> = {};

    if (step === 'TREATMENT')  value = (parsed['treatment']  as string) ?? null;
    if (step === 'TIMELINE')   value = (parsed['timeline']   as string) ?? null;
    if (step === 'HISTORY')    value = (parsed['history']    as string) ?? null;
    if (step === 'NAME') {
      value = (parsed['fullName'] as string) ?? null;
      extra.consentGiven = (parsed['consentGiven'] as boolean) ?? false;
    }
    if (step === 'SCHEDULE') {
      value = (parsed['preferredDay'] as string) ?? null;
      if (parsed['preferredTimeWindow']) {
        extra.preferredTimeWindow = parsed['preferredTimeWindow'] as string;
      }
    }

    return { value, confidence, raw: userMessage, extra };
  } catch (err) {
    logger.warn({ step, err: String(err) }, 'Structured extraction failed — using raw value');
    return { value: userMessage, confidence: 'LOW', raw: userMessage };
  }
}
