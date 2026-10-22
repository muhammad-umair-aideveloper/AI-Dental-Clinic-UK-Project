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
  isUkMobile: boolean;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return { isValid: false, normalized: '', isUkMobile: false, error: 'UK phone number is required.' };
  }

  // Rigid normalization: Strip all whitespace and non-digit characters
  const digitsOnly = input.replace(/\D/g, '');

  let normalized = '';

  if (digitsOnly.startsWith('00447') && digitsOnly.length === 15) {
    normalized = '+44' + digitsOnly.slice(4);
  } else if (digitsOnly.startsWith('0044') && digitsOnly.length >= 13) {
    normalized = '+44' + digitsOnly.slice(4);
  } else if (digitsOnly.startsWith('447') && digitsOnly.length === 12) {
    normalized = '+' + digitsOnly;
  } else if (digitsOnly.startsWith('44') && digitsOnly.length >= 11 && digitsOnly.length <= 13) {
    normalized = '+' + digitsOnly;
  } else if (digitsOnly.startsWith('07') && digitsOnly.length === 11) {
    normalized = '+447' + digitsOnly.slice(2);
  } else if (digitsOnly.startsWith('0') && (digitsOnly.length === 10 || digitsOnly.length === 11)) {
    normalized = '+44' + digitsOnly.slice(1);
  } else if (digitsOnly.startsWith('7') && digitsOnly.length === 10) {
    normalized = '+447' + digitsOnly.slice(1);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('44')) {
    normalized = '+' + digitsOnly;
  }

  const isUkMobile = /^\+447\d{9}$/.test(normalized);
  const isGeneralUk = /^\+44[123789]\d{8,9}$/.test(normalized);

  if (isUkMobile || isGeneralUk) {
    return {
      isValid: true,
      normalized,
      isUkMobile,
    };
  }

  return {
    isValid: false,
    normalized: normalized || input.trim(),
    isUkMobile: false,
    error: `Invalid UK phone format: "${input}". Must be a valid UK number starting with 07 or +447 (e.g. 07123 456789 or +447123456789).`,
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
export function isSameDayAfter8AmUk(apptDate: string, referenceDate: Date = new Date()): {
  isSameDayAfter8Am: boolean;
  currentLondonDate: string;
  currentLondonTime: string;
  reason: string;
} {
  const cleanApptDate = apptDate.trim().slice(0, 10);
  const londonNow = getEuropeLondonDateTime(referenceDate);

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
