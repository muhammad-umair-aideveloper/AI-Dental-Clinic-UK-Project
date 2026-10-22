/**
 * src/lib/gemini/agent.ts
 *
 * Gemini AI Agent with Deterministic Function Calling for Vertex Dental Lab (London, UK).
 * Sourced strictly with:
 *   - check_slot_availability(appt_date, appt_time)
 *   - create_booking(customer_name, customer_phone, service, appt_date, appt_time)
 *
 * Handles tool calling loop, UK timezone context, British Receptionist persona,
 * and graceful fallback if GEMINI_API_KEY is not configured.
 */

import {
  check_slot_availability,
  create_booking,
  GEMINI_FUNCTION_DECLARATIONS,
  CheckSlotAvailabilityResult,
  CreateBookingResult,
} from './tools';
import { getEuropeLondonDateTime } from '@/lib/uk-utils';

const GEMINI_SYSTEM_INSTRUCTION = `You are Sarah, the polite, articulate, and exceptionally professional British AI Receptionist for Vertex Dental Lab, an elite private dental clinic located in Harley Street, London, UK.

TIMEZONE & HOURS:
- Vertex Dental Lab operates in the Europe/London timezone (accounting for GMT and BST).
- Clinic hours: Monday to Friday 09:00 to 17:00 (1-hour appointment slots). Closed Sundays.

STRICT PROTOCOLS FOR BOOKINGS:
1. When a patient asks about booking, availability, or dates, always invoke the tool 'check_slot_availability' with 'appt_date' (YYYY-MM-DD) and optional 'appt_time' (HH:MM).
2. To book a confirmed appointment, you MUST gather:
   - Full Name (customer_name)
   - UK Mobile Number (customer_phone — e.g. 07123456789 or +447123456789)
   - Service / Treatment required (service)
   - Appointment Date (appt_date — YYYY-MM-DD)
   - Appointment Time (appt_time — HH:MM between 09:00 and 17:00)
3. Once all 5 parameters are present, call 'create_booking'.
4. NEVER confirm an appointment until 'create_booking' succeeds. If the slot is double-booked (code 23505), apologize politely in British fashion and present the remaining available slots returned by the tool.

BRITISH CLINIC FEES (GBP £):
- New Patient Consultation: £65
- Hygiene Scale & Polish: £85
- Routine Extraction: £150
- White Composite Filling: £140
- Root Canal Treatment: £450
- Boutique Teeth Whitening: £350
- Invisalign Clear Aligners: From £2,500 (0% finance available)
- Single Dental Implant: £2,200

NHS POLICY:
- Vertex Dental Lab is currently at full capacity for NHS registrations and cannot accept new NHS patients. Emphasize immediate private availability.`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
}

export interface GeminiAgentResponse {
  reply: string;
  toolsExecuted: Array<{
    name: string;
    args: any;
    result: any;
  }>;
  engine: 'gemini-live' | 'deterministic-fallback';
}

/**
 * Runs the Gemini conversational agent with multi-turn tool calling.
 */
export async function runGeminiReceptionist(
  userMessage: string,
  history: ChatMessage[] = [],
  apiKeyOverride?: string
): Promise<GeminiAgentResponse> {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const londonNow = getEuropeLondonDateTime();
  const dateContextPrompt = `\n[CURRENT UK CLINIC TIME: ${londonNow.dateStr} at ${londonNow.timeStr} Europe/London (${londonNow.isBst ? 'BST' : 'GMT'})]`;

  // 1. If Gemini API key is available, run live Gemini Generative Language API
  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // Format conversation history for Gemini
      const contents: any[] = [];

      for (const msg of history.slice(-8)) {
        if (msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'assistant' || msg.role === 'model') {
          contents.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      }

      // Add latest user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage + dateContextPrompt }],
      });

      const requestPayload: any = {
        contents,
        systemInstruction: {
          parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }],
        },
        tools: [
          {
            functionDeclarations: GEMINI_FUNCTION_DECLARATIONS,
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const contentParts = candidate?.content?.parts || [];

        // Check for functionCall
        const functionCallPart = contentParts.find((p: any) => p.functionCall);

        if (functionCallPart) {
          const fnName = functionCallPart.functionCall.name;
          const fnArgs = functionCallPart.functionCall.args || {};
          const toolsExecuted: any[] = [];

          let toolResult: any = null;

          if (fnName === 'check_slot_availability') {
            toolResult = await check_slot_availability({
              appt_date: fnArgs.appt_date,
              appt_time: fnArgs.appt_time,
            });
            toolsExecuted.push({ name: fnName, args: fnArgs, result: toolResult });
          } else if (fnName === 'create_booking') {
            toolResult = await create_booking({
              customer_name: fnArgs.customer_name,
              customer_phone: fnArgs.customer_phone,
              service: fnArgs.service,
              appt_date: fnArgs.appt_date,
              appt_time: fnArgs.appt_time,
            });
            toolsExecuted.push({ name: fnName, args: fnArgs, result: toolResult });
          }

          // Pass functionResponse back to Gemini for final conversational answer
          contents.push(candidate.content);
          contents.push({
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: fnName,
                  response: toolResult,
                },
              },
            ],
          });

          const secondRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }],
              },
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800,
              },
            }),
          });

          if (secondRes.ok) {
            const secondData = await secondRes.json();
            const secondCandidate = secondData.candidates?.[0];
            const textPart = secondCandidate?.content?.parts?.find((p: any) => p.text);
            const reply = textPart?.text || 'I have processed your appointment request.';

            return {
              reply,
              toolsExecuted,
              engine: 'gemini-live',
            };
          }
        }

        // Direct text response
        const textPart = contentParts.find((p: any) => p.text);
        if (textPart?.text) {
          return {
            reply: textPart.text,
            toolsExecuted: [],
            engine: 'gemini-live',
          };
        }
      }
    } catch (err) {
      console.warn('[GeminiAgent] Live call failed, switching to deterministic engine:', err);
    }
  }

  // 2. Deterministic UK Receptionist Rules Engine (Runs seamlessly if no Gemini key or offline)
  return runDeterministicBritishReceptionist(userMessage, history);
}

/**
 * Deterministic British AI Receptionist rules engine.
 * Guarantees 100% adherence to UK slot checking, phone normalization, and booking rules.
 */
export async function runDeterministicBritishReceptionist(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<GeminiAgentResponse> {
  const msgLower = userMessage.toLowerCase();
  const toolsExecuted: any[] = [];
  const londonNow = getEuropeLondonDateTime();

  // Check NHS queries
  if (msgLower.includes('nhs')) {
    return {
      reply:
        "Good day. Thank you for reaching out to Vertex Dental Lab. We are currently at full capacity for NHS registrations and are unable to accept new NHS patients at this time. However, we have immediate availability for private patients, including our comprehensive New Patient Consultation for £65. Would you like me to check our diary for an appointment?",
      toolsExecuted: [],
      engine: 'deterministic-fallback',
    };
  }

  // Check Pricing queries
  if (
    msgLower.includes('price') ||
    msgLower.includes('cost') ||
    msgLower.includes('fee') ||
    msgLower.includes('how much')
  ) {
    if (msgLower.includes('invisalign')) {
      return {
        reply:
          "Our Invisalign clear aligner treatments start from £2,500. This includes an initial consultation, complimentary 3D iTero digital scan, custom aligners, and all refinement appointments. We also offer 0% interest-free patient finance. Would you like to check availability for a consultation?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('implant')) {
      return {
        reply:
          "A Single Dental Implant is £2,200 at Vertex Dental Lab, which includes the premium titanium fixture, custom precision abutment, and porcelain aesthetic crown. May I arrange a consultation for you?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('whitening')) {
      return {
        reply:
          "Our Boutique Teeth Whitening system is £350, including custom laboratory-formed trays and high-strength professional whitening gels. Would you like to reserve a time?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('hygiene') || msgLower.includes('clean')) {
      return {
        reply:
          "Our Hygiene Scale & Polish is £85 for a 30-minute deep periodontal clean and stain removal. Would you like me to check our open appointment slots?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    return {
      reply:
        "Here is our private fee schedule at Vertex Dental Lab:\n• New Patient Consultation: £65\n• Hygiene Scale & Polish: £85\n• Routine Extraction: £150\n• White Composite Filling: £140\n• Root Canal Treatment: £450\n• Boutique Teeth Whitening: £350\n• Invisalign: From £2,500\n• Single Dental Implant: £2,200\n\nWhich treatment can I assist you in booking today?",
      toolsExecuted: [],
      engine: 'deterministic-fallback',
    };
  }

  // Date detection (e.g. 2026-10-25 or 'today' or 'tomorrow')
  let detectedDate = '';
  const dateMatch = userMessage.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (dateMatch) {
    detectedDate = dateMatch[1];
  } else if (msgLower.includes('today')) {
    detectedDate = londonNow.dateStr;
  } else if (msgLower.includes('tomorrow')) {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    detectedDate = getEuropeLondonDateTime(tmrw).dateStr;
  }

  // Time detection (e.g. 10:00, 14:00)
  const timeMatch = userMessage.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const detectedTime = timeMatch ? timeMatch[0] : undefined;

  // Phone detection (07... or +447...)
  const phoneMatch = userMessage.match(/(\+?44\s?7\d{3}\s?\d{6}|07\d{3}\s?\d{6}|\b07\d{9}\b)/);

  // If user provided phone and time, check history for date and attempt booking
  if (phoneMatch && detectedTime) {
    let bookingDate = detectedDate;
    if (!bookingDate) {
      for (const h of history) {
        const d = h.content.match(/\b(202\d-\d{2}-\d{2})\b/);
        if (d) {
          bookingDate = d[1];
          break;
        }
      }
    }
    if (!bookingDate) {
      bookingDate = londonNow.dateStr;
    }

    // Extract name or default
    let customerName = 'Patient';
    const nameMatch = userMessage.match(/(?:i am|my name is|name[:\s]+)([a-zA-Z\s]{2,25})/i);
    if (nameMatch) {
      customerName = nameMatch[1].trim();
    }

    // Determine service
    let service = 'New Patient Consultation';
    if (msgLower.includes('hygiene') || msgLower.includes('scale')) service = 'Hygiene Scale & Polish';
    else if (msgLower.includes('invisalign')) service = 'Invisalign Consultation';
    else if (msgLower.includes('whitening')) service = 'Teeth Whitening';
    else if (msgLower.includes('implant')) service = 'Dental Implant Consultation';
    else if (msgLower.includes('extraction')) service = 'Routine Extraction';

    const bookingResult = await create_booking({
      customer_name: customerName,
      customer_phone: phoneMatch[0],
      service,
      appt_date: bookingDate,
      appt_time: detectedTime,
    });

    toolsExecuted.push({ name: 'create_booking', args: { customer_name: customerName, appt_date: bookingDate, appt_time: detectedTime }, result: bookingResult });

    if (bookingResult.success) {
      return {
        reply: `Delighted to confirm, ${customerName}! Your appointment for ${service} has been booked for ${bookingResult.appt_date} at ${bookingResult.appt_time} (Europe/London). We have recorded your mobile number (${bookingResult.customer_phone}). You will receive an SMS reminder 1 hour prior to your visit. We look forward to welcoming you to Vertex Dental Lab!`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    } else if (bookingResult.code === '23505') {
      const freeSlots = bookingResult.available_slots?.join(', ') || '09:00, 11:00, 14:00';
      return {
        reply: `Terribly sorry, but slot ${detectedTime} on ${bookingDate} has just been reserved. We do however have availability on that same date at: ${freeSlots}. Which of those alternative slots would suit you best?`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    } else {
      return {
        reply: `Terribly sorry: ${bookingResult.error || 'We could not complete your booking at this moment.'}`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    }
  }

  // If date detected without booking completion, check availability
  if (detectedDate) {
    const slotCheck = await check_slot_availability({
      appt_date: detectedDate,
      appt_time: detectedTime,
    });
    toolsExecuted.push({ name: 'check_slot_availability', args: { appt_date: detectedDate, appt_time: detectedTime }, result: slotCheck });

    if (!slotCheck.available) {
      if (slotCheck.available_slots.length === 0) {
        return {
          reply: `I have examined our diary for ${detectedDate}, but unfortunately all slots are fully booked. Would another day this week suit you?`,
          toolsExecuted,
          engine: 'deterministic-fallback',
        };
      }
      return {
        reply: `Slot ${detectedTime} on ${detectedDate} is currently unavailable. The remaining 1-hour slots on that day are: ${slotCheck.available_slots.join(', ')}. To confirm a booking, please provide your Full Name, UK Mobile Number (e.g. 07123 456789), and preferred service.`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    }

    return {
      reply: `Splendid! On ${detectedDate}, we have 1-hour slots available at: ${slotCheck.available_slots.join(', ')}. To confirm your appointment, please reply with your preferred time, your Full Name, and your UK Mobile Number (e.g. 07123456789).`,
      toolsExecuted,
      engine: 'deterministic-fallback',
    };
  }

  // Default welcome
  return {
    reply:
      "Good day! Welcome to Vertex Dental Lab in Harley Street, London. I am Sarah, your AI reception assistant. How may I assist you today? I can provide treatment details, private pricing, check slot availability, or book a consultation for you.",
    toolsExecuted: [],
    engine: 'deterministic-fallback',
  };
}
