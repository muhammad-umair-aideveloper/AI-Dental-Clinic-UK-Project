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
  priceRange: string;
  basePriceGbp: number;
  category: ServiceCategory;
  duration: string;
  description: string;
  features: string[];
  popular?: boolean;
  recoveryTime?: string;
  depositGbp?: number;
  onlineBookable?: boolean;
  botRecommended?: boolean;
  assignedProviders?: string[];
  preOpInstructions?: string;
  insuranceCoverage?: string;
  requiresPreConsult?: boolean;
  financeMonthlyFrom?: number;
}

export interface Clinician {
  id: string;
  name: string;
  title: string;
  credentials: string;
  gdcNumber: string;
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
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  notes?: string;
  isEmergency?: boolean;
  createdAt: string;
  source: 'Online Booking' | 'AI Assistant' | 'Walk-In / Phone' | 'Reception' | 'Guest Triage Modal';
  approvedByAI?: boolean;
  aiApprovalReason?: string;
}

export type LeadStatus = 'New Lead' | 'Contacted' | 'Consultation Booked' | 'Lost / Archived' | 'New' | 'Resolved';
export type LeadSource = 'Web Form' | 'AI Bot' | 'Guest Triage Modal' | 'Emergency Fast-Track' | 'Reception' | 'Online Booking';

export interface WebInquiry {
  id: string;
  patientName: string;
  email: string;
  phone: string;
  serviceInterest: string;
  message: string;
  createdAt: string;
  status: LeadStatus;
  source?: LeadSource;
  preferredDate?: string;
  preferredTime?: string;
  treatmentCategory?: 'General' | 'Cosmetic' | 'Emergency' | 'Specialist';
}

export interface SmileGalleryCase {
  id: string;
  title: string;
  category: 'Cosmetic' | 'Restorative' | 'Orthodontics' | 'Implants';
  beforeImage: string;
  afterImage: string;
  procedureNotes: string;
  duration: string;
  clinicianName: string;
  clinicianGdc: string;
  tags?: string[];
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
  cqcProviderId?: string;
  icoRegistration?: string;
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

// Exactly 3 AI Agent Provider Options: Gemini, Claude, ChatGPT
export type AIProvider = 'Gemini' | 'Claude' | 'ChatGPT';

export interface AIProviderSettings {
  activeProvider: AIProvider;
  geminiApiKey: string;
  geminiModel: string;
  claudeApiKey: string;
  claudeModel: string;
  chatgptApiKey: string;
  chatgptModel: string;
}

// Appointment Approval Policy configured by Admin
export interface AppointmentApprovalPolicy {
  autoApproveEnabled: boolean; // if admin says yes, AI can confirm
  approvedCategories: ServiceCategory[]; // which kinds of appointments AI is authorized to approve
  manualReviewCategories: ServiceCategory[]; // which kinds must be held for doctor manual review
  adminApprovalDirectives: string; // admin's specific written rules for booking confirmation
  autoConfirmMessage: string;
  manualReviewMessage: string;
}

export interface ReasoningStep {
  step: number;
  title: string;
  detail: string;
  status: 'perception' | 'retrieval' | 'policy_eval' | 'guardrail';
}

export interface UserAuth {
  isLoggedIn: boolean;
  role: 'guest' | 'patient' | 'admin';
  name: string;
  email: string;
  phone: string;
}
