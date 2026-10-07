/**
 * clinic.config.ts
 *
 * THE SINGLE SOURCE OF TRUTH for all clinic-specific values.
 * No clinic data is hardcoded anywhere else in the codebase.
 * All values here must be reviewed and signed off by the clinic before go-live.
 *
 * Emergency message templates (emergencyMessages.*) must be clinically
 * approved by the lead dentist before deployment.
 */

// ─── Opening Hours ────────────────────────────────────────────────────────────

export type DayHours = { open: string; close: string } | null;

export interface WeeklyHours {
  monday:    DayHours;
  tuesday:   DayHours;
  wednesday: DayHours;
  thursday:  DayHours;
  friday:    DayHours;
  saturday:  DayHours;
  sunday:    DayHours;
}

// ─── Config Shape ─────────────────────────────────────────────────────────────

export const clinicConfig = {
  // ── Identity ────────────────────────────────────────────────────────────────
  name:        'Vertex Dental Lab',
  shortName:   'Vertex',
  leadDentist: 'Dr. Alistair Vance',
  timezone:    'Europe/London',
  currency:    'GBP' as const,
  gdcNumber:   '248912',

  // ── Opening Hours ───────────────────────────────────────────────────────────
  openingHours: {
    monday:    { open: '08:30', close: '18:00' },
    tuesday:   { open: '08:30', close: '18:00' },
    wednesday: { open: '08:30', close: '18:00' },
    thursday:  { open: '08:30', close: '18:00' },
    friday:    { open: '08:30', close: '18:00' },
    saturday:  null,
    sunday:    null,
  } satisfies WeeklyHours,

  // ── Contact ─────────────────────────────────────────────────────────────────
  contact: {
    /** Reception WhatsApp number in E.164 */
    whatsapp:         '+447946088800',
    /** Reception email */
    email:            'reception@vertexdental.co.uk',
    /** Out-of-hours / emergency direct line */
    emergencyLine:    '+442079460888',
    /** Public website domain (used for CORS + short links) */
    domain:           'vertexdental.co.uk',
    websiteUrl:       'https://vertexdental.co.uk',
    privacyNoticeUrl: 'https://vertexdental.co.uk/privacy',
  },

  // ── Address ─────────────────────────────────────────────────────────────────
  address: {
    line1:    '12 Harley Street',
    city:     'London',
    postcode: 'W1G 9PQ',
    country:  'United Kingdom',
    /** Full one-line address for messages */
    full:     '12 Harley Street, London W1G 9PQ',
    mapsUrl:  'https://maps.google.com/?q=12+Harley+Street+London+W1G+9PQ',
    /** Parking instructions (shown in appointment reminders) */
    parking:  'NCP car park on Wimpole Street (5-min walk). Residents permit zone Mon–Fri — allow extra time. Nearest tube: Bond Street or Oxford Circus (10-min walk).',
  },

  // ── Nearest A&E ─────────────────────────────────────────────────────────────
  nearestAE: {
    name:    'University College Hospital A&E',
    address: 'Euston Road, London NW1 2BU',
    phone:   '020 3456 7890',
  },

  // ── Fees & Deposits ─────────────────────────────────────────────────────────
  fees: {
    /** Consultation fee in GBP */
    consultationFee:   50,
    /** Refundable deposit taken at booking (minimum) */
    depositMin:        25,
    /** Refundable deposit taken at booking (maximum) */
    depositMax:        50,
    /** Default deposit amount used when not treatment-specific */
    depositDefault:    50,
    /** Whether deposit is credited toward treatment cost on attendance */
    depositCreditedOnAttendance: true,
  },

  // ── High-Value Treatments ────────────────────────────────────────────────────
  highValueTreatments: ['Invisalign', 'Veneers', 'Implants'] as const,

  // ── Treatment Options (chat widget quick replies) ────────────────────────────
  treatmentOptions: [
    'Invisalign',
    'Veneers',
    'Implants',
    'Other',
  ] as const,

  timelineOptions: [
    'Immediately',
    'Within 3 months',
    'Just researching',
  ] as const,

  historyOptions: [
    'Yes — here at Vertex',
    'Yes — elsewhere',
    'No',
  ] as const,

  // ── Review & Links ───────────────────────────────────────────────────────────
  googleReviewUrl: 'https://g.page/r/PLACEHOLDER_REPLACE_BEFORE_GOLIVE/review',

  // ── Cancellation & Refund Policy ────────────────────────────────────────────
  cancellationPolicy: {
    fullRefundHoursNotice: 24,
    text: `Cancellations made with at least 24 hours' notice receive a full refund of the deposit. Cancellations made with less than 24 hours' notice, or no-shows, forfeit the deposit per our Terms & Conditions. The deposit is credited toward your treatment cost on attendance.`,
    shortText: `≥24h notice: full refund. Late cancel / no-show: deposit kept per T&Cs.`,
  },

  // ── Callback Policy ─────────────────────────────────────────────────────────
  callbackPolicy: {
    /** Minutes within which reception will call back during open hours */
    withinOpenHoursMinutes: 60,
    /** Time-of-day to call back on next working day (HH:mm) */
    nextWorkingDayTime: '09:00',
  },

  // ── Quiet Hours (no patient SMS/WA except emergencies + confirmations) ───────
  quietHours: {
    /** HH:mm — start of quiet period */
    start: '21:00',
    /** HH:mm — end of quiet period (next calendar day) */
    end:   '08:00',
  },

  // ── GDPR ────────────────────────────────────────────────────────────────────
  gdpr: {
    /** Unconverted leads are purged after this many months */
    retentionMonthsUnconverted: 12,
    consentText:
      'By sharing your details, you agree to our Privacy Notice. ' +
      'We will only contact you regarding your dental care.',
    consentCheckboxLabel:
      'I agree to be contacted about my dental care. View our Privacy Notice.',
  },

  // ── Admin ────────────────────────────────────────────────────────────────────
  admin: {
    /** Google accounts allowed to access /revenue-admin */
    allowedEmails: [
      'alistair@vertexdental.co.uk',
      'reception@vertexdental.co.uk',
    ] as string[],
    /** Daily summary email recipient */
    dailySummaryRecipient: 'reception@vertexdental.co.uk',
  },

  // ── Emergency Messages (NEVER generated by LLM; clinically approved text) ───
  emergencyMessages: {
    /**
     * Red-flag response: swelling near airway/eye, uncontrolled bleeding,
     * facial trauma. Instructs to call 999.
     */
    redFlag: `🚨 **This sounds like a medical emergency.**\n\nPlease **call 999 immediately** or go to your nearest A&E:\n\n🏥 University College Hospital A&E\nEuston Road, London NW1 2BU\n\n⚠️ *This is general information, not medical advice.*`,

    /**
     * Standard emergency response: pain, broken tooth, abscess, etc.
     * Routes to emergency line + NHS 111 + A&E.
     */
    standard: `We're sorry you're in pain. Please contact us immediately:\n\n📞 **Emergency line:** +44 20 7946 0888\n📞 **NHS 111** — free, available 24/7\n🏥 Nearest A&E: University College Hospital, Euston Road, London NW1 2BU\n\n🦷 **Temporary care tips (while you wait):**\n• Apply a cold compress to the outside of your cheek\n• Rinse gently with lukewarm salt water\n• Keep your head elevated\n• If a tooth has been knocked out or broken, store it in milk or saliva — do not scrub it\n\n⚠️ *This is general information, not medical advice.*`,

    /** Appended to all emergency replies */
    disclaimer: '⚠️ This is general information only, not medical or dental advice. Always seek professional help.',

    /** Optional follow-on message after emergency info */
    followOn: `Leave your name and number and we'll call you first thing in the morning — our team opens at 08:30.`,

    /** Reception alert subject for emergency leads */
    receptionAlertSubject: '🚨 EMERGENCY PATIENT — Immediate Action Required',
  },

  // ── FAQ (LLM may answer only from this list; never invent answers) ───────────
  faq: [
    {
      q: 'How much does Invisalign cost?',
      a: 'Invisalign starts from £1,800. The exact cost depends on complexity — a free consultation will give you a precise quote.',
    },
    {
      q: 'How much do dental implants cost?',
      a: 'Implants start from £1,500 per tooth. A consultation and assessment are required for a personalised quote.',
    },
    {
      q: 'How much do veneers cost?',
      a: 'Porcelain veneers start from £600 per tooth. A consultation is needed to discuss your goals and provide an exact quote.',
    },
    {
      q: 'Do you accept NHS patients?',
      a: 'We are a private dental clinic. We do not accept NHS-funded treatment.',
    },
    {
      q: 'Do you offer 0% finance?',
      a: 'Yes, we offer 0% APR finance on qualifying treatments. Ask about our finance options at your consultation.',
    },
    {
      q: 'How long does Invisalign take?',
      a: 'Treatment typically takes between 6 and 18 months depending on complexity. Your dentist will give you a personalised timeline.',
    },
    {
      q: 'Is the deposit refundable?',
      a: 'Yes — cancellations with at least 24 hours\' notice receive a full refund. Your deposit is also credited toward your treatment cost when you attend.',
    },
    {
      q: 'Where are you located?',
      a: 'We are at 12 Harley Street, London W1G 9PQ. Nearest tubes: Bond Street and Oxford Circus.',
    },
    {
      q: 'What are your opening hours?',
      a: 'We are open Monday to Friday, 08:30–18:00. We are closed weekends.',
    },
    {
      q: 'Do you treat dental anxiety?',
      a: 'Absolutely. Our team specialises in nervous patients. We offer pain-free computerised anaesthesia (The Wand®) and take time to explain every step.',
    },
    {
      q: 'How do I cancel or reschedule?',
      a: 'Use the link in your confirmation message or call us on +44 20 7946 0888. Please give at least 24 hours\' notice for a full refund.',
    },
    {
      q: 'What is your cancellation policy?',
      a: 'Cancellations with at least 24 hours\' notice receive a full deposit refund. Less than 24 hours\' notice or no-shows forfeit the deposit per our T&Cs.',
    },
  ],

  // ── Message Templates ────────────────────────────────────────────────────────
  // Placeholders: {name}, {dentist}, {callbackTime}, {amount}, {url},
  //               {time}, {date}, {address}, {parking}, {mapsUrl},
  //               {rescheduleUrl}, {reviewUrl}
  messageTemplates: {
    /** Sent immediately after lead qualification completes */
    leadConfirmation:
      'Thanks {name}! Dr {dentist}\'s team will call you at {callbackTime} to confirm your consultation slot. If you have any questions in the meantime, call us on +44 20 7946 0888. 😊',

    /** Reception lead summary subject */
    receptionLeadSubject:
      '{priority}New consultation enquiry — {name} ({score})',

    /** Deposit link — first message */
    depositLink:
      'Hi {name}, great news! To secure your consultation with Dr {dentist}, please pay the refundable £{amount} deposit here: {url}\n\nThis link expires in 24 hours. Questions? Call +44 20 7946 0888.',

    /** Deposit nudge — sent 2h after link if unpaid */
    depositNudge:
      'Hi {name}, just a reminder — your deposit link to secure your consultation slot expires soon: {url}\n\nNeed help? Call us on +44 20 7946 0888.',

    /** Deposit expiry notification */
    depositExpired:
      'Hi {name}, your deposit link has expired and we\'ve released the slot. If you\'d still like to book, please contact us: +44 20 7946 0888.',

    /** Booking confirmation after deposit paid */
    bookingConfirmation:
      'Hi {name}, your consultation with Dr {dentist} is confirmed! 🎉\n\n📅 {date} at {time}\n📍 {address}\n🅿️ {parking}\n🗺️ {mapsUrl}\n\nNeed to change? {rescheduleUrl}',

    /** T-24h reminder */
    reminder24h:
      'Hi {name}, a friendly reminder — your consultation with Dr {dentist} is tomorrow at {time}. 📍 {address}. Parking: {parking}. Maps: {mapsUrl}. Need to reschedule? {rescheduleUrl}',

    /** T-2h reminder */
    reminder2h:
      'Hi {name}, your consultation with Dr {dentist} is in 2 hours (at {time}). 📍 {address}. Maps: {mapsUrl}. See you soon!',

    /** Review request — first message */
    reviewRequest:
      'Hi {name}, hope your visit with Dr {dentist} went smoothly today! 😊 Would you mind taking 30 seconds to share your experience? It really helps other patients find us: {reviewUrl}',

    /** Review follow-up — only if no click after 48h */
    reviewFollowUp:
      'Hi {name}, just a gentle reminder — it\'d mean a lot to us if you could leave a quick review when you get a moment: {reviewUrl} 🙏',

    /** Cancellation confirmation ≥24h notice */
    cancellationFullRefund:
      'Hi {name}, your consultation has been cancelled and your deposit of £{amount} will be refunded within 5–10 business days. We hope to see you again soon!',

    /** Cancellation confirmation <24h notice */
    cancellationLateNoRefund:
      'Hi {name}, your consultation has been cancelled. As this was within 24 hours, the deposit is retained per our cancellation policy. We hope to see you again soon.',

    /** No-show notification */
    noShow:
      'Hi {name}, we noticed you missed your consultation today. Your deposit has been retained per our T&Cs. If you\'d like to rebook, call us on +44 20 7946 0888.',
  },
} as const;

export type ClinicConfig = typeof clinicConfig;
export type TreatmentOption = (typeof clinicConfig.treatmentOptions)[number];
export type TimelineOption  = (typeof clinicConfig.timelineOptions)[number];
export type HistoryOption   = (typeof clinicConfig.historyOptions)[number];
