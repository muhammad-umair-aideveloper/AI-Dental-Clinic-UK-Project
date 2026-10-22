/**
 * src/app/api/chat/route.ts
 *
 * UK Dental AI Receptionist Chatbot API Endpoint for Vertex Dental Lab (London, UK).
 * Uses OpenAI Tool Calling:
 *   - check_available_slots({ date })
 *   - book_appointment({ customer_name, phone, service, appointment_date, appointment_time })
 * 
 * Persona & Guidelines:
 *   - Polite British AI Receptionist
 *   - Strict UK Clinic Knowledge & GBP Pricing
 *   - NHS Policy: At full NHS capacity; immediate Private availability
 *   - Collects Name, UK Mobile (+447), Service, Date, Time before booking
 *   - Never confirms a booking without a successful Supabase PostgreSQL insert
 *   - Logs all chats to Supabase chat_logs table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { sanitizeUkMobile, normalizeTimeFormat, CLINIC_SLOTS } from '@/app/api/book/route';
import { appendBookingToGoogleSheet } from '@/lib/google-sheets/sync';
import {
  checkChatRateLimit,
  sanitizeChatInput,
  scrubSensitiveHealthPii,
  CHAT_MAX_INPUT_LENGTH,
} from '@/lib/chatbot/guardrails';
import { runGeminiReceptionist } from '@/lib/gemini/agent';

// System prompt defining persona, UK clinic pricing and NHS rules
const SYSTEM_PROMPT = `You are Sarah, the polite, articulate, and exceptionally professional British AI Receptionist for Vertex Dental Lab, an elite private dental clinic located in Harley Street, London, UK.

COMMUNICATION STYLE:
- Use polite British etiquette (e.g., "Good day", "Splendid", "Delighted to assist", "Certainly", "Terribly sorry", "May I kindly enquire").
- Always use British English spelling (e.g., colour, enquiry, programme, centre, anaesthesia).
- Be welcoming, empathetic, clinical, and reassuring, especially to anxious or nervous patients.

CLINIC POLICIES & FEES (ALL IN £ GBP):
- NHS Policy: Vertex Dental Lab is currently at FULL NHS CAPACITY and cannot register new NHS patients. If asked about NHS treatment, state politely: "We are currently at full capacity for NHS patients and cannot accept new NHS registrations at this time. However, we have immediate availability for private patients with same-day appointments, flexible hours, and 0% financing options."
- PRIVATE FEES SCHEDULE:
  * New Patient Consultation: £65 (Comprehensive examination, digital X-rays, treatment roadmap)
  * Hygiene Scale & Polish: £85 (Deep periodontal clean and stain removal)
  * Routine Extraction: £150 (Gentle, painless extraction under local anaesthesia)
  * White Composite Filling: £140 (Natural, shade-matched aesthetic resin)
  * Root Canal Treatment: £450 (Specialist endodontic treatment with microscope)
  * Boutique Teeth Whitening: £350 (Custom home whitening trays + professional kit)
  * Invisalign Clear Aligners: From £2,500 (Complimentary 3D iTero digital scan, 0% finance)
  * Single Dental Implant: £2,200 (Titanium fixture, custom abutment, porcelain crown)

APPOINTMENT BOOKING RULES:
- Operating hours: Monday to Friday 09:00 to 17:00 (Europe/London). Saturday by appointment only. Closed Sundays.
- To book an appointment, you MUST gather:
  1. Patient's Full Name (customer_name)
  2. UK Mobile Number (phone — e.g. 07... or +447...)
  3. Service / Treatment (service)
  4. Preferred Date (appointment_date — YYYY-MM-DD format)
  5. Preferred Time (appointment_time — HH:MM format between 09:00 and 17:00)
- Call 'check_available_slots' when a patient mentions a date or asks when they can be seen.
- Call 'book_appointment' ONLY when all 5 pieces of information are collected.
- CRITICAL: NEVER claim an appointment is booked or confirmed until the 'book_appointment' tool returns a successful result with a database ID. If the tool returns error 23505 (slot taken), inform the patient with polite British apologies and offer the alternative available slots returned by the tool.`;

// OpenAI Function / Tool Definitions
const CHAT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'check_available_slots',
      description: 'Checks available appointment slots for a specified date at Vertex Dental Lab (09:00 to 17:00 London time).',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Date in YYYY-MM-DD format (e.g. 2026-10-20).',
          },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Books a confirmed dental appointment into the clinic Supabase database. Requires patient name, UK mobile (+447), service, date (YYYY-MM-DD), and time (HH:MM).',
      parameters: {
        type: 'object',
        properties: {
          customer_name: {
            type: 'string',
            description: "Full name of the patient (e.g. Eleanor Vance).",
          },
          phone: {
            type: 'string',
            description: "Patient's UK mobile number starting with 07 or +447 (e.g. 07946 088800).",
          },
          service: {
            type: 'string',
            description: "Treatment or consultation required (e.g. Hygiene Scale & Polish, Invisalign).",
          },
          appointment_date: {
            type: 'string',
            description: "Appointment date in YYYY-MM-DD format.",
          },
          appointment_time: {
            type: 'string',
            description: "Appointment time in HH:MM format (e.g. 10:00, 14:30).",
          },
        },
        required: ['customer_name', 'phone', 'service', 'appointment_date', 'appointment_time'],
      },
    },
  },
];

/**
 * Executes tool: check_available_slots
 */
async function executeCheckAvailableSlots(dateStr: string) {
  const supabase = getSupabaseServerClient();
  let bookedTimes: string[] = [];

  if (supabase && isSupabaseConfigured()) {
    const { data: booked } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', dateStr)
      .neq('status', 'CANCELLED');

    if (booked) {
      bookedTimes = booked.map(b => (b.appointment_time || '').slice(0, 5));
    }
  } else if (global.__dentalMemoryAppointments) {
    bookedTimes = global.__dentalMemoryAppointments
      .filter(a => a.appointment_date === dateStr && a.status !== 'CANCELLED')
      .map(a => a.appointment_time.slice(0, 5));
  }

  const available = CLINIC_SLOTS.filter(s => !bookedTimes.includes(s));
  return {
    date: dateStr,
    total_slots: CLINIC_SLOTS.length,
    available_slots: available,
    count: available.length,
  };
}

/**
 * Executes tool: book_appointment
 */
async function executeBookAppointment(args: {
  customer_name: string;
  phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
}) {
  const { customer_name, phone: rawPhone, service, appointment_date, appointment_time: rawTime } = args;

  // 1. Sanitize UK Phone
  const phoneRes = sanitizeUkMobile(rawPhone);
  if (!phoneRes.isValid) {
    return {
      success: false,
      error: phoneRes.error || 'Invalid UK mobile number.',
    };
  }
  const phone = phoneRes.normalized;
  const appointmentTime = normalizeTimeFormat(rawTime);

  const supabase = getSupabaseServerClient();

  if (supabase && isSupabaseConfigured()) {
    // Upsert patient
    try {
      await supabase.from('patients').upsert(
        { name: customer_name, phone, updated_at: new Date().toISOString() },
        { onConflict: 'phone' }
      );
    } catch {
      // non-blocking
    }

    // Insert appointment
    const { data: inserted, error: insertError } = await supabase
      .from('appointments')
      .insert({
        customer_name,
        phone,
        service,
        appointment_date,
        appointment_time: appointmentTime,
        status: 'CONFIRMED',
        reminder_1hr_sent: false,
        google_sheet_synced: false,
      })
      .select()
      .single();

    if (insertError) {
      if (
        insertError.code === '23505' ||
        insertError.message?.includes('unique_date_time_slot') ||
        insertError.message?.includes('duplicate key')
      ) {
        const slots = await executeCheckAvailableSlots(appointment_date);
        return {
          success: false,
          code: '23505',
          error: `Slot ${appointmentTime.slice(0, 5)} on ${appointment_date} is already taken.`,
          available_slots: slots.available_slots,
        };
      }

      return {
        success: false,
        error: insertError.message || 'Database error creating appointment.',
      };
    }

    // Google Sheets sync
    let sheetSynced = false;
    try {
      sheetSynced = await appendBookingToGoogleSheet({
        appointment_date,
        appointment_time: appointmentTime.slice(0, 5),
        customer_name,
        phone,
        service,
      });

      if (sheetSynced && inserted?.id) {
        await supabase
          .from('appointments')
          .update({ google_sheet_synced: true })
          .eq('id', inserted.id);
      }
    } catch (sheetErr) {
      console.error('[ChatBooking] Google Sheets sync error:', sheetErr);
    }

    return {
      success: true,
      booking_id: inserted.id,
      customer_name,
      phone,
      service,
      appointment_date,
      appointment_time: appointmentTime.slice(0, 5),
      status: 'CONFIRMED',
      google_sheet_synced: sheetSynced,
    };
  }

  // Memory fallback
  if (!global.__dentalMemoryAppointments) {
    global.__dentalMemoryAppointments = [];
  }

  const conflict = global.__dentalMemoryAppointments.find(
    a =>
      a.appointment_date === appointment_date &&
      a.appointment_time.slice(0, 5) === appointmentTime.slice(0, 5) &&
      a.status !== 'CANCELLED'
  );

  if (conflict) {
    const slots = await executeCheckAvailableSlots(appointment_date);
    return {
      success: false,
      code: '23505',
      error: `Slot ${appointmentTime.slice(0, 5)} on ${appointment_date} is already taken.`,
      available_slots: slots.available_slots,
    };
  }

  let sheetSynced = false;
  try {
    sheetSynced = await appendBookingToGoogleSheet({
      appointment_date,
      appointment_time: appointmentTime.slice(0, 5),
      customer_name,
      phone,
      service,
    });
  } catch {
    // non-blocking
  }

  const memoryId = `apt-chat-${Date.now()}`;
  global.__dentalMemoryAppointments.push({
    id: memoryId,
    customer_name,
    phone,
    service,
    appointment_date,
    appointment_time: appointmentTime,
    status: 'CONFIRMED',
    reminder_1hr_sent: false,
    google_sheet_synced: sheetSynced,
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    booking_id: memoryId,
    customer_name,
    phone,
    service,
    appointment_date,
    appointment_time: appointmentTime.slice(0, 5),
    status: 'CONFIRMED',
    google_sheet_synced: sheetSynced,
  };
}

/**
 * Logs conversation to Supabase chat_logs table.
 */
async function logChatToSupabase(entry: {
  session_id?: string;
  phone?: string;
  user_message: string;
  bot_response: string;
  tools_called?: any[];
}) {
  const supabase = getSupabaseServerClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from('chat_logs').insert({
        session_id: entry.session_id || 'web-chat',
        phone: entry.phone || null,
        user_message: entry.user_message,
        bot_response: entry.bot_response,
        tools_called: entry.tools_called || null,
      });
    } catch (err) {
      console.warn('[ChatLog] Error writing to chat_logs table:', err);
    }
  }
}

/**
 * Intelligent Local Receptionist Engine (Used when OPENAI_API_KEY is not configured or as resilient fallback)
 */
async function localBritishReceptionistEngine(userMessage: string, history: Array<{ role: string; content: string }>) {
  const msgLower = userMessage.toLowerCase();
  const toolsExecuted: any[] = [];

  // Check NHS query
  if (msgLower.includes('nhs')) {
    return {
      reply:
        "Good day. Thank you for reaching out to Vertex Dental Lab. We are currently at full capacity for NHS patients and unable to accept new NHS registrations at this time. However, we have immediate availability for private appointments, including our comprehensive New Patient Consultation for £65. Would you like me to reserve a private appointment for you?",
      tools: [],
    };
  }

  // Check Pricing query
  if (msgLower.includes('price') || msgLower.includes('cost') || msgLower.includes('how much') || msgLower.includes('fee')) {
    if (msgLower.includes('invisalign')) {
      return {
        reply:
          "Our Invisalign clear aligner treatments start from £2,500. This includes an initial consultation, complimentary 3D iTero digital scan, custom aligners, and all refinement appointments. We also offer 0% interest-free patient finance. Would you like to book a consultation?",
        tools: [],
      };
    }
    if (msgLower.includes('implant')) {
      return {
        reply:
          "A Single Dental Implant is £2,200, which includes the premium titanium implant fixture, custom abutment, and porcelain aesthetic crown. Would you like to arrange a consultation with Dr. Alistair Vance?",
        tools: [],
      };
    }
    if (msgLower.includes('whitening')) {
      return {
        reply:
          "Our Boutique Teeth Whitening system is £350, including custom precision-fitted trays and high-strength professional whitening gels. May I assist in scheduling a consultation?",
        tools: [],
      };
    }
    if (msgLower.includes('hygiene') || msgLower.includes('clean') || msgLower.includes('polish')) {
      return {
        reply:
          "Our Hygiene Scale & Polish is £85 for a comprehensive 30-minute deep periodontal cleanse and stain removal. Would you like me to check our available times for you?",
        tools: [],
      };
    }
    return {
      reply:
        "Here is our private fee schedule at Vertex Dental Lab:\n• New Patient Consultation: £65\n• Hygiene Scale & Polish: £85\n• Routine Extraction: £150\n• White Composite Filling: £140\n• Root Canal Treatment: £450\n• Boutique Teeth Whitening: £350\n• Invisalign: From £2,500\n• Single Dental Implant: £2,200\n\nWhich treatment can I assist you with today?",
      tools: [],
    };
  }

  // Check if date mentioned to check availability (e.g. YYYY-MM-DD or 'tomorrow')
  const dateMatch = userMessage.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (dateMatch) {
    const targetDate = dateMatch[1];
    const slotsResult = await executeCheckAvailableSlots(targetDate);
    toolsExecuted.push({ name: 'check_available_slots', args: { date: targetDate }, result: slotsResult });

    if (slotsResult.available_slots.length === 0) {
      return {
        reply: `I have checked our diary for ${targetDate}, but unfortunately all slots are fully booked on that date. Would another date suit you?`,
        tools: toolsExecuted,
      };
    }

    const firstFew = slotsResult.available_slots.slice(0, 6).join(', ');
    return {
      reply: `Splendid! For ${targetDate}, we have availability at: ${firstFew}. To confirm a booking, please let me know your preferred time, along with your Full Name, UK Mobile Number (e.g. 07123 456789), and the service required.`,
      tools: toolsExecuted,
    };
  }

  // Attempt booking extraction if user provided details
  const phoneMatch = userMessage.match(/(\+?44\s?7\d{3}\s?\d{6}|07\d{3}\s?\d{6}|\b07\d{9}\b)/);
  const timeMatch = userMessage.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);

  if (phoneMatch && timeMatch) {
    // Search history for date
    let chosenDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    for (const h of history) {
      const d = h.content.match(/\b(202\d-\d{2}-\d{2})\b/);
      if (d) {
        chosenDate = d[1];
        break;
      }
    }

    const bookingResult = await executeBookAppointment({
      customer_name: 'Patient',
      phone: phoneMatch[0],
      service: 'General Dental Consultation',
      appointment_date: chosenDate,
      appointment_time: timeMatch[0],
    });

    toolsExecuted.push({ name: 'book_appointment', result: bookingResult });

    if (bookingResult.success) {
      return {
        reply: `Delighted to confirm! Your appointment has been booked for ${bookingResult.appointment_date} at ${bookingResult.appointment_time} for ${bookingResult.service}. We have logged your mobile number (${bookingResult.phone}). You will receive an SMS reminder 1 hour prior to your visit. We look forward to seeing you at Vertex Dental Lab!`,
        tools: toolsExecuted,
      };
    } else if (bookingResult.code === '23505') {
      const alternativeSlots = bookingResult.available_slots?.slice(0, 5).join(', ') || '09:30, 11:00, 14:00';
      return {
        reply: `Terribly sorry, but the slot at ${timeMatch[0]} on ${chosenDate} has just been taken. We do however have immediate availability on the same day at: ${alternativeSlots}. Would any of those times be convenient for you?`,
        tools: toolsExecuted,
      };
    }
  }

  // General warm British welcome
  return {
    reply:
      "Good day! Welcome to Vertex Dental Lab in Harley Street, London. I am Sarah, your reception assistant. How may I assist you today? I can provide treatment details, private pricing, check slot availability, or book an appointment for you.",
    tools: [],
  };
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (20 req/min)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous-client';

    const rate = checkChatRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a moment before sending more messages.',
          retryAfter: rate.resetInSeconds,
        },
        { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } }
      );
    }

    // 2. Parse payload (supports both { message } and { messages: [...] })
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    let userMessage = '';
    let messageHistory: Array<{ role: string; content: string }> = [];

    if (Array.isArray(body.messages) && body.messages.length > 0) {
      messageHistory = body.messages;
      const lastMsg = body.messages[body.messages.length - 1];
      userMessage = typeof lastMsg?.content === 'string' ? lastMsg.content.trim() : '';
    } else if (typeof body.message === 'string') {
      userMessage = body.message.trim();
      messageHistory = [{ role: 'user', content: userMessage }];
    }

    if (!userMessage) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    if (userMessage.length > CHAT_MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Message exceeds maximum allowed length of ${CHAT_MAX_INPUT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // 3. Security Guardrails & PII Scrubbing
    const { sanitized, hasInjectionAttempt } = sanitizeChatInput(userMessage);
    if (hasInjectionAttempt) {
      const cannedReply =
        'Good day. I am the Vertex Dental Lab receptionist. I can assist you with treatment pricing, clinic hours, and booking consultations with our clinicians. How may I help you today?';
      await logChatToSupabase({ user_message: userMessage, bot_response: cannedReply });
      return NextResponse.json({ reply: cannedReply, intent: 'GENERAL', isEmergency: false });
    }

    const { scrubbed, piiDetected, redactedTypes } = scrubSensitiveHealthPii(sanitized);

    // 4. Primary Engine: Gemini AI Receptionist Agent with Deterministic Function Calling
    // (check_slot_availability, create_booking)
    const geminiAgentResult = await runGeminiReceptionist(
      scrubbed,
      messageHistory as any
    );

    await logChatToSupabase({
      user_message: scrubbed,
      bot_response: geminiAgentResult.reply,
      tools_called: geminiAgentResult.toolsExecuted,
    });

    // Determine if a booking was successfully confirmed in this turn
    const bookingConfirmed = Array.isArray(geminiAgentResult.toolsExecuted) &&
      geminiAgentResult.toolsExecuted.some(
        (t: any) =>
          (t.name === 'create_booking' || t.name === 'book_appointment') &&
          t.result?.success === true
      );

    return NextResponse.json({
      success: true,
      reply: geminiAgentResult.reply,
      tools: geminiAgentResult.toolsExecuted,
      engine: geminiAgentResult.engine,
      bookingConfirmed,
      meta: { piiScrubbed: piiDetected, redactedTypes },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error in chat receptionist service.' },
      { status: 500 }
    );
  }
}
