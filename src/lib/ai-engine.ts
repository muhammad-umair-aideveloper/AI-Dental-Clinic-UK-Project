import {
  DentalService,
  CompanyDetails,
  ClinicPolicies,
  FAQItem,
  AIGuardrails,
} from '@/types/clinic';

export interface AIResponseResult {
  reply: string;
  sourceGrounded: string[];
  actionType?: 'book' | 'emergency' | 'whatsapp' | 'call' | 'none';
  actionPayload?: string;
  isEmergencyAlert?: boolean;
}

export function generateGroundingResponse(
  query: string,
  context: {
    services: DentalService[];
    companyDetails: CompanyDetails;
    policies: ClinicPolicies;
    faqs: FAQItem[];
    guardrails: AIGuardrails;
  }
): AIResponseResult {
  const q = query.toLowerCase().trim();
  const { services, companyDetails, policies, faqs, guardrails } = context;

  // 1. Guardrail Check: Medical Diagnosis & Prescription Prevention
  const prescriptionCheck = /(prescribe|prescription|amoxicillin|antibiotic|ibuprofen dose|painkillers|codeine|medicine)/i;
  if (prescriptionCheck.test(q)) {
    return {
      reply: `Under General Dental Council (GDC) regulations and clinical safety protocols, our AI assistant cannot prescribe medications or determine pharmaceutical dosages online. 

Please attend our clinic for an in-person clinical assessment by Dr. Vance, or contact our clinical team directly at ${companyDetails.helplinePhone} so a registered dental clinician can evaluate your symptoms safely.`,
      sourceGrounded: ['GDC Prescribing Guardrail', 'Clinic Safety Standards'],
      actionType: 'call',
      actionPayload: companyDetails.helplinePhone,
    };
  }

  // 2. Emergency & Acute Triage Guardrail
  const emergencyKeywords = /(emergency|bleeding|swelling|swollen|knocked out|trauma|severe pain|unbearable|abscess|fever|infection|jaw broken|accident)/i;
  if (emergencyKeywords.test(q)) {
    return {
      reply: `🚨 **URGENT DENTAL TRIAGE NOTICE**

${guardrails.transferToHumanInstructions}

• **Immediate Emergency Hotline:** [${companyDetails.helplinePhone}](tel:${companyDetails.helplinePhone.replace(/\s+/g, '')})
• **Direct WhatsApp Triage:** [Message on WhatsApp](${companyDetails.whatsappPhone})
• **Clinic Address:** ${companyDetails.clinicalAddress}

*Clinical Advice:* If you are suffering from acute facial swelling spreading towards the eye or neck, or difficulty swallowing/breathing, please present immediately to hospital A&E or phone NHS 111.`,
      sourceGrounded: ['Emergency Escalation Policy', 'GDC Acute Patient Protocol'],
      actionType: 'emergency',
      actionPayload: companyDetails.helplinePhone,
      isEmergencyAlert: true,
    };
  }

  // 3. Booking Intent Check
  const bookingKeywords = /(book|appointment|schedule|consultation|visit|see dentist|slot|available|reserve)/i;
  if (bookingKeywords.test(q)) {
    // Check if a specific service is mentioned
    const matchedService = services.find(s => 
      q.includes(s.name.toLowerCase()) || 
      q.includes(s.category.toLowerCase()) ||
      (s.name.toLowerCase().includes('invisalign') && q.includes('invisalign')) ||
      (s.name.toLowerCase().includes('implant') && q.includes('implant')) ||
      (s.name.toLowerCase().includes('whitening') && q.includes('whitening')) ||
      (s.name.toLowerCase().includes('hygiene') && (q.includes('hygiene') || q.includes('clean'))) ||
      (s.name.toLowerCase().includes('root canal') && (q.includes('root canal') || q.includes('rct')))
    );

    if (matchedService) {
      return {
        reply: `Certainly! I would be delighted to assist you in booking **${matchedService.name}** (${matchedService.priceRange}, approx. ${matchedService.duration}). 

Our clinical diary is currently open with Dr. Alistair Vance and our registered clinicians. Would you like me to open the booking calendar right now?`,
        sourceGrounded: [`Service: ${matchedService.name}`, 'Verified Pricing Schedule'],
        actionType: 'book',
        actionPayload: matchedService.name,
      };
    }

    return {
      reply: `We would be delighted to welcome you to Vertex Dental Lab. You can select your preferred treatment, date, and morning/afternoon slot directly through our interactive appointment portal. 

Would you like to book a routine checkup, hygiene airflow therapy, or a specialist cosmetic consultation today?`,
      sourceGrounded: ['Clinic Appointment System', 'Company Details'],
      actionType: 'book',
    };
  }

  // 4. Cancellation & Refund Policy
  if (q.includes('cancel') || q.includes('reschedule') || q.includes('policy') || q.includes('notice') || q.includes('fee')) {
    return {
      reply: `**Vertex Dental Lab Appointment & Cancellation Policy:**

• **Notice Required:** ${policies.cancellationPolicy}
• **Deposit & Refund:** ${policies.refundPolicy}
• **Arrival Guidance:** ${policies.additionalPolicies[0] || 'Please arrive 10 minutes prior to your slot.'}

If you need to adjust your existing appointment, please notify our reception team at ${companyDetails.helplinePhone} or via WhatsApp at ${companyDetails.whatsappPhone}.`,
      sourceGrounded: ['Clinic Cancellation Policy', 'Refund Policy & Timelines'],
      actionType: 'whatsapp',
      actionPayload: companyDetails.whatsappPhone,
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
      return {
        reply: `**${service.name}** at Vertex Dental Lab:
• **Verified UK Pricing:** ${service.priceRange} (0% finance available on eligible treatments)
• **Procedure Duration:** ${service.duration}
• **Clinical Details:** ${service.description}
• **Key Highlights:** ${service.features.join(' • ')}

All custom restorations are precision-crafted right here in our in-house London digital laboratory. Would you like to schedule an assessment?`,
        sourceGrounded: [`Service: ${service.name}`, 'Verified Pricing Schedule', 'In-House CAD/CAM Lab'],
        actionType: 'book',
        actionPayload: service.name,
      };
    }
  }

  // 6. Finance / 0% Interest Questions
  if (q.includes('finance') || q.includes('payment plan') || q.includes('0%') || q.includes('spread cost') || q.includes('instalment') || q.includes('installment')) {
    return {
      reply: `Vertex Dental Lab offers **0% APR interest-free patient finance** over 6, 10, 12, or 24 months through Chrysalis Finance UK for treatments over £1,000. 

This enables you to divide your investment in dental implants, Invisalign®, or full smile makeovers into predictable monthly instalments with no hidden bank charges.`,
      sourceGrounded: ['Payment Policies', 'FAQ: Finance Options'],
      actionType: 'book',
    };
  }

  // 7. Laboratory & Technology Queries
  if (q.includes('lab') || q.includes('laboratory') || q.includes('in-house') || q.includes('cad/cam') || q.includes('technology') || q.includes('scanner') || q.includes('3d')) {
    return {
      reply: `Our on-site **Vertex Dental Lab** is equipped with robotic German & Swiss CAD/CAM 5-axis milling units, medical-grade 3D printers, and exocad® digital design suites. 

This allows us to craft custom ceramic crowns, veneers, and bio-compatible implant prosthetics on-site with micron precision, avoiding weeks of uncomfortable temporary teeth.`,
      sourceGrounded: ['Company Description', 'In-House Technology Assets'],
      actionType: 'none',
    };
  }

  // 8. Contact & Location & Hours Queries
  if (q.includes('where') || q.includes('address') || q.includes('location') || q.includes('hours') || q.includes('open') || q.includes('phone') || q.includes('contact') || q.includes('tube') || q.includes('parking')) {
    return {
      reply: `**Vertex Dental Lab London Clinic Details:**
• **Address:** ${companyDetails.clinicalAddress} (Near Oxford Circus & Bond Street stations)
• **Opening Hours:** ${companyDetails.workingHours}
• **Direct Telephone:** ${companyDetails.helplinePhone}
• **Direct WhatsApp:** ${companyDetails.whatsappPhone}
• **Email:** ${companyDetails.contactEmail}

We have dedicated private patient parking facilities available upon advance reservation.`,
      sourceGrounded: ['Company Details & Contact Information'],
      actionType: 'call',
      actionPayload: companyDetails.helplinePhone,
    };
  }

  // 9. FAQ Exact / Semantic Matching
  for (const faq of faqs) {
    const faqQ = faq.question.toLowerCase();
    const keywords = faqQ.replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
    const matches = keywords.filter(w => q.includes(w));
    if (matches.length >= 2 || q.includes(faqQ)) {
      return {
        reply: `${faq.answer}\n\n*Source: Official Vertex Dental Lab Knowledge Base.*`,
        sourceGrounded: [`FAQ: ${faq.question}`],
        actionType: 'none',
      };
    }
  }

  // 10. Fallback Guardrail Response
  return {
    reply: `Thank you for contacting Vertex Dental Lab. 

${guardrails.informationUnavailableInstructions}

Our team will be delighted to answer bespoke clinical queries, arrange a diagnostic scan, or provide an itemized written treatment plan.`,
    sourceGrounded: ['AI Fallback Instructions', 'Company Contact Details'],
    actionType: 'whatsapp',
    actionPayload: companyDetails.whatsappPhone,
  };
}
