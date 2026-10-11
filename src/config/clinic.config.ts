/**
 * clinic.config.ts
 *
 * THE SINGLE AUTHORITATIVE SOURCE OF TRUTH for clinic settings.
 * All opening hours, slot durations, closed days, bank holidays,
 * timezone logic (Europe/London), and owner contact parameters are defined here.
 * Never hard-code these values in UI components or cron jobs.
 */

export interface DaySchedule {
  open: string;  // HH:mm (24h)
  close: string; // HH:mm (24h)
}

export interface WeeklySchedule {
  monday: DaySchedule | null;
  tuesday: DaySchedule | null;
  wednesday: DaySchedule | null;
  thursday: DaySchedule | null;
  friday: DaySchedule | null;
  saturday: DaySchedule | null;
  sunday: DaySchedule | null;
}

export interface ClinicConfig {
  name: string;
  shortName: string;
  leadDentist: string;
  timezone: string; // 'Europe/London'
  slotLengthMinutes: number; // default: 30 minutes
  weeklySchedule: WeeklySchedule;
  /**
   * Official UK Bank Holidays (England & Wales) - YYYY-MM-DD
   */
  ukBankHolidays: string[];
  ownerContact: {
    phone: string;
    email: string;
  };
}

export const clinicConfig: ClinicConfig = {
  name: 'Vertex Dental Lab',
  shortName: 'Vertex',
  leadDentist: 'Dr. Alistair Vance',
  timezone: 'Europe/London',
  slotLengthMinutes: 30, // Default 30 minutes per appointment

  // Default opening hours: Mon-Fri 09:00-17:00, weekends closed
  weeklySchedule: {
    monday: { open: '09:00', close: '17:00' },
    tuesday: { open: '09:00', close: '17:00' },
    wednesday: { open: '09:00', close: '17:00' },
    thursday: { open: '09:00', close: '17:00' },
    friday: { open: '09:00', close: '17:00' },
    saturday: null, // closed
    sunday: null,   // closed
  },

  // UK Bank Holidays (England & Wales) for 2025, 2026, 2027
  ukBankHolidays: [
    // 2025
    '2025-01-01', // New Year's Day
    '2025-04-18', // Good Friday
    '2025-04-21', // Easter Monday
    '2025-05-05', // Early May Bank Holiday
    '2025-05-26', // Spring Bank Holiday
    '2025-08-25', // Summer Bank Holiday
    '2025-12-25', // Christmas Day
    '2025-12-26', // Boxing Day

    // 2026
    '2026-01-01', // New Year's Day
    '2026-04-03', // Good Friday
    '2026-04-06', // Easter Monday
    '2026-05-04', // Early May Bank Holiday
    '2026-05-25', // Spring Bank Holiday
    '2026-08-31', // Summer Bank Holiday
    '2026-12-25', // Christmas Day
    '2026-12-28', // Boxing Day (substitute)

    // 2027
    '2027-01-01', // New Year's Day
    '2027-03-26', // Good Friday
    '2027-03-29', // Easter Monday
    '2027-05-03', // Early May Bank Holiday
    '2027-05-31', // Spring Bank Holiday
    '2027-08-30', // Summer Bank Holiday
    '2027-12-27', // Christmas Day (substitute)
    '2027-12-28', // Boxing Day (substitute)
  ],

  // Owner contact details from environment variables
  ownerContact: {
    phone: process.env.CLINIC_OWNER_PHONE || '+447946088800',
    email: process.env.CLINIC_OWNER_EMAIL || 'owner@vertexdental.co.uk',
  },
};

/**
 * Returns weekday key for a given Date
 */
export function getWeekdayKey(date: Date): keyof WeeklySchedule {
  const days: (keyof WeeklySchedule)[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[date.getDay()];
}

/**
 * Check if a date string (YYYY-MM-DD) is a UK Bank Holiday
 */
export function isBankHoliday(dateStr: string): boolean {
  return clinicConfig.ukBankHolidays.includes(dateStr.trim());
}

/**
 * Check if the clinic is open on a given date (YYYY-MM-DD or Date object)
 */
export function isClinicOpenOnDate(dateInput: string | Date): boolean {
  const dateStr = typeof dateInput === 'string' ? dateInput.slice(0, 10) : dateInput.toISOString().slice(0, 10);
  if (isBankHoliday(dateStr)) {
    return false;
  }

  // Parse date components safely to avoid UTC/local offset shift
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekday = getWeekdayKey(d);

  return clinicConfig.weeklySchedule[weekday] !== null;
}

/**
 * Get daily opening hours for a given date string (YYYY-MM-DD)
 */
export function getOpeningHoursForDate(dateStr: string): DaySchedule | null {
  if (isBankHoliday(dateStr)) {
    return null;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekday = getWeekdayKey(d);
  return clinicConfig.weeklySchedule[weekday];
}

/**
 * Robust Europe/London time zone conversion utilities.
 * Handles BST (UTC+1, British Summer Time) and GMT (UTC+0) seamlessly.
 */

/**
 * Converts a Europe/London local date (YYYY-MM-DD) and local time (HH:mm or h:mm A)
 * into a UTC ISO string (timestamptz for PostgreSQL).
 */
export function londonTimeToUtcIso(dateStr: string, timeStr: string): string {
  // Normalize timeStr into HH:mm (24-hour format)
  let hours = 0;
  let minutes = 0;

  const trimmed = timeStr.trim().toUpperCase();
  const isAmPm = trimmed.includes('AM') || trimmed.includes('PM');

  if (isAmPm) {
    const isPm = trimmed.includes('PM');
    const cleanTime = trimmed.replace(/[AMP\s]/g, '');
    const parts = cleanTime.split(':').map(Number);
    hours = parts[0];
    minutes = parts[1] || 0;
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
  } else {
    const parts = trimmed.split(':').map(Number);
    hours = parts[0];
    minutes = parts[1] || 0;
  }

  const [year, month, day] = dateStr.split('-').map(Number);

  // Determine daylight saving offset for London for this specific date & time
  // Using Intl.DateTimeFormat to compute exact UTC offset in Europe/London
  const pad = (n: number) => String(n).padStart(2, '0');
  const targetIsoLocal = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`;

  // Start with a UTC date assumption
  const candidateUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

  // Determine what candidateUtc translates to in London
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: clinicConfig.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(candidateUtc);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') partMap[p.type] = p.value;
  }

  const londonHours = parseInt(partMap.hour, 10);
  const londonMinutes = parseInt(partMap.minute, 10);

  // Compute difference between candidate London time and target London time
  const targetTotalMinutes = hours * 60 + minutes;
  const londonTotalMinutes = londonHours * 60 + londonMinutes;
  const diffMinutes = targetTotalMinutes - londonTotalMinutes;

  // Adjust candidate UTC by the difference
  const finalUtc = new Date(candidateUtc.getTime() + diffMinutes * 60 * 1000);
  return finalUtc.toISOString();
}

/**
 * Converts a UTC ISO string (or Date object) into Europe/London local date, time, and display string.
 */
export function utcToLondon(utcInput: string | Date): {
  dateStr: string;   // YYYY-MM-DD in London
  timeStr: string;   // HH:mm in London
  time12: string;    // h:mm A in London
  display: string;   // e.g. "Monday 12 October 2026, 10:30 AM"
  isBst: boolean;    // true if British Summer Time (UTC+1)
} {
  const d = typeof utcInput === 'string' ? new Date(utcInput) : utcInput;

  const dtfFull = new Intl.DateTimeFormat('en-GB', {
    timeZone: clinicConfig.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtfFull.formatToParts(d);
  const m: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') m[p.type] = p.value;
  }

  const dateStr = `${m.year}-${m.month}-${m.day}`;
  const timeStr = `${m.hour}:${m.minute}`;

  const h = parseInt(m.hour, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const time12 = `${h12}:${m.minute} ${suffix}`;

  const display = new Intl.DateTimeFormat('en-GB', {
    timeZone: clinicConfig.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  // Detect if BST (UTC offset is +1 hour = +60 minutes)
  const utcHours = d.getUTCHours();
  const londonH = parseInt(m.hour, 10);
  const hourDiff = (londonH - utcHours + 24) % 24;
  const isBst = hourDiff === 1;

  return { dateStr, timeStr, time12, display, isBst };
}

/**
 * Generate all possible appointment slot times for a given date in Europe/London local time.
 * Automatically respects opening hours, closed days, bank holidays, and slot length.
 */
export function generateDaySlots(dateStr: string, slotLengthMinutes: number = clinicConfig.slotLengthMinutes): {
  timeStr: string; // HH:mm
  time12: string;  // h:mm A
  utcIso: string;  // UTC ISO string
}[] {
  const hours = getOpeningHoursForDate(dateStr);
  if (!hours) {
    return []; // Closed day or bank holiday
  }

  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);

  const startMinutes = openHour * 60 + openMin;
  const endMinutes = closeHour * 60 + closeMin;

  const slots: { timeStr: string; time12: string; utcIso: string }[] = [];

  for (let m = startMinutes; m + slotLengthMinutes <= endMinutes; m += slotLengthMinutes) {
    const slotHour = Math.floor(m / 60);
    const slotMinute = m % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(slotHour)}:${pad(slotMinute)}`;

    const suffix = slotHour >= 12 ? 'PM' : 'AM';
    const h12 = slotHour % 12 === 0 ? 12 : slotHour % 12;
    const time12 = `${h12}:${pad(slotMinute)} ${suffix}`;

    const utcIso = londonTimeToUtcIso(dateStr, timeStr);
    slots.push({ timeStr, time12, utcIso });
  }

  return slots;
}
