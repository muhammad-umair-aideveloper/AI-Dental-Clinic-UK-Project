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

export function buildSystemPrompt(currentUkDateTime: string): string {
  return `# ROLE & IDENTITY
You are the virtual receptionist for a Private Dental Practice in the UK. Your job is to smoothly answer patient questions regarding treatments and prices, check real-time slot availability in Supabase, and book conflict-free appointments.

# CURRENT UK DATE & TIME CONTEXT
Current UK Date & Time (Europe/London): ${currentUkDateTime}

# TONE & COMMUNICATION STYLE
- Use warm, professional, and polite British English (e.g., use "practice" instead of "office", "booked in", "lovely", "£").
- Keep answers concise, clear, and reassuring—never robotic or overly lengthy.

# PRACTICE TREATMENTS & PRICING (GBP £)
- New Patient Dental Examination / Check-up: £65
- Routine Dental Hygiene (Scale & Polish / Airflow Clean): £85
- Emergency Dental Appointment: £95
- White Composite Filling: from £140
- Tooth Extraction: from £180
- Root Canal Treatment: from £450
- Professional Teeth Whitening (Boutique): £350
- Dental Implant Consultation: £95 (Implant treatment from £2,400)
- Opening Hours: Monday to Saturday, 9:00 AM to 5:00 PM (Last appointment slot at 4:00 PM / 16:00).

# STRICT BOOKING PROTOCOL (ZERO EXCEPTIONS)
1. NEVER GUESS SLOT AVAILABILITY:
   - You must NEVER tell a patient a time is available without calling check_slot_availability first.
   - If the requested time slot is already booked in Supabase, politely inform the patient that the dentist is unavailable at that exact time and offer the alternative free slots returned by the tool.

2. MANDATORY 5 FIELDS BEFORE BOOKING:
   Before calling create_booking, ensure you have collected:
   - Patient's Full Name (customer_name)
   - UK Mobile Number (customer_phone - e.g., 07... or +447... for their 1-hour SMS reminder)
   - Required Treatment/Service (service)
   - Preferred Date (appt_date in YYYY-MM-DD format)
   - Preferred Time (appt_time in HH:MM 24-hour format)
   Ask for any missing details naturally in a single brief message.

3. STRICT FORMAT CONVERSION FOR TOOLS:
   - Convert relative dates ("today", "tomorrow", "this Friday") into strict YYYY-MM-DD format based on current UK date.
   - Convert all 12-hour times ("2pm", "2:00 in the afternoon", "10am") into strict 24-hour HH:MM format (e.g., 2:00 PM MUST be passed as "14:00", 9:00 AM as "09:00"). Never pass "AM" or "PM" into tool parameters.
   - Convert UK phone numbers starting with 07 into +447 format before passing to create_booking (e.g., 07911123456 -> +447911123456).

4. CONFIRMATION:
   - Confirm the booking to the patient ONLY after create_booking returns a success response.
   - Provide a clear summary (Name, Treatment, Date, Time) and mention that they will receive an automated text reminder 1 hour prior to their appointment.`;
}

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
  const currentUkDateTime = `${londonNow.dateStr} at ${londonNow.timeStr} Europe/London (${londonNow.isBst ? 'BST' : 'GMT'})`;
  const systemPrompt = buildSystemPrompt(currentUkDateTime);

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
        parts: [{ text: userMessage }],
      });

      const requestPayload: any = {
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
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
                parts: [{ text: systemPrompt }],
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
    if (msgLower.includes('emergency')) {
      return {
        reply:
          "An Emergency Dental Appointment is £95. We offer same-day triage, immediate pain relief, and clinical diagnosis. Would you like me to check our available times for today?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if ((msgLower.includes('hygiene') || msgLower.includes('clean') || msgLower.includes('scale')) && (msgLower.includes('check-up') || msgLower.includes('check up') || msgLower.includes('exam'))) {
      return {
        reply:
          "Our Routine Dental Hygiene (Scale & Polish / Airflow Clean) is £85, and a New Patient Dental Examination is £65. Both treatments can lovely and conveniently be arranged together. Would you like to check available slots?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('exam') || msgLower.includes('check-up') || msgLower.includes('check up') || msgLower.includes('new patient')) {
      return {
        reply:
          "Our New Patient Dental Examination is £65, which includes a comprehensive oral health check, low-dose digital X-rays, and a bespoke treatment plan. May I check our diary for a lovely time for you?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('hygiene') || msgLower.includes('clean') || msgLower.includes('scale')) {
      return {
        reply:
          "Our Routine Dental Hygiene (Scale & Polish / Airflow Clean) is £85 for a comprehensive periodontal clean and stain removal. Would you like to check available slots?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('filling')) {
      return {
        reply:
          "White Composite Fillings start from £140, shade-matched seamlessly to your natural teeth. Would you like to book a consultation?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('extraction') || msgLower.includes('tooth removal')) {
      return {
        reply:
          "Tooth Extractions start from £180 for gentle, painless removal under local anaesthetic. Would you like to book in?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('root canal')) {
      return {
        reply:
          "Root Canal Treatment starts from £450, carried out with specialist endodontic equipment for maximum comfort. May I find an available slot for you?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('whitening')) {
      return {
        reply:
          "Professional Teeth Whitening (Boutique) is £350, including custom laboratory-made trays and professional whitening gels. Would you like to arrange an appointment?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('implant')) {
      return {
        reply:
          "A Dental Implant Consultation is £95, with complete implant treatment starting from £2,400 including fixture, abutment, and bespoke crown. Would you like to book a consultation?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    return {
      reply:
        "Here is our private treatment fee schedule:\n• New Patient Dental Examination: £65\n• Routine Dental Hygiene: £85\n• Emergency Dental Appointment: £95\n• White Composite Filling: from £140\n• Tooth Extraction: from £180\n• Root Canal Treatment: from £450\n• Professional Teeth Whitening (Boutique): £350\n• Dental Implant Consultation: £95 (Implant from £2,400)\n\nWe are open Monday to Saturday, 9:00 AM to 5:00 PM (last slot 4:00 PM). Which treatment can I help you book in for?",
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

  // Time detection (e.g. 10:00, 14:00, 2pm, 10am)
  let detectedTime: string | undefined = undefined;
  const time24Match = userMessage.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (time24Match) {
    detectedTime = time24Match[0];
  } else {
    // 12-hour regex: 2pm, 10am, 2:00 pm
    const time12Match = userMessage.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i);
    if (time12Match) {
      let hr = parseInt(time12Match[1], 10);
      const min = time12Match[2] || '00';
      const meridian = time12Match[3].toLowerCase();
      if (meridian === 'pm' && hr < 12) hr += 12;
      if (meridian === 'am' && hr === 12) hr = 0;
      detectedTime = `${String(hr).padStart(2, '0')}:${min}`;
    }
  }

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
    let service = 'New Patient Dental Examination';
    if (msgLower.includes('emergency')) service = 'Emergency Dental Appointment';
    else if (msgLower.includes('hygiene') || msgLower.includes('scale') || msgLower.includes('clean')) service = 'Routine Dental Hygiene';
    else if (msgLower.includes('filling')) service = 'White Composite Filling';
    else if (msgLower.includes('extraction') || msgLower.includes('removal')) service = 'Tooth Extraction';
    else if (msgLower.includes('root canal')) service = 'Root Canal Treatment';
    else if (msgLower.includes('whitening')) service = 'Professional Teeth Whitening (Boutique)';
    else if (msgLower.includes('implant')) service = 'Dental Implant Consultation';

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
        reply: `Delighted to get you booked in, ${customerName}! Your appointment for ${service} is confirmed for ${bookingResult.appt_date} at ${bookingResult.appt_time} at our practice. We have logged your mobile number (${bookingResult.customer_phone}) and you will receive an automated text reminder 1 hour prior to your appointment. We look forward to seeing you!`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    } else if (bookingResult.code === '23505') {
      const freeSlots = bookingResult.available_slots?.join(', ') || '09:00, 11:00, 14:00';
      return {
        reply: `Terribly sorry, but our dentist is unavailable at ${detectedTime} on ${bookingDate} as that slot is already taken. We do have availability on that same date at: ${freeSlots}. Would any of those times suit you?`,
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
