'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';
import { generateGroundingResponse, AIResponseResult } from '@/lib/ai-engine';
import { ServiceCategory, AIProvider } from '@/types/clinic';
import {
  Calendar,
  Users,
  MessageSquare,
  Bot,
  Sparkles,
  Search,
  CheckCircle2,
  Trash2,
  Phone,
  Clock,
  ShieldCheck,
  Plus,
  Save,
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  Send,
  AlertTriangle,
  Sliders,
  Database,
  Terminal,
  Building,
  HelpCircle,
  FileCheck,
  Brain,
  Cpu,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ClipboardPaste,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
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

  // Navigation Tabs (Stitch Sidebar)
  const [activeMainTab, setActiveMainTab] = useState<'ai-knowledge' | 'appointments' | 'inquiries' | 'walkin'>('ai-knowledge');

  // AI & Knowledge Management Sub-Tabs
  const [aiSubTab, setAiSubTab] = useState<'knowledge' | 'behavior' | 'simulator'>('behavior');

  // Save banner feedback
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);

  // Appointments Tab States
  const [aptSearch, setAptSearch] = useState('');
  const [aptDateFilter, setAptDateFilter] = useState<'All' | 'Today' | 'Tomorrow'>('All');
  const [aptStatusFilter, setAptStatusFilter] = useState<'All' | 'Confirmed' | 'Pending'>('All');
  const [deletingAptId, setDeletingAptId] = useState<string | null>(null);

  // Walk-In Form State
  const [walkInForm, setWalkInForm] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    serviceName: services[0]?.name || 'General Checkup & Digital OPG X-Rays',
    date: '2026-10-01',
    timeSlot: '11:00 AM',
    notes: 'Walk-in / Phone reservation taken by clinic receptionist.',
  });
  const [walkInSuccess, setWalkInSuccess] = useState('');

  // AI Settings Local Edit Buffer
  const [localCompany, setLocalCompany] = useState(companyDetails);
  const [localPolicies, setLocalPolicies] = useState({
    refundPolicy: clinicPolicies.refundPolicy,
    cancellationPolicy: clinicPolicies.cancellationPolicy,
    additionalPoliciesText: clinicPolicies.additionalPolicies.join('\n'),
  });
  const [localGuardrails, setLocalGuardrails] = useState({
    identityRole: aiSettings.identityRole,
    targetAudience: aiSettings.targetAudience,
    toneManner: aiSettings.toneManner,
    responseLength: aiSettings.responseLength,
    businessGoals: aiSettings.businessGoals,
    shouldSayText: aiSettings.shouldSay.join('\n'),
    mustNotSayText: aiSettings.mustNotSay.join('\n'),
    informationUnavailableInstructions: aiSettings.informationUnavailableInstructions,
    transferToHumanInstructions: aiSettings.transferToHumanInstructions,
    languageBehaviorPolicy: aiSettings.languageBehaviorPolicy,
  });

  // Local 3 Agent API Provider Settings Buffer
  const [localProvider, setLocalProvider] = useState<AIProvider>(aiProviderSettings.activeProvider);
  const [localGeminiKey, setLocalGeminiKey] = useState(aiProviderSettings.geminiApiKey);
  const [localGeminiModel, setLocalGeminiModel] = useState(aiProviderSettings.geminiModel);
  const [localClaudeKey, setLocalClaudeKey] = useState(aiProviderSettings.claudeApiKey);
  const [localClaudeModel, setLocalClaudeModel] = useState(aiProviderSettings.claudeModel);
  const [localChatgptKey, setLocalChatgptKey] = useState(aiProviderSettings.chatgptApiKey);
  const [localChatgptModel, setLocalChatgptModel] = useState(aiProviderSettings.chatgptModel);
  const [showKeyVisibility, setShowKeyVisibility] = useState(false);

  // Local Appointment Approval Policy Buffer
  const [localAutoApprove, setLocalAutoApprove] = useState(approvalPolicy.autoApproveEnabled);
  const [localApprovedCategories, setLocalApprovedCategories] = useState<ServiceCategory[]>(
    approvalPolicy.approvedCategories
  );
  const [localApprovalDirectives, setLocalApprovalDirectives] = useState(
    approvalPolicy.adminApprovalDirectives
  );

  // New Service Modal
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    priceRange: 'From £',
    basePriceGbp: 150,
    category: 'General' as ServiceCategory,
    duration: '45 mins',
    description: '',
  });

  // New FAQ Form
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [newFAQForm, setNewFAQForm] = useState({
    question: '',
    answer: '',
    category: 'General',
  });

  // Simulator State with Reasoning Traces
  const [simulatorQuery, setSimulatorQuery] = useState('');
  const [simulatorHistory, setSimulatorHistory] = useState<
    Array<{
      query: string;
      result: AIResponseResult;
      timestamp: string;
    }>
  >([
    {
      query: 'Can you book me for teeth whitening and is it auto-approved?',
      result: {
        reply: `Certainly! I have reviewed our clinical diary for In-Clinic Laser Teeth Whitening (£350, approx. 60 mins).

✅ Approval Status: This Cosmetic procedure is pre-approved by clinic administration for immediate calendar confirmation.

Philips Zoom! WhiteSpeed laser delivers up to 8 shades whiter in 1 hour. Would you like me to open the interactive booking calendar for you right now?`,
        reasoningTrace: [
          {
            step: 1,
            title: 'Perception & Semantic Intent Detection',
            detail: 'Detected request for Teeth Whitening booking + approval query.',
            status: 'perception',
          },
          {
            step: 2,
            title: 'Website & Knowledge Retrieval',
            detail: 'Retrieved verified fee: From £350, 60 mins, Zoom laser protocol.',
            status: 'retrieval',
          },
          {
            step: 3,
            title: 'Admin Appointment Approval Policy Evaluation',
            detail: 'Evaluated Admin Policy: Category [Cosmetic] is in Approved Categories list. Auto-Confirm authority = TRUE.',
            status: 'policy_eval',
          },
          {
            step: 4,
            title: 'Guardrail & British Phrasing Synthesis',
            detail: 'Formatted response in British English with confirmation assurance.',
            status: 'guardrail',
          },
        ],
        sourceGrounded: ['Website Service: In-Clinic Laser Teeth Whitening', 'Admin Approval Policy', 'Verified GBP Fee'],
        appointmentApprovalStatus: 'Auto-Approved',
        actionType: 'book',
        actionPayload: 'In-Clinic Laser Teeth Whitening',
        activeAgentEngine: 'Gemini (gemini-2.0-flash)',
      },
      timestamp: 'Demo Trace',
    },
  ]);
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(0);

  // Top Metrics
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(a => a.date === '2026-10-01').length;
  const confirmedPatients = appointments.filter(a => a.status === 'Confirmed').length;
  const totalInquiries = inquiries.length;

  const allCategories: ServiceCategory[] = [
    'General',
    'Preventive',
    'Endodontics',
    'Cosmetic',
    'Surgical',
    'Orthodontics',
    'Pediatric',
    'Emergency',
  ];

  // Filtered Appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchSearch =
      apt.patientName.toLowerCase().includes(aptSearch.toLowerCase()) ||
      apt.patientPhone.includes(aptSearch) ||
      apt.serviceName.toLowerCase().includes(aptSearch.toLowerCase());

    const matchDate =
      aptDateFilter === 'All'
        ? true
        : aptDateFilter === 'Today'
        ? apt.date === '2026-10-01'
        : apt.date === '2026-10-02';

    const matchStatus =
      aptStatusFilter === 'All' ? true : apt.status === aptStatusFilter;

    return matchSearch && matchDate && matchStatus;
  });

  // Save All AI Settings Trigger
  const handleSaveAllAISettings = () => {
    // 1. Save Company Details
    updateCompanyDetails(localCompany);

    // 2. Save Policies
    updateClinicPolicies({
      refundPolicy: localPolicies.refundPolicy,
      cancellationPolicy: localPolicies.cancellationPolicy,
      additionalPolicies: localPolicies.additionalPoliciesText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
    });

    // 3. Save Guardrails
    updateAISettings({
      identityRole: localGuardrails.identityRole,
      targetAudience: localGuardrails.targetAudience,
      toneManner: localGuardrails.toneManner,
      responseLength: localGuardrails.responseLength,
      businessGoals: localGuardrails.businessGoals,
      shouldSay: localGuardrails.shouldSayText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      mustNotSay: localGuardrails.mustNotSayText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      informationUnavailableInstructions: localGuardrails.informationUnavailableInstructions,
      transferToHumanInstructions: localGuardrails.transferToHumanInstructions,
      languageBehaviorPolicy: localGuardrails.languageBehaviorPolicy,
    });

    // 4. Save 3 Agent Provider Settings
    updateAIProviderSettings({
      activeProvider: localProvider,
      geminiApiKey: localGeminiKey,
      geminiModel: localGeminiModel,
      claudeApiKey: localClaudeKey,
      claudeModel: localClaudeModel,
      chatgptApiKey: localChatgptKey,
      chatgptModel: localChatgptModel,
    });

    // 5. Save Admin Appointment Approval Policy
    updateApprovalPolicy({
      autoApproveEnabled: localAutoApprove,
      approvedCategories: localApprovedCategories,
      manualReviewCategories: allCategories.filter(c => !localApprovedCategories.includes(c)),
      adminApprovalDirectives: localApprovalDirectives,
    });

    // Feedback Banner
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

  // Add Service Handler
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceForm.name || !newServiceForm.priceRange) return;

    addService({
      name: newServiceForm.name,
      priceRange: newServiceForm.priceRange,
      basePriceGbp: Number(newServiceForm.basePriceGbp) || 100,
      category: newServiceForm.category,
      duration: newServiceForm.duration,
      description: newServiceForm.description || 'Clinical dental service provided by Vertex Dental Lab.',
      features: ['Clinical examination included', 'High precision lab materials', 'Full GDC compliance'],
    });

    setIsAddingService(false);
    setNewServiceForm({
      name: '',
      priceRange: 'From £',
      basePriceGbp: 150,
      category: 'General',
      duration: '45 mins',
      description: '',
    });
  };

  // Add FAQ Handler
  const handleCreateFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFAQForm.question || !newFAQForm.answer) return;

    addFAQ({
      question: newFAQForm.question,
      answer: newFAQForm.answer,
      category: newFAQForm.category,
    });

    setIsAddingFAQ(false);
    setNewFAQForm({ question: '', answer: '', category: 'General' });
  };

  // Walk-In Booking Submission
  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.patientName || !walkInForm.patientPhone) return;

    const matchedService = services.find(s => s.name === walkInForm.serviceName) || services[0];

    const newId = addAppointment({
      patientName: walkInForm.patientName,
      patientEmail: walkInForm.patientEmail || 'walkin@vertexdental.co.uk',
      patientPhone: walkInForm.patientPhone,
      serviceId: matchedService.id,
      serviceName: matchedService.name,
      clinicianName: 'Dr. Alistair Vance',
      date: walkInForm.date,
      timeSlot: walkInForm.timeSlot,
      status: 'Confirmed',
      notes: walkInForm.notes,
      source: 'Walk-In / Phone',
    });

    setWalkInSuccess(`Appointment #${newId} booked successfully into clinic calendar.`);
    setTimeout(() => setWalkInSuccess(''), 4000);
    setWalkInForm({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      serviceName: services[0]?.name || 'General Checkup & Digital OPG X-Rays',
      date: '2026-10-01',
      timeSlot: '11:00 AM',
      notes: 'Walk-in / Phone reservation taken by clinic receptionist.',
    });
  };

  // Simulator Run (Reasoning Engine)
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
          additionalPolicies: localPolicies.additionalPoliciesText.split('\n').filter(Boolean),
        },
        faqs,
        guardrails: {
          ...aiSettings,
          informationUnavailableInstructions: localGuardrails.informationUnavailableInstructions,
          transferToHumanInstructions: localGuardrails.transferToHumanInstructions,
        },
        approvalPolicy: {
          autoApproveEnabled: localAutoApprove,
          approvedCategories: localApprovedCategories,
          manualReviewCategories: allCategories.filter(c => !localApprovedCategories.includes(c)),
          adminApprovalDirectives: localApprovalDirectives,
          autoConfirmMessage: approvalPolicy.autoConfirmMessage,
          manualReviewMessage: approvalPolicy.manualReviewMessage,
        },
        providerSettings: {
          activeProvider: localProvider,
          geminiApiKey: localGeminiKey,
          geminiModel: localGeminiModel,
          claudeApiKey: localClaudeKey,
          claudeModel: localClaudeModel,
          chatgptApiKey: localChatgptKey,
          chatgptModel: localChatgptModel,
        },
      });

      setSimulatorHistory(prev => [
        {
          query: q,
          result,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      setExpandedTraceIndex(0);
      setSimulatorLoading(false);
      setSimulatorQuery('');
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      {/* Save Success Alert Notification */}
      {saveSuccessBanner && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-[#0f2e24] border border-emerald-500 text-white shadow-2xl flex items-center space-x-3 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold">AI Agent Directives & API Settings Saved</p>
            <p className="text-[11px] text-emerald-200">
              Active engine: {localProvider}. Appointment approval authority updated immediately.
            </p>
          </div>
        </div>
      )}

      {/* Main Stitch Dashboard Layout: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* ======================================================== */}
        {/* STITCH LEFT SIDEBAR */}
        {/* ======================================================== */}
        <aside className="w-full md:w-64 bg-[#111622] border-r border-[#1f293d] flex flex-col justify-between shrink-0">
          <div>
            {/* Sidebar Brand Header */}
            <div className="p-5 border-b border-[#1f293d] flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    Vertex Dental<span className="text-sky-400">Lab</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">UK Admin Suite</p>
                </div>
              </Link>
            </div>

            {/* Sidebar Navigation */}
            <nav className="p-3 space-y-1 text-xs font-medium">
              <p className="px-3 pt-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Core Administration
              </p>

              <button
                onClick={() => setActiveMainTab('ai-knowledge')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeMainTab === 'ai-knowledge'
                    ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-300 border border-sky-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#161e2e]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Brain className="w-4 h-4 text-sky-400" />
                  <span>AI Agent & Knowledge</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>

              <button
                onClick={() => setActiveMainTab('appointments')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeMainTab === 'appointments'
                    ? 'bg-[#161e2e] text-white border border-slate-700 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#161e2e]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Appointments Diary</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#1a2336] text-slate-300 border border-slate-700">
                  {appointments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveMainTab('inquiries')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  activeMainTab === 'inquiries'
                    ? 'bg-[#161e2e] text-white border border-slate-700 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#161e2e]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Patient Inquiries</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#1a2336] text-slate-300 border border-slate-700">
                  {inquiries.length}
                </span>
              </button>

              <button
                onClick={() => setActiveMainTab('walkin')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl transition-all ${
                  activeMainTab === 'walkin'
                    ? 'bg-[#161e2e] text-white border border-slate-700 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#161e2e]'
                }`}
              >
                <Plus className="w-4 h-4 text-slate-400" />
                <span>Walk-In Reservation</span>
              </button>

              {/* Agent Active Pill in Sidebar */}
              <div className="pt-6 px-3">
                <div className="p-3 rounded-2xl bg-[#161e2e] border border-[#242e44] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">Active Agent Engine:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-950 text-sky-300 border border-sky-800">
                      {localProvider}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Auto-Approval:</span>
                    <span className={`text-[10px] font-bold ${localAutoApprove ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {localAutoApprove ? 'Authorized' : 'Manual Doctor Only'}
                    </span>
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Sidebar Footer User Info */}
          <div className="p-4 border-t border-[#1f293d] space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                DV
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">Dr. Alistair Vance</p>
                <p className="text-[10px] text-slate-400 truncate">Clinical Director • GDC 248912</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <Link href="/" className="text-sky-400 hover:text-sky-300 flex items-center space-x-1">
                <span>View Public Site</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button onClick={resetToDefaults} className="text-slate-500 hover:text-red-400 text-[10px]">
                Reset Demo
              </button>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN DASHBOARD CONTENT AREA */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Sticky Header */}
          <header className="sticky top-0 z-20 bg-[#0b0f17]/95 backdrop-blur-md px-6 py-3.5 border-b border-[#1f293d] flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-base font-extrabold text-white">
                {activeMainTab === 'ai-knowledge'
                  ? 'AI Agent & Knowledge Management System'
                  : activeMainTab === 'appointments'
                  ? 'Clinic Calendar & Appointments'
                  : activeMainTab === 'inquiries'
                  ? 'Patient Web Inquiries'
                  : 'Add Walk-In / Phone Booking'}
              </h1>
              <span className="hidden sm:inline px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#161e2e] text-slate-300 border border-[#242e44]">
                London Marylebone Suite
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {activeMainTab === 'ai-knowledge' && (
                <button
                  onClick={handleSaveAllAISettings}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 hover:opacity-90 shadow-md shadow-sky-500/20 flex items-center space-x-1.5 active:scale-95 transition-all"
                >
                  <Save className="w-3.5 h-3.5 text-slate-950" />
                  <span>Save All AI Settings</span>
                </button>
              )}
            </div>
          </header>

          <div className="p-6 sm:p-8 space-y-8 max-w-6xl mx-auto w-full">
            {/* Top Metric Cards (Stitch Style) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-[#111622] border border-[#1f293d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Total Bookings</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-950 text-sky-400 flex items-center justify-center border border-sky-800/40">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{totalAppointments}</p>
                <p className="text-[11px] text-sky-400 font-mono">All-time clinic calendar</p>
              </div>

              <div className="p-5 rounded-3xl bg-[#111622] border border-[#1f293d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Today&apos;s Slots</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{todayAppointments}</p>
                <p className="text-[11px] text-emerald-400 font-mono">Scheduled today</p>
              </div>

              <div className="p-5 rounded-3xl bg-[#111622] border border-[#1f293d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Confirmed Patients</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center border border-indigo-800/40">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{confirmedPatients}</p>
                <p className="text-[11px] text-indigo-300 font-mono">Active verified patients</p>
              </div>

              <div className="p-5 rounded-3xl bg-[#111622] border border-[#1f293d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Web Inquiries</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center border border-purple-800/40">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{totalInquiries}</p>
                <p className="text-[11px] text-purple-300 font-mono">Contact form leads</p>
              </div>
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: AI ASSISTANT & KNOWLEDGE MANAGEMENT */}
            {/* ======================================================== */}
            {activeMainTab === 'ai-knowledge' && (
              <div className="space-y-6">
                {/* 3 Sub-Tabs Header */}
                <div className="flex space-x-2 border-b border-[#1f293d] pb-2">
                  <button
                    onClick={() => setAiSubTab('behavior')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      aiSubTab === 'behavior'
                        ? 'bg-[#161e2e] text-sky-400 border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-[#111622]'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Tab 2: AI Agent Instructions, Approval Policy & API Keys</span>
                  </button>

                  <button
                    onClick={() => setAiSubTab('knowledge')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      aiSubTab === 'knowledge'
                        ? 'bg-[#161e2e] text-sky-400 border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-[#111622]'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Tab 1: Company Knowledge Base</span>
                  </button>

                  <button
                    onClick={() => setAiSubTab('simulator')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      aiSubTab === 'simulator'
                        ? 'bg-[#161e2e] text-sky-400 border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-[#111622]'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Tab 3: Live Chat Reasoning Simulator</span>
                  </button>
                </div>

                {/* ---------------------------------------------------- */}
                {/* SUB-TAB 2: AI INSTRUCTIONS, APPROVAL POLICY & 3 AGENT APIS */}
                {/* ---------------------------------------------------- */}
                {aiSubTab === 'behavior' && (
                  <div className="space-y-8 animate-fade-in">
                    {/* SECTION A: ADMIN APPOINTMENT APPROVAL AUTHORITY */}
                    <div className="rounded-3xl bg-[#111622] border border-[#1f293d] p-6 space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
                        <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                          <CheckCheck className="w-4 h-4" />
                          <span>Admin Appointment Approval Authority & AI Confirmation Settings</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
                          Authority Rule Directive
                        </span>
                      </div>

                      {/* Auto-Approval Toggle */}
                      <div className="p-4 rounded-2xl bg-[#161e2e] border border-[#242e44] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-white">AI Auto-Confirmation Authority</p>
                          <p className="text-xs text-slate-400">
                            If enabled, the AI can immediately approve and book appointments into the clinic calendar based on your directives below.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLocalAutoApprove(!localAutoApprove)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                            localAutoApprove
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${localAutoApprove ? 'bg-white' : 'bg-slate-500'}`} />
                          <span>{localAutoApprove ? 'AI Confirmation: ENABLED' : 'AI Confirmation: DISABLED'}</span>
                        </button>
                      </div>

                      {/* Approved Appointment Types / Categories */}
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-300">
                          Select Which Kinds of Appointments the AI Is Approved to Confirm:
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Selected categories will be confirmed immediately. Unchecked categories will be placed on hold as &quot;Pending Clinical Review&quot; for doctor manual sign-off.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                          {allCategories.map(cat => {
                            const isApproved = localApprovedCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => toggleCategoryApproval(cat)}
                                className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                                  isApproved
                                    ? 'bg-[#12231e] border-emerald-500/60 text-emerald-300 shadow-xs'
                                    : 'bg-[#161e2e] border-[#242e44] text-slate-400 hover:border-slate-600'
                                }`}
                              >
                                <div>
                                  <p className="text-xs font-bold">{cat}</p>
                                  <p className="text-[10px] opacity-75">
                                    {isApproved ? 'Auto-Approved' : 'Needs Doctor Review'}
                                  </p>
                                </div>
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isApproved ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {isApproved ? '✓' : '—'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Admin Approval Directives Textarea */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300">
                          Admin Approval Directives & Appointment Criteria:
                        </label>
                        <textarea
                          rows={3}
                          value={localApprovalDirectives}
                          onChange={e => setLocalApprovalDirectives(e.target.value)}
                          placeholder="e.g. Auto-approve routine checkups and cleanings. For dental implants and root canals, hold for Dr. Vance manual clinical verification."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed font-mono"
                        />
                      </div>
                    </div>

                    {/* SECTION B: ONLY THREE AGENT API OPTIONS (Gemini, Claude, ChatGPT) */}
                    <div className="rounded-3xl bg-[#111622] border border-[#1f293d] p-6 space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
                        <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                          <Cpu className="w-4 h-4" />
                          <span>AI Agent Engine API Settings (Only Three Options: Gemini, Claude, ChatGPT)</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                          Paste API Key
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">
                        Choose your preferred AI agent and paste your API key below. The reasoning answer tool will utilize this model to formulate clinical replies grounded in your website data.
                      </p>

                      {/* 3 Agent Radio Selection Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Option 1: Gemini */}
                        <div
                          onClick={() => setLocalProvider('Gemini')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            localProvider === 'Gemini'
                              ? 'bg-[#15233d] border-sky-400 text-white ring-2 ring-sky-500/20 shadow-md'
                              : 'bg-[#161e2e] border-[#242e44] text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-sm text-sky-400 flex items-center space-x-1.5">
                              <Sparkles className="w-4 h-4" />
                              <span>Google Gemini</span>
                            </span>
                            <span className={`w-3.5 h-3.5 rounded-full border ${localProvider === 'Gemini' ? 'bg-sky-400 border-white' : 'border-slate-600'}`} />
                          </div>
                          <p className="text-[11px] text-slate-300">Fast reasoning, native multimodal support</p>
                          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[9px] font-mono bg-[#0b0f17] text-sky-300">
                            gemini-2.0-flash
                          </span>
                        </div>

                        {/* Option 2: Claude */}
                        <div
                          onClick={() => setLocalProvider('Claude')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            localProvider === 'Claude'
                              ? 'bg-[#261d15] border-amber-400 text-white ring-2 ring-amber-500/20 shadow-md'
                              : 'bg-[#161e2e] border-[#242e44] text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-sm text-amber-400 flex items-center space-x-1.5">
                              <Brain className="w-4 h-4" />
                              <span>Anthropic Claude</span>
                            </span>
                            <span className={`w-3.5 h-3.5 rounded-full border ${localProvider === 'Claude' ? 'bg-amber-400 border-white' : 'border-slate-600'}`} />
                          </div>
                          <p className="text-[11px] text-slate-300">Nuanced clinical phrasing, careful guardrails</p>
                          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[9px] font-mono bg-[#0b0f17] text-amber-300">
                            claude-3-5-sonnet
                          </span>
                        </div>

                        {/* Option 3: ChatGPT */}
                        <div
                          onClick={() => setLocalProvider('ChatGPT')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            localProvider === 'ChatGPT'
                              ? 'bg-[#13261e] border-emerald-400 text-white ring-2 ring-emerald-500/20 shadow-md'
                              : 'bg-[#161e2e] border-[#242e44] text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-sm text-emerald-400 flex items-center space-x-1.5">
                              <Bot className="w-4 h-4" />
                              <span>OpenAI ChatGPT</span>
                            </span>
                            <span className={`w-3.5 h-3.5 rounded-full border ${localProvider === 'ChatGPT' ? 'bg-emerald-400 border-white' : 'border-slate-600'}`} />
                          </div>
                          <p className="text-[11px] text-slate-300">Broad knowledge, structured JSON triage</p>
                          <span className="mt-2 inline-block px-2 py-0.5 rounded text-[9px] font-mono bg-[#0b0f17] text-emerald-300">
                            gpt-4o-mini
                          </span>
                        </div>
                      </div>

                      {/* API Key Paste Fields for All Three Agents */}
                      <div className="p-5 rounded-2xl bg-[#0b0f17] border border-slate-700/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center space-x-2">
                            <Key className="w-4 h-4 text-sky-400" />
                            <span>Paste Agent API Keys</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowKeyVisibility(!showKeyVisibility)}
                            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                          >
                            {showKeyVisibility ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showKeyVisibility ? 'Mask Keys' : 'Reveal Keys'}</span>
                          </button>
                        </div>

                        {/* Gemini Key */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                            <span>1. Google Gemini API Key {localProvider === 'Gemini' && '• (ACTIVE AGENT)'}</span>
                            <span className="text-slate-500 font-mono text-[10px]">AIzaSy...</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type={showKeyVisibility ? 'text' : 'password'}
                              value={localGeminiKey}
                              onChange={e => setLocalGeminiKey(e.target.value)}
                              placeholder="Paste Google Gemini API Key..."
                              className="flex-1 px-3 py-2 rounded-xl bg-[#161e2e] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <input
                              type="text"
                              value={localGeminiModel}
                              onChange={e => setLocalGeminiModel(e.target.value)}
                              placeholder="Model Name"
                              className="w-36 px-3 py-2 rounded-xl bg-[#161e2e] border border-slate-700 text-xs text-sky-300 font-mono"
                            />
                          </div>
                        </div>

                        {/* Claude Key */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                            <span>2. Anthropic Claude API Key {localProvider === 'Claude' && '• (ACTIVE AGENT)'}</span>
                            <span className="text-slate-500 font-mono text-[10px]">sk-ant-...</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type={showKeyVisibility ? 'text' : 'password'}
                              value={localClaudeKey}
                              onChange={e => setLocalClaudeKey(e.target.value)}
                              placeholder="Paste Anthropic Claude API Key..."
                              className="flex-1 px-3 py-2 rounded-xl bg-[#161e2e] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <input
                              type="text"
                              value={localClaudeModel}
                              onChange={e => setLocalClaudeModel(e.target.value)}
                              placeholder="Model Name"
                              className="w-36 px-3 py-2 rounded-xl bg-[#161e2e] border border-slate-700 text-xs text-amber-300 font-mono"
                            />
                          </div>
                        </div>

                        {/* ChatGPT Key */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                            <span>3. OpenAI ChatGPT API Key {localProvider === 'ChatGPT' && '• (ACTIVE AGENT)'}</span>
                            <span className="text-slate-500 font-mono text-[10px]">sk-proj-...</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type={showKeyVisibility ? 'text' : 'password'}
                              value={localChatgptKey}
                              onChange={e => setLocalChatgptKey(e.target.value)}
                              placeholder="Paste OpenAI ChatGPT API Key..."
                              className="flex-1 px-3 py-2 rounded-xl bg-[#161e2e] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={localChatgptModel}
                              onChange={e => setLocalChatgptModel(e.target.value)}
                              placeholder="Model Name"
                              className="w-36 px-3 py-2 rounded-xl bg-[#161e2e] border border-slate-700 text-xs text-emerald-300 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION C: GUARDRAILS & PERSONA */}
                    <div className="rounded-3xl bg-[#111622] border border-[#1f293d] p-6 space-y-6">
                      <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4" />
                        <span>AI Reasoning Persona & Guardrails</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            AI Role & Persona
                          </label>
                          <textarea
                            rows={2}
                            value={localGuardrails.identityRole}
                            onChange={e => setLocalGuardrails({ ...localGuardrails, identityRole: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Target Audience & Tone
                          </label>
                          <textarea
                            rows={2}
                            value={localGuardrails.toneManner}
                            onChange={e => setLocalGuardrails({ ...localGuardrails, toneManner: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-emerald-400">
                            &ldquo;What the AI SHOULD say&rdquo; (one per line)
                          </label>
                          <textarea
                            rows={4}
                            value={localGuardrails.shouldSayText}
                            onChange={e => setLocalGuardrails({ ...localGuardrails, shouldSayText: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-emerald-900/50 text-xs text-emerald-200 font-mono text-[11px]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-red-400">
                            &ldquo;What the AI must NOT say&rdquo; (one per line)
                          </label>
                          <textarea
                            rows={4}
                            value={localGuardrails.mustNotSayText}
                            onChange={e => setLocalGuardrails({ ...localGuardrails, mustNotSayText: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-red-900/50 text-xs text-red-200 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SUB-TAB 1: COMPANY KNOWLEDGE BASE */}
                {/* ---------------------------------------------------- */}
                {aiSubTab === 'knowledge' && (
                  <div className="space-y-8 animate-fade-in">
                    {/* Company Details */}
                    <div className="rounded-3xl bg-[#111622] border border-[#1f293d] p-6 space-y-6">
                      <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                        <Building className="w-4 h-4" />
                        <span>Company Details & Contact Information</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Clinic / Company Name
                          </label>
                          <input
                            type="text"
                            value={localCompany.clinicName}
                            onChange={e => setLocalCompany({ ...localCompany, clinicName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Working Hours & Schedule
                          </label>
                          <input
                            type="text"
                            value={localCompany.workingHours}
                            onChange={e => setLocalCompany({ ...localCompany, workingHours: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Helpline Phone Number (+44 UK)
                          </label>
                          <input
                            type="text"
                            value={localCompany.helplinePhone}
                            onChange={e => setLocalCompany({ ...localCompany, helplinePhone: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            WhatsApp Contact (+44 UK)
                          </label>
                          <input
                            type="text"
                            value={localCompany.whatsappPhone}
                            onChange={e => setLocalCompany({ ...localCompany, whatsappPhone: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Company Description (Seen by AI Reasoning Engine)
                        </label>
                        <textarea
                          rows={3}
                          value={localCompany.companyDescription}
                          onChange={e => setLocalCompany({ ...localCompany, companyDescription: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Dental Services & Verified Pricing */}
                    <div className="rounded-3xl bg-[#111622] border border-[#1f293d] p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" />
                          <span>Dental Services & Verified Pricing ({services.length} Registered)</span>
                        </div>

                        <button
                          onClick={() => setIsAddingService(!isAddingService)}
                          className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Service</span>
                        </button>
                      </div>

                      {isAddingService && (
                        <form
                          onSubmit={handleCreateService}
                          className="p-5 rounded-2xl bg-[#0b0f17] border border-sky-500/40 space-y-4 animate-fade-in"
                        >
                          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                            Register New Dental Service in Knowledge Base
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-300 mb-1">Service Name *</label>
                              <input
                                type="text"
                                required
                                value={newServiceForm.name}
                                onChange={e => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
                                placeholder="Composite Bonding Makeover"
                                className="w-full px-3 py-2 rounded-lg bg-[#161e2e] border border-slate-700 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-300 mb-1">Price Range (in GBP £) *</label>
                              <input
                                type="text"
                                required
                                value={newServiceForm.priceRange}
                                onChange={e => setNewServiceForm({ ...newServiceForm, priceRange: e.target.value })}
                                placeholder="From £250"
                                className="w-full px-3 py-2 rounded-lg bg-[#161e2e] border border-slate-700 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-300 mb-1">Category</label>
                              <select
                                value={newServiceForm.category}
                                onChange={e => setNewServiceForm({ ...newServiceForm, category: e.target.value as ServiceCategory })}
                                className="w-full px-3 py-2 rounded-lg bg-[#161e2e] border border-slate-700 text-xs text-white"
                              >
                                {allCategories.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex space-x-2 pt-2">
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                            >
                              Save to Clinic Catalog
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingService(false)}
                              className="px-3 py-2 rounded-lg bg-[#161e2e] text-slate-300 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-[#0b0f17] text-slate-400 text-[10px] uppercase font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Service Name</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3">Verified Price</th>
                              <th className="py-2.5 px-3">Duration</th>
                              <th className="py-2.5 px-3">Description</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1f293d]">
                            {services.map(srv => (
                              <tr key={srv.id} className="hover:bg-[#161e2e]/50">
                                <td className="py-3 px-3 font-bold text-white">{srv.name}</td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#161e2e] text-sky-300 border border-slate-700">
                                    {srv.category}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                                  {srv.priceRange}
                                </td>
                                <td className="py-3 px-3 text-slate-400">{srv.duration}</td>
                                <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                                  {srv.description}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => deleteService(srv.id)}
                                    className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Policies & FAQs */}
                    <div className="rounded-3xl bg-[#111622] border border-[#1f293d] p-6 space-y-6">
                      <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                        <FileCheck className="w-4 h-4" />
                        <span>Refund, Cancellation & Clinic Policies</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Refund Policy & Timelines
                          </label>
                          <textarea
                            rows={2}
                            value={localPolicies.refundPolicy}
                            onChange={e => setLocalPolicies({ ...localPolicies, refundPolicy: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Appointment Cancellation Policy
                          </label>
                          <textarea
                            rows={2}
                            value={localPolicies.cancellationPolicy}
                            onChange={e => setLocalPolicies({ ...localPolicies, cancellationPolicy: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Additional Business Policies (one policy per line)
                          </label>
                          <textarea
                            rows={4}
                            value={localPolicies.additionalPoliciesText}
                            onChange={e => setLocalPolicies({ ...localPolicies, additionalPoliciesText: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FAQs */}
                    <div className="rounded-3xl bg-[#111622] border border-[#1f293d] p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                          <HelpCircle className="w-4 h-4" />
                          <span>Frequently Asked Questions ({faqs.length} FAQs)</span>
                        </div>
                        <button
                          onClick={() => setIsAddingFAQ(!isAddingFAQ)}
                          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                        >
                          + Add FAQ
                        </button>
                      </div>

                      {isAddingFAQ && (
                        <form onSubmit={handleCreateFAQ} className="p-4 rounded-2xl bg-[#0b0f17] border border-sky-500/40 space-y-3">
                          <input
                            type="text"
                            required
                            value={newFAQForm.question}
                            onChange={e => setNewFAQForm({ ...newFAQForm, question: e.target.value })}
                            placeholder="Question"
                            className="w-full px-3 py-2 rounded-lg bg-[#161e2e] border border-slate-700 text-xs text-white"
                          />
                          <textarea
                            rows={2}
                            required
                            value={newFAQForm.answer}
                            onChange={e => setNewFAQForm({ ...newFAQForm, answer: e.target.value })}
                            placeholder="Verified clinical answer"
                            className="w-full px-3 py-2 rounded-lg bg-[#161e2e] border border-slate-700 text-xs text-white"
                          />
                          <div className="flex space-x-2">
                            <button type="submit" className="px-3 py-1.5 bg-sky-500 text-slate-950 font-bold text-xs rounded-lg">Save FAQ</button>
                            <button type="button" onClick={() => setIsAddingFAQ(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
                          </div>
                        </form>
                      )}

                      <div className="space-y-3">
                        {faqs.map(faq => (
                          <div key={faq.id} className="p-4 rounded-2xl bg-[#0b0f17] border border-slate-800 flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold text-white">{faq.question}</p>
                              <p className="text-xs text-slate-400 mt-1">{faq.answer}</p>
                            </div>
                            <button onClick={() => deleteFAQ(faq.id)} className="text-slate-500 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SUB-TAB 3: LIVE CHAT REASONING SIMULATOR */}
                {/* ---------------------------------------------------- */}
                {aiSubTab === 'simulator' && (
                  <div className="rounded-3xl bg-[#111622] border border-[#1f293d] p-6 space-y-6 animate-fade-in">
                    <div>
                      <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                        <Brain className="w-4 h-4" />
                        <span>Live Chat Reasoning Simulator (Chain-of-Thought Engine)</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">Inspect How the AI Agent Reasons Before Answering</h3>
                      <p className="text-xs text-slate-400">
                        Active Agent: <strong>{localProvider}</strong>. Verifies website data, evaluates your Appointment Approval Directives, and strictly follows clinical guardrails.
                      </p>
                    </div>

                    {/* Preset Test Chips */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Preset Test Queries:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Can you book me for teeth whitening and is it auto-approved?',
                          'How much are dental implants and does the doctor need to review?',
                          'What is the cancellation timeline?',
                          'I have extreme facial swelling and fever',
                          'Can you prescribe amoxicillin?',
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleRunSimulator(preset)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#161e2e] border border-[#242e44] hover:border-sky-400 hover:text-sky-300 text-slate-300 transition-colors"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Query Input Bar */}
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="text"
                        value={simulatorQuery}
                        onChange={e => setSimulatorQuery(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRunSimulator();
                        }}
                        placeholder={`Test ${localProvider} reasoning on patient query or symptom...`}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        onClick={() => handleRunSimulator()}
                        disabled={simulatorLoading || !simulatorQuery.trim()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>Run Reasoning</span>
                      </button>
                    </div>

                    {/* Simulator Output Window */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Reasoning & Output Logs ({simulatorHistory.length} Runs)
                        </span>
                        <button
                          onClick={() => setSimulatorHistory([])}
                          className="text-[11px] text-slate-500 hover:text-slate-300"
                        >
                          Clear Log
                        </button>
                      </div>

                      {simulatorLoading && (
                        <div className="p-4 rounded-2xl bg-[#0b0f17] border border-slate-700 text-xs text-sky-400 flex items-center space-x-2">
                          <Brain className="w-4 h-4 animate-spin text-sky-400" />
                          <span>Simulating {localProvider} reasoning trace & appointment policy check...</span>
                        </div>
                      )}

                      <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                        {simulatorHistory.map((item, idx) => {
                          const isTraceOpen = expandedTraceIndex === idx;
                          return (
                            <div
                              key={idx}
                              className="rounded-2xl bg-[#0b0f17] border border-[#1f293d] p-4 space-y-3"
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between text-xs">
                                <div className="flex items-center space-x-2 font-bold text-sky-300">
                                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                  <span>Patient Query: &ldquo;{item.query}&rdquo;</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
                                    {item.result.activeAgentEngine}
                                  </span>
                                </div>
                              </div>

                              {/* Reasoning Chain Dropdown */}
                              {item.result.reasoningTrace && item.result.reasoningTrace.length > 0 && (
                                <div className="rounded-xl bg-[#141b2a] border border-slate-700/80 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedTraceIndex(isTraceOpen ? null : idx)}
                                    className="w-full px-3 py-2 text-left text-xs font-bold text-sky-300 bg-[#172033] hover:bg-[#1a253c] flex items-center justify-between transition-colors"
                                  >
                                    <span className="flex items-center space-x-1.5">
                                      <Brain className="w-4 h-4 text-sky-400" />
                                      <span>🧠 Chain-of-Thought Reasoning Trace ({item.result.reasoningTrace.length} Steps)</span>
                                    </span>
                                    {isTraceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>

                                  {isTraceOpen && (
                                    <div className="p-3 space-y-2.5 text-[11px] text-slate-300 font-mono border-t border-slate-800 bg-[#0d1320]">
                                      {item.result.reasoningTrace.map(step => (
                                        <div key={step.step} className="space-y-0.5">
                                          <p className="font-bold text-sky-400">
                                            Step {step.step}: {step.title}
                                          </p>
                                          <p className="text-slate-300 leading-relaxed pl-2 border-l border-sky-600/40">
                                            {step.detail}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* AI Response Output */}
                              <div className="p-3.5 rounded-xl bg-[#151c2c] border border-slate-700/80 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                                {item.result.reply}
                              </div>

                              {/* Grounding Source & Approval Badges */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                                {item.result.appointmentApprovalStatus && (
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold ${
                                      item.result.appointmentApprovalStatus === 'Auto-Approved'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                                    }`}
                                  >
                                    Approval: {item.result.appointmentApprovalStatus}
                                  </span>
                                )}
                                {item.result.sourceGrounded?.map((src, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-2 py-0.5 rounded font-mono bg-[#161e2e] text-slate-300 border border-slate-700"
                                  >
                                    Grounded in: {src}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: APPOINTMENTS & CALENDAR */}
            {/* ======================================================== */}
            {activeMainTab === 'appointments' && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-3xl bg-[#111622] border border-[#1f293d] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={aptSearch}
                      onChange={e => setAptSearch(e.target.value)}
                      placeholder="Search patient, phone, or service..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-1 bg-[#0b0f17] p-1 rounded-xl text-xs border border-slate-700">
                      <span className="px-2 text-slate-400 text-[10px] uppercase font-bold">Date:</span>
                      {(['All', 'Today', 'Tomorrow'] as const).map(df => (
                        <button
                          key={df}
                          onClick={() => setAptDateFilter(df)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            aptDateFilter === df ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {df}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1 bg-[#0b0f17] p-1 rounded-xl text-xs border border-slate-700">
                      <span className="px-2 text-slate-400 text-[10px] uppercase font-bold">Status:</span>
                      {(['All', 'Confirmed', 'Pending'] as const).map(sf => (
                        <button
                          key={sf}
                          onClick={() => setAptStatusFilter(sf)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            aptStatusFilter === sf ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {sf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-[#111622] border border-[#1f293d] overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#0b0f17] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#1f293d]">
                        <tr>
                          <th className="py-3.5 px-4">Ref #</th>
                          <th className="py-3.5 px-4">Patient Name & Contact</th>
                          <th className="py-3.5 px-4">Treatment</th>
                          <th className="py-3.5 px-4">Date & Slot</th>
                          <th className="py-3.5 px-4">AI Approval Status</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f293d]">
                        {filteredAppointments.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500">
                              No appointments matching current filters.
                            </td>
                          </tr>
                        ) : (
                          filteredAppointments.map(apt => (
                            <tr key={apt.id} className="hover:bg-[#161e2e]/50 transition-colors">
                              <td className="py-4 px-4 font-mono font-bold text-sky-400">{apt.id}</td>
                              <td className="py-4 px-4">
                                <p className="font-bold text-white text-sm">{apt.patientName}</p>
                                <p className="text-[11px] text-slate-400">{apt.patientPhone} • {apt.patientEmail}</p>
                                {apt.notes && (
                                  <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-xs">
                                    Note: {apt.notes}
                                  </p>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-semibold text-slate-200">{apt.serviceName}</span>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="flex items-center space-x-1 font-semibold text-white">
                                  <Calendar className="w-3.5 h-3.5 text-sky-400 mr-1" />
                                  <span>{apt.date}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-500 mr-1" />
                                  <span>{apt.timeSlot}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161e2e] text-slate-300 border border-slate-700">
                                  {apt.aiApprovalReason || (apt.approvedByAI ? 'Auto-Approved' : 'Manual Sign-off')}
                                </span>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    apt.status === 'Confirmed'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                >
                                  {apt.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                                {apt.status === 'Pending' && (
                                  <button
                                    onClick={() => updateAppointmentStatus(apt.id, 'Confirmed')}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                                  >
                                    Approve & Confirm
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeletingAptId(apt.id)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {deletingAptId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-[#111622] border border-slate-700 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl text-center">
                      <div className="w-12 h-12 rounded-full bg-red-950 text-red-400 flex items-center justify-center mx-auto">
                        <Trash2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-white">Delete Appointment?</h4>
                      <p className="text-xs text-slate-300">
                        Remove appointment <strong>#{deletingAptId}</strong> from the diary?
                      </p>
                      <div className="flex space-x-2 justify-center pt-2">
                        <button
                          onClick={() => setDeletingAptId(null)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            deleteAppointment(deletingAptId);
                            setDeletingAptId(null);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 3: WEB INQUIRIES */}
            {/* ======================================================== */}
            {activeMainTab === 'inquiries' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-bold text-white">Incoming Patient Web Inquiries</h3>
                  <p className="text-xs text-slate-400">
                    Direct messages submitted through the public website with 1-click WhatsApp and Phone call CTAs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inquiries.map(inq => (
                    <div
                      key={inq.id}
                      className="rounded-3xl bg-[#111622] border border-[#1f293d] p-6 space-y-4 shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-sky-400">{inq.id}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inq.status === 'New'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : inq.status === 'Contacted'
                                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {inq.status}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white">{inq.patientName}</h4>
                        <p className="text-xs text-sky-300 font-semibold">Interest: {inq.serviceInterest}</p>
                        <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0f17] p-3 rounded-xl border border-slate-800">
                          &ldquo;{inq.message}&rdquo;
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Received: {new Date(inq.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#1f293d] flex flex-wrap items-center gap-2">
                        <a
                          href={`tel:${inq.phone.replace(/\s+/g, '')}`}
                          className="px-3 py-1.5 rounded-xl bg-[#161e2e] hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-sky-400" />
                          <span>Call {inq.phone}</span>
                        </a>

                        <a
                          href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(inq.patientName)},%20this%20is%20Vertex%20Dental%20Lab.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {inq.status !== 'Resolved' && (
                          <button
                            onClick={() => updateInquiryStatus(inq.id, 'Resolved')}
                            className="ml-auto px-3 py-1.5 rounded-xl bg-[#0b0f17] text-slate-300 text-xs border border-slate-700 hover:bg-[#161e2e]"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 4: WALK-IN / PHONE BOOKING */}
            {/* ======================================================== */}
            {activeMainTab === 'walkin' && (
              <div className="max-w-2xl mx-auto rounded-3xl bg-[#111622] border border-[#1f293d] p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950 text-sky-400 text-xs font-bold mb-2">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Reception Desk & Telephone Reservations</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Manual Patient Booking Entry</h3>
                  <p className="text-xs text-slate-400">
                    Immediately reserve clinical operatory time for walk-in patients or telephone callers.
                  </p>
                </div>

                {walkInSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{walkInSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleWalkInSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={walkInForm.patientName}
                      onChange={e => setWalkInForm({ ...walkInForm, patientName: e.target.value })}
                      placeholder="e.g. Sir Arthur Sterling"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        UK Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={walkInForm.patientPhone}
                        onChange={e => setWalkInForm({ ...walkInForm, patientPhone: e.target.value })}
                        placeholder="+44 7700 900123"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Patient Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={walkInForm.patientEmail}
                        onChange={e => setWalkInForm({ ...walkInForm, patientEmail: e.target.value })}
                        placeholder="patient@example.co.uk"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Treatment / Procedure
                    </label>
                    <select
                      value={walkInForm.serviceName}
                      onChange={e => setWalkInForm({ ...walkInForm, serviceName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-sm text-white"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.priceRange})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        required
                        value={walkInForm.date}
                        onChange={e => setWalkInForm({ ...walkInForm, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Time Slot
                      </label>
                      <select
                        value={walkInForm.timeSlot}
                        onChange={e => setWalkInForm({ ...walkInForm, timeSlot: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-sm text-white"
                      >
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="10:15 AM">10:15 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="11:45 AM">11:45 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="03:00 PM">03:00 PM</option>
                        <option value="04:15 PM">04:15 PM</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 hover:opacity-90 transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Save Directly into Clinic Diary</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
