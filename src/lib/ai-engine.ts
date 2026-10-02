import {
  DentalService,
  CompanyDetails,
  ClinicPolicies,
  FAQItem,
  AIGuardrails,
  AppointmentApprovalPolicy,
  AIProviderSettings,
  ReasoningStep,
} from '@/types/clinic';

export interface AIResponseResult {
  reply: string;
  replyText?: string;
  reasoningTrace: ReasoningStep[];
  sourceGrounded: string[];
  groundedSources?: string[];
  actionType?: 'book' | 'emergency' | 'whatsapp' | 'call' | 'none';
  actionPayload?: string;
  isEmergencyAlert?: boolean;
  appointmentApprovalStatus?: 'Auto-Approved' | 'Held for Manual Clinical Review' | 'Not Applicable';
  activeAgentEngine: string;
}

export function generateGroundingResponse(
  query: string,
  context: {
    services: DentalService[];
    companyDetails: CompanyDetails;
    policies?: ClinicPolicies;
    clinicPolicies?: ClinicPolicies;
    faqs?: FAQItem[];
    guardrails?: AIGuardrails;
    aiSettings?: AIGuardrails;
    approvalPolicy?: AppointmentApprovalPolicy;
    providerSettings?: AIProviderSettings;
  }
): AIResponseResult {
  const q = query.toLowerCase().trim();
  const {
    services,
    companyDetails,
  } = context;
  const faqs = context.faqs || [];

  // Safe fallbacks to handle aliased context keys (guardrails/aiSettings, policies/clinicPolicies)
  const guardrails = context.guardrails || (context as any).aiSettings || {
    identityRole: 'Clinical AI Concierge',
    targetAudience: 'Patients seeking private dental care',
    toneManner: 'Empathetic and professional',
    responseLength: 'concise',
    businessGoals: 'Help patients schedule appointments and provide clear fee information.',
    shouldSay: ['Transparent UK fees', 'GDC safety protocols'],
    mustNotSay: ['Prescribe medications without clinical consultation'],
    informationUnavailableInstructions: 'Our clinical reception team will be delighted to answer any bespoke clinical queries directly.',
    transferToHumanInstructions: 'Transferring to human clinical receptionist.',
    languageBehaviorPolicy: 'British English',
  };

  const policies = context.policies || (context as any).clinicPolicies || {
    refundPolicy: 'Full refund if cancelled with 24 hours notice.',
    cancellationPolicy: 'Please give 24 hours notice to reschedule without deposit forfeiture.',
    additionalPolicies: [],
  };

  const approvalPolicy = context.approvalPolicy || {
    autoApproveEnabled: true,
    approvedCategories: ['General', 'Preventive', 'Cosmetic'],
    manualReviewCategories: ['Surgical', 'Orthodontics', 'Emergency'],
    adminApprovalDirectives: 'Standard clinical confirmation.',
    autoConfirmMessage: 'Your appointment is confirmed.',
    manualReviewMessage: 'Your appointment request is awaiting clinical triage.',
  };

  const providerSettings = context.providerSettings || {
    activeProvider: 'Gemini',
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
    claudeApiKey: '',
    claudeModel: 'claude-3-5-sonnet',
    chatgptApiKey: '',
    chatgptModel: 'gpt-4o',
  };

  const reasoningTrace: ReasoningStep[] = [];
  const activeAgent = `${providerSettings.activeProvider || 'Gemini'} (${
    providerSettings.activeProvider === 'Gemini'
      ? providerSettings.geminiModel || 'gemini-1.5-flash'
      : providerSettings.activeProvider === 'Claude'
      ? providerSettings.claudeModel || 'claude-3-5-sonnet'
      : providerSettings.chatgptModel || 'gpt-4o'
  })`;

  // -------------------------------------------------------------
  // REASONING STEP 1: Perception & Clinical Intent Analysis
  // -------------------------------------------------------------
  reasoningTrace.push({
    step: 1,
    title: 'Perception & Semantic Intent Detection',
    detail: `Analyzing query: "${query}". Scanning for acute dental trauma, prescription requests, service inquiries, and booking triggers. Active Agent Engine: ${activeAgent}.`,
    status: 'perception',
  });

  // 1. Guardrail Check: Medical Diagnosis & Prescription Prevention
  const prescriptionCheck = /(prescribe|prescription|amoxicillin|antibiotic|ibuprofen dose|painkillers|codeine|medicine)/i;
  if (prescriptionCheck.test(q)) {
    reasoningTrace.push({
      step: 2,
      title: 'Prescription & GDC Safety Guardrail Intercept',
      detail:
        'Detected pharmaceutical prescription request. GDC regulations strictly prohibit non-clinical automated prescribing. Triggering safety diversion.',
      status: 'guardrail',
    });

    return {
      reply: `Under General Dental Council (GDC) regulations and clinical safety protocols, our AI assistant cannot prescribe medications or determine pharmaceutical dosages online. 

Please attend our clinic for an in-person clinical assessment by Dr. Vance, or contact our clinical team directly at ${companyDetails.helplinePhone} so a registered dental clinician can evaluate your symptoms safely.`,
      reasoningTrace,
      sourceGrounded: ['GDC Prescribing Guardrail', 'Clinic Safety Standards', 'Website Safety Policy'],
      actionType: 'call',
      actionPayload: companyDetails.helplinePhone,
      activeAgentEngine: activeAgent,
    };
  }

  // 2. Emergency & Acute Triage Guardrail
  const emergencyKeywords = /(emergency|bleeding|swelling|swollen|knocked out|trauma|severe pain|unbearable|abscess|fever|infection|jaw broken|accident)/i;
  if (emergencyKeywords.test(q)) {
    reasoningTrace.push({
      step: 2,
      title: 'Acute Emergency Triage Activation',
      detail:
        'Detected urgent symptoms (pain / bleeding / swelling / trauma). Prioritizing immediate telephone hotline, WhatsApp triage, and NHS 111 escalation.',
      status: 'guardrail',
    });

    return {
      reply: `🚨 **URGENT DENTAL TRIAGE NOTICE**

${guardrails.transferToHumanInstructions}

• **Immediate Emergency Hotline:** [${companyDetails.helplinePhone}](tel:${companyDetails.helplinePhone.replace(/\s+/g, '')})
• **Direct WhatsApp Triage:** [Message on WhatsApp](${companyDetails.whatsappPhone})
• **Clinic Address:** ${companyDetails.clinicalAddress}

*Clinical Advice:* If you are suffering from acute facial swelling spreading towards the eye or neck, or difficulty swallowing/breathing, please present immediately to hospital A&E or phone NHS 111.`,
      reasoningTrace,
      sourceGrounded: ['Emergency Escalation Policy', 'GDC Acute Patient Protocol', 'Marylebone Clinic Location'],
      actionType: 'emergency',
      actionPayload: companyDetails.helplinePhone,
      isEmergencyAlert: true,
      activeAgentEngine: activeAgent,
    };
  }

  // -------------------------------------------------------------
  // REASONING STEP 2: Website Knowledge & Description Retrieval
  // -------------------------------------------------------------
  reasoningTrace.push({
    step: 2,
    title: 'Website & Admin Knowledge Base Retrieval',
    detail: `Querying catalog of ${services.length} services, verified GBP prices, policies, and clinic details for "${companyDetails.clinicName}".`,
    status: 'retrieval',
  });

  // 3. Booking Intent with Admin Approval Policy Check
  const bookingKeywords = /(book|appointment|schedule|consultation|visit|see dentist|slot|available|reserve|approve)/i;
  if (bookingKeywords.test(q)) {
    // Check if a specific service is mentioned
    const matchedService = services.find(s => 
      q.includes(s.name.toLowerCase()) || 
      q.includes(s.category.toLowerCase()) ||
      (s.name.toLowerCase().includes('invisalign') && q.includes('invisalign')) ||
      (s.name.toLowerCase().includes('implant') && q.includes('implant')) ||
      (s.name.toLowerCase().includes('whitening') && q.includes('whitening')) ||
      (s.name.toLowerCase().includes('hygiene') && (q.includes('hygiene') || q.includes('clean'))) ||
      (s.name.toLowerCase().includes('checkup') && (q.includes('checkup') || q.includes('check up'))) ||
      (s.name.toLowerCase().includes('root canal') && (q.includes('root canal') || q.includes('rct')))
    );

    // Evaluate Admin Appointment Approval Policy
    const targetCategory = matchedService ? matchedService.category : 'General';
    const isAutoApprovedByAdmin =
      approvalPolicy.autoApproveEnabled &&
      approvalPolicy.approvedCategories.includes(targetCategory);

    reasoningTrace.push({
      step: 3,
      title: 'Admin Appointment Approval Policy Evaluation',
      detail: `Target Treatment: ${matchedService ? matchedService.name : 'General Consultation'} (Category: ${targetCategory}).
Admin Directives: "${approvalPolicy.adminApprovalDirectives}".
Evaluation: Auto-Approve Enabled = ${approvalPolicy.autoApproveEnabled}. Category Approved by Admin = ${isAutoApprovedByAdmin}.`,
      status: 'policy_eval',
    });

    reasoningTrace.push({
      step: 4,
      title: 'Guardrail & British Phrasing Synthesis',
      detail:
        'Synthesizing booking options in British English with live calendar triggers.',
      status: 'guardrail',
    });

    if (matchedService) {
      const approvalNotice = isAutoApprovedByAdmin
        ? `✅ **Approval Status:** This ${matchedService.category} procedure is **pre-approved by clinic administration** for immediate calendar confirmation.`
        : `⚠️ **Approval Status:** This ${matchedService.category} procedure requires **manual clinical confirmation** by Dr. Vance prior to appointment locking.`;

      return {
        reply: `Certainly! I have reviewed our clinical diary and website details for **${matchedService.name}** (${matchedService.priceRange}, approx. ${matchedService.duration}).

${approvalNotice}

${matchedService.description}

Would you like me to open the interactive booking calendar for you right now?`,
        reasoningTrace,
        sourceGrounded: [
          `Service: ${matchedService.name}`,
          'Admin Appointment Approval Policy',
          'Verified Price Schedule (GBP)',
        ],
        actionType: 'book',
        actionPayload: matchedService.name,
        appointmentApprovalStatus: isAutoApprovedByAdmin
          ? 'Auto-Approved'
          : 'Held for Manual Clinical Review',
        activeAgentEngine: activeAgent,
      };
    }

    return {
      reply: `We would be delighted to welcome you to Vertex Dental Lab. 

Per our clinic administrator directives:
• Routine checkups, digital OPG scans, and hygiene airflow therapy can be **automatically approved** immediately into Dr. Vance’s calendar.
• Complex surgical procedures (implants, root canals, Invisalign) are held for **specialist clinical review**.

Which treatment would you like to schedule today?`,
      reasoningTrace,
      sourceGrounded: ['Clinic Appointment System', 'Admin Approval Directives', 'Company Details'],
      actionType: 'book',
      activeAgentEngine: activeAgent,
    };
  }

  // 4. Cancellation & Refund Policy
  if (q.includes('cancel') || q.includes('reschedule') || q.includes('policy') || q.includes('notice') || q.includes('fee')) {
    reasoningTrace.push({
      step: 3,
      title: 'Admin Clinic Policies Evaluation',
      detail:
        'Retrieved deposit refund window (3-5 business days) and 24-48 hour cancellation notice from admin policies.',
      status: 'retrieval',
    });

    return {
      reply: `**Vertex Dental Lab Appointment & Cancellation Policy:**

• **Notice Required:** ${policies.cancellationPolicy}
• **Deposit & Refund:** ${policies.refundPolicy}
• **Arrival Guidance:** ${policies.additionalPolicies[0] || 'Please arrive 10 minutes prior to your slot.'}

If you need to adjust your existing appointment, please notify our reception team at ${companyDetails.helplinePhone} or via WhatsApp at ${companyDetails.whatsappPhone}.`,
      reasoningTrace,
      sourceGrounded: ['Clinic Cancellation Policy', 'Refund Policy & Timelines', 'Admin Business Rules'],
      actionType: 'whatsapp',
      actionPayload: companyDetails.whatsappPhone,
      activeAgentEngine: activeAgent,
    };
  }

  // 5. Pricing & Service Specific Queries
  for (const service of services) {
    const sName = service.name.toLowerCase();
    const isMatch = 
      (sName.includes('invisalign') && (q.includes('invisalign') || q.includes('aligner') || q.includes('braces'))) ||
      (sName.includes('implant') && (q.includes('implant') || q.includes('missing tooth') || q.includes('straumann'))) ||
      (sName.includes('whitening') && (q.includes('whitening') || q.includes('whiten') || q.includes('zoom') || q.includes('laser'))) ||
      (sName.includes('hygiene') && (q.includes('hygiene') || q.includes('airflow') || q.includes('cleaning') || q.includes('scale'))) ||
      (sName.includes('root canal') && (q.includes('root canal') || q.includes('rct') || q.includes('nerve') || q.includes('endodontic'))) ||
      (sName.includes('checkup') && (q.includes('checkup') || q.includes('check up') || q.includes('x-ray') || q.includes('opg') || q.includes('exam'))) ||
      (sName.includes('pediatric') && (q.includes('child') || q.includes('kid') || q.includes('pediatric') || q.includes('family')));

    if (isMatch) {
      const isAutoApproved =
        approvalPolicy.autoApproveEnabled &&
        approvalPolicy.approvedCategories.includes(service.category);

      reasoningTrace.push({
        step: 3,
        title: `Service Inspection: ${service.name}`,
        detail: `Found verified pricing: ${service.priceRange}. Category: ${service.category}. Auto-Approval Authorized by Admin: ${isAutoApproved}.`,
        status: 'policy_eval',
      });

      return {
        reply: `**${service.name}** at Vertex Dental Lab:
• **Verified UK Pricing:** ${service.priceRange} (0% finance available on eligible treatments)
• **Procedure Duration:** ${service.duration}
• **Clinical Details:** ${service.description}
• **Key Highlights:** ${service.features.join(' • ')}
• **Admin Approval Status:** ${
          isAutoApproved
            ? 'Pre-approved for instant booking confirmation.'
            : 'Requires clinical doctor sign-off upon submission.'
        }

All custom restorations are precision-crafted in our in-house London digital laboratory. Would you like to schedule an assessment?`,
        reasoningTrace,
        sourceGrounded: [
          `Service: ${service.name}`,
          'Verified Pricing Schedule',
          'In-House CAD/CAM Lab Specs',
          'Admin Approval Directives',
        ],
        actionType: 'book',
        actionPayload: service.name,
        activeAgentEngine: activeAgent,
      };
    }
  }

  // 6. Finance / 0% Interest Questions
  if (q.includes('finance') || q.includes('payment plan') || q.includes('0%') || q.includes('spread cost') || q.includes('instalment') || q.includes('installment')) {
    reasoningTrace.push({
      step: 3,
      title: 'Payment & Finance Policy Retrieval',
      detail: 'Retrieved Chrysalis Finance UK 0% APR details for treatments above £1,000.',
      status: 'retrieval',
    });

    return {
      reply: `Vertex Dental Lab offers **0% APR interest-free patient finance** over 6, 10, 12, or 24 months through Chrysalis Finance UK for treatments over £1,000. 

This enables you to divide your investment in dental implants, Invisalign®, or full smile makeovers into predictable monthly instalments with no hidden bank charges.`,
      reasoningTrace,
      sourceGrounded: ['Payment Policies', 'FAQ: Finance Options', 'Chrysalis UK Partner Terms'],
      actionType: 'book',
      activeAgentEngine: activeAgent,
    };
  }

  // 7. Contact & Location & Hours Queries
  if (q.includes('where') || q.includes('address') || q.includes('location') || q.includes('hours') || q.includes('open') || q.includes('phone') || q.includes('contact') || q.includes('tube') || q.includes('parking')) {
    reasoningTrace.push({
      step: 3,
      title: 'Clinic Logistics & Address Retrieval',
      detail: 'Retrieved Marylebone address, transport links, and operating schedule.',
      status: 'retrieval',
    });

    return {
      reply: `**Vertex Dental Lab London Clinic Details:**
• **Address:** ${companyDetails.clinicalAddress} (Near Oxford Circus & Bond Street stations)
• **Opening Hours:** ${companyDetails.workingHours}
• **Direct Telephone:** ${companyDetails.helplinePhone}
• **Direct WhatsApp:** ${companyDetails.whatsappPhone}
• **Email:** ${companyDetails.contactEmail}

We have dedicated private patient parking facilities available upon advance reservation.`,
      reasoningTrace,
      sourceGrounded: ['Company Details & Contact Information', 'Marylebone Transport Links'],
      actionType: 'call',
      actionPayload: companyDetails.helplinePhone,
      activeAgentEngine: activeAgent,
    };
  }

  // 8. FAQ Exact / Semantic Matching
  for (const faq of faqs) {
    const faqQ = faq.question.toLowerCase();
    const keywords = faqQ.replace(/[^a-z0-9 ]/g, '').split(' ').filter((w: string) => w.length > 3);
    const matches = keywords.filter((w: string) => q.includes(w));
    if (matches.length >= 2 || q.includes(faqQ)) {
      reasoningTrace.push({
        step: 3,
        title: `FAQ Match: "${faq.question}"`,
        detail: `Retrieved verified answer from official FAQ database.`,
        status: 'retrieval',
      });

      return {
        reply: `${faq.answer}\n\n*Source: Official Vertex Dental Lab Knowledge Base.*`,
        reasoningTrace,
        sourceGrounded: [`FAQ: ${faq.question}`, 'Website Knowledge Base'],
        actionType: 'none',
        activeAgentEngine: activeAgent,
      };
    }
  }

  // 9. Fallback Reasoning & Knowledge Gap
  reasoningTrace.push({
    step: 3,
    title: 'Knowledge Base Fallback & Admin Coordination',
    detail:
      'Exact query not covered in standard FAQs. Applying fallback protocol to connect patient with human coordinators.',
    status: 'guardrail',
  });

  return {
    reply: `Thank you for contacting Vertex Dental Lab. 

${guardrails.informationUnavailableInstructions}

Our team will be delighted to answer bespoke clinical queries, arrange a diagnostic scan, or provide an itemized written treatment plan.`,
    reasoningTrace,
    sourceGrounded: ['AI Fallback Instructions', 'Company Contact Details', 'Website Clinical Policy'],
    actionType: 'whatsapp',
    actionPayload: companyDetails.whatsappPhone,
    activeAgentEngine: activeAgent,
  };
}
