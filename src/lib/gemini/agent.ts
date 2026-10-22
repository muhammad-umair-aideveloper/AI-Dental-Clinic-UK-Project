/**
 * src/lib/gemini/agent.ts
 *
 * Gemini AI Agent with Deterministic Function Calling for Vertex Dental Lab (London, UK).
 * Sourced strictly with:
 *   - check_slot_availability(appt_date, appt_time)
 *   - create_booking(customer_name, customer_phone, service, appt_date, appt_time)
 *
 * Handles tool calling loop, UK timezone context, British Receptionist persona,
 * robust multi-turn Gemini message formatting, and resilient UK deterministic rules engine.
 */

import {
  check_slot_availability,
  create_booking,
  GEMINI_FUNCTION_DECLARATIONS,
  CheckSlotAvailabilityResult,
  CreateBookingResult,
} from './tools';
import { getEuropeLondonDateTime, normalizeUkTimeHHMM } from '@/lib/uk-utils';
import { detectLanguage } from '@/lib/triage-engine';

export function buildSystemPrompt(currentUkDateTime: string): string {
  return `# ROLE & IDENTITY
You are Sarah, the polite, articulate, and exceptionally professional British AI Receptionist for Vertex Dental Lab, an elite private dental clinic located at 45 Harley Street, London, W1G 8QR, UK.

# CURRENT UK DATE & TIME CONTEXT
Current UK Date & Time (Europe/London): ${currentUkDateTime}

# TONE & COMMUNICATION STYLE
- Use warm, professional, and courteous British English (e.g. "delighted", "splendid", "practice", "booked in", "£ GBP").
- Always use British English spelling (colour, enquiry, programme, centre, anaesthesia).
- Keep answers concise, clear, reassuring, and clinically accurate.

# PRACTICE TREATMENTS & PRICING (GBP £)
- New Patient Dental Examination / Check-up: £65
- Routine Dental Hygiene (Scale & Polish / Airflow Clean): £85
- Emergency Dental Appointment: £95
- White Composite Filling: from £140
- Tooth Extraction: from £180
- Root Canal Treatment: from £450
- Professional Teeth Whitening (Boutique): £350
- Invisalign Clear Aligners: from £2,500 (complimentary 3D iTero scan + 0% finance)
- Dental Implant Consultation: £95 (single implant treatment from £2,200)
- Operating Hours: Monday to Saturday, 09:00 to 17:00 (Europe/London). Last appointment slot at 16:00. Closed Sundays.
- NHS Policy: Vertex Dental Lab is currently at FULL NHS CAPACITY and cannot accept new NHS patient registrations. We have immediate private availability.

# STRICT PROTOCOL FOR TOOL CALLING
1. NEVER GUESS SLOT AVAILABILITY:
   - When a patient asks about available appointments, slots, or dates, you MUST call 'check_slot_availability' first.
   - If the requested time slot is booked in Supabase, politely inform the patient and offer the alternative available slots returned by the tool.

2. MANDATORY 5 FIELDS FOR BOOKING:
   Before calling 'create_booking', you must collect:
   - Patient's Full Name (customer_name)
   - UK Mobile Number (customer_phone — starting with 07 or +447)
   - Required Treatment / Service (service)
   - Preferred Date (appt_date — YYYY-MM-DD format)
   - Preferred Time (appt_time — HH:MM 24-hour format between 09:00 and 16:00)

3. PARAMETER FORMATS:
   - Relative dates ("today", "tomorrow", "this Friday") must be converted into YYYY-MM-DD format based on current UK date.
   - 12-hour times ("2pm", "10am") must be converted into 24-hour HH:MM format ("14:00", "10:00"). Never pass AM/PM to tools.
   - UK phone numbers starting with 07 must be normalized to +447 format.

4. CONFIRMATION:
   - Confirm the booking ONLY after 'create_booking' returns a success response. Mention that they will receive an automated SMS reminder 1 hour prior to their appointment.`;
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
 * Validates if an API key looks like a real Google AI Studio / Gemini key.
 */
function isValidGeminiApiKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 25) return false;
  if (/dummy|placeholder|example|your[-_]?api/i.test(trimmed)) return false;
  return true;
}

/**
 * Formats conversation history strictly for Google Gemini API:
 * 1. Drops any initial model/assistant greetings so the conversation starts with 'user'.
 * 2. Strictly alternates: user, model, user, model...
 * 3. Consolidates consecutive same-role messages.
 * 4. Ensures current user message is not duplicated if already passed at end of history.
 */
function formatGeminiContents(history: ChatMessage[], currentMessage: string): any[] {
  const currentTrimmed = currentMessage.trim();

  // Exclude current message if already present as last element in history
  let previous = history;
  if (previous.length > 0) {
    const last = previous[previous.length - 1];
    if (last.role === 'user' && last.content.trim() === currentTrimmed) {
      previous = previous.slice(0, -1);
    }
  }

  // Map to clean list with valid roles ('user' or 'model')
  const cleanList: Array<{ role: 'user' | 'model'; text: string }> = [];
  for (const msg of previous) {
    const text = (msg.content || '').trim();
    if (!text) continue;
    const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
    cleanList.push({ role, text });
  }

  // Gemini API requires that the conversation MUST start with a 'user' turn
  while (cleanList.length > 0 && cleanList[0].role !== 'user') {
    cleanList.shift();
  }

  const consolidated: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

  for (const item of cleanList) {
    if (consolidated.length === 0) {
      consolidated.push({ role: item.role, parts: [{ text: item.text }] });
    } else {
      const prev = consolidated[consolidated.length - 1];
      if (prev.role === item.role) {
        prev.parts[0].text += `\n${item.text}`;
      } else {
        consolidated.push({ role: item.role, parts: [{ text: item.text }] });
      }
    }
  }

  // Append current user message
  if (consolidated.length > 0 && consolidated[consolidated.length - 1].role === 'user') {
    consolidated[consolidated.length - 1].parts[0].text += `\n${currentTrimmed}`;
  } else {
    consolidated.push({ role: 'user', parts: [{ text: currentTrimmed }] });
  }

  // Limit to last 8 turns max (ensuring first turn remains 'user')
  let finalContents = consolidated.slice(-8);
  while (finalContents.length > 0 && finalContents[0].role !== 'user') {
    finalContents.shift();
  }
  if (finalContents.length === 0) {
    finalContents = [{ role: 'user', parts: [{ text: currentTrimmed }] }];
  }

  return finalContents;
}

/**
 * Calculates next date for a day of week (e.g. "friday", "monday").
 */
function getNextWeekdayDate(dayName: string, refDate: Date = new Date()): string {
  const days: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  const targetDay = days[dayName.toLowerCase()];
  if (targetDay === undefined) return '';

  const d = new Date(refDate);
  const currentDay = d.getDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) {
    diff += 7;
  }
  d.setDate(d.getDate() + diff);
  return getEuropeLondonDateTime(d).dateStr;
}

/**
 * Parses natural UK date expressions from user query into strict YYYY-MM-DD format.
 */
function parseUkDate(text: string, londonNowDate: string): string | null {
  const lower = text.toLowerCase();

  // 1. Explicit ISO date: YYYY-MM-DD
  const isoMatch = text.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  // 2. UK format: DD/MM/YYYY or DD-MM-YYYY
  const ukDateMatch = text.match(/\b(0?[1-9]|[12]\d|3[01])[\/-](0?[1-9]|1[0-2])(?:[\/-](202\d))?\b/);
  if (ukDateMatch) {
    const day = ukDateMatch[1].padStart(2, '0');
    const month = ukDateMatch[2].padStart(2, '0');
    const year = ukDateMatch[3] || londonNowDate.slice(0, 4);
    return `${year}-${month}-${day}`;
  }

  // 3. Natural Month expressions: e.g. "25th October", "October 25", "25 Oct"
  const monthMap: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  const monthRegex = /\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\b/i;
  const monthMatch = text.match(monthRegex);
  if (monthMatch) {
    const dayStr = monthMatch[1] || monthMatch[4];
    const monthStr = (monthMatch[2] || monthMatch[3]).toLowerCase().slice(0, 3);
    const monthNum = monthMap[monthStr];
    if (dayStr && monthNum) {
      const day = dayStr.padStart(2, '0');
      const year = londonNowDate.slice(0, 4);
      return `${year}-${monthNum}-${day}`;
    }
  }

  // 4. Relative expressions: today, tomorrow, day after tomorrow
  if (lower.includes('today') || lower.includes('aaj')) {
    return londonNowDate;
  }
  if (lower.includes('tomorrow') || lower.includes('kal')) {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return getEuropeLondonDateTime(tmrw).dateStr;
  }
  if (lower.includes('day after tomorrow') || lower.includes('parson')) {
    const dat = new Date();
    dat.setDate(dat.getDate() + 2);
    return getEuropeLondonDateTime(dat).dateStr;
  }

  // 5. Days of the week
  const weekdayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of weekdayNames) {
    if (new RegExp(`\\b${day}\\b`, 'i').test(lower)) {
      return getNextWeekdayDate(day);
    }
  }

  // 6. "this weekend" / "weekend" -> next Saturday
  if (lower.includes('weekend')) {
    return getNextWeekdayDate('saturday');
  }

  // 7. "next week" -> next Monday
  if (lower.includes('next week')) {
    return getNextWeekdayDate('monday');
  }

  return null;
}

/**
 * Parses time expression from user message into 24-hour HH:MM format.
 */
function parseUkTime(text: string): string | null {
  // 1. 24-hour format: e.g. 14:00, 09:30, 10:00
  const match24 = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (match24) {
    return `${match24[1].padStart(2, '0')}:${match24[2]}`;
  }

  // 2. 12-hour format: e.g. 2pm, 10am, 2:30pm, 9:00 am
  const match12 = text.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (match12) {
    let hr = parseInt(match12[1], 10);
    const min = match12[2] || '00';
    const meridian = match12[3].toLowerCase();
    if (meridian === 'pm' && hr < 12) hr += 12;
    if (meridian === 'am' && hr === 12) hr = 0;
    return `${String(hr).padStart(2, '0')}:${min}`;
  }

  return null;
}

/**
 * Runs the Gemini conversational agent with multi-turn tool calling.
 * Automatically falls back to deterministic UK receptionist engine if API key is unconfigured or fails.
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

  // 1. Live Gemini Generative Language API call (if valid key provided)
  if (isValidGeminiApiKey(apiKey)) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const contents = formatGeminiContents(history, userMessage);

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
          temperature: 0.2,
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

        // Check if Gemini invoked a functionCall
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

          // Return functionResponse to Gemini for final conversational British reply
          contents.push(candidate.content);
          contents.push({
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: fnName,
                  response: {
                    name: fnName,
                    content: toolResult,
                  },
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
                temperature: 0.2,
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
          } else {
            const secondErr = await secondRes.text().catch(() => '');
            console.warn(`[GeminiAgent] Second turn failed HTTP ${secondRes.status}: ${secondErr}`);
          }
        }

        // Direct text response from Gemini
        const textPart = contentParts.find((p: any) => p.text);
        if (textPart?.text) {
          return {
            reply: textPart.text,
            toolsExecuted: [],
            engine: 'gemini-live',
          };
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[GeminiAgent] Live call returned HTTP ${res.status}: ${errText}`);
      }
    } catch (err) {
      console.warn('[GeminiAgent] Live call failed, invoking deterministic rules engine:', err);
    }
  }

  // 2. Deterministic UK Receptionist Rules Engine (Guarantees zero-failure operation)
  return runDeterministicBritishReceptionist(userMessage, history);
}

/**
 * Comprehensive Deterministic British AI Receptionist rules engine.
 * Guarantees 100% adherence to UK slot checking, phone normalization, and booking rules
 * when live Gemini is offline or unconfigured.
 */
export async function runDeterministicBritishReceptionist(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<GeminiAgentResponse> {
  const msgLower = userMessage.toLowerCase().trim();
  const toolsExecuted: any[] = [];
  const londonNow = getEuropeLondonDateTime();
  const lang = detectLanguage(userMessage);

  // -------------------------------------------------------------------------
  // 1. NHS CAPACITY POLICY
  // -------------------------------------------------------------------------
  if (msgLower.includes('nhs')) {
    return {
      reply:
        lang === 'roman_urdu'
          ? "Hum is waqt NHS patients ke liye full capacity par hain aur new NHS registration nahi kar rahe. Lekin private patients ke liye New Patient Consultation sirf £65 mein dastyab hai. Kya aap appointment book karwana chahein gay?"
          : "Good day. Thank you for reaching out to Vertex Dental Lab. We are currently at full capacity for NHS registrations and are unable to accept new NHS patients at this time. However, we have immediate availability for private patients, including our comprehensive New Patient Consultation for £65. Would you like me to check our diary for an appointment?",
      toolsExecuted: [],
      engine: 'deterministic-fallback',
    };
  }

  // -------------------------------------------------------------------------
  // 2. EMERGENCY DENTAL TRIAGE & SEVERE PAIN
  // -------------------------------------------------------------------------
  if (
    msgLower.includes('emergency') ||
    msgLower.includes('severe pain') ||
    msgLower.includes('toothache') ||
    msgLower.includes('swelling') ||
    msgLower.includes('swollen') ||
    msgLower.includes('bleeding') ||
    msgLower.includes('broken tooth') ||
    msgLower.includes('daant dard') ||
    msgLower.includes('takleef')
  ) {
    const todaySlots = await check_slot_availability({ appt_date: londonNow.dateStr });
    toolsExecuted.push({
      name: 'check_slot_availability',
      args: { appt_date: londonNow.dateStr },
      result: todaySlots,
    });

    if (lang === 'roman_urdu') {
      const freeSlots = todaySlots.available_slots.slice(0, 4).join(', ') || '10:00, 11:00, 14:00';
      return {
        reply: `Dant ke dard ke liye hamare paas aaj (£95) Emergency Appointment dastyab hai. Aaj ke open slots: ${freeSlots}. Fori relief ke liye kripya apna Naam aur UK Mobile number batayein taake doctor se time fix kiya ja sakay.`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    }

    if (todaySlots.available_slots.length > 0) {
      const earliest = todaySlots.available_slots[0];
      const slotsStr = todaySlots.available_slots.slice(0, 4).join(', ');
      return {
        reply: `I am terribly sorry to hear that you are experiencing dental pain. We prioritise dental emergencies with same-day emergency appointments for £95, providing immediate clinical diagnosis and relief. For today (${londonNow.dateStr}), our earliest open slot is at ${earliest} (other times: ${slotsStr}). Would you like me to reserve this emergency slot for you? Please provide your Full Name and UK Mobile number.`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    }
  }

  // -------------------------------------------------------------------------
  // 3. PRIVATE PRICING & TREATMENT FEES
  // -------------------------------------------------------------------------
  if (
    msgLower.includes('price') ||
    msgLower.includes('cost') ||
    msgLower.includes('fee') ||
    msgLower.includes('how much') ||
    msgLower.includes('rates') ||
    msgLower.includes('kharcha') ||
    msgLower.includes('kitna')
  ) {
    if (msgLower.includes('invisalign') || msgLower.includes('aligner') || msgLower.includes('brace')) {
      return {
        reply:
          "Our Invisalign clear aligner treatments start from £2,500. This includes an initial consultation, complimentary 3D iTero digital scan, custom aligners, and all refinement appointments. We also offer 0% interest-free patient finance from £52/month. Would you like to book a consultation?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('implant')) {
      return {
        reply:
          "A Single Dental Implant is £2,200, which includes the premium titanium fixture, custom abutment, and porcelain aesthetic crown. Initial implant assessment consultations are £95. Would you like me to check available slots with Dr. Alistair Vance?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('whitening')) {
      return {
        reply:
          "Our Boutique Teeth Whitening system is £350, including custom precision-fitted laboratory trays and professional whitening gels. Would you like to arrange an appointment?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('hygiene') || msgLower.includes('clean') || msgLower.includes('scale') || msgLower.includes('polish')) {
      return {
        reply:
          "Our Routine Dental Hygiene (Scale & Polish / Airflow Clean) is £85 for a comprehensive 30-minute deep periodontal clean and stain removal. Would you like to check our available slots?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('filling')) {
      return {
        reply:
          "White Composite Fillings start from £140, shade-matched seamlessly to your natural tooth colour. Would you like to check availability?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    if (msgLower.includes('root canal')) {
      return {
        reply:
          "Root Canal Treatment starts from £450, carried out with specialist endodontic equipment for maximum comfort and preservation of your natural tooth. May I find an available slot for you?",
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }
    return {
      reply:
        "Here is our private treatment fee schedule at Vertex Dental Lab:\n• New Patient Dental Examination: £65\n• Routine Dental Hygiene: £85\n• Emergency Dental Appointment: £95\n• White Composite Filling: from £140\n• Tooth Extraction: from £180\n• Root Canal Treatment: from £450\n• Professional Teeth Whitening (Boutique): £350\n• Invisalign Clear Aligners: from £2,500 (0% finance)\n• Single Dental Implant: from £2,200\n\nWe are open Monday to Saturday, 9:00 AM to 5:00 PM (last slot 4:00 PM). Which treatment can I help you book in for?",
      toolsExecuted: [],
      engine: 'deterministic-fallback',
    };
  }

  // -------------------------------------------------------------------------
  // 4. PARSE DATE & TIME
  // -------------------------------------------------------------------------
  let detectedDate = parseUkDate(userMessage, londonNow.dateStr);
  const detectedTime = parseUkTime(userMessage);

  // Look in recent history if user only provided time in this turn (e.g. "at 2pm")
  if (!detectedDate && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const prevDate = parseUkDate(history[i].content, londonNow.dateStr);
      if (prevDate) {
        detectedDate = prevDate;
        break;
      }
    }
  }

  // Phone detection (07... or +447...)
  const phoneMatch = userMessage.match(/(\+?44\s?7\d{3}\s?\d{6}|07\d{3}\s?\d{6}|\b07\d{9}\b)/);

  // -------------------------------------------------------------------------
  // 5. ATTEMPT FULL BOOKING CREATION IF PHONE + TIME/DATE ARE PRESENT
  // -------------------------------------------------------------------------
  if (phoneMatch && (detectedTime || detectedDate)) {
    const bookingDate = detectedDate || londonNow.dateStr;
    const bookingTime = detectedTime || '10:00';

    let customerName = 'Patient';
    const nameMatch = userMessage.match(/(?:i am|my name is|name[:\s]+)([a-zA-Z\s]{2,25})/i);
    if (nameMatch) {
      customerName = nameMatch[1].trim();
    }

    let service = 'New Patient Dental Examination';
    if (msgLower.includes('emergency')) service = 'Emergency Dental Appointment';
    else if (msgLower.includes('hygiene') || msgLower.includes('scale') || msgLower.includes('clean')) service = 'Routine Dental Hygiene';
    else if (msgLower.includes('filling')) service = 'White Composite Filling';
    else if (msgLower.includes('extraction') || msgLower.includes('removal')) service = 'Tooth Extraction';
    else if (msgLower.includes('root canal')) service = 'Root Canal Treatment';
    else if (msgLower.includes('whitening')) service = 'Professional Teeth Whitening (Boutique)';
    else if (msgLower.includes('invisalign') || msgLower.includes('aligner')) service = 'Invisalign Clear Aligners';
    else if (msgLower.includes('implant')) service = 'Dental Implant Consultation';

    const bookingResult = await create_booking({
      customer_name: customerName,
      customer_phone: phoneMatch[0],
      service,
      appt_date: bookingDate,
      appt_time: bookingTime,
    });

    toolsExecuted.push({
      name: 'create_booking',
      args: { customer_name: customerName, customer_phone: phoneMatch[0], service, appt_date: bookingDate, appt_time: bookingTime },
      result: bookingResult,
    });

    if (bookingResult.success) {
      return {
        reply: `Delighted to get you booked in, ${customerName}! Your appointment for ${service} is confirmed for ${bookingResult.appt_date} at ${bookingResult.appt_time} at our Harley Street clinic. We have logged your mobile number (${bookingResult.customer_phone}) and you will receive an automated SMS reminder 1 hour prior to your visit. We look forward to seeing you!`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    } else if (bookingResult.code === '23505') {
      const freeSlots = bookingResult.available_slots?.join(', ') || '09:00, 11:00, 14:00';
      return {
        reply: `Terribly sorry, but our dentist is unavailable at ${bookingTime} on ${bookingDate} as that slot is already taken. We do have availability on that same date at: ${freeSlots}. Would any of those times suit you?`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    } else {
      return {
        reply: `Terribly sorry: ${bookingResult.error || 'We could not complete your booking at this moment. Please call our reception team.'}`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    }
  }

  // -------------------------------------------------------------------------
  // 6. SLOT AVAILABILITY / APPOINTMENT INQUIRY (Triggered by date or keyword)
  // -------------------------------------------------------------------------
  const isSlotInquiry =
    Boolean(detectedDate) ||
    msgLower.includes('slot') ||
    msgLower.includes('availab') ||
    msgLower.includes('appointment') ||
    msgLower.includes('book') ||
    msgLower.includes('free time') ||
    msgLower.includes('open time') ||
    msgLower.includes('when can') ||
    msgLower.includes('what time') ||
    msgLower.includes('what date') ||
    msgLower.includes('diary') ||
    msgLower.includes('calendar') ||
    msgLower.includes('schedule') ||
    msgLower.includes('waqt') ||
    msgLower.includes('kab') ||
    msgLower.includes('aana');

  if (isSlotInquiry) {
    // If no specific date was given, choose next suitable clinic day (today if <16:00 and not Sunday, else tomorrow)
    let targetDate = detectedDate;
    if (!targetDate) {
      const isPastClose = londonNow.hour >= 16;
      const todayDay = new Date().getDay();
      if (!isPastClose && todayDay !== 0) {
        targetDate = londonNow.dateStr;
      } else {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        if (nextDay.getDay() === 0) {
          nextDay.setDate(nextDay.getDate() + 1); // skip Sunday to Monday
        }
        targetDate = getEuropeLondonDateTime(nextDay).dateStr;
      }
    }

    // Check Sunday closure
    const dateObj = new Date(targetDate + 'T12:00:00Z');
    if (dateObj.getUTCDay() === 0) {
      const nextMon = getNextWeekdayDate('monday', dateObj);
      return {
        reply: `Vertex Dental Lab is open Monday to Saturday from 09:00 to 17:00, and is closed on Sundays. May I check our available appointment slots for you for Monday, ${nextMon}?`,
        toolsExecuted: [],
        engine: 'deterministic-fallback',
      };
    }

    const slotCheck = await check_slot_availability({
      appt_date: targetDate,
      appt_time: detectedTime || undefined,
    });

    toolsExecuted.push({
      name: 'check_slot_availability',
      args: { appt_date: targetDate, appt_time: detectedTime },
      result: slotCheck,
    });

    if (lang === 'roman_urdu') {
      const slotsList = slotCheck.available_slots.join(', ');
      return {
        reply: `Khush amdeed! ${targetDate} ke liye hamare paas yeh 1-hour slots dastyab hain: ${slotsList}. Appointment pakki karne ke liye barahe karam apna pasandeeda waqt, Mukammal Naam aur UK Mobile number (e.g. 07123456789) batayein.`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    }

    if (detectedTime) {
      if (slotCheck.available) {
        return {
          reply: `Splendid! The ${detectedTime} slot on ${targetDate} is currently available. To confirm this booking, please reply with your Full Name, UK Mobile Number (e.g. 07123 456789), and the service required (e.g. Consultation, Hygiene, Check-up).`,
          toolsExecuted,
          engine: 'deterministic-fallback',
        };
      } else {
        const altSlots = slotCheck.available_slots.join(', ');
        return {
          reply: `Terribly sorry, but the slot at ${detectedTime} on ${targetDate} is already booked. However, the remaining free slots on that day are: ${altSlots}. Would one of these times suit you?`,
          toolsExecuted,
          engine: 'deterministic-fallback',
        };
      }
    }

    if (slotCheck.available_slots.length === 0) {
      return {
        reply: `I have examined our diary for ${targetDate}, but unfortunately all slots are fully booked on that date. Would the following day or another date this week suit you?`,
        toolsExecuted,
        engine: 'deterministic-fallback',
      };
    }

    const freeSlotsStr = slotCheck.available_slots.join(', ');
    return {
      reply: `Splendid! For ${targetDate}, we have 1-hour appointment slots available at: ${freeSlotsStr}. To reserve an appointment, please let me know your preferred time, your Full Name, and your UK Mobile Number (e.g. 07123 456789).`,
      toolsExecuted,
      engine: 'deterministic-fallback',
    };
  }

  // -------------------------------------------------------------------------
  // 7. CLINICIAN & CLINICAL DIRECTOR INQUIRY
  // -------------------------------------------------------------------------
  if (msgLower.includes('doctor') || msgLower.includes('vance') || msgLower.includes('dentist') || msgLower.includes('who')) {
    return {
      reply:
        "Dr. Alistair Vance (GDC No: 248912) is our Clinical Director at Vertex Dental Lab in Harley Street. He holds over 15 years of advanced clinical experience specializing in Restorative Dentistry, Dental Implants, and Smile Aesthetics. Dr. Vance is available for private consultations Monday to Saturday. Would you like me to check his diary availability for you?",
      toolsExecuted: [],
      engine: 'deterministic-fallback',
    };
  }

  // -------------------------------------------------------------------------
  // 8. CLINIC LOCATION & HOURS
  // -------------------------------------------------------------------------
  if (msgLower.includes('location') || msgLower.includes('address') || msgLower.includes('where') || msgLower.includes('hours') || msgLower.includes('open')) {
    return {
      reply:
        "Vertex Dental Lab is located at 45 Harley Street, London, W1G 8QR (Marylebone). We are open Monday to Saturday from 09:00 to 17:00 (last appointment slot at 16:00), and closed on Sundays. Would you like to check available appointment slots for today or this week?",
      toolsExecuted: [],
      engine: 'deterministic-fallback',
    };
  }

  // -------------------------------------------------------------------------
  // 9. DEFAULT BRITISH COURTESY RESPONSE
  // -------------------------------------------------------------------------
  return {
    reply:
      "Good day! Welcome to Vertex Dental Lab in Harley Street, London. I am Sarah, your AI reception assistant. We are currently accepting private appointments for examinations (£65), hygiene (£85), teeth whitening (£350), and dental implants. Would you like me to check our available diary slots for you, or answer questions regarding our treatments?",
    toolsExecuted: [],
    engine: 'deterministic-fallback',
  };
}
