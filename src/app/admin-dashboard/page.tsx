'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';
import { generateGroundingResponse, AIResponseResult } from '@/lib/ai-engine';
import { ServiceCategory, AIProvider } from '@/types/clinic';
import {
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Trash2,
  Clock,
  ShieldCheck,
  Plus,
  Save,
  Key,
  Eye,
  EyeOff,
  Send,
  AlertTriangle,
  Database,
  Building,
  Brain,
  Cpu,
  ExternalLink,
  ChevronRight,
  ClipboardPaste,
  ShieldAlert,
  ChevronDown,
  LayoutDashboard,
  CalendarDays,
  FolderKanban,
  Bot,
  UserCheck,
  Bell,
  Check,
  X,
  RefreshCw,
  Sliders,
  Sparkles,
  Stethoscope,
  Activity,
  FileText,
  BadgeCheck,
  Settings,
  Phone,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    services,
    addService,
    deleteService,
    appointments,
    updateAppointmentStatus,
    deleteAppointment,
    addAppointment,
    inquiries,
    updateInquiryStatus,
    companyDetails,
    updateCompanyDetails,
    clinicPolicies,
    updateClinicPolicies,
    faqs,
    addFAQ,
    deleteFAQ,
    aiSettings,
    updateAISettings,
    aiProviderSettings,
    updateAIProviderSettings,
    approvalPolicy,
    updateApprovalPolicy,
    resetToDefaults,
  } = useClinic();

  // Navigation matching Image 2 sidebar:
  // Overview | Appointments | Services Catalog | AI Chatbot Studio | Patients
  const [activeNav, setActiveNav] = useState<'overview' | 'appointments' | 'services' | 'ai-studio' | 'patients'>('appointments');

  // Sub-sections inside the AI Agent section (the 3 sub-sections combined in one)
  const [aiSubSection, setAiSubSection] = useState<'providers' | 'approval-policy' | 'knowledge-simulator'>('providers');

  // Save banner feedback
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);

  // Appointments Tab States (matching Image 2)
  const [aptSearch, setAptSearch] = useState('');
  const [aptFilterTab, setAptFilterTab] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('pending');
  const [selectedPractitioner, setSelectedPractitioner] = useState('All');
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  // Manual Booking Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    serviceName: services[0]?.name || 'General Checkup & Digital OPG X-Rays',
    date: 'Today, Oct 24',
    timeSlot: '03:30 PM',
    clinicianName: 'Dr. Sarah Jenkins',
    chiefComplaint: '',
    isUrgent: false,
  });

  // Local state for AI Settings
  const [localProvider, setLocalProvider] = useState<AIProvider>(aiProviderSettings.activeProvider);
  const [localGeminiKey, setLocalGeminiKey] = useState(aiProviderSettings.geminiApiKey);
  const [localGeminiModel, setLocalGeminiModel] = useState(aiProviderSettings.geminiModel);
  const [localClaudeKey, setLocalClaudeKey] = useState(aiProviderSettings.claudeApiKey);
  const [localClaudeModel, setLocalClaudeModel] = useState(aiProviderSettings.claudeModel);
  const [localChatgptKey, setLocalChatgptKey] = useState(aiProviderSettings.chatgptApiKey);
  const [localChatgptModel, setLocalChatgptModel] = useState(aiProviderSettings.chatgptModel);

  // Key Visibility toggles
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showChatgptKey, setShowChatgptKey] = useState(false);

  // Local state for Approval Policy
  const [localAutoApprove, setLocalAutoApprove] = useState(approvalPolicy.autoApproveEnabled);
  const [localApprovedCategories, setLocalApprovedCategories] = useState<ServiceCategory[]>(
    approvalPolicy.approvedCategories
  );
  const [localApprovalDirectives, setLocalApprovalDirectives] = useState(
    approvalPolicy.adminApprovalDirectives
  );

  // Local Company Details & Policies
  const [localCompany, setLocalCompany] = useState(companyDetails);
  const [localPolicies, setLocalPolicies] = useState({
    refundPolicy: clinicPolicies.refundPolicy,
    cancellationPolicy: clinicPolicies.cancellationPolicy,
    additionalPoliciesText: clinicPolicies.additionalPolicies.join('\n'),
  });

  // Simulator State
  const [simulatorQuery, setSimulatorQuery] = useState('');
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulatorHistory, setSimulatorHistory] = useState<
    { query: string; response: AIResponseResult; timestamp: string }[]
  >([]);
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(0);

  const allCategories: ServiceCategory[] = [
    'General',
    'Preventive',
    'Endodontics',
    'Cosmetic',
    'Surgical',
    'Orthodontics',
    'Emergency',
  ];

  // Mock initial triage cards matching Image 2 Marcus Reed & Elena Rostova
  const mockTriagePatients = [
    {
      id: 'apt-m-1',
      name: 'Marcus Reed',
      type: 'First-time Patient',
      age: 34,
      mrn: '#9842',
      treatment: 'Root Canal Therapy & Crown',
      doctor: 'Dr. Sarah Jenkins',
      date: 'Today, Oct 24 • 03:30 PM',
      complaint: 'Experiencing acute molar sensitivity since 2 days, sharp pain radiating to jaw.',
      operatory: 'Chair 1 (Operatory A) Free',
      requestedAgo: '18 mins ago',
      urgent: true,
      status: 'pending',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    },
    {
      id: 'apt-e-2',
      name: 'Elena Rostova',
      type: 'Returning Patient (5 visits)',
      age: 29,
      mrn: '#7124',
      treatment: 'Teeth Whitening & Hygiene Polish',
      doctor: 'Dr. Alex Vance',
      date: 'Today, Oct 24 • 04:45 PM',
      complaint: 'Routine wedding prep whitening session; prefers low peroxide gel if possible.',
      insurance: 'Cigna Dental Plus #C902',
      operatory: 'Chair 3 (Hygienist) Prep',
      requestedAgo: '42 mins ago',
      urgent: false,
      status: 'pending',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
    },
    {
      id: 'apt-j-3',
      name: 'Julian Hayes',
      type: 'First-time Patient',
      age: 48,
      mrn: '#1053',
      treatment: '3D Guided Dental Implant Consult',
      doctor: 'Dr. Sarah Jenkins',
      date: 'Today, Oct 24 • 05:15 PM',
      complaint: 'Lower premolar fractured at gumline. Requesting immediate bone graft review.',
      operatory: 'Chair 1 (Operatory A)',
      requestedAgo: '1 hour ago',
      urgent: true,
      status: 'pending',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    },
  ];

  // Count metrics for Image 2 style
  const totalRequestsToday = 28;
  const pendingReviewCount = 5;
  const confirmedCount = 19;
  const declinedCount = 4;

  const handleSaveAllAISettings = () => {
    updateCompanyDetails(localCompany);
    updateClinicPolicies({
      refundPolicy: localPolicies.refundPolicy,
      cancellationPolicy: localPolicies.cancellationPolicy,
      additionalPolicies: localPolicies.additionalPoliciesText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
    });
    updateAIProviderSettings({
      activeProvider: localProvider,
      geminiApiKey: localGeminiKey,
      geminiModel: localGeminiModel,
      claudeApiKey: localClaudeKey,
      claudeModel: localClaudeModel,
      chatgptApiKey: localChatgptKey,
      chatgptModel: localChatgptModel,
    });
    updateApprovalPolicy({
      autoApproveEnabled: localAutoApprove,
      approvedCategories: localApprovedCategories,
      manualReviewCategories: allCategories.filter(c => !localApprovedCategories.includes(c)),
      adminApprovalDirectives: localApprovalDirectives,
      autoConfirmMessage: approvalPolicy.autoConfirmMessage,
      manualReviewMessage: approvalPolicy.manualReviewMessage,
    });

    setSaveSuccessBanner(true);
    setTimeout(() => setSaveSuccessBanner(false), 4000);
  };

  const toggleCategoryApproval = (cat: ServiceCategory) => {
    if (localApprovedCategories.includes(cat)) {
      setLocalApprovedCategories(localApprovedCategories.filter(c => c !== cat));
    } else {
      setLocalApprovedCategories([...localApprovedCategories, cat]);
    }
  };

  const handleRunSimulator = (presetQuery?: string) => {
    const q = (presetQuery || simulatorQuery).trim();
    if (!q) return;

    setSimulatorLoading(true);
    setTimeout(() => {
      const result = generateGroundingResponse(q, {
        services,
        companyDetails: localCompany,
        policies: {
          refundPolicy: localPolicies.refundPolicy,
          cancellationPolicy: localPolicies.cancellationPolicy,
          additionalPolicies: localPolicies.additionalPoliciesText
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean),
        },
        faqs,
        guardrails: aiSettings,
        providerSettings: {
          activeProvider: localProvider,
          geminiApiKey: localGeminiKey,
          geminiModel: localGeminiModel,
          claudeApiKey: localClaudeKey,
          claudeModel: localClaudeModel,
          chatgptApiKey: localChatgptKey,
          chatgptModel: localChatgptModel,
        },
        approvalPolicy: {
          autoApproveEnabled: localAutoApprove,
          approvedCategories: localApprovedCategories,
          manualReviewCategories: allCategories.filter(c => !localApprovedCategories.includes(c)),
          adminApprovalDirectives: localApprovalDirectives,
          autoConfirmMessage: approvalPolicy.autoConfirmMessage,
          manualReviewMessage: approvalPolicy.manualReviewMessage,
        },
      });

      setSimulatorHistory(prev => [
        {
          query: q,
          response: result,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      setExpandedTraceIndex(0);
      setSimulatorLoading(false);
      setSimulatorQuery('');
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      
      {/* Toast Save Alert */}
      {saveSuccessBanner && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center space-x-3 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold">AI Agent Settings & Approval Policies Saved</p>
            <p className="text-[11px] text-slate-300">
              Active Engine: {localProvider} • Approval Authority: {localAutoApprove ? 'Authorized' : 'Doctor Sign-off'}
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row w-full">
        
        {/* ======================================================== */}
        {/* SIDEBAR: DentPulse Clinical Admin Style (Matching Image 2) */}
        {/* ======================================================== */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 shadow-xs">
          <div>
            {/* Logo */}
            <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm tracking-tight text-slate-950">
                  Vertex Dental<span className="text-sky-600">Lab</span>
                </h2>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                  CLINICAL ADMIN
                </p>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="p-3">
              <p className="px-3 pt-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                CLINICAL SUITE
              </p>

              <nav className="space-y-1 text-xs font-medium">
                {/* 1. Overview */}
                <button
                  onClick={() => setActiveNav('overview')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeNav === 'overview'
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Overview</span>
                </button>

                {/* 2. Appointments (with red urgent badge '5' like in Image 2) */}
                <button
                  onClick={() => setActiveNav('appointments')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                    activeNav === 'appointments'
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CalendarDays className="w-4 h-4" />
                    <span>Appointments</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeNav === 'appointments'
                        ? 'bg-white text-sky-700'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    5
                  </span>
                </button>

                {/* 3. Services Catalog */}
                <button
                  onClick={() => setActiveNav('services')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeNav === 'services'
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Services Catalog</span>
                </button>

                {/* 4. AI Chatbot Studio / AI Agent & Knowledge */}
                <button
                  onClick={() => setActiveNav('ai-studio')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                    activeNav === 'ai-studio'
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Brain className="w-4 h-4" />
                    <span>AI Chatbot Studio</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>

                {/* 5. Patients */}
                <button
                  onClick={() => setActiveNav('patients')}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    activeNav === 'patients'
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Patients</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Bottom Sidebar: Settings, Cloud Version, Public Site */}
          <div className="p-4 border-t border-slate-100 space-y-3 text-xs">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between text-slate-600 hover:text-sky-600 font-medium py-1"
            >
              <span className="flex items-center space-x-2">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Public Site</span>
              </span>
              <span className="text-[10px] text-slate-400">UK Live</span>
            </Link>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>v3.2 Dental Cloud</span>
              </span>
              <button
                onClick={resetToDefaults}
                className="text-slate-400 hover:text-rose-600 transition-colors"
                title="Reset demo data"
              >
                Reset
              </button>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN VIEWPORT */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          
          {/* Top Navbar matching Image 2 */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between gap-4 shadow-xs">
            {/* Search Input */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient records, MRN, dental chart..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
            </div>

            {/* Right Controls matching Image 2 */}
            <div className="flex items-center space-x-3.5 ml-auto">
              {/* Accepting Online Bookings Pill */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Accepting Online Bookings - Open</span>
              </div>

              {/* Quick Action Button */}
              <button
                onClick={() => setManualModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Action</span>
              </button>

              {/* Notification Bell */}
              <button className="relative w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
              </button>

              {/* Clinician Profile Avatar */}
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-300 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&h=120&q=80"
                    alt="Dr. Sarah Jenkins"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Dr. Sarah Jenkins</p>
                  <p className="text-[10px] text-slate-500">Clinical Director • Marylebone</p>
                </div>
              </div>
            </div>
          </header>

          {/* ======================================================== */}
          {/* VIEW 1: APPOINTMENTS & BOOKING REQUESTS (Matching Image 2) */}
          {/* ======================================================== */}
          {activeNav === 'appointments' && (
            <div className="p-6 sm:p-8 space-y-7 max-w-7xl mx-auto w-full animate-fade-in">
              
              {/* Header Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    CLINICAL ADMINISTRATION SUITE • <span className="text-sky-600 font-extrabold">Live Triage Dispatch</span>
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-0.5">
                    Appointments & Booking Requests
                  </h1>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => setActiveNav('ai-studio')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-sky-600" />
                    <span>Auto-Sync AI Portal</span>
                  </button>

                  <button
                    onClick={() => setManualModalOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm flex items-center space-x-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manual Booking</span>
                  </button>

                  <button
                    onClick={() => {}}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-2xs"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards (Matching Image 2 exactly) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Requests Today */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>TOTAL REQUESTS TODAY</span>
                    <Calendar className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-slate-950">{totalRequestsToday}</span>
                    <span className="text-xs font-bold text-emerald-600">+14% vs yesterday</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-sky-600 rounded-full"></div>
                  </div>
                </div>

                {/* 2. Pending Review (Urgent) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>PENDING REVIEW</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700">
                      URGENT
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-slate-950">{pendingReviewCount}</span>
                    <span className="text-xs text-rose-600 font-semibold">Immediate triage required</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Average Wait: <span className="font-bold text-slate-800">12.3 mins</span> (Emergency/Urgent)
                  </p>
                </div>

                {/* 3. Accepted & Confirmed */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>ACCEPTED & CONFIRMED</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-slate-950">{confirmedCount}</span>
                    <span className="text-xs text-emerald-600 font-semibold">8 booked today</span>
                  </div>
                  <p className="text-[11px] text-slate-500">All operatories prepped & sterilization audited</p>
                </div>

                {/* 4. Declined / Rescheduled */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>DECLINED / RESCHEDULED</span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-slate-950">{declinedCount}</span>
                    <span className="text-xs text-slate-500">14.2% bounce rate</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Slot reallocated: <span className="font-bold text-slate-800">100% Zero Chair Loss</span></p>
                </div>
              </div>

              {/* Filter Toolbar (Matching Image 2) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Search box */}
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={aptSearch}
                      onChange={e => setAptSearch(e.target.value)}
                      placeholder="Filter by patient name, phone, MRN, or doctor..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>

                  {/* Date Picker Pill */}
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Today, Oct 24</span>
                  </div>

                  {/* Dropdowns */}
                  <select
                    value={selectedPractitioner}
                    onChange={e => setSelectedPractitioner(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="All">All Practitioners</option>
                    <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins</option>
                    <option value="Dr. Alex Vance">Dr. Alex Vance</option>
                  </select>

                  <select className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none">
                    <option>All Payers</option>
                    <option>Private Pay / Direct</option>
                    <option>Cigna Dental Plus</option>
                    <option>Bupa Healthcare</option>
                  </select>
                </div>

                {/* Filter Pills: All Requests | Pending Review | Confirmed | Declined */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setAptFilterTab('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        aptFilterTab === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      All Requests ({totalRequestsToday})
                    </button>

                    <button
                      onClick={() => setAptFilterTab('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                        aptFilterTab === 'pending'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>Pending Review</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                        {pendingReviewCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setAptFilterTab('confirmed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        aptFilterTab === 'confirmed'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Confirmed ({confirmedCount})
                    </button>

                    <button
                      onClick={() => setAptFilterTab('declined')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        aptFilterTab === 'declined'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Declined ({declinedCount})
                    </button>
                  </div>

                  <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
                    Showing priority triaged list
                  </span>
                </div>
              </div>

              {/* Two Column Layout matching Image 2: Left Triage Cards + Right Operatory Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Urgent Intake Triage (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-extrabold text-slate-950">Urgent Intake Triage</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        {pendingReviewCount} Awaiting Approval
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        appointments.forEach(a => updateAppointmentStatus(a.id, 'Confirmed'));
                      }}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Batch Accept All</span>
                    </button>
                  </div>

                  {/* Render Mock Triage Cards matching Image 2 */}
                  {mockTriagePatients.map(pt => (
                    <div
                      key={pt.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4 hover:shadow-md transition-shadow"
                    >
                      {/* Top Row: Avatar, Name, Type, Time */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3.5">
                          <img
                            src={pt.avatar}
                            alt={pt.name}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-extrabold text-sm text-slate-950">{pt.name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                {pt.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Age {pt.age} • MRN {pt.mrn} • Assigned: <span className="font-bold text-slate-800">{pt.doctor}</span>
                            </p>
                          </div>
                        </div>

                        <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-1.5 shrink-0 self-start sm:self-center">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{pt.date}</span>
                        </div>
                      </div>

                      {/* Treatment & Assigned info */}
                      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                        <Stethoscope className="w-4 h-4 text-sky-600" />
                        <span>{pt.treatment}</span>
                      </div>

                      {/* Clinical Chief Complaint Alert Box (matching Image 2) */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          CLINICAL CHIEF COMPLAINT
                        </p>
                        <p className="text-slate-800 font-medium italic">
                          &ldquo;{pt.complaint}&rdquo;
                        </p>
                      </div>

                      {/* Operatory & Action Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-3 text-xs text-slate-500">
                          <span className="inline-flex items-center text-slate-700 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                            {pt.operatory}
                          </span>
                          <span>•</span>
                          <span>Requested {pt.requestedAgo}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {}}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            Reschedule / Contact
                          </button>

                          <button
                            onClick={() => {}}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                          >
                            Decline
                          </button>

                          <button
                            onClick={() => {}}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-xs"
                          >
                            Accept Appointment
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Also render actual clinic context appointments */}
                  {appointments.map(apt => (
                    <div
                      key={apt.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-sm text-slate-950">{apt.patientName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              apt.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {apt.status}
                          </span>
                          {apt.approvedByAI && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                              AI Approved
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{apt.date} • {apt.timeSlot}</span>
                      </div>
                      <p className="text-xs text-slate-700">
                        <span className="font-bold">Treatment:</span> {apt.serviceName} • <span className="font-bold">Doctor:</span> {apt.clinicianName}
                      </p>
                      {apt.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                          {apt.notes}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">Booking Source: {apt.source}</span>
                        <div className="flex items-center space-x-2">
                          {apt.status !== 'Confirmed' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'Confirmed')}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-teal-700 hover:bg-teal-800"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => deleteAppointment(apt.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column: Operatory Schedule (4 cols - matching Image 2) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-sky-600" />
                        <h4 className="font-extrabold text-sm text-slate-950">Operatory Schedule</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                        Today Oct 24
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Live chair utilization status. Cross-reference before confirming overlapping surgical blocks.
                    </p>

                    {/* Chair Status Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="font-bold text-slate-900 text-[11px]">Chair 1</p>
                        <p className="text-[10px] text-slate-500">Dr. Jenkins</p>
                        <span className="inline-block mt-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full">
                          • Ready
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="font-bold text-slate-900 text-[11px]">Chair 2</p>
                        <p className="text-[10px] text-slate-500">Dr. Vance</p>
                        <span className="inline-block mt-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-full">
                          • In Proc.
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="font-bold text-slate-900 text-[11px]">Chair 3</p>
                        <p className="text-[10px] text-slate-500">Hygienist</p>
                        <span className="inline-block mt-1 text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded-full">
                          • Prep/Ster.
                        </span>
                      </div>
                    </div>

                    {/* Timeline List matching Image 2 */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-900">09:00 AM</span>
                          <p className="text-[11px] text-slate-600">C. Henderson • Composite Bonding</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Chair 1</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-900">11:30 AM</span>
                          <p className="text-[11px] text-slate-600">P. Gomez • Full Mouth Debridement</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Chair 3</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-100 text-[11px] text-slate-600 font-medium text-center">
                        01:00 PM - Operatory Disinfection Cycle
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-900">02:00 PM</span>
                          <p className="text-[11px] text-slate-600">A. Sterling • Crown Seating #19</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Chair 2</span>
                      </div>

                      {/* TARGET SLOT (matching Image 2) */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div>
                          <span className="font-bold text-emerald-900">03:30 PM (TARGET)</span>
                          <p className="text-[11px] text-emerald-700">Immediate Slot Allocation</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                          SLOT AVAILABLE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: AI CHATBOT STUDIO & KNOWLEDGE (User Requested)    */}
          {/* NOTICE: Total Bookings metric cards are REMOVED here!    */}
          {/* 3 Sub-Sections combined into one cohesive studio view!   */}
          {/* ======================================================== */}
          {activeNav === 'ai-studio' && (
            <div className="p-6 sm:p-8 space-y-7 max-w-7xl mx-auto w-full animate-fade-in">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    CLINICAL ADMINISTRATION SUITE • <span className="text-sky-600 font-extrabold">Autonomous Reasoning Engine</span>
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-0.5">
                    AI Agent & Knowledge Management System
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage multi-agent provider APIs, appointment auto-confirmation authority, clinic grounding rules, and inspect reasoning traces.
                  </p>
                </div>

                <button
                  onClick={handleSaveAllAISettings}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm flex items-center space-x-2 transition-all active:scale-95 shrink-0 self-start sm:self-center"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All AI Settings</span>
                </button>
              </div>

              {/* Sub-Section Navigation Tabs (The 3 sections combined in one as requested!) */}
              <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setAiSubSection('providers')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                    aiSubSection === 'providers'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-sky-400" />
                  <span>1. Agent APIs & Engine (Gemini / Claude / ChatGPT)</span>
                </button>

                <button
                  onClick={() => setAiSubSection('approval-policy')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                    aiSubSection === 'approval-policy'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Appointment Approval Authority & Directives</span>
                </button>

                <button
                  onClick={() => setAiSubSection('knowledge-simulator')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                    aiSubSection === 'knowledge-simulator'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3. Grounded Knowledge & Live Reasoning Simulator</span>
                </button>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SUB-SECTION 1: 3 AGENT API OPTIONS (Gemini, Claude, ChatGPT) */}
              {/* ---------------------------------------------------- */}
              {aiSubSection === 'providers' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                    <h3 className="text-base font-extrabold text-slate-950 flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-sky-600" />
                      <span>Select Active Reasoning Engine & Paste Agent API Keys</span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      As requested, exactly three AI Agent providers are supported: Google Gemini, Anthropic Claude, and OpenAI ChatGPT. Paste your API key into the respective agent card and select which one serves as the live primary clinical assistant.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Provider 1: Google Gemini */}
                    <div
                      className={`p-6 rounded-2xl bg-white border transition-all ${
                        localProvider === 'Gemini'
                          ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                          : 'border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm">
                            G
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-950">Google Gemini</h4>
                            <p className="text-[10px] text-slate-400">Gemini 1.5 Pro / Flash</p>
                          </div>
                        </div>

                        <input
                          type="radio"
                          name="ai-engine"
                          checked={localProvider === 'Gemini'}
                          onChange={() => setLocalProvider('Gemini')}
                          className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                        />
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Model Selection
                          </label>
                          <select
                            value={localGeminiModel}
                            onChange={e => setLocalGeminiModel(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                          >
                            <option value="gemini-1.5-flash">gemini-1.5-flash (Fastest Triage)</option>
                            <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Clinical Reasoning)</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-600">
                              Gemini API Key
                            </label>
                            <button
                              onClick={() => setShowGeminiKey(!showGeminiKey)}
                              className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                            >
                              {showGeminiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showGeminiKey ? 'Hide' : 'Reveal'}</span>
                            </button>
                          </div>
                          <input
                            type={showGeminiKey ? 'text' : 'password'}
                            value={localGeminiKey}
                            onChange={e => setLocalGeminiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900"
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Status:</span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {localGeminiKey ? 'API Key Configured' : 'Paste Key Required'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Provider 2: Anthropic Claude */}
                    <div
                      className={`p-6 rounded-2xl bg-white border transition-all ${
                        localProvider === 'Claude'
                          ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                          : 'border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm">
                            C
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-950">Anthropic Claude</h4>
                            <p className="text-[10px] text-slate-400">Claude 3.5 Sonnet</p>
                          </div>
                        </div>

                        <input
                          type="radio"
                          name="ai-engine"
                          checked={localProvider === 'Claude'}
                          onChange={() => setLocalProvider('Claude')}
                          className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                        />
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Model Selection
                          </label>
                          <select
                            value={localClaudeModel}
                            onChange={e => setLocalClaudeModel(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                          >
                            <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet (High Precision)</option>
                            <option value="claude-3-haiku-20240307">claude-3-haiku (Instant)</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-600">
                              Claude API Key
                            </label>
                            <button
                              onClick={() => setShowClaudeKey(!showClaudeKey)}
                              className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                            >
                              {showClaudeKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showClaudeKey ? 'Hide' : 'Reveal'}</span>
                            </button>
                          </div>
                          <input
                            type={showClaudeKey ? 'text' : 'password'}
                            value={localClaudeKey}
                            onChange={e => setLocalClaudeKey(e.target.value)}
                            placeholder="sk-ant-api03-..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900"
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Status:</span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {localClaudeKey ? 'API Key Configured' : 'Paste Key Required'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Provider 3: OpenAI ChatGPT */}
                    <div
                      className={`p-6 rounded-2xl bg-white border transition-all ${
                        localProvider === 'ChatGPT'
                          ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                          : 'border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
                            O
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-950">OpenAI ChatGPT</h4>
                            <p className="text-[10px] text-slate-400">GPT-4o / GPT-4o-mini</p>
                          </div>
                        </div>

                        <input
                          type="radio"
                          name="ai-engine"
                          checked={localProvider === 'ChatGPT'}
                          onChange={() => setLocalProvider('ChatGPT')}
                          className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                        />
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Model Selection
                          </label>
                          <select
                            value={localChatgptModel}
                            onChange={e => setLocalChatgptModel(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                          >
                            <option value="gpt-4o">gpt-4o (State of the art)</option>
                            <option value="gpt-4o-mini">gpt-4o-mini (Cost-effective)</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-600">
                              ChatGPT API Key
                            </label>
                            <button
                              onClick={() => setShowChatgptKey(!showChatgptKey)}
                              className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                            >
                              {showChatgptKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showChatgptKey ? 'Hide' : 'Reveal'}</span>
                            </button>
                          </div>
                          <input
                            type={showChatgptKey ? 'text' : 'password'}
                            value={localChatgptKey}
                            onChange={e => setLocalChatgptKey(e.target.value)}
                            placeholder="sk-proj-..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900"
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Status:</span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {localChatgptKey ? 'API Key Configured' : 'Paste Key Required'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SUB-SECTION 2: APPOINTMENT APPROVAL AUTHORITY & POLICY */}
              {/* ---------------------------------------------------- */}
              {aiSubSection === 'approval-policy' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Master Auto-Approval Toggle */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-extrabold text-slate-950">
                          AI Appointment Confirmation Authority
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            localAutoApprove
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {localAutoApprove ? 'AI Confirmation: ENABLED' : 'AI Confirmation: DISABLED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        If enabled, the AI has authority to automatically confirm bookings in approved categories. If disabled, all requests require doctor sign-off.
                      </p>
                    </div>

                    <button
                      onClick={() => setLocalAutoApprove(!localAutoApprove)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                        localAutoApprove
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      }`}
                    >
                      {localAutoApprove ? '✓ AI Can Auto-Confirm' : 'Require Doctor Review'}
                    </button>
                  </div>

                  {/* Which kinds of appointments AI is approved to confirm */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-950">
                        Admin Authorized Treatment Categories for AI Approval
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Select which kinds of appointments the AI is authorized to confirm immediately. Unselected categories will be marked as &quot;Pending Clinical Review&quot;.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {allCategories.map(cat => {
                        const isApproved = localApprovedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleCategoryApproval(cat)}
                            className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between space-y-2 ${
                              isApproved
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs">{cat}</span>
                              {isApproved ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-slate-300"></span>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold">
                              {isApproved ? 'Auto-Approved' : 'Needs Doctor Review'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Admin Approval Directives Textarea */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-950">
                      Admin Clinical Directives & Approval Guidelines for AI
                    </h4>
                    <p className="text-xs text-slate-600">
                      Give specific criteria to your AI regarding when it can confirm appointments versus when it must escalate to reception.
                    </p>
                    <textarea
                      rows={4}
                      value={localApprovalDirectives}
                      onChange={e => setLocalApprovalDirectives(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SUB-SECTION 3: GROUNDED KNOWLEDGE & REASONING SIMULATOR */}
              {/* ---------------------------------------------------- */}
              {aiSubSection === 'knowledge-simulator' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Clinic Description & Opening Hours */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <h3 className="text-base font-extrabold text-slate-950 flex items-center space-x-2">
                      <Database className="w-4 h-4 text-sky-600" />
                      <span>Clinic Description & Grounded Knowledge Base</span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      The AI reads this live clinical information to answer patient inquiries accurately without hallucinations.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Clinic Name
                        </label>
                        <input
                          type="text"
                          value={localCompany.clinicName}
                          onChange={e => setLocalCompany({ ...localCompany, clinicName: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Working Hours
                        </label>
                        <input
                          type="text"
                          value={localCompany.workingHours}
                          onChange={e => setLocalCompany({ ...localCompany, workingHours: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Clinic Description & Laboratory Capabilities
                        </label>
                        <textarea
                          rows={3}
                          value={localCompany.companyDescription}
                          onChange={e => setLocalCompany({ ...localCompany, companyDescription: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interactive Live Reasoning Simulator Tool */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-950 flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-sky-600" />
                          <span>Live Clinical Reasoning Simulator Tool</span>
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Test how the AI reasons step-by-step using website data, fee schedules, and admin approval rules.
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        Engine: {localProvider}
                      </span>
                    </div>

                    {/* Quick prompts */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 self-center">Try prompt:</span>
                      <button
                        onClick={() => handleRunSimulator('How much is Invisalign and what are your opening hours?')}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        Invisalign pricing & hours
                      </button>
                      <button
                        onClick={() => handleRunSimulator('Can I book an appointment for dental implants on Monday?')}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        Book dental implants (Policy Check)
                      </button>
                      <button
                        onClick={() => handleRunSimulator('I have extreme tooth pain and swelling. Can I see someone today?')}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        Emergency pain triage
                      </button>
                    </div>

                    {/* Input box */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={simulatorQuery}
                        onChange={e => setSimulatorQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRunSimulator()}
                        placeholder="Type any patient inquiry to inspect AI reasoning..."
                        className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                      <button
                        onClick={() => handleRunSimulator()}
                        disabled={simulatorLoading || !simulatorQuery.trim()}
                        className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reason</span>
                      </button>
                    </div>

                    {/* Simulator Results & Chain of Thought */}
                    {simulatorLoading && (
                      <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                        <span>AI Reasoning Engine processing grounded knowledge...</span>
                      </div>
                    )}

                    {simulatorHistory.length > 0 && !simulatorLoading && (
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        {simulatorHistory.map((item, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900">Query: &ldquo;{item.query}&rdquo;</span>
                              <span className="text-[11px] text-slate-400">{item.timestamp}</span>
                            </div>

                            {/* Response Bubble */}
                            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed">
                              {item.response.reply}
                            </div>

                            {/* Chain of Thought Reasoning Trace */}
                            <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs space-y-2">
                              <p className="font-bold text-sky-950 flex items-center space-x-1.5 text-[11px]">
                                <Brain className="w-3.5 h-3.5 text-sky-600" />
                                <span>Chain-of-Thought Reasoning Log ({item.response.reasoningTrace.length} Steps)</span>
                              </p>

                              <div className="space-y-1.5">
                                {item.response.reasoningTrace.map((step, sIdx) => (
                                  <div key={sIdx} className="text-[11px] text-slate-700">
                                    <span className="font-bold text-sky-900">Step {step.step}: {step.title}</span> — {step.detail}
                                  </div>
                                ))}
                              </div>

                              {/* Grounded Sources */}
                              <div className="pt-2 border-t border-sky-200/60 text-[10px] text-sky-800 font-semibold">
                                Grounded Sources: {item.response.sourceGrounded.join(' • ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: OVERVIEW                                          */}
          {/* ======================================================== */}
          {activeNav === 'overview' && (
            <div className="p-6 sm:p-8 space-y-7 max-w-7xl mx-auto w-full animate-fade-in">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  CLINICAL ADMINISTRATION SUITE
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-0.5">
                  Executive Clinic Overview
                </h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Active Patients</span>
                  <p className="text-3xl font-black text-slate-950">384</p>
                  <p className="text-xs text-emerald-600 font-semibold">+18 new this month</p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">AI Auto-Triage Accuracy</span>
                  <p className="text-3xl font-black text-slate-950">98.4%</p>
                  <p className="text-xs text-sky-600 font-semibold">Grounded on GDC standards</p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Same-Day CAD/CAM Crowns</span>
                  <p className="text-3xl font-black text-slate-950">42 Units</p>
                  <p className="text-xs text-slate-600 font-semibold">Milled in Marylebone Lab</p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 4: SERVICES CATALOG                                  */}
          {/* ======================================================== */}
          {activeNav === 'services' && (
            <div className="p-6 sm:p-8 space-y-7 max-w-7xl mx-auto w-full animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    CLINICAL ADMINISTRATION SUITE
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-0.5">
                    Services Catalog & Lab Pricing
                  </h1>
                </div>

                <button
                  onClick={() => {}}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm"
                >
                  + Add New Treatment
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map(s => (
                  <div key={s.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {s.category}
                      </span>
                      <span className="font-extrabold text-sm text-slate-950">{s.priceRange}</span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-950">{s.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>Duration: {s.duration}</span>
                      <button
                        onClick={() => deleteService(s.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: PATIENTS                                          */}
          {/* ======================================================== */}
          {activeNav === 'patients' && (
            <div className="p-6 sm:p-8 space-y-7 max-w-7xl mx-auto w-full animate-fade-in">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  CLINICAL ADMINISTRATION SUITE
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-0.5">
                  Patient Records & Clinical Charts
                </h1>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="divide-y divide-slate-100">
                  {mockTriagePatients.map(p => (
                    <div key={p.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3.5">
                        <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-extrabold text-sm text-slate-950">{p.name}</p>
                          <p className="text-xs text-slate-500">MRN {p.mrn} • Age {p.age} • Assigned: {p.doctor}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {p.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Manual Booking Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setManualModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-sm font-bold"
            >
              ✕
            </button>
            <h3 className="text-base font-extrabold text-slate-950 mb-4">
              Add Manual / Phone Booking
            </h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                addAppointment({
                  patientName: manualForm.patientName,
                  patientEmail: manualForm.patientEmail || 'reception@vertexdental.co.uk',
                  patientPhone: manualForm.patientPhone,
                  serviceId: services[0]?.id || 's1',
                  serviceName: manualForm.serviceName,
                  clinicianName: manualForm.clinicianName,
                  date: manualForm.date,
                  timeSlot: manualForm.timeSlot,
                  status: 'Confirmed',
                  notes: manualForm.chiefComplaint,
                  source: 'Walk-In / Phone',
                });
                setManualModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  value={manualForm.patientName}
                  onChange={e => setManualForm({ ...manualForm, patientName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={manualForm.patientPhone}
                  onChange={e => setManualForm({ ...manualForm, patientPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Treatment</label>
                <select
                  value={manualForm.serviceName}
                  onChange={e => setManualForm({ ...manualForm, serviceName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.priceRange})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinical Notes / Chief Complaint</label>
                <textarea
                  rows={2}
                  value={manualForm.chiefComplaint}
                  onChange={e => setManualForm({ ...manualForm, chiefComplaint: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
