'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  DentalService,
  Appointment,
  AppointmentStatus,
  WebInquiry,
  CompanyDetails,
  ClinicPolicies,
  FAQItem,
  AIGuardrails,
  AIProviderSettings,
  AppointmentApprovalPolicy,
  UserAuth,
} from '@/types/clinic';
import {
  DEFAULT_SERVICES,
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
  openBookingModal: (serviceName?: string) => void;
  closeBookingModal: () => void;

  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  isChatDrawerOpen: boolean;
  chatInitialMessage: string;
  openChatDrawer: (initialQuery?: string) => void;
  closeChatDrawer: () => void;

  // CRUD Operations
  addService: (service: Omit<DentalService, 'id'>) => void;
  updateService: (service: DentalService) => void;
  deleteService: (id: string) => void;

  addAppointment: (app: Omit<Appointment, 'id' | 'createdAt'>) => string;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;

  addInquiry: (inq: Omit<WebInquiry, 'id' | 'createdAt' | 'status'>) => void;
  updateInquiryStatus: (id: string, status: 'New' | 'Contacted' | 'Resolved') => void;

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
  SERVICES: 'vdl_services_v3',
  APPOINTMENTS: 'vdl_appointments_v3',
  INQUIRIES: 'vdl_inquiries_v3',
  COMPANY: 'vdl_company_v3',
  POLICIES: 'vdl_policies_v3',
  FAQS: 'vdl_faqs_v3',
  AI_SETTINGS: 'vdl_ai_settings_v3',
  AI_PROVIDER: 'vdl_ai_provider_v3',
  APPROVAL_POLICY: 'vdl_approval_policy_v3',
  USER: 'vdl_user_v3',
  CURRENCY: 'vdl_currency_v3',
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
      isLoggedIn: false,
      role: 'guest',
      name: 'Guest Patient',
      email: '',
      phone: '',
    })
  );

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState('');

  // Save to LocalStorage helpers
  const saveServices = (data: DentalService[]) => {
    setServices(data);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data));
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

  const openBookingModal = (serviceName?: string) => {
    if (serviceName) setSelectedServiceForBooking(serviceName);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

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
  };

  const updateService = (updatedSrv: DentalService) => {
    const next = services.map(s => (s.id === updatedSrv.id ? updatedSrv : s));
    saveServices(next);
  };

  const deleteService = (id: string) => {
    saveServices(services.filter(s => s.id !== id));
  };

  // Appointment CRUD with Admin Approval Evaluation
  const addAppointment = (app: Omit<Appointment, 'id' | 'createdAt'>): string => {
    const newId = `apt-${Date.now().toString().slice(-4)}`;

    // Evaluate against Admin Approval Policy
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

  // Inquiries CRUD
  const addInquiry = (inq: Omit<WebInquiry, 'id' | 'createdAt' | 'status'>) => {
    const newInquiry: WebInquiry = {
      ...inq,
      id: `inq-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'New',
    };
    saveInquiries([newInquiry, ...inquiries]);
  };

  const updateInquiryStatus = (id: string, status: 'New' | 'Contacted' | 'Resolved') => {
    const next = inquiries.map(i => (i.id === id ? { ...i, status } : i));
    saveInquiries(next);
  };

  // Company Details
  const updateCompanyDetails = (details: Partial<CompanyDetails>) => {
    const updated = { ...companyDetails, ...details };
    setCompanyDetails(updated);
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updated));
  };

  // Policies
  const updateClinicPolicies = (policies: Partial<ClinicPolicies>) => {
    const updated = { ...clinicPolicies, ...policies };
    setClinicPolicies(updated);
    localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(updated));
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
  };

  const updateFAQ = (updatedFaq: FAQItem) => {
    const next = faqs.map(f => (f.id === updatedFaq.id ? updatedFaq : f));
    setFaqs(next);
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(next));
  };

  const deleteFAQ = (id: string) => {
    const next = faqs.filter(f => f.id !== id);
    setFaqs(next);
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(next));
  };

  // AI Settings
  const updateAISettings = (settings: Partial<AIGuardrails>) => {
    const updated = { ...aiSettings, ...settings };
    setAiSettings(updated);
    localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(updated));
  };

  const updateAIProviderSettings = (settings: Partial<AIProviderSettings>) => {
    const updated = { ...aiProviderSettings, ...settings };
    setAiProviderSettings(updated);
    localStorage.setItem(STORAGE_KEYS.AI_PROVIDER, JSON.stringify(updated));
  };

  const updateApprovalPolicy = (policy: Partial<AppointmentApprovalPolicy>) => {
    const updated = { ...approvalPolicy, ...policy };
    setApprovalPolicy(updated);
    localStorage.setItem(STORAGE_KEYS.APPROVAL_POLICY, JSON.stringify(updated));
  };

  // Auth
  const loginAs = (role: 'admin' | 'patient', email?: string, name?: string) => {
    const user: UserAuth = {
      isLoggedIn: true,
      role,
      name: name || (role === 'admin' ? 'Clinic Director (Admin)' : 'Charlotte Kensington'),
      email: email || (role === 'admin' ? 'admin@vertexdental.co.uk' : 'patient@vertexdental.co.uk'),
      phone: role === 'admin' ? '+44 20 7946 0888' : '+44 7712 345678',
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
    setAppointments(INITIAL_APPOINTMENTS);
    setInquiries(INITIAL_INQUIRIES);
    setCompanyDetails(DEFAULT_COMPANY_DETAILS);
    setClinicPolicies(DEFAULT_POLICIES);
    setFaqs(DEFAULT_FAQS);
    setAiSettings(DEFAULT_AI_GUARDRAILS);
    setAiProviderSettings(DEFAULT_AI_PROVIDER_SETTINGS);
    setApprovalPolicy(DEFAULT_APPROVAL_POLICY);
    localStorage.clear();
  };

  return (
    <ClinicContext.Provider
      value={{
        services,
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
        openBookingModal,
        closeBookingModal,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        isChatDrawerOpen,
        chatInitialMessage,
        openChatDrawer,
        closeChatDrawer,
        addService,
        updateService,
        deleteService,
        addAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        addInquiry,
        updateInquiryStatus,
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
