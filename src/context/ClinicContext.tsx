'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  DentalService,
  Clinician,
  Appointment,
  AppointmentStatus,
  WebInquiry,
  SmileGalleryCase,
  CompanyDetails,
  ClinicPolicies,
  FAQItem,
  AIGuardrails,
  AIProviderSettings,
  AppointmentApprovalPolicy,
  UserAuth,
  LeadStatus,
} from '@/types/clinic';
import {
  DEFAULT_SERVICES,
  DEFAULT_CLINICIANS,
  DEFAULT_GALLERY_CASES,
  DEFAULT_COMPANY_DETAILS,
  DEFAULT_POLICIES,
  DEFAULT_FAQS,
  DEFAULT_AI_GUARDRAILS,
  DEFAULT_AI_PROVIDER_SETTINGS,
  DEFAULT_APPROVAL_POLICY,
  INITIAL_APPOINTMENTS,
  INITIAL_INQUIRIES,
} from '@/lib/default-data';

export type Currency = 'GBP' | 'EUR' | 'USD';

interface ClinicContextType {
  services: DentalService[];
  clinicians: Clinician[];
  galleryCases: SmileGalleryCase[];
  appointments: Appointment[];
  inquiries: WebInquiry[];
  companyDetails: CompanyDetails;
  clinicPolicies: ClinicPolicies;
  faqs: FAQItem[];
  aiSettings: AIGuardrails;
  aiProviderSettings: AIProviderSettings;
  approvalPolicy: AppointmentApprovalPolicy;
  currentUser: UserAuth;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (gbpAmount: number) => string;

  // Modals & UI Controls
  isBookingModalOpen: boolean;
  selectedServiceForBooking: string;
  selectedCategoryForBooking: 'General' | 'Cosmetic';
  openBookingModal: (serviceName?: string, category?: 'General' | 'Cosmetic') => void;
  closeBookingModal: () => void;

  isChatDrawerOpen: boolean;
  chatInitialMessage: string;
  openChatDrawer: (initialQuery?: string) => void;
  closeChatDrawer: () => void;

  // Optimistic Toast
  toastMessage: string | null;
  triggerToast: (msg: string) => void;

  // CRUD Operations
  addService: (service: Omit<DentalService, 'id'>) => void;
  updateService: (service: DentalService) => void;
  deleteService: (id: string) => void;

  addClinician: (clinician: Omit<Clinician, 'id'>) => void;
  updateClinician: (clinician: Clinician) => void;
  deleteClinician: (id: string) => void;

  addGalleryCase: (caseItem: Omit<SmileGalleryCase, 'id'>) => void;
  updateGalleryCase: (caseItem: SmileGalleryCase) => void;
  deleteGalleryCase: (id: string) => void;

  addAppointment: (app: Omit<Appointment, 'id' | 'createdAt'>) => string;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;

  addInquiry: (inq: Omit<WebInquiry, 'id' | 'createdAt'> & { status?: LeadStatus }) => string;
  updateInquiryStatus: (id: string, status: LeadStatus) => void;
  deleteInquiry: (id: string) => void;

  updateCompanyDetails: (details: Partial<CompanyDetails>) => void;
  updateClinicPolicies: (policies: Partial<ClinicPolicies>) => void;

  addFAQ: (faq: Omit<FAQItem, 'id'>) => void;
  updateFAQ: (faq: FAQItem) => void;
  deleteFAQ: (id: string) => void;

  updateAISettings: (settings: Partial<AIGuardrails>) => void;
  updateAIProviderSettings: (settings: Partial<AIProviderSettings>) => void;
  updateApprovalPolicy: (policy: Partial<AppointmentApprovalPolicy>) => void;

  loginAs: (role: 'admin' | 'patient', email?: string, name?: string) => void;
  logout: () => void;

  resetToDefaults: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SERVICES: 'vdl_services_v4',
  CLINICIANS: 'vdl_clinicians_v4',
  GALLERY: 'vdl_gallery_v4',
  APPOINTMENTS: 'vdl_appointments_v4',
  INQUIRIES: 'vdl_inquiries_v4',
  COMPANY: 'vdl_company_v4',
  POLICIES: 'vdl_policies_v4',
  FAQS: 'vdl_faqs_v4',
  AI_SETTINGS: 'vdl_ai_settings_v4',
  AI_PROVIDER: 'vdl_ai_provider_v4',
  APPROVAL_POLICY: 'vdl_approval_policy_v4',
  USER: 'vdl_user_v4',
  CURRENCY: 'vdl_currency_v4',
};

function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<DentalService[]>(() =>
    getStoredItem(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
  );
  const [clinicians, setClinicians] = useState<Clinician[]>(() =>
    getStoredItem(STORAGE_KEYS.CLINICIANS, DEFAULT_CLINICIANS)
  );
  const [galleryCases, setGalleryCases] = useState<SmileGalleryCase[]>(() =>
    getStoredItem(STORAGE_KEYS.GALLERY, DEFAULT_GALLERY_CASES)
  );
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    getStoredItem(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS)
  );
  const [inquiries, setInquiries] = useState<WebInquiry[]>(() =>
    getStoredItem(STORAGE_KEYS.INQUIRIES, INITIAL_INQUIRIES)
  );
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>(() =>
    getStoredItem(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY_DETAILS)
  );
  const [clinicPolicies, setClinicPolicies] = useState<ClinicPolicies>(() =>
    getStoredItem(STORAGE_KEYS.POLICIES, DEFAULT_POLICIES)
  );
  const [faqs, setFaqs] = useState<FAQItem[]>(() =>
    getStoredItem(STORAGE_KEYS.FAQS, DEFAULT_FAQS)
  );
  const [aiSettings, setAiSettings] = useState<AIGuardrails>(() =>
    getStoredItem(STORAGE_KEYS.AI_SETTINGS, DEFAULT_AI_GUARDRAILS)
  );
  const [aiProviderSettings, setAiProviderSettings] = useState<AIProviderSettings>(() =>
    getStoredItem(STORAGE_KEYS.AI_PROVIDER, DEFAULT_AI_PROVIDER_SETTINGS)
  );
  const [approvalPolicy, setApprovalPolicy] = useState<AppointmentApprovalPolicy>(() =>
    getStoredItem(STORAGE_KEYS.APPROVAL_POLICY, DEFAULT_APPROVAL_POLICY)
  );
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === 'undefined') return 'GBP';
    return (localStorage.getItem(STORAGE_KEYS.CURRENCY) as Currency) || 'GBP';
  });
  const [currentUser, setCurrentUser] = useState<UserAuth>(() =>
    getStoredItem(STORAGE_KEYS.USER, {
      isLoggedIn: true,
      role: 'admin',
      name: 'Dr. Alistair Vance',
      email: 'admin@vertexdental.co.uk',
      phone: '+44 20 7946 0888',
    })
  );

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState('');
  const [selectedCategoryForBooking, setSelectedCategoryForBooking] = useState<'General' | 'Cosmetic'>('Cosmetic');
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Save to LocalStorage helpers
  const saveServices = (data: DentalService[]) => {
    setServices(data);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data));
  };

  const saveClinicians = (data: Clinician[]) => {
    setClinicians(data);
    localStorage.setItem(STORAGE_KEYS.CLINICIANS, JSON.stringify(data));
  };

  const saveGallery = (data: SmileGalleryCase[]) => {
    setGalleryCases(data);
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(data));
  };

  const saveAppointments = (data: Appointment[]) => {
    setAppointments(data);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(data));
  };

  const saveInquiries = (data: WebInquiry[]) => {
    setInquiries(data);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(data));
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEYS.CURRENCY, c);
  };

  const formatPrice = (gbpAmount: number): string => {
    if (currency === 'GBP') {
      return `£${gbpAmount.toLocaleString('en-GB')}`;
    } else if (currency === 'EUR') {
      const eur = Math.round(gbpAmount * 1.18);
      return `€${eur.toLocaleString('en-GB')}`;
    } else {
      const usd = Math.round(gbpAmount * 1.28);
      return `$${usd.toLocaleString('en-US')}`;
    }
  };

  const openBookingModal = (serviceName?: string, category?: 'General' | 'Cosmetic') => {
    if (serviceName) setSelectedServiceForBooking(serviceName);
    if (category) setSelectedCategoryForBooking(category);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const openChatDrawer = (initialQuery?: string) => {
    if (initialQuery) setChatInitialMessage(initialQuery);
    setIsChatDrawerOpen(true);
  };
  const closeChatDrawer = () => setIsChatDrawerOpen(false);

  // Service CRUD
  const addService = (newSrv: Omit<DentalService, 'id'>) => {
    const srv: DentalService = {
      ...newSrv,
      id: `srv-${Date.now()}`,
    };
    saveServices([...services, srv]);
    triggerToast(`Added service "${srv.name}" to catalog.`);
  };

  const updateService = (updatedSrv: DentalService) => {
    const next = services.map(s => (s.id === updatedSrv.id ? updatedSrv : s));
    saveServices(next);
    triggerToast(`Updated "${updatedSrv.name}" pricing & features.`);
  };

  const deleteService = (id: string) => {
    saveServices(services.filter(s => s.id !== id));
    triggerToast('Service removed from catalog.');
  };

  // Clinician CRUD
  const addClinician = (newClin: Omit<Clinician, 'id'>) => {
    const clin: Clinician = {
      ...newClin,
      id: `clin-${Date.now()}`,
    };
    saveClinicians([...clinicians, clin]);
    triggerToast(`Added clinician "${clin.name}" with GDC credentials.`);
  };

  const updateClinician = (updatedClin: Clinician) => {
    const next = clinicians.map(c => (c.id === updatedClin.id ? updatedClin : c));
    saveClinicians(next);
    triggerToast(`Updated clinician profile for "${updatedClin.name}".`);
  };

  const deleteClinician = (id: string) => {
    saveClinicians(clinicians.filter(c => c.id !== id));
    triggerToast('Clinician record removed.');
  };

  // Smile Gallery CRUD
  const addGalleryCase = (newCase: Omit<SmileGalleryCase, 'id'>) => {
    const caseItem: SmileGalleryCase = {
      ...newCase,
      id: `case-${Date.now()}`,
    };
    saveGallery([...galleryCases, caseItem]);
    triggerToast(`Added Before/After case "${caseItem.title}".`);
  };

  const updateGalleryCase = (updatedCase: SmileGalleryCase) => {
    const next = galleryCases.map(c => (c.id === updatedCase.id ? updatedCase : c));
    saveGallery(next);
    triggerToast(`Updated case study "${updatedCase.title}".`);
  };

  const deleteGalleryCase = (id: string) => {
    saveGallery(galleryCases.filter(c => c.id !== id));
    triggerToast('Gallery case removed.');
  };

  // Appointment CRUD with Admin Approval Evaluation
  const addAppointment = (app: Omit<Appointment, 'id' | 'createdAt'>): string => {
    const newId = `apt-${Date.now().toString().slice(-4)}`;

    const targetService = services.find(s => s.id === app.serviceId || s.name === app.serviceName);
    const category = targetService?.category || 'General';

    const isAutoApprovedByAdmin =
      approvalPolicy.autoApproveEnabled &&
      approvalPolicy.approvedCategories.includes(category);

    const calculatedStatus: AppointmentStatus = isAutoApprovedByAdmin ? 'Confirmed' : 'Pending';
    const approvalReason = isAutoApprovedByAdmin
      ? `AI Confirmed: Category [${category}] is approved per Admin Appointment Directive.`
      : `AI Marked Pending: Category [${category}] requires manual doctor sign-off.`;

    const newAppointment: Appointment = {
      ...app,
      id: newId,
      status: app.status || calculatedStatus,
      approvedByAI: isAutoApprovedByAdmin,
      aiApprovalReason: approvalReason,
      createdAt: new Date().toISOString(),
    };

    saveAppointments([newAppointment, ...appointments]);
    return newId;
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    const next = appointments.map(a => (a.id === id ? { ...a, status } : a));
    saveAppointments(next);
  };

  const deleteAppointment = (id: string) => {
    saveAppointments(appointments.filter(a => a.id !== id));
  };

  // Inquiries / Leads CRUD
  const addInquiry = (inq: Omit<WebInquiry, 'id' | 'createdAt'> & { status?: LeadStatus }): string => {
    const newId = `lead-${Date.now().toString().slice(-4)}`;
    const newInquiry: WebInquiry = {
      ...inq,
      id: newId,
      createdAt: new Date().toISOString(),
      status: inq.status || 'New Lead',
    };
    saveInquiries([newInquiry, ...inquiries]);
    return newId;
  };

  const updateInquiryStatus = (id: string, status: LeadStatus) => {
    const next = inquiries.map(i => (i.id === id ? { ...i, status } : i));
    saveInquiries(next);
    triggerToast(`Lead status updated to "${status}".`);
  };

  const deleteInquiry = (id: string) => {
    saveInquiries(inquiries.filter(i => i.id !== id));
    triggerToast('Lead archived and deleted.');
  };

  // Company Details
  const updateCompanyDetails = (details: Partial<CompanyDetails>) => {
    const updated = { ...companyDetails, ...details };
    setCompanyDetails(updated);
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updated));
    triggerToast('Clinic details & GDC/CQC credentials updated.');
  };

  // Policies
  const updateClinicPolicies = (policies: Partial<ClinicPolicies>) => {
    const updated = { ...clinicPolicies, ...policies };
    setClinicPolicies(updated);
    localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(updated));
    triggerToast('Clinic policies & cancellation terms updated.');
  };

  // FAQs
  const addFAQ = (faq: Omit<FAQItem, 'id'>) => {
    const newFaq: FAQItem = {
      ...faq,
      id: `faq-${Date.now()}`,
    };
    const next = [...faqs, newFaq];
    setFaqs(next);
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(next));
    triggerToast('FAQ item added.');
  };

  const updateFAQ = (updatedFaq: FAQItem) => {
    const next = faqs.map(f => (f.id === updatedFaq.id ? updatedFaq : f));
    setFaqs(next);
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(next));
    triggerToast('FAQ updated.');
  };

  const deleteFAQ = (id: string) => {
    const next = faqs.filter(f => f.id !== id);
    setFaqs(next);
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(next));
    triggerToast('FAQ removed.');
  };

  // AI Settings
  const updateAISettings = (settings: Partial<AIGuardrails>) => {
    const updated = { ...aiSettings, ...settings };
    setAiSettings(updated);
    localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(updated));
    triggerToast('AI Instructions & GDC Guardrails saved.');
  };

  const updateAIProviderSettings = (settings: Partial<AIProviderSettings>) => {
    const updated = { ...aiProviderSettings, ...settings };
    setAiProviderSettings(updated);
    localStorage.setItem(STORAGE_KEYS.AI_PROVIDER, JSON.stringify(updated));
    triggerToast(`AI Provider set to ${updated.activeProvider}.`);
  };

  const updateApprovalPolicy = (policy: Partial<AppointmentApprovalPolicy>) => {
    const updated = { ...approvalPolicy, ...policy };
    setApprovalPolicy(updated);
    localStorage.setItem(STORAGE_KEYS.APPROVAL_POLICY, JSON.stringify(updated));
    triggerToast('Appointment approval policy updated.');
  };

  // Auth (Admin Only for Staff Hub)
  const loginAs = (role: 'admin' | 'patient', email?: string, name?: string) => {
    const user: UserAuth = {
      isLoggedIn: true,
      role: 'admin',
      name: name || 'Dr. Alistair Vance (Lead Surgeon)',
      email: email || 'admin@vertexdental.co.uk',
      phone: '+44 20 7946 0888',
    };
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  };

  const logout = () => {
    const guest: UserAuth = {
      isLoggedIn: false,
      role: 'guest',
      name: 'Guest Patient',
      email: '',
      phone: '',
    };
    setCurrentUser(guest);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const resetToDefaults = () => {
    setServices(DEFAULT_SERVICES);
    setClinicians(DEFAULT_CLINICIANS);
    setGalleryCases(DEFAULT_GALLERY_CASES);
    setAppointments(INITIAL_APPOINTMENTS);
    setInquiries(INITIAL_INQUIRIES);
    setCompanyDetails(DEFAULT_COMPANY_DETAILS);
    setClinicPolicies(DEFAULT_POLICIES);
    setFaqs(DEFAULT_FAQS);
    setAiSettings(DEFAULT_AI_GUARDRAILS);
    setAiProviderSettings(DEFAULT_AI_PROVIDER_SETTINGS);
    setApprovalPolicy(DEFAULT_APPROVAL_POLICY);
    localStorage.clear();
    triggerToast('All data reset to official UK private clinic defaults.');
  };

  return (
    <ClinicContext.Provider
      value={{
        services,
        clinicians,
        galleryCases,
        appointments,
        inquiries,
        companyDetails,
        clinicPolicies,
        faqs,
        aiSettings,
        aiProviderSettings,
        approvalPolicy,
        currentUser,
        currency,
        setCurrency,
        formatPrice,
        isBookingModalOpen,
        selectedServiceForBooking,
        selectedCategoryForBooking,
        openBookingModal,
        closeBookingModal,
        isChatDrawerOpen,
        chatInitialMessage,
        openChatDrawer,
        closeChatDrawer,
        toastMessage,
        triggerToast,
        addService,
        updateService,
        deleteService,
        addClinician,
        updateClinician,
        deleteClinician,
        addGalleryCase,
        updateGalleryCase,
        deleteGalleryCase,
        addAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        addInquiry,
        updateInquiryStatus,
        deleteInquiry,
        updateCompanyDetails,
        updateClinicPolicies,
        addFAQ,
        updateFAQ,
        deleteFAQ,
        updateAISettings,
        updateAIProviderSettings,
        updateApprovalPolicy,
        loginAs,
        logout,
        resetToDefaults,
      }}
    >
      {children}
      {/* Global Optimistic Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-md bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center space-x-3 animate-fade-in">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <p className="text-xs font-medium text-slate-100">{toastMessage}</p>
        </div>
      )}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
