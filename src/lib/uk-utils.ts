/**
 * src/lib/uk-utils.ts
 *
 * Dedicated UK Normalization and Timezone Engine for Vertex Dental Lab.
 * Enforces:
 *   1. Europe/London timezone evaluations (strictly handling BST / GMT transitions).
 *   2. UK Mobile Phone normalization to E.164 (+447XXXXXXXXX).
 *   3. 1-Hour standard clinic slots between 09:00 and 17:00.
 *   4. Same-Day booking alert evaluation (after 08:00 AM London time).
 */

// 1-Hour Standard Clinic Slots between 09:00 and 17:00 London time
export const UK_CLINIC_1HR_SLOTS: readonly string[] = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
] as const;

/**
 * Normalizes any UK phone number string into E.164 format (+447...).
 * Specifically:
 * - Strips all spaces, hyphens, brackets, dots
 * - If user enters '07123456789' or '07123 456789', replaces leading '0' with '+44' -> '+447123456789'
 * - Handles leading '0044', '+44', or bare '447'
 * - Validates UK mobile structure (+447 followed by 9 digits = 13 characters total)
 */
export function normalizeUkMobilePhone(input: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return { isValid: false, normalized: '', error: 'UK phone number is required.' };
  }

  // Strip all non-digit and non-plus characters
  let cleaned = input.replace(/[\s\-\(\)\.]/g, '').trim();

  // Convert international prefix 0044 to +44
  if (cleaned.startsWith('0044')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Convert bare 447 to +447
  if (cleaned.startsWith('447')) {
    cleaned = '+' + cleaned;
  }

  // Convert leading 07 to +447
  if (cleaned.startsWith('07')) {
    cleaned = '+44' + cleaned.slice(1);
  }

  // Convert leading 01, 02, 03, 08 (UK landlines/freephone)
  if (/^0[12389]/.test(cleaned)) {
    cleaned = '+44' + cleaned.slice(1);
  }

  // Validate E.164 UK Mobile: +447 followed by 9 digits
  const ukMobileRegex = /^\+447\d{9}$/;
  if (ukMobileRegex.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }

  // Fallback for general valid UK E.164 numbers (+44 followed by 9-10 digits)
  const ukGeneralRegex = /^\+44[123789]\d{8,9}$/;
  if (ukGeneralRegex.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }

  return {
    isValid: false,
    normalized: cleaned,
    error: `Invalid UK phone format: "${input}". Must be a UK mobile starting with 07 or +447 (e.g. 07123456789 or +447123456789).`,
  };
}

/**
 * Normalizes time string into HH:MM (24-hour) format.
 * Supports: '10:00:00' -> '10:00', '9:00' -> '09:00', '14:00' -> '14:00'.
 */
export function normalizeUkTimeHHMM(timeStr: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].slice(0, 2).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return trimmed;
}

/**
 * Returns current timestamp evaluation strictly in Europe/London timezone.
 * Automatically handles GMT (UTC+0) and BST (UTC+1) transitions without raw UTC skew.
 */
export function getEuropeLondonDateTime(dateObj: Date = new Date()): {
  dateStr: string;   // YYYY-MM-DD in London
  timeStr: string;   // HH:MM:SS in London
  timeHHMM: string;  // HH:MM in London
  hour: number;      // 0 - 23
  minute: number;    // 0 - 59
  second: number;    // 0 - 59
  isBst: boolean;    // true if daylight saving is active
} {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });

  const parts = dtf.formatToParts(dateObj);
  const m: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') m[p.type] = p.value;
  }

  const dateStr = `${m.year}-${m.month}-${m.day}`;
  const hour = parseInt(m.hour || '0', 10);
  const minute = parseInt(m.minute || '0', 10);
  const second = parseInt(m.second || '0', 10);
  const timeHHMM = `${m.hour}:${m.minute}`;
  const timeStr = `${m.hour}:${m.minute}:${m.second}`;
  const isBst = m.timeZoneName === 'BST';

  return {
    dateStr,
    timeStr,
    timeHHMM,
    hour,
    minute,
    second,
    isBst,
  };
}

/**
 * Evaluates whether a booking is SAME-DAY AFTER 08:00 AM UK time.
 * If appt_date == current UK date AND current UK time >= 08:00:00 -> returns true.
 */
export function isSameDayAfter8AmUk(apptDate: string): {
  isSameDayAfter8Am: boolean;
  currentLondonDate: string;
  currentLondonTime: string;
  reason: string;
} {
  const cleanApptDate = apptDate.trim().slice(0, 10);
  const londonNow = getEuropeLondonDateTime();

  const isSameDay = cleanApptDate === londonNow.dateStr;
  const isPast8Am = londonNow.hour >= 8;

  const isSameDayAfter8Am = isSameDay && isPast8Am;

  let reason = '';
  if (!isSameDay) {
    reason = `Booking date (${cleanApptDate}) is not today in London (${londonNow.dateStr}).`;
  } else if (!isPast8Am) {
    reason = `Current London time is ${londonNow.timeStr} (before 08:00 AM cut-off).`;
  } else {
    reason = `URGENT: Same-day booking for ${cleanApptDate} placed at ${londonNow.timeStr} London time (after 08:00 AM).`;
  }

  return {
    isSameDayAfter8Am,
    currentLondonDate: londonNow.dateStr,
    currentLondonTime: londonNow.timeStr,
    reason,
  };
}
