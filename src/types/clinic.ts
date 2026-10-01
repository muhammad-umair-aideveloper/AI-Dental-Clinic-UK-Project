export type ServiceCategory = 
  | 'General'
  | 'Preventive'
  | 'Endodontics'
  | 'Cosmetic'
  | 'Surgical'
  | 'Orthodontics'
  | 'Pediatric'
  | 'Emergency';

export interface DentalService {
  id: string;
  name: string;
  priceRange: string; // e.g. "From £95" or "£450 - £750"
  basePriceGbp: number;
  category: ServiceCategory;
  duration: string; // e.g. "45 mins"
  description: string;
  features: string[];
  popular?: boolean;
  recoveryTime?: string;
}

export interface Clinician {
  id: string;
  name: string;
  title: string;
  credentials: string; // e.g. "BDS (Hons), MFDS RCS Eng, M.Sc Oral Implantology"
  gdcNumber: string; // e.g. "GDC No. 248912"
  bio: string;
  experienceYears: number;
  specialties: string[];
  photo: string;
  rating: number;
  reviewsCount: number;
  verifiedProcedures: number;
}

export type AppointmentStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  clinicianName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  status: AppointmentStatus;
  notes?: string;
  isEmergency?: boolean;
  createdAt: string;
  source: 'Online Booking' | 'AI Assistant' | 'Walk-In / Phone' | 'Reception';
}

export interface WebInquiry {
  id: string;
  patientName: string;
  email: string;
  phone: string;
  serviceInterest: string;
  message: string;
  createdAt: string;
  status: 'New' | 'Contacted' | 'Resolved';
}

export interface CompanyDetails {
  clinicName: string;
  workingHours: string;
  companyDescription: string;
  helplinePhone: string;
  whatsappPhone: string;
  contactEmail: string;
  clinicalAddress: string;
  cqcRegistration: string;
  bdaMember: string;
}

export interface ClinicPolicies {
  refundPolicy: string;
  cancellationPolicy: string;
  additionalPolicies: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface AIGuardrails {
  identityRole: string;
  targetAudience: string;
  toneManner: string;
  responseLength: string;
  businessGoals: string;
  shouldSay: string[];
  mustNotSay: string[];
  informationUnavailableInstructions: string;
  transferToHumanInstructions: string;
  languageBehaviorPolicy: string;
}

export type AIProvider = 'OpenAI' | 'OpenRouter' | 'Custom Endpoint';

export interface AIProviderSettings {
  provider: AIProvider;
  modelName: string;
  apiKey: string;
}

export interface UserAuth {
  isLoggedIn: boolean;
  role: 'guest' | 'patient' | 'admin';
  name: string;
  email: string;
  phone: string;
}
