/**
 * tests/unit/emergency-detector.test.ts
 *
 * ≥50 phrases covering:
 *   - True positives: RED_FLAG (25) + STANDARD (25+)
 *   - True negatives / false-positive guards (15+)
 *   - Misspelling variants (10+)
 */
import { describe, it, expect } from 'vitest';
import { detectEmergency, detectEmergencyInFields } from '../../src/workflows/w2-emergency/detector.js';

// ─── RED FLAG TRUE POSITIVES ─────────────────────────────────────────────────
describe('RED FLAG detections', () => {
  const redFlagPhrases = [
    "I can't swallow properly, my throat is swelling",
    "cannot swallow, face is huge",
    "Difficulty swallowing and my face is very swollen",
    "Trouble swallowing and can't breathe properly",
    "Swelling near my throat is getting worse",
    "Throat swelling from an abscess",
    "My face is very swollen and I feel faint",
    "The swelling is spreading to my eye",
    "Swelling spread to my neck overnight",
    "I can't open my mouth at all",
    "Cannot open my mouth, jaw is locked shut",
    "Jaw is locked and I'm in agony",
    "trismus, jaw won't open",
    "I was hit in the head and my tooth came out",
    "Head injury from a fall, bleeding in mouth",
    "Hit in the face with a cricket bat",
    "Facial trauma from an accident",
    "I was knocked unconscious and hurt my jaw",
    "Uncontrolled bleeding won't stop after extraction",
    "Can't stop the bleeding from my gum",
    "Won't stop bleeding since 3 hours",
    "Bleeding heavily after wisdom tooth removal",
    "Blood gushing from socket after extraction",
    "Fever with toothache and swollen jaw",
    "High temperature with abscess spreading",
  ];

  for (const phrase of redFlagPhrases) {
    it(`detects RED_FLAG: "${phrase.slice(0, 60)}..."`, () => {
      const result = detectEmergency(phrase);
      expect(result.isEmergency).toBe(true);
      expect(result.category).toBe('RED_FLAG');
    });
  }
});

// ─── STANDARD EMERGENCY TRUE POSITIVES ───────────────────────────────────────
describe('STANDARD emergency detections', () => {
  const standardPhrases = [
    "I have severe tooth pain on the right side",
    "Excruciating pain in my back molar",
    "Unbearable toothache, can't sleep",
    "My tooth is killing me with pain",
    "I have an abscess on my gum",
    "Dental abscess getting worse",
    "My face is swollen from an abscess",
    "Swollen cheek from infection",
    "I broke my front tooth on a hard sweet",
    "Chipped tooth from eating",
    "My tooth cracked while eating dinner",
    "Fractured molar, extreme pain",
    "My tooth got knocked out playing football",
    "Knocked-out tooth — what do I do?",
    "My tooth fell out completely",
    "Tooth came out after being hit",
    "Avulsion of incisor from accident",
    "Lost my filling while eating",
    "Crown fell out this morning",
    "Filling came out, tooth really sensitive now",
    "Gum bleeding after I floss",
    "Bleeding from my tooth socket won't slow",
    "Infected tooth, I have a high fever",
    "Infection spreading from my wisdom tooth",
    "Sharp pain in tooth when I bite down",
    "Throbbing toothache, very severe",
    "So much pain in my jaw, urgent help needed",
    "Dental emergency, cracked tooth",
    "Urgent dental help needed — broken tooth",
    "Really bad pain in my mouth",
  ];

  for (const phrase of standardPhrases) {
    it(`detects STANDARD: "${phrase.slice(0, 60)}..."`, () => {
      const result = detectEmergency(phrase);
      expect(result.isEmergency).toBe(true);
    });
  }
});

// ─── MISSPELLING VARIANTS ─────────────────────────────────────────────────────
describe('Misspelling detections', () => {
  const misspellings = [
    { phrase: "I have a bad tothache",       desc: 'tothache' },
    { phrase: "Toothace really bad today",   desc: 'toothace' },
    { phrase: "my teith are hurting badly",  desc: 'teith' },
    { phrase: "bleading from my gum",        desc: 'bleading' },
    { phrase: "my gum is bleding heavily",   desc: 'bleding' },
    { phrase: "my face is swolen",           desc: 'swolen' },
    { phrase: "sweling in my cheek",         desc: 'sweling' },
    { phrase: "dental absess burst",         desc: 'absess' },
    { phrase: "abcess on my gum is huge",    desc: 'abcess' },
    { phrase: "brocken tooth from accident", desc: 'brocken' },
    { phrase: "tooth chiped eating bread",   desc: 'chiped' },
    { phrase: "tooth was knockd out",        desc: 'knockd out' },
    { phrase: "tooth has falen out",         desc: 'falen out' },
    { phrase: "I have tootache so bad",      desc: 'tootache' },
    { phrase: "dental infecshun spreading",  desc: 'infecshun' },
  ];

  for (const { phrase, desc } of misspellings) {
    it(`detects misspelling variant: ${desc}`, () => {
      const result = detectEmergency(phrase);
      expect(result.isEmergency).toBe(true);
    });
  }
});

// ─── TRUE NEGATIVES (must NOT trigger) ───────────────────────────────────────
describe('Non-emergency phrases (false-positive guard)', () => {
  const nonEmergencyPhrases = [
    { phrase: "I'm researching Invisalign options",         desc: 'researching Invisalign' },
    { phrase: "How much do implants cost?",                 desc: 'price inquiry' },
    { phrase: "Just exploring veneers, no rush",           desc: 'exploring veneers' },
    { phrase: "I have mild sensitivity to cold drinks",    desc: 'mild sensitivity' },
    { phrase: "Looking into clear aligners",               desc: 'clear aligners inquiry' },
    { phrase: "What are your opening hours?",              desc: 'hours question' },
    { phrase: "Do you offer 0% finance?",                  desc: 'finance question' },
    { phrase: "I'd like a routine checkup",                desc: 'routine checkup' },
    { phrase: "General enquiry about teeth whitening",     desc: 'whitening inquiry' },
    { phrase: "Thinking about getting implants eventually",desc: 'considering implants' },
    { phrase: "No pain, just want a second opinion",       desc: 'no pain second opinion' },
    { phrase: "I have slight tooth discomfort occasionally",desc: 'slight discomfort' },
    { phrase: "Slightly sensitive to sweets sometimes",    desc: 'slight sensitivity' },
    { phrase: "How long does Invisalign treatment take?",  desc: 'Invisalign duration' },
    { phrase: "Can I book a consultation for veneers?",    desc: 'booking inquiry' },
    { phrase: "Is Alistair Vance accepting new patients?", desc: 'new patient inquiry' },
    { phrase: "My child needs a checkup",                  desc: 'pediatric checkup' },
  ];

  for (const { phrase, desc } of nonEmergencyPhrases) {
    it(`does NOT trigger for: ${desc}`, () => {
      const result = detectEmergency(phrase);
      expect(result.isEmergency).toBe(false);
    });
  }
});

// ─── Multi-field scan ─────────────────────────────────────────────────────────
describe('detectEmergencyInFields', () => {
  it('detects emergency in message field even if name is benign', () => {
    const result = detectEmergencyInFields({
      name:    'John Smith',
      message: 'I have a severe throbbing toothache and my face is swollen',
    });
    expect(result.isEmergency).toBe(true);
  });

  it('returns no emergency when all fields are benign', () => {
    const result = detectEmergencyInFields({
      name:    'Jane Doe',
      message: 'Interested in Invisalign pricing please',
      email:   'jane@example.com',
    });
    expect(result.isEmergency).toBe(false);
  });

  it('RED_FLAG takes priority over STANDARD', () => {
    const result = detectEmergencyInFields({
      name:    'Joe',
      message: "can't swallow, my throat is closing and I have a broken tooth",
    });
    expect(result.category).toBe('RED_FLAG');
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────
describe('Edge cases', () => {
  it('handles mixed case', () => {
    const result = detectEmergency('SEVERE TOOTHACHE AND SWOLLEN FACE');
    expect(result.isEmergency).toBe(true);
  });

  it('handles extra punctuation', () => {
    const result = detectEmergency('My tooth!!! broke!!! so painful!!!');
    expect(result.isEmergency).toBe(true);
  });

  it('handles empty string', () => {
    const result = detectEmergency('');
    expect(result.isEmergency).toBe(false);
  });

  it('handles whitespace only', () => {
    const result = detectEmergency('   ');
    expect(result.isEmergency).toBe(false);
  });

  it('returns matchedPhrase for audit trail', () => {
    const result = detectEmergency('I have a severe toothache right now');
    expect(result.matchedPhrase).toBeTruthy();
  });
});
