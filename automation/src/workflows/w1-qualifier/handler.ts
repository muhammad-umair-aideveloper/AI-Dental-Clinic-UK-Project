/**
 * workflows/w1-qualifier/handler.ts
 *
 * Main chat message handler — orchestrates:
 *   1. Emergency detection (W2) — always first
 *   2. Human-request detection
 *   3. Off-script detection
 *   4. Deterministic step machine advancement
 *   5. LLM reply phrasing
 *   6. Field extraction + storage
 *   7. Lead completion → send patient confirmation + reception alert → W3 handoff
 */
import { randomUUID } from 'crypto';
import { clinicConfig } from '../../clinic.config.js';
import {
  getConversationBySession,
  createConversation,
  updateConversation,
  getLead,
  createLead,
  updateLead,
  newId,
} from '../../core/firestore.js';
import { assertValidTransition, makeHistoryEntry } from '../../core/lead-state-machine.js';
import {
  sendWhatsAppWithSmsFallback,
  sendReceptionEmail,
  renderTemplate,
} from '../../core/messaging.js';
import { computeCallbackTime } from '../../core/quiet-hours.js';
import { logger } from '../../core/logger.js';
import { detectEmergency } from '../w2-emergency/detector.js';
import { handleEmergency } from '../w2-emergency/responder.js';
import { phraseStepReply, extractField, handleOffScript } from './llm-adapter.js';
import { getNextStep, getStepDefinition, isTerminalStep, MAX_TURNS } from './state-machine.js';
import { scoreFromTimeline } from './scorer.js';
import { validateAndNormaliseMobile } from './phone-validator.js';
import { triggerDepositWorkflow } from '../w3-deposit/trigger.js';
import type {
  ChatMessageRequest,
  ChatMessageResponse,
  Conversation,
  Lead,
  LeadQualificationFields,
  ConversationStep,
} from '../../core/types.js';

const HUMAN_REQUEST_PATTERNS = [
  /speak\s+(to\s+)?(a\s+)?(human|person|someone|receptionist|agent|staff)/i,
  /talk\s+(to\s+)?(a\s+)?(human|person|someone|receptionist)/i,
  /call\s+me/i,
  /can\s+(someone|you)\s+(call|ring|phone)/i,
  /want\s+(to\s+)?(speak|talk)\s+to\s+someone/i,
  /real\s+person/i,
  /not\s+(a\s+)?bot/i,
];

function isHumanRequest(text: string): boolean {
  return HUMAN_REQUEST_PATTERNS.some((p) => p.test(text));
}

function isOffScript(text: string, currentStep: ConversationStep): boolean {
  // If the text contains a question mark and doesn't match the expected
  // field type for the current step, treat as potentially off-script.
  if (!text.includes('?')) return false;
  // Don't flag as off-script for greeting/confirm steps
  if (currentStep === 'GREETING' || currentStep === 'CONFIRM') return false;
  // Check for FAQ keywords
  const faqKeywords = ['cost', 'price', 'how much', 'do you', 'what is', 'what are',
    'how long', 'where', 'when', 'finance', 'nhs', 'pain', 'anaesthetic'];
  return faqKeywords.some((kw) => text.toLowerCase().includes(kw));
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function handleChatMessage(
  req: ChatMessageRequest,
): Promise<ChatMessageResponse> {
  const { sessionId, message, sourcePage } = req;
  const now = new Date();

  // ── 1. Emergency Detection (ALWAYS FIRST) ──────────────────────────────────
  const emergencyResult = detectEmergency(message);
  if (emergencyResult.isEmergency) {
    // Get or create lead/conversation to have a leadId for alerting
    let conv = await getConversationBySession(sessionId);
    if (!conv) {
      const leadId = newId();
      const convId = newId();
      const lead = makeNewLead(leadId, req);
      await createLead(lead);
      conv = makeNewConversation(convId, leadId, sessionId);
      await createConversation(conv);
    }

    const { replyToPatient, followOnMessage } = await handleEmergency({
      leadId:        conv.leadId,
      patientMessage: message,
      category:      emergencyResult.category,
      matchedPhrase: emergencyResult.matchedPhrase,
      contact: {
        name:   conv.extractedFields.fullName,
        mobile: conv.extractedFields.mobile,
      },
      now,
    });

    await updateConversation(conv.id, {
      currentStep: 'EMERGENCY',
      messages: [
        ...conv.messages,
        { role: 'user', content: '[EMERGENCY MESSAGE]', timestamp: now.toISOString(), step: conv.currentStep },
        { role: 'assistant', content: replyToPatient, timestamp: now.toISOString(), step: 'EMERGENCY' },
      ],
    });

    return {
      reply:      replyToPatient,
      step:       'EMERGENCY',
      isEmergency: true,
      isDone:      false,
      // Show the follow-on as a quick reply option
      quickReplies: [followOnMessage],
    };
  }

  // ── 2. Load or Create Conversation ────────────────────────────────────────
  let conv = await getConversationBySession(sessionId);

  if (!conv) {
    const leadId = newId();
    const convId = newId();
    const lead   = makeNewLead(leadId, req);
    await createLead(lead);
    conv = makeNewConversation(convId, leadId, sessionId);
    await createConversation(conv);
  }

  const lead = await getLead(conv.leadId);
  if (!lead) throw new Error(`Lead ${conv.leadId} not found`);

  // ── 3. Guard: Max turns ────────────────────────────────────────────────────
  if (conv.turnCount >= MAX_TURNS) {
    return {
      reply:       `Thanks ${conv.extractedFields.fullName ?? 'for chatting'}! Our team will be in touch shortly.`,
      step:        'DONE',
      isEmergency: false,
      isDone:      true,
    };
  }

  // ── 4. Human Request ───────────────────────────────────────────────────────
  if (isHumanRequest(message)) {
    await updateConversation(conv.id, { currentStep: 'HUMAN_REQUESTED' });

    return {
      reply: `Of course! Leave your name and number and we'll call you right away. Our team is available Mon–Fri, 08:30–18:00.`,
      step:       'HUMAN_REQUESTED',
      isEmergency: false,
      isDone:      false,
    };
  }

  // ── 5. HUMAN_REQUESTED follow-up: extract name+number and finish ──────────
  if (conv.currentStep === 'HUMAN_REQUESTED') {
    // Try to extract phone from the message
    const phoneMatch = message.match(/(?:\+?44|0)7\d{9}/);
    const validation = phoneMatch
      ? validateAndNormaliseMobile(phoneMatch[0])
      : { valid: false, error: 'no phone found' };

    if (validation.valid && validation.e164) {
      const fields = { ...conv.extractedFields, mobile: validation.e164 };
      await updateConversation(conv.id, { currentStep: 'DONE', extractedFields: fields });
      await updateLead(conv.leadId, { mobile: validation.e164, status: 'QUALIFIED' });
      await sendReceptionCallbackAlert(lead, fields, 'HUMAN_REQUESTED');
    }

    return {
      reply: `Got it! One of our team will call you as soon as possible — usually within the hour during opening hours. ${validation.error ? 'Could I confirm your mobile number?' : 'Have a great day! 😊'}`,
      step:  'DONE',
      isEmergency: false,
      isDone: true,
    };
  }

  // ── 6. Off-script detection ────────────────────────────────────────────────
  const currentStep = conv.currentStep;
  if (isOffScript(message, currentStep) && conv.turnCount > 0) {
    const offScriptReply = await handleOffScript(
      message,
      currentStep,
      conv.extractedFields.fullName,
    );

    const messages = [
      ...conv.messages,
      { role: 'user' as const, content: message, timestamp: now.toISOString(), step: currentStep },
      { role: 'assistant' as const, content: offScriptReply, timestamp: now.toISOString(), step: currentStep },
    ];

    await updateConversation(conv.id, { messages, turnCount: conv.turnCount + 1 });

    const stepDef = getStepDefinition(currentStep);
    return {
      reply:        offScriptReply,
      step:         currentStep,
      isEmergency:  false,
      isDone:       false,
      quickReplies: stepDef?.quickReplies ? [...stepDef.quickReplies] : undefined,
    };
  }

  // ── 7. Extract field from user message ────────────────────────────────────
  let updatedFields = { ...conv.extractedFields };
  let phoneError: string | undefined;

  if (currentStep !== 'GREETING' && currentStep !== 'CONFIRM') {
    // Special case: phone validation
    if (currentStep === 'CONTACT') {
      const phoneMatch = message.match(/(?:\+?44|0)7\d{9}|07\d{9}/);
      if (phoneMatch) {
        const validation = validateAndNormaliseMobile(phoneMatch[0]);
        if (validation.valid && validation.e164) {
          updatedFields.mobile = validation.e164;
        } else {
          phoneError = validation.error;
        }
      } else {
        // Check if it looks like a phone attempt
        const looksLikePhone = /\d{7,}/.test(message);
        if (looksLikePhone) {
          phoneError = `I couldn't recognise that as a valid UK mobile. Please use a number starting with 07 (e.g. 07700 900000).`;
        }
      }
      // Also extract email if present
      const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) updatedFields.email = emailMatch[0];
    } else {
      const extraction = await extractField(currentStep, message, updatedFields);
      if (extraction.value) {
        const fieldKey = getFieldForStep(currentStep);
        if (fieldKey) {
          (updatedFields as Record<string, unknown>)[fieldKey] = extraction.value;
        }
        if (extraction.extra) {
          updatedFields = { ...updatedFields, ...extraction.extra };
        }
      }
    }
  }

  // ── 8. Advance to next step ────────────────────────────────────────────────
  let nextStep: ConversationStep = currentStep;

  if (currentStep === 'GREETING') {
    nextStep = 'TREATMENT';
  } else if (phoneError) {
    nextStep = currentStep; // Stay on CONTACT step
  } else {
    nextStep = getNextStep(currentStep);
  }

  const isDone = isTerminalStep(nextStep) || nextStep === 'DONE';

  // ── 9. Phrase the reply ────────────────────────────────────────────────────
  let reply: string;
  const callbackTime = computeCallbackTime(now);
  const nextStepDef  = getStepDefinition(nextStep);

  if (phoneError) {
    reply = phoneError;
  } else if (isDone) {
    reply = await phraseStepReply({
      stepDef:         getStepDefinition('CONFIRM')!,
      history:         conv.messages,
      callbackTime,
      extractedFields: updatedFields,
    });
  } else if (nextStepDef) {
    reply = await phraseStepReply({
      stepDef:         nextStepDef,
      history:         conv.messages,
      callbackTime,
      extractedFields: updatedFields,
    });
  } else {
    reply = `Thanks! Our team will be in touch at ${callbackTime}. 😊`;
  }

  // ── 10. Persist conversation + lead ───────────────────────────────────────
  const newMessages = [
    ...conv.messages,
    { role: 'user' as const, content: message, timestamp: now.toISOString(), step: currentStep },
    { role: 'assistant' as const, content: reply, timestamp: now.toISOString(), step: nextStep },
  ];

  await updateConversation(conv.id, {
    currentStep:     nextStep,
    messages:        newMessages,
    extractedFields: updatedFields,
    turnCount:       conv.turnCount + 1,
  });

  // Sync fields to lead document
  const leadPatch: Partial<Lead> = {
    treatment:           updatedFields.treatment,
    timeline:            updatedFields.timeline,
    history:             updatedFields.history,
    fullName:            updatedFields.fullName,
    mobile:              updatedFields.mobile,
    email:               updatedFields.email,
    preferredDay:        updatedFields.preferredDay,
    preferredTimeWindow: updatedFields.preferredTimeWindow,
    consentGiven:        updatedFields.consentGiven ?? false,
  };

  if (updatedFields.mobile) {
    leadPatch.status = 'QUALIFIED';
    leadPatch.score  = scoreFromTimeline(updatedFields.timeline);
    leadPatch.statusHistory = [
      ...(lead.statusHistory ?? []),
      makeHistoryEntry(lead.status, 'QUALIFIED', 'SYSTEM'),
    ];
  } else {
    leadPatch.status = 'QUALIFYING';
  }

  await updateLead(conv.leadId, leadPatch);

  // ── 11. On completion: send confirmation + alert reception → W3 ───────────
  if (isDone && updatedFields.mobile && updatedFields.fullName) {
    const finalLead = { ...lead, ...leadPatch };
    await onQualificationComplete(finalLead as Lead, updatedFields as LeadQualificationFields, callbackTime);
  }

  // ── 12. Return response ────────────────────────────────────────────────────
  const stepDef = getStepDefinition(nextStep);
  return {
    reply,
    step:         nextStep,
    isEmergency:  false,
    isDone,
    quickReplies: stepDef?.quickReplies ? [...stepDef.quickReplies] : undefined,
    showConsentCheckbox: nextStep === 'NAME',
  };
}

// ─── Qualification Complete ───────────────────────────────────────────────────

async function onQualificationComplete(
  lead: Lead,
  fields: LeadQualificationFields,
  callbackTime: string,
): Promise<void> {
  const { messageTemplates, leadDentist } = clinicConfig;

  // Send instant confirmation to patient
  const confirmationMsg = renderTemplate(messageTemplates.leadConfirmation, {
    name:         fields.fullName,
    dentist:      leadDentist,
    callbackTime,
  });

  await sendWhatsAppWithSmsFallback(
    lead.id,
    fields.mobile,
    confirmationMsg,
    'LEAD_CONFIRMATION',
    'BOOKING_CONFIRMATION',
  );

  // Send lead summary to reception
  await sendReceptionCallbackAlert(lead, fields, 'QUALIFIED');

  // Trigger Workflow 3: Deposit
  try {
    await triggerDepositWorkflow(lead.id);
  } catch (err) {
    logger.error({ leadId: lead.id, err: String(err) }, 'Failed to trigger W3 deposit workflow');
  }
}

async function sendReceptionCallbackAlert(
  lead: Lead,
  fields: Partial<LeadQualificationFields>,
  source: string,
): Promise<void> {
  const score = scoreFromTimeline(fields.timeline);
  const priority = score === 'HOT' ? '🔴 HOT LEAD — ' : score === 'WARM' ? '🟡 ' : '';

  const body = [
    `${priority}New consultation enquiry`,
    ``,
    `Name:          ${fields.fullName ?? 'Not collected'}`,
    `Mobile:        ${fields.mobile ? '•••••• (logged)' : 'Not collected'}`,
    `Treatment:     ${fields.treatment ?? 'Not specified'}`,
    `Timeline:      ${fields.timeline ?? 'Not specified'}`,
    `History:       ${fields.history ?? 'Not specified'}`,
    `Preferred:     ${fields.preferredDay ?? ''} ${fields.preferredTimeWindow ?? ''}`.trim(),
    `Score:         ${score}`,
    `Source:        ${lead.source} / ${lead.sourcePage ?? 'unknown page'}`,
    `Time:          ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`,
    `Lead ID:       ${lead.id}`,
    ``,
    score === 'HOT'
      ? `📞 CALL FIRST — this lead wants to start IMMEDIATELY.`
      : `📞 Call within the hour during opening times.`,
    `tel:${fields.mobile ?? ''}`,
  ].join('\n');

  await sendReceptionEmail({
    leadId:   lead.id,
    subject:  `${priority}New consultation enquiry — ${fields.fullName ?? 'Unknown'} (${score})`,
    body,
    template: 'RECEPTION_LEAD_SUMMARY',
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNewLead(id: string, req: ChatMessageRequest): Lead {
  const now = new Date().toISOString();
  return {
    id,
    status:        'NEW',
    emergency:     false,
    source:        'CHAT_WIDGET',
    sourcePage:    req.sourcePage,
    consentGiven:  false,
    optOut:        false,
    doNotContact:  false,
    reviewMessageCount: 0,
    reviewLinkClicked:  false,
    createdAt:     now,
    updatedAt:     now,
    statusHistory: [makeHistoryEntry(null, 'NEW', 'SYSTEM')],
  };
}

function makeNewConversation(
  id: string,
  leadId: string,
  sessionId: string,
): Conversation {
  const now = new Date().toISOString();
  return {
    id,
    leadId,
    sessionId,
    currentStep:     'GREETING',
    messages:        [],
    extractedFields: {},
    createdAt:       now,
    updatedAt:       now,
    turnCount:       0,
  };
}

function getFieldForStep(step: ConversationStep): keyof LeadQualificationFields | null {
  const map: Partial<Record<ConversationStep, keyof LeadQualificationFields>> = {
    TREATMENT: 'treatment',
    TIMELINE:  'timeline',
    HISTORY:   'history',
    NAME:      'fullName',
    CONTACT:   'mobile',
    SCHEDULE:  'preferredDay',
  };
  return map[step] ?? null;
}
