/**
 * workflows/w2-emergency/detector.ts
 *
 * Emergency keyword / regex detection layer.
 * Runs SYNCHRONOUSLY, BEFORE any LLM call, on every inbound message.
 *
 * NEVER uses the LLM to detect emergencies.
 * Returns DetectionResult with category and matched phrase for audit.
 *
 * Test suite: automation/tests/unit/emergency-detector.test.ts (≥50 phrases)
 */

export type EmergencyCategory = 'RED_FLAG' | 'STANDARD' | null;

export interface DetectionResult {
  isEmergency: boolean;
  category: EmergencyCategory;
  matchedPhrase?: string;
}

// ─── Red-Flag Patterns ────────────────────────────────────────────────────────
// These trigger a "Call 999" response. Life-threatening conditions only.

const RED_FLAG_PATTERNS: RegExp[] = [
  // Airway / swallowing
  /can['\u2019]?t\s+swallow/i,
  /cannot\s+swallow/i,
  /difficulty\s+swallowing/i,
  /trouble\s+swallowing/i,
  /swelling\s+(near|by|around|affecting)\s+(my\s+)?(throat|airway|eye|neck)/i,
  /throat\s+swelling/i,
  /swollen\s+(throat|airway|neck)/i,
  /face\s+(is\s+)?(very\s+)?swollen/i,
  /swelling\s+spread(ing)?\s+to\s+(my\s+)?(face|eye|neck|cheek)/i,

  // Uncontrolled bleeding
  /uncontrolled\s+bleeding/i,
  /won['\u2019]?t\s+stop\s+bleeding/i,
  /can['\u2019]?t\s+stop\s+(the\s+)?bleeding/i,
  /bleeding\s+(heavily|profusely|a\s+lot|won['\u2019]?t\s+stop|not\s+stopping)/i,
  /blood\s+(everywhere|pouring|gushing)/i,

  // Jaw / mouth locked
  /can['\u2019]?t\s+open\s+(my\s+)?mouth/i,
  /cannot\s+open\s+(my\s+)?mouth/i,
  /jaw\s+(is\s+)?(locked|stuck|won['\u2019]?t\s+open)/i,
  /trismus/i,

  // Head / facial trauma
  /head\s+(injury|trauma|hit)/i,
  /hit\s+(in\s+the\s+)?(head|face)/i,
  /facial\s+trauma/i,
  /face\s+injury/i,
  /knocked\s+unconscious/i,

  // High fever with dental infection (sign of spreading infection)
  /fever\s+(with|and)\s+(tooth|dental|abscess|jaw|swelling)/i,
  /temperature\s+(with|and)\s+(tooth|dental|abscess|jaw)/i,
  /abscess\s+(spreading|spread)/i,
  /spreading\s+infection/i,
];

// ─── Standard Emergency Patterns ─────────────────────────────────────────────
// These trigger emergency line + NHS 111 response.

const STANDARD_PATTERNS: RegExp[] = [
  // Severe pain
  /\b(severe|extreme|excruciating|unbearable|agonising|agonizing|terrible|awful|worst)\b.{0,30}\b(pain|ache|toothache|tooth\s*ache)\b/i,
  /\b(pain|ache|toothache)\b.{0,30}\b(severe|extreme|excruciating|unbearable|agonising|agonizing|terrible|awful|worst)\b/i,
  /tooth(ache)?\s+is\s+(killing|killing me|agony|very bad|so bad|so painful)/i,
  /\b(killing|agony)\b.{0,20}\b(tooth|dental|mouth|jaw)\b/i,

  // Broken / chipped / cracked tooth
  /\b(broken|chipped|cracked|fractured|snapped|shattered)\b.{0,20}\b(tooth|teeth|molar|incisor|crown|filling|veneer)\b/i,
  /\b(tooth|teeth|molar|incisor)\b.{0,20}\b(broken|chipped|cracked|fractured|snapped|fell off)\b/i,
  /my\s+(tooth|teeth)\s+(broke|snapped|cracked|chipped|fell\s+out)/i,
  /lost\s+(a\s+)?(tooth|filling|crown|cap)/i,
  /filling\s+(fell|came|has\s+come)\s+out/i,
  /crown\s+(fell|came|has\s+come)\s+out/i,

  // Knocked-out tooth
  /knocked[\s-]out\s+(tooth|teeth)/i,
  /tooth\s+(knocked|fallen|fell|come|came)\s+out/i,
  /avulsion/i,
  /my\s+tooth\s+came\s+out/i,
  /tooth\s+(has\s+)?been\s+knocked\s+out/i,

  // Bleeding
  /\b(bleeding|bleed)\b.{0,20}\b(tooth|teeth|gum|mouth|socket|extraction)/i,
  /\b(gum|mouth|socket)\b.{0,20}\b(bleeding|bleed)\b/i,
  /extraction\s+(site\s+)?(is\s+)?(bleeding|bleed)/i,

  // Swelling / abscess
  /\b(swelling|swollen|abscess|absess|abcess)\b.{0,20}\b(gum|tooth|jaw|cheek|face|mouth)/i,
  /\b(gum|jaw|cheek|face|mouth)\b.{0,20}\b(swollen|swelling|abscess|abcess|absess)\b/i,
  /dental\s+abscess/i,
  /\b(abscess|abcess|absess)\b/i, // standalone match

  // Fever / infection with toothache
  /\b(fever|temperature)\b.{0,30}\b(tooth|dental|mouth|jaw)/i,
  /\b(tooth|dental|mouth|jaw)\b.{0,30}\b(fever|temperature)\b/i,
  /\b(infection|infected)\b.{0,20}\b(tooth|teeth|gum|jaw|mouth)/i,

  // Misspellings ─────────────────────────────────────────────────────────────
  /toth(ache)?/i,           // toth, tothache
  /teith/i,                 // teith
  /toothace/i,              // toothace
  /bleading/i,              // bleading
  /bleding/i,               // bleding
  /swolen/i,                // swolen
  /sweling/i,               // sweling
  /absess/i,                // absess (duplicate of above but explicit)
  /abcess/i,                // abcess
  /cracke[dt]/i,            // cracked misspelling
  /chiped/i,                // chipped misspelling
  /brocken/i,               // broken misspelling
  /\bnockd?\s+out\b/i,      // knockd out
  /falen\s+out/i,           // falen out (fallen)
  /infecshun/i,             // misspelling of infection
  /tootache/i,              // tootache
  /toothach\b/i,            // truncated toothache

  // Common phrases / informal
  /emergency\s+(dental|tooth|teeth)/i,
  /dental\s+emergency/i,
  /urgent\s+(dental|tooth|teeth)/i,
  /(tooth|teeth)\s+emergency/i,
  /in\s+(a\s+)?(lot\s+of\s+)?pain\b/i,
  /so\s+much\s+pain/i,
  /really\s+(bad|severe)\s+pain/i,
  /sharp\s+pain\b.{0,20}\b(tooth|teeth|jaw|gum)/i,
  /throbbing\s+(pain|tooth|teeth|jaw)/i,
  /tooth\s+(is\s+)?(really\s+)?(hurting|killing me|agony)/i,
];

// ─── False-Positive Guard (explicit non-emergency phrases) ────────────────────
// If the entire text matches one of these, skip emergency detection.
// These protect against "I'm researching implants" triggering the detector.

const NON_EMERGENCY_PATTERNS: RegExp[] = [
  /^(just\s+)?(researching|exploring|looking\s+into|considering|thinking\s+about)/i,
  /no\s+(pain|ache|emergency|urgency)/i,
  /routine\s+(checkup|check-up|cleaning|hygiene|appointment|consultation)/i,
  /general\s+(enquiry|inquiry|question|information)/i,
  /price(s)?\s+(for|of)\s+(invisalign|veneers|implants|whitening)/i,
  /how\s+much\s+(does|do|is|are)/i,
  /what\s+(are|is)\s+your\s+(prices?|costs?|fees?|hours?|opening)/i,
  /mild\s+(sensitivity|discomfort)/i,
  /slightly\s+(sensitive|sore)/i,
];

// ─── Main Detector ────────────────────────────────────────────────────────────

/**
 * Tests all fields of an inbound message for emergency keywords.
 * Runs BEFORE any LLM call.
 *
 * @param text - The user's message text
 * @returns DetectionResult
 */
export function detectEmergency(text: string): DetectionResult {
  const normalised = text.trim();

  // Fast-path: check non-emergency guard first
  for (const pattern of NON_EMERGENCY_PATTERNS) {
    if (pattern.test(normalised)) {
      return { isEmergency: false, category: null };
    }
  }

  // Check red flags first (most severe)
  for (const pattern of RED_FLAG_PATTERNS) {
    const match = normalised.match(pattern);
    if (match) {
      return {
        isEmergency:   true,
        category:      'RED_FLAG',
        matchedPhrase: match[0],
      };
    }
  }

  // Check standard emergency patterns
  for (const pattern of STANDARD_PATTERNS) {
    const match = normalised.match(pattern);
    if (match) {
      return {
        isEmergency:   true,
        category:      'STANDARD',
        matchedPhrase: match[0],
      };
    }
  }

  return { isEmergency: false, category: null };
}

/**
 * Scans multiple fields simultaneously (e.g., name, message, form fields).
 * Returns the most severe result found.
 */
export function detectEmergencyInFields(
  fields: Record<string, string | undefined>,
): DetectionResult {
  let worstResult: DetectionResult = { isEmergency: false, category: null };

  for (const [, value] of Object.entries(fields)) {
    if (!value) continue;
    const result = detectEmergency(value);
    if (result.isEmergency) {
      if (result.category === 'RED_FLAG') return result; // can't get worse
      worstResult = result;
    }
  }

  return worstResult;
}
