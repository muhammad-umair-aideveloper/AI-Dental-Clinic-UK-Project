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
  ChevronDown,
  LayoutDashboard,
  CalendarDays,
  FolderKanban,
  Bot,
  Bell,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Activity,
  Phone,
  MapPin,
  Car,
  CreditCard,
  UploadCloud,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface SimulatedMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  isAlert?: boolean;
  alertText?: string;
  reasoningTrace?: { step: number; title: string; detail: string }[];
  sources?: string[];
}

export default function AdminDashboardPage() {
  const {
    services,
    addService,
    deleteService,
    appointments,
    updateAppointmentStatus,
    deleteAppointment,
    addAppointment,
    companyDetails,
    updateCompanyDetails,
    clinicPolicies,
    updateClinicPolicies,
    faqs,
    aiSettings,
    updateAISettings,
    aiProviderSettings,
    updateAIProviderSettings,
    approvalPolicy,
    updateApprovalPolicy,
    resetToDefaults,
  } = useClinic();

  // Navigation matching Image 2 & 3:
  // Overview | Appointments | Services Catalog | AI Chatbot Studio | Patients
  const [activeNav, setActiveNav] = useState<'overview' | 'appointments' | 'services' | 'ai-studio' | 'patients'>('ai-studio');

  // Save banner feedback
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);

  // Appointments Tab States
  const [aptSearch, setAptSearch] = useState('');
  const [aptFilterTab, setAptFilterTab] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('pending');
  const [selectedPractitioner, setSelectedPractitioner] = useState('All');

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
  });

  // Local state for AI Settings (matching reference image)
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

  // Persona tone selector matching reference image (Warm & Empathetic, Direct & Concise, Formal Medical)
  const [selectedTone, setSelectedTone] = useState<'warm' | 'concise' | 'formal'>('warm');

  // Approval Policy (user requirement)
  const [localAutoApprove, setLocalAutoApprove] = useState(approvalPolicy.autoApproveEnabled);
  const [localApprovedCategories, setLocalApprovedCategories] = useState<ServiceCategory[]>(
    approvalPolicy.approvedCategories
  );
  const [localApprovalDirectives, setLocalApprovalDirectives] = useState(
    approvalPolicy.adminApprovalDirectives
  );

  // Clinic Knowledge Base Profile fields (matching reference image Card 1)
  const [clinicProfile, setClinicProfile] = useState({
    clinicName: companyDetails.clinicName || 'DentPulse Advanced Dental & Orthodontics',
    emergencyPhone: companyDetails.helplinePhone || '+44 (0)20 7946 0199',
    address: companyDetails.clinicalAddress || '742 Evergreen Medical Suites, Suite 400, London W1G 6PB',
    operatingHours: companyDetails.workingHours || 'Mon-Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 3:00 PM',
    insurance: 'Delta Dental, Cigna, Bupa, AXA Health, Private Pay',
    parking: 'Free underground patient parking via 8th avenue, wheelchair ramp at east entrance.',
  });

  // Chatbot Live Preview (Right column of reference image)
  const [chatMode, setChatMode] = useState<'test' | 'prod'>('test');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  // Messages matching reference image exactly initially
  const [chatMessages, setChatMessages] = useState<SimulatedMessage[]>([
    {
      id: 'm-1',
      sender: 'bot',
      text: "Hello! I'm Pearl from DentPulse Advanced Dental & Orthodontics. How can I assist you with your dental health or scheduling today?",
    },
    {
      id: 'm-2',
      sender: 'user',
      text: 'Hi, I have severe pain in my bottom left molar. Can I get antibiotics prescribed?',
    },
    {
      id: 'm-3',
      sender: 'bot',
      text: "I'm so sorry you're in pain! As an AI concierge, I cannot prescribe medications or diagnose conditions.",
      isAlert: true,
      alertText: 'Severe dental pain requires an immediate clinical evaluation by Dr. Sarah Jenkins.',
      reasoningTrace: [
        { step: 1, title: 'Perception & Symptom Analysis', detail: 'User reports acute molar pain and requests antibiotics.' },
        { step: 2, title: 'Clinical Safety Boundary', detail: 'Non-diagnostic policy triggered: AI cannot prescribe medication.' },
        { step: 3, title: 'Emergency Triage Escalation', detail: 'Immediate evaluation flagged; retrieved next available slot at 3:30 PM.' },
      ],
      sources: ['GDC Standards for Dental Professionals', 'Clinic Emergency Protocol'],
    },
  ]);

  const allCategories: ServiceCategory[] = [
    'General',
    'Preventive',
    'Endodontics',
    'Cosmetic',
    'Surgical',
    'Orthodontics',
    'Emergency',
  ];

  const handleSaveAll = () => {
    updateCompanyDetails({
      ...companyDetails,
      clinicName: clinicProfile.clinicName,
      helplinePhone: clinicProfile.emergencyPhone,
      clinicalAddress: clinicProfile.address,
      workingHours: clinicProfile.operatingHours,
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

  // Send message in Live Chatbot Preview
  const handleSendChatMessage = (presetPrompt?: string) => {
    const q = (presetPrompt || chatInput).trim();
    if (!q) return;

    const userMsg: SimulatedMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      const result = generateGroundingResponse(q, {
        services,
        companyDetails: {
          ...companyDetails,
          clinicName: clinicProfile.clinicName,
          helplinePhone: clinicProfile.emergencyPhone,
          clinicalAddress: clinicProfile.address,
          workingHours: clinicProfile.operatingHours,
        },
        clinicPolicies,
        faqs,
        aiSettings,
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

      const isPainQuery = /pain|hurt|swelling|broken|emergency|antibiotic/i.test(q);

      const botMsg: SimulatedMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: result.replyText,
        isAlert: isPainQuery,
        alertText: isPainQuery ? 'Severe dental symptoms require immediate clinical evaluation by Dr. Sarah Jenkins.' : undefined,
        reasoningTrace: result.reasoningTrace,
        sources: result.groundedSources,
      };

      setChatMessages(prev => [...prev, botMsg]);
      setChatLoading(false);
      setExpandedTraceId(botMsg.id);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      
      {/* Toast Alert */}
      {saveSuccessBanner && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center space-x-3 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold">Settings Deployed to Live Clinical Widget</p>
            <p className="text-[11px] text-slate-300">
              Active Provider: {localProvider} • Approval Authority: {localAutoApprove ? 'Authorized' : 'Doctor Sign-off'}
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row w-full">
        
        {/* ======================================================== */}
        {/* SIDEBAR: DentPulse Clinical Admin Style (Matching Image 2 & 3) */}
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
                  DentPulse
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

                {/* 2. Appointments */}
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
                      activeNav === 'appointments' ? 'bg-white text-sky-700' : 'bg-rose-600 text-white'
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

                {/* 4. AI Chatbot Studio (matching reference image) */}
                <button
                  onClick={() => setActiveNav('ai-studio')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                    activeNav === 'ai-studio'
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Bot className="w-4 h-4" />
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

          {/* Bottom Sidebar */}
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
              <span className="text-[10px] text-slate-400">Live</span>
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
          
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between gap-4 shadow-xs">
            {/* Search Input */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient records, MRN, dental chart..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3.5 ml-auto">
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Accepting Online Bookings - Open</span>
              </div>

              <button
                onClick={() => setManualModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Action</span>
              </button>

              <button className="relative w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
              </button>

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
                  <p className="text-[10px] text-slate-500">Downtown Clinic</p>
                </div>
              </div>
            </div>
          </header>

          {/* ======================================================== */}
          {/* AI CHATBOT STUDIO & CLINIC CONFIGURATION (REFERENCE MATCH)*/}
          {/* ======================================================== */}
          {activeNav === 'ai-studio' && (
            <div className="p-6 sm:p-8 space-y-7 max-w-[1500px] mx-auto w-full animate-fade-in">
              
              {/* Header matching Reference Image exactly */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                    CLINICAL AUTOMATION / <span className="text-slate-500">AI AGENT & KNOWLEDGE ENGINE</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      AI Chatbot Studio & Clinic Configuration
                    </h1>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      Agent: Pearl v2.8 Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure clinical safety guardrails, company grounding data, and test simulated conversations in real-time.
                  </p>
                </div>

                {/* Top-Right Badges & Deploy Action Button (matching reference image) */}
                <div className="flex items-center space-x-3 self-start xl:self-center">
                  {/* Grounded FAQs Badge */}
                  <div className="p-2.5 px-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                        GROUNDED FAQS
                      </p>
                      <p className="text-base font-black text-slate-950 mt-0.5 leading-none">42</p>
                    </div>
                  </div>

                  {/* Safety Shield Badge */}
                  <div className="p-2.5 px-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                        SAFETY SHIELD
                      </p>
                      <p className="text-base font-black text-slate-950 mt-0.5 leading-none">100% Strict</p>
                    </div>
                  </div>

                  {/* Deploy to Live Widget Button */}
                  <button
                    onClick={handleSaveAll}
                    className="px-5 py-3 rounded-2xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-sm flex items-center space-x-2 transition-all active:scale-95 shrink-0"
                  >
                    <UploadCloud className="w-4 h-4 text-sky-400" />
                    <span>Deploy to Live Widget</span>
                  </button>
                </div>
              </div>

              {/* SPLIT SCREEN LAYOUT: Left Config Cards (60%) + Right Live Chatbot Preview (40%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ---------------------------------------------------- */}
                {/* LEFT COLUMN: Configuration & Grounding Cards (7 cols) */}
                {/* ---------------------------------------------------- */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* CARD 1: Clinic Knowledge Base Profile (matching reference image Card 1) */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-950">
                            Clinic Knowledge Base Profile
                          </h3>
                          <p className="text-xs text-slate-500">
                            Core clinic identity and logistics ingested by Pearl to answer patient booking queries.
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center space-x-1">
                        <Check className="w-3 h-3 text-cyan-600" />
                        <span>Ingested</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Clinic Official Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Clinic Official Name
                        </label>
                        <div className="relative">
                          <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={clinicProfile.clinicName}
                            onChange={e => setClinicProfile({ ...clinicProfile, clinicName: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>
                      </div>

                      {/* Direct Emergency Hotline */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Direct Emergency Hotline
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={clinicProfile.emergencyPhone}
                            onChange={e => setClinicProfile({ ...clinicProfile, emergencyPhone: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>
                      </div>

                      {/* Street Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Clinic Street Address & Suite
                        </label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={clinicProfile.address}
                            onChange={e => setClinicProfile({ ...clinicProfile, address: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>
                      </div>

                      {/* Operating Hours */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Operating Hours Protocol
                        </label>
                        <div className="relative">
                          <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={clinicProfile.operatingHours}
                            onChange={e => setClinicProfile({ ...clinicProfile, operatingHours: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>
                      </div>

                      {/* Accepted Insurance */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Accepted Insurance Providers
                        </label>
                        <div className="relative">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={clinicProfile.insurance}
                            onChange={e => setClinicProfile({ ...clinicProfile, insurance: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>
                      </div>

                      {/* Parking & Accessibility */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Parking, Accessibility & Wayfinding Guidance
                        </label>
                        <div className="relative">
                          <span className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs flex items-center justify-center">
                            P
                          </span>
                          <input
                            type="text"
                            value={clinicProfile.parking}
                            onChange={e => setClinicProfile({ ...clinicProfile, parking: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveAll}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition-colors flex items-center space-x-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Clinic Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* CARD 2: Clinical Safety Limits & Behavioral Bounds (matching reference Card 2) */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-950">
                            Clinical Safety Limits & Behavioral Bounds
                          </h3>
                          <p className="text-xs text-slate-500">
                            Enforce ethical healthcare guardrails, strict non-diagnostic policies, and concierge tone.
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Strict Guardrails Active
                      </span>
                    </div>

                    {/* Persona & Conversational Tone matching Reference Image */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Persona & Conversational Tone
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Option 1: Warm & Empathetic */}
                        <div
                          onClick={() => setSelectedTone('warm')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedTone === 'warm'
                              ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-400/20 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-slate-950">Warm & Empathetic</span>
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                selectedTone === 'warm' ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                              }`}
                            >
                              {selectedTone === 'warm' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Friendly clinician voice, compassionate reassurance, comforting dental anxiety.
                          </p>
                        </div>

                        {/* Option 2: Direct & Concise */}
                        <div
                          onClick={() => setSelectedTone('concise')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedTone === 'concise'
                              ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-400/20 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-slate-950">Direct & Concise</span>
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                selectedTone === 'concise' ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                              }`}
                            >
                              {selectedTone === 'concise' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Brevity focused, optimal for fast appointment scheduling and exact pricing lookups.
                          </p>
                        </div>

                        {/* Option 3: Formal Medical */}
                        <div
                          onClick={() => setSelectedTone('formal')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedTone === 'formal'
                              ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-400/20 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-slate-950">Formal Medical</span>
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                selectedTone === 'formal' ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                              }`}
                            >
                              {selectedTone === 'formal' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            Rigid academic terminology, formal syntax, suited for specialist surgical consults.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Admin Appointment Approval Policy & Authority (User explicit requirement) */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Admin Appointment Approval Authority</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Admin dictates which categories the AI can auto-confirm into the diary versus holding for doctor triage.
                        </p>
                      </div>

                      <button
                        onClick={() => setLocalAutoApprove(!localAutoApprove)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                          localAutoApprove
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {localAutoApprove ? '✓ AI Auto-Confirm: Active' : 'Require Doctor Review'}
                      </button>
                    </div>

                    {/* Category Selection Pills */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Approved Treatment Categories for AI Confirmation:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {allCategories.map(cat => {
                          const isApproved = localApprovedCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              onClick={() => toggleCategoryApproval(cat)}
                              className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between text-xs font-bold ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                            >
                              <span>{cat}</span>
                              {isApproved ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Admin Directives */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Admin Approval Directives & Escalate Guidelines
                      </label>
                      <textarea
                        rows={2}
                        value={localApprovalDirectives}
                        onChange={e => setLocalApprovalDirectives(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>

                  {/* CARD 4: 3 AI Agent API Options (Gemini, Claude, ChatGPT) */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2">
                          <Key className="w-4 h-4 text-sky-600" />
                          <span>3 Multi-Agent API Options (Paste Keys Here)</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Admin pastes API keys for Gemini, Claude, or ChatGPT to power the live reasoning engine.
                        </p>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                        Active: {localProvider}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Gemini */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${localProvider === 'Gemini' ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500/20' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center justify-between font-bold text-slate-950">
                          <span>Google Gemini</span>
                          <input type="radio" checked={localProvider === 'Gemini'} onChange={() => setLocalProvider('Gemini')} />
                        </div>
                        <input
                          type={showGeminiKey ? 'text' : 'password'}
                          value={localGeminiKey}
                          onChange={e => setLocalGeminiKey(e.target.value)}
                          placeholder="Paste Gemini API Key..."
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px]"
                        />
                      </div>

                      {/* Claude */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${localProvider === 'Claude' ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500/20' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center justify-between font-bold text-slate-950">
                          <span>Anthropic Claude</span>
                          <input type="radio" checked={localProvider === 'Claude'} onChange={() => setLocalProvider('Claude')} />
                        </div>
                        <input
                          type={showClaudeKey ? 'text' : 'password'}
                          value={localClaudeKey}
                          onChange={e => setLocalClaudeKey(e.target.value)}
                          placeholder="Paste Claude API Key..."
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px]"
                        />
                      </div>

                      {/* ChatGPT */}
                      <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${localProvider === 'ChatGPT' ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500/20' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center justify-between font-bold text-slate-950">
                          <span>OpenAI ChatGPT</span>
                          <input type="radio" checked={localProvider === 'ChatGPT'} onChange={() => setLocalProvider('ChatGPT')} />
                        </div>
                        <input
                          type={showChatgptKey ? 'text' : 'password'}
                          value={localChatgptKey}
                          onChange={e => setLocalChatgptKey(e.target.value)}
                          placeholder="Paste ChatGPT API Key..."
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* ---------------------------------------------------- */}
                {/* RIGHT COLUMN: Live Chatbot Preview (Matching Image 3 exactly!) */}
                {/* ---------------------------------------------------- */}
                <div className="lg:col-span-5 sticky top-20">
                  <div className="rounded-2xl bg-white border border-slate-200/90 shadow-lg overflow-hidden flex flex-col h-[750px]">
                    
                    {/* Header matching Reference Image */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-sky-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950 leading-tight">
                            Live Chatbot Preview
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                            Pearl Digital Concierge • <span className="text-emerald-600 font-semibold">Clinical Guardrails Active</span>
                          </p>
                        </div>
                      </div>

                      {/* Segmented Mode Button matching Reference Image: Test Mode | Production */}
                      <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                        <button
                          onClick={() => setChatMode('test')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            chatMode === 'test'
                              ? 'bg-sky-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-950'
                          }`}
                        >
                          Test Mode
                        </button>
                        <button
                          onClick={() => setChatMode('prod')}
                          className={`px-3 py-1 rounded-lg font-medium transition-all ${
                            chatMode === 'prod'
                              ? 'bg-sky-700 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Production
                        </button>
                      </div>
                    </div>

                    {/* Sub-bar matching Reference: Model & Latency */}
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                        <span>Model: DentPulse RAG Clinical ({localProvider})</span>
                      </span>
                      <span>Latency: 142ms</span>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8FAFC]">
                      {/* Session Timestamp Pill */}
                      <div className="flex justify-center">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-200/70 text-slate-600">
                          Today • Sandbox Session Initialized
                        </span>
                      </div>

                      {/* Message List */}
                      {chatMessages.map(msg => {
                        if (msg.sender === 'user') {
                          return (
                            <div key={msg.id} className="flex items-end justify-end space-x-2">
                              <div className="max-w-[85%] p-3.5 rounded-2xl rounded-br-xs bg-[#0A2540] text-white text-xs leading-relaxed shadow-sm">
                                {msg.text}
                              </div>
                              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                PT
                              </span>
                            </div>
                          );
                        }

                        // Bot Message
                        return (
                          <div key={msg.id} className="flex items-start space-x-2.5">
                            <span className="w-8 h-8 rounded-full bg-sky-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              P
                            </span>
                            <div className="max-w-[88%] space-y-2">
                              {/* Main Bubble */}
                              <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed shadow-xs space-y-2.5">
                                <p>{msg.text}</p>

                                {/* Red Clinical Guardrail Alert Callout (matching Reference Image exactly!) */}
                                {msg.isAlert && (
                                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start space-x-2">
                                    <span className="text-rose-600 font-bold text-sm leading-none mt-0.5">*</span>
                                    <p className="text-[11px] font-semibold leading-snug">
                                      {msg.alertText || 'Severe dental pain requires an immediate clinical evaluation by Dr. Sarah Jenkins.'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Reasoning Trace Toggle & Content */}
                              {msg.reasoningTrace && msg.reasoningTrace.length > 0 && (
                                <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200/90 text-[11px] text-slate-700 space-y-1.5">
                                  <button
                                    onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                                    className="font-bold text-sky-900 flex items-center justify-between w-full"
                                  >
                                    <span className="flex items-center space-x-1.5">
                                      <Brain className="w-3.5 h-3.5 text-sky-600" />
                                      <span>🧠 Chain-of-Thought Reasoning Trace ({msg.reasoningTrace.length} Steps)</span>
                                    </span>
                                    {expandedTraceId === msg.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  </button>

                                  {expandedTraceId === msg.id && (
                                    <div className="pt-2 border-t border-sky-200/70 space-y-1 text-[10px]">
                                      {msg.reasoningTrace.map((st, i) => (
                                        <p key={i}>
                                          <strong className="text-sky-950">Step {st.step} ({st.title}):</strong> {st.detail}
                                        </p>
                                      ))}
                                      {msg.sources && (
                                        <p className="text-slate-500 font-semibold pt-1">
                                          Grounded Sources: {msg.sources.join(' • ')}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {chatLoading && (
                        <div className="flex items-center space-x-2 text-xs text-slate-500 pl-10">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                          <span>Pearl is reasoning through clinical guidelines...</span>
                        </div>
                      )}
                    </div>

                    {/* Test Prompts Row matching Reference Image */}
                    <div className="p-2.5 px-4 bg-white border-t border-slate-100 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                        TEST PROMPTS:
                      </span>
                      <button
                        onClick={() => handleSendChatMessage('Do you accept MetLife / Cigna?')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap"
                      >
                        &ldquo;Do you accept MetLife?&rdquo;
                      </button>
                      <button
                        onClick={() => handleSendChatMessage('What is your parking advice?')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap"
                      >
                        &ldquo;Parking advice?&rdquo;
                      </button>
                      <button
                        onClick={() => handleSendChatMessage('How much is Invisalign?')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap"
                      >
                        &ldquo;Invisalign fees?&rdquo;
                      </button>
                    </div>

                    {/* Chat Input Bar matching Reference Image */}
                    <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                        placeholder="Type a prompt to test bot safety guidelines..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                      <button
                        onClick={() => handleSendChatMessage()}
                        disabled={chatLoading || !chatInput.trim()}
                        className="w-10 h-10 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white flex items-center justify-center transition-colors shadow-xs"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: APPOINTMENTS & OTHER TABS                           */}
          {/* ======================================================== */}
          {activeNav === 'appointments' && (
            <div className="p-6 sm:p-8 space-y-7 max-w-7xl mx-auto w-full animate-fade-in">
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
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-sky-600" />
                    <span>Auto-Sync AI Portal</span>
                  </button>

                  <button
                    onClick={() => setManualModalOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manual Booking</span>
                  </button>
                </div>
              </div>

              {/* Triage Cards */}
              <div className="space-y-4">
                {appointments.map(apt => (
                  <div key={apt.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-sm text-slate-950">{apt.patientName}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
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
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">Source: {apt.source}</span>
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
            </div>
          )}

          {activeNav === 'overview' && (
            <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
              <h1 className="text-2xl font-black text-slate-950">Executive Clinic Overview</h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Active Patients</span>
                  <p className="text-3xl font-black text-slate-950 mt-1">384</p>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">AI Auto-Triage Accuracy</span>
                  <p className="text-3xl font-black text-slate-950 mt-1">98.4%</p>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">CAD/CAM Restorations</span>
                  <p className="text-3xl font-black text-slate-950 mt-1">42 Units</p>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'services' && (
            <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
              <h1 className="text-2xl font-black text-slate-950">Services Catalog</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {services.map(s => (
                  <div key={s.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{s.category}</span>
                    <h3 className="font-extrabold text-base text-slate-950">{s.name}</h3>
                    <p className="font-black text-sm text-sky-700">{s.priceRange}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'patients' && (
            <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
              <h1 className="text-2xl font-black text-slate-950">Patient Directory</h1>
              <p className="text-xs text-slate-500">384 Active Dental Records stored securely on v3.2 Dental Cloud.</p>
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
            <h3 className="text-base font-extrabold text-slate-950 mb-4">Add Manual Booking</h3>
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
              <div className="flex justify-end space-x-2 pt-2">
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
