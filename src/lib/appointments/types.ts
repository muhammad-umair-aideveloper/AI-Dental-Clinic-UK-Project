/**
 * src/lib/appointments/types.ts
 *
 * Types for Appointment System & Booking Lifecycle
 */

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface CreateAppointmentInput {
  patientName: string;
  phoneNumber: string;
  email?: string;
  reason: string;
  date: string;       // YYYY-MM-DD (Europe/London)
  time: string;       // HH:mm or h:mm A (Europe/London)
  reminderConsent: boolean;
  clinicianName?: string;
  notes?: string;
  source?: 'Website' | 'Chatbot' | 'Admin' | 'Widget';
}

export interface AppointmentRecord {
  id: string;
  customer_name?: string;
  phone?: string;
  service?: string;
  appointment_date?: string;
  appointment_time?: string;
  reminder_1hr_sent?: boolean;
  google_sheet_synced?: boolean;
  patient_id?: string | null;
  patient_name: string;
  phone_number: string;
  email?: string | null;
  reason: string;
  slot_time: string;       // UTC ISO string
  slot_end_time: string;   // UTC ISO string
  status: AppointmentStatus;
  clinician_name: string;
  reminder_consent: boolean;
  consent_timestamp?: string | null;
  reminder_sent: boolean;
  reminder_sent_at?: string | null;
  notes?: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  // Enriched local display fields:
  london_date?: string;
  london_time?: string;
  london_display?: string;
}

export interface SlotAvailability {
  timeStr: string;   // HH:mm
  time12: string;    // h:mm A
  utcIso: string;    // UTC ISO string
  available: boolean;
  reasonDisabled?: 'booked' | 'past' | 'closed' | 'holiday';
}

export interface AppointmentServiceResponse<T = AppointmentRecord> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'DOUBLE_BOOKED' | 'INVALID_PHONE' | 'INVALID_INPUT' | 'SLOT_UNAVAILABLE' | 'CLINIC_CLOSED' | 'SERVER_ERROR' | '23505';
  available_slots?: string[];
  availableSlots?: string[];
}
