'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import { generateGroundingResponse, AIResponseResult } from '@/lib/ai-engine';
import {
  DentalService,
  Clinician,
  SmileGalleryCase,
  LeadStatus,
  LeadSource,
  WebInquiry,
  ServiceCategory,
} from '@/types/clinic';
import {
  Search,
  ArrowLeft,
  SlidersHorizontal,
  Plus,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  ArrowUpRight,
  Check,
  X,
  CreditCard,
  Sparkles,
  Bot,
  Users,
  CheckCircle2,
  Building,
  Phone,
  Shield,
  FileText,
  Activity,
  Download,
  Send,
  MessageSquare,
  ExternalLink,
  Eye,
  Trash2,
  Edit3,
  Filter,
  Database,
  Cpu,
  Layers,
  Lock,
  RefreshCw,
  Zap,
  LogOut,
  Sun,
  Moon,
  Bell,
  HelpCircle,
  CheckSquare,
  Square,
  TrendingUp,
  BarChart3,
  Wifi,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    logout,
    services,
    clinicians,
    galleryCases,
    inquiries,
    companyDetails,
    clinicPolicies,
    faqs,
    aiSettings,
    aiProviderSettings,
    approvalPolicy,
    addService,
    updateService,
    deleteService,
    addClinician,
    updateClinician,
    deleteClinician,
    addGalleryCase,
    updateGalleryCase,
    deleteGalleryCase,
    updateInquiryStatus,
    deleteInquiry,
    updateCompanyDetails,
    updateClinicPolicies,
    addFAQ,
    updateFAQ,
    deleteFAQ,
    updateAISettings,
    updateAIProviderSettings,
    triggerToast,
  } = useClinic();

  // Authentication Guard: unauthenticated staff or visitors are redirected to /admin-login
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!currentUser.isLoggedIn || currentUser.role !== 'admin') {
      router.replace('/admin-login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [currentUser, router]);

  // Top Main Tabs
  type MainTab = 'leads' | 'cms' | 'ai' | 'reports';
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('leads');

  // Tab 1: Lead Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [selectedLeadForView, setSelectedLeadForView] = useState<WebInquiry | null>(null);

  // Checkbox Selection for Leads Table
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>(['lead-303']);

  // Tab 1: Simulated Webhook modal
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [isPushingWebhook, setIsPushingWebhook] = useState(false);

  // Tab 2: CMS Subsections
  type CMSSubTab = 'prices' | 'team' | 'gallery';
  const [activeCMSTab, setActiveCMSTab] = useState<CMSSubTab>('prices');

  // CMS Modals
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<DentalService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Cosmetic' as ServiceCategory,
    priceRange: 'From £995',
    basePriceGbp: 995,
    duration: '2 visits (10 days)',
    description: '',
    popular: false,
    financeMonthlyFrom: 41,
  });

  const [clinicianModalOpen, setClinicianModalOpen] = useState(false);
  const [editingClinician, setEditingClinician] = useState<Clinician | null>(null);
  const [clinicianForm, setClinicianForm] = useState({
    name: '',
    title: '',
    credentials: '',
    gdcNumber: 'GDC No: ',
    bio: '',
    experienceYears: 10,
    specialties: 'Cosmetic Dentistry, Porcelain Veneers',
    photo: '/images/lead-clinician.jpg',
    rating: 4.95,
    reviewsCount: 150,
    verifiedProcedures: 1200,
  });

  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGalleryCase, setEditingGalleryCase] = useState<SmileGalleryCase | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Cosmetic' as 'Cosmetic' | 'Restorative' | 'Orthodontics' | 'Implants',
    beforeImage: '/images/smile-before-1.jpg',
    afterImage: '/images/smile-after-1.jpg',
    procedureNotes: '',
    duration: '2 visits',
    clinicianName: 'Dr. Alistair Vance',
    clinicianGdc: 'GDC No: 248912',
  });

  // Tab 3: AI Assistant & Knowledge Management Subtabs
  type AISubTab = 'knowledge' | 'guardrails' | 'simulator';
  const [activeAITab, setActiveAITab] = useState<AISubTab>('knowledge');

  // AI Knowledge Base local form states
  const [kbCompany, setKbCompany] = useState(companyDetails);
  const [kbPolicies, setKbPolicies] = useState(clinicPolicies);

  // AI Guardrails local form states
  const [aiLocalSettings, setAiLocalSettings] = useState(aiSettings);
  const [aiLocalProvider, setAiLocalProvider] = useState(aiProviderSettings);
  const [showApiKey, setShowApiKey] = useState(false);

  // FAQ Modal
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'General' });

  // AI Live Chat Simulator State
  const [simQuery, setSimQuery] = useState('');
  const [simHistory, setSimHistory] = useState<
    { role: 'user' | 'assistant'; text: string; result?: AIResponseResult }[]
  >([
    {
      role: 'assistant',
      text: 'Good day. I am the Vertex Dental Lab clinical triage assistant. How may I assist you with private treatments, fees, or emergency guidance today?',
    },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  // ========================================================
  // DYNAMIC CLINIC REVENUE CALCULATION ENGINE
  // ========================================================
  const getLeadEstimatedValue = (serviceInterest: string = '', message: string = ''): number => {
    const text = `${serviceInterest} ${message}`.toLowerCase();
    if (text.includes('implant') || text.includes('straumann') || text.includes('full upper arch')) {
      if (text.includes('full') || text.includes('arch') || text.includes('multiple')) return 6600;
      return 1650;
    }
    if (text.includes('invisalign') || text.includes('aligner')) {
      if (text.includes('whitening')) return 2845;
      return 2450;
    }
    if (text.includes('veneer') || text.includes('e.max') || text.includes('porcelain')) {
      if (text.includes('6') || text.includes('six')) return 4770;
      if (text.includes('8') || text.includes('eight')) return 6360;
      return 795;
    }
    if (text.includes('whitening') || text.includes('zoom') || text.includes('laser')) {
      if (text.includes('hygiene') || text.includes('airflow')) return 505;
      return 395;
    }
    if (text.includes('checkup') || text.includes('examination') || text.includes('family')) {
      if (text.includes('four') || text.includes('4')) return 380;
      return 95;
    }
    if (text.includes('root canal') || text.includes('endodontic')) {
      return 550;
    }
    if (text.includes('hygiene') || text.includes('biofilm') || text.includes('airflow')) {
      return 110;
    }
    return 450;
  };

  // Live Financial Metrics
  const totalRevenue = inquiries.reduce((sum, l) => sum + getLeadEstimatedValue(l.serviceInterest, l.message), 0);
  const confirmedLeads = inquiries.filter(l => l.status === 'Consultation Booked');
  const confirmedRevenue = confirmedLeads.reduce((sum, l) => sum + getLeadEstimatedValue(l.serviceInterest, l.message), 0);
  const pendingLeads = inquiries.filter(l => l.status === 'New Lead' || l.status === 'New' || l.status === 'Contacted');
  const pendingRevenue = pendingLeads.reduce((sum, l) => sum + getLeadEstimatedValue(l.serviceInterest, l.message), 0);
  const avgCaseValue = inquiries.length > 0 ? Math.round(totalRevenue / inquiries.length) : 0;

  // Stream calculations for 3 core streams
  const implantsLeads = inquiries.filter(l => {
    const t = `${l.serviceInterest} ${l.message}`.toLowerCase();
    return t.includes('implant') || t.includes('straumann') || (l.treatmentCategory === 'General' && t.includes('arch'));
  });
  const implantsRevenue = implantsLeads.reduce((sum, l) => sum + getLeadEstimatedValue(l.serviceInterest, l.message), 0) || 6600;

  const orthoLeads = inquiries.filter(l => {
    const t = `${l.serviceInterest} ${l.message}`.toLowerCase();
    return t.includes('invisalign') || t.includes('aligner') || t.includes('ortho');
  });
  const orthoRevenue = orthoLeads.reduce((sum, l) => sum + getLeadEstimatedValue(l.serviceInterest, l.message), 0) || 4900;

  const cosmeticLeads = inquiries.filter(l => {
    const t = `${l.serviceInterest} ${l.message}`.toLowerCase();
    return t.includes('veneer') || t.includes('whitening') || t.includes('cosmetic') || t.includes('bonding');
  });
  const cosmeticRevenue = cosmeticLeads.reduce((sum, l) => sum + getLeadEstimatedValue(l.serviceInterest, l.message), 0) || 3390;

  // Toggle Checkbox Helpers
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  // 8-Month Stacked Bar Chart Data (Jan to Aug)
  const monthlyRevenueChartData = [
    { month: 'Jan', booked: 18, pipeline: 14, totalH: 32 },
    { month: 'Feb', booked: 22, pipeline: 18, totalH: 40 },
    { month: 'Mar', booked: 16, pipeline: 12, totalH: 28 },
    { month: 'Apr', booked: 26, pipeline: 15, totalH: 41 },
    { month: 'May', booked: 20, pipeline: 21, totalH: 41 },
    { month: 'Jun', booked: 28, pipeline: 22, totalH: 50 },
    { month: 'Jul', booked: 24, pipeline: 16, totalH: 40 },
    { month: 'Aug', booked: 22, pipeline: 15, totalH: 37 },
  ];

  // ========================================================
  // FILTERED LEADS FOR TAB 1
  // ========================================================
  const filteredLeads = inquiries.filter(lead => {
    if (statusFilter !== 'All' && lead.status !== statusFilter) return false;
    if (sourceFilter !== 'All' && lead.source !== sourceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        lead.patientName.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.serviceInterest.toLowerCase().includes(q) ||
        lead.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Lead ID', 'Patient Name', 'Phone', 'Email', 'Service Interest', 'Est Value (£)', 'Source', 'Status', 'Date Received', 'Message'];
    const rows = filteredLeads.map(l => [
      `"${l.id}"`,
      `"${l.patientName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.serviceInterest.replace(/"/g, '""')}"`,
      `"${getLeadEstimatedValue(l.serviceInterest, l.message)}"`,
      `"${l.source || 'Web Form'}"`,
      `"${l.status}"`,
      `"${new Date(l.createdAt).toLocaleDateString('en-GB')} ${new Date(l.createdAt).toLocaleTimeString('en-GB')}"`,
      `"${l.message.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vertex_dental_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast(`Exported ${filteredLeads.length} patient leads to CSV with estimated revenues.`);
  };

  // Webhook Simulator
  const handleTriggerWebhookSync = () => {
    setIsPushingWebhook(true);
    setTimeout(() => {
      setIsPushingWebhook(false);
      setShowWebhookModal(false);
      triggerToast(`Synced ${filteredLeads.length} patient inquiries to Dentally UK / Front Desk Zapier!`);
    }, 1200);
  };

  // ========================================================
  // SIMULATOR RUNNER
  // ========================================================
  const runSimulatorQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userEntry = { role: 'user' as const, text: queryText };
    setSimHistory(prev => [...prev, userEntry]);
    setSimQuery('');
    setIsSimulating(true);

    setTimeout(() => {
      const response = generateGroundingResponse(queryText, {
        services,
        companyDetails: kbCompany,
        clinicPolicies: kbPolicies,
        faqs,
        guardrails: aiLocalSettings,
        providerSettings: aiLocalProvider,
        approvalPolicy,
      });

      setSimHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: response.reply,
          result: response,
        },
      ]);
      setIsSimulating(false);
    }, 400);
  };

  // Auth Guard Fallback
  if (isCheckingAuth || !currentUser.isLoggedIn || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F6F7F9] text-[#111827] flex items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center space-y-3.5 text-center max-w-sm p-8 rounded-2xl bg-white border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5722] flex items-center justify-center border border-orange-200/60">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-[#111827]">Verifying Staff Authorization...</p>
          <p className="text-xs text-neutral-500">
            Redirecting to staff authentication portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#111827] flex flex-col font-sans antialiased">
      
      {/* ======================================================== */}
      {/* 1. TOP UNIFIED NAVBAR (Single Horizontal Row) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#F6F7F9]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between border-b border-neutral-200/50">
        
        {/* Left: Brand Pill with Orange Circular Icon + Vertex Title */}
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-full shadow-xs border border-neutral-200/70 flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF7A45] to-[#F54B1A] flex items-center justify-center text-white font-black text-[11px] shadow-xs">
              V
            </div>
            <span className="font-bold text-sm tracking-tight text-neutral-900">Vertex</span>
            <span className="text-[10px] text-neutral-400 font-medium border-l border-neutral-200 pl-2">Lab</span>
          </div>
        </div>

        {/* Center: Floating White Pill Container with Navigation Tabs */}
        <nav className="hidden md:flex items-center p-1 bg-white border border-neutral-200/70 rounded-full shadow-xs space-x-1">
          <button
            onClick={() => setActiveMainTab('leads')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeMainTab === 'leads'
                ? 'bg-[#141519] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Overview / Leads
          </button>
          <button
            onClick={() => setActiveMainTab('cms')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeMainTab === 'cms'
                ? 'bg-[#141519] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Clinic Content CMS
          </button>
          <button
            onClick={() => setActiveMainTab('ai')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeMainTab === 'ai'
                ? 'bg-[#141519] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            AI Assistant & Guardrails
          </button>
          <button
            onClick={() => setActiveMainTab('reports')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeMainTab === 'reports'
                ? 'bg-[#141519] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Revenue Reports
          </button>
        </nav>

        {/* Right: Quick Utility Pills + Clinic Profile Pill */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Quick Search trigger */}
          <button
            onClick={() => {
              setActiveMainTab('leads');
              const el = document.getElementById('bento-search-input');
              if (el) el.focus();
            }}
            className="w-9 h-9 rounded-full bg-white border border-neutral-200/70 flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-xs transition-colors"
            title="Search Leads"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* CRM Webhook Push */}
          <button
            onClick={() => setShowWebhookModal(true)}
            className="w-9 h-9 rounded-full bg-white border border-neutral-200/70 flex items-center justify-center text-amber-500 hover:text-amber-600 hover:bg-amber-50 shadow-xs transition-colors"
            title="Push to Dentally / CRM Zapier"
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200/70 text-xs font-semibold text-neutral-700 hover:text-neutral-900 shadow-xs transition-colors"
            title="Export Leads CSV"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export CSV</span>
          </button>

          {/* Return to Public Website */}
          <Link
            href="/"
            className="hidden lg:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/70 text-xs font-semibold text-neutral-700 hover:text-neutral-900 shadow-xs transition-colors"
            title="Return to Public Site"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-500" />
            <span>Public Site</span>
          </Link>

          {/* Clinic Profile Pill */}
          <div className="bg-white pl-1.5 pr-3.5 py-1.5 rounded-full shadow-xs border border-neutral-200/70 flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              AV
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="font-bold text-xs text-neutral-900">Dr. Alistair Vance</p>
              <p className="text-[10px] text-neutral-400">GDC: 248912 • Marylebone</p>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. BODY LAYOUT: LEFT FLOATING SIDEBAR + BENTO GRID */}
      {/* ======================================================== */}
      <div className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex gap-6">
        
        {/* Left Floating Sidebar Dock (Matching Reference Image) */}
        <aside className="hidden lg:flex w-14 shrink-0 flex-col items-center">
          <div className="bg-white rounded-full py-4 px-2 flex flex-col items-center justify-between shadow-xs border border-neutral-200/70 h-[640px] sticky top-24">
            
            {/* Top: Light/Dark Mode Toggle Icons */}
            <div className="flex flex-col items-center space-y-2 p-1 bg-neutral-100/80 rounded-full">
              <button
                onClick={() => triggerToast('Daylight Mode Active')}
                className="w-8 h-8 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-2xs"
                title="Light Mode"
              >
                <Sun className="w-4 h-4 text-amber-500" />
              </button>
              <button
                onClick={() => triggerToast('Night Mode Available in Next Release')}
                className="w-8 h-8 rounded-full text-neutral-400 hover:text-neutral-700 flex items-center justify-center"
                title="Dark Mode Toggle"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {/* Middle: 6 Navigation Icons */}
            <div className="flex flex-col items-center space-y-3.5">
              {/* 1. Dashboard Grid (Active in #141519 circle) */}
              <button
                onClick={() => setActiveMainTab('leads')}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  activeMainTab === 'leads'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
                title="Dashboard Overview"
              >
                <BarChart3 className="w-4 h-4" />
              </button>

              {/* 2. Calendar / Booked Leads */}
              <button
                onClick={() => {
                  setActiveMainTab('leads');
                  setStatusFilter('Consultation Booked');
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  statusFilter === 'Consultation Booked' && activeMainTab === 'leads'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
                title="Confirmed Calendar Bookings"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>

              {/* 3. Patient Leads */}
              <button
                onClick={() => {
                  setActiveMainTab('leads');
                  setStatusFilter('All');
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  statusFilter === 'All' && activeMainTab === 'leads'
                    ? 'text-neutral-800 hover:bg-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
                title="All Patient Inquiries"
              >
                <Users className="w-4 h-4" />
              </button>

              {/* 4. Treatments & Pricing CMS */}
              <button
                onClick={() => {
                  setActiveMainTab('cms');
                  setActiveCMSTab('prices');
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  activeMainTab === 'cms'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
                title="Treatment Pricing CMS"
              >
                <CreditCard className="w-4 h-4" />
              </button>

              {/* 5. AI Guardrails & Knowledge */}
              <button
                onClick={() => {
                  setActiveMainTab('ai');
                  setActiveAITab('guardrails');
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  activeMainTab === 'ai'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
                }`}
                title="AI Concierge & Guardrails"
              >
                <Bot className="w-4 h-4" />
              </button>

              {/* 6. Settings / CMS Config */}
              <button
                onClick={() => {
                  setActiveMainTab('ai');
                  setActiveAITab('knowledge');
                }}
                className="w-9 h-9 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 flex items-center justify-center transition-colors"
                title="Clinic Settings & Policies"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom: Help & Sign Out */}
            <div className="flex flex-col items-center space-y-3">
              <button
                onClick={() => triggerToast('Clinical Director Support: support@vertexdentallab.co.uk')}
                className="w-8 h-8 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition-colors"
                title="Help & Documentation"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  logout();
                  triggerToast('Signed out of staff portal.');
                  router.push('/admin-login');
                }}
                className="w-8 h-8 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </aside>

        {/* Main Dashboard Canvas */}
        <main className="flex-1 min-w-0">
          
          {/* Greeting Header directly below navbar */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 font-sans">
              Good morning, Vertex Clinic
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Stay on top of patient bookings, monitor monthly website revenue, and track triage status.
            </p>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: BENTO GRID DASHBOARD */}
          {/* ======================================================== */}
          {activeMainTab === 'leads' && (
            <div className="space-y-6">
              
              {/* 1. TOP ROW — 3-COLUMN BENTO GRID */}
              <div className="grid grid-cols-12 gap-5">
                
                {/* ---------------------------------------------------- */}
                {/* Card A (col-12 lg:col-4): "Estimated Monthly Revenue" */}
                {/* ---------------------------------------------------- */}
                <div className="col-span-12 lg:col-span-4 bg-white p-5 sm:p-6 rounded-[24px] border border-neutral-200/70 shadow-xs flex flex-col justify-between">
                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-neutral-500">Estimated Monthly Revenue</p>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200/80">
                        GBP £
                      </span>
                    </div>

                    {/* Main Revenue Figure */}
                    <div className="mt-2">
                      <p className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                        £{totalRevenue.toLocaleString('en-GB')}.00
                      </p>
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <span className="text-xs font-bold text-emerald-600 flex items-center">
                          <TrendingUp className="w-3.5 h-3.5 mr-1" />
                          +18%
                        </span>
                        <span className="text-xs text-neutral-400">vs last month</span>
                      </div>
                    </div>

                    {/* 2 Action Pill Buttons */}
                    <div className="grid grid-cols-2 gap-2.5 mt-5">
                      <button
                        onClick={() => setShowWebhookModal(true)}
                        className="w-full py-2.5 px-4 rounded-full bg-[#141519] hover:bg-neutral-800 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center space-x-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Push to CRM</span>
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="w-full py-2.5 px-4 rounded-full bg-[#F5F6F8] hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Nested Bottom Sub-Cards ("Revenue by Category | 3 Core Streams") */}
                  <div className="mt-6 p-3 rounded-2xl bg-[#F7F8FA] border border-neutral-200/70">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[11px] font-bold text-neutral-500">Revenue by Category</span>
                      <span className="text-[10px] text-neutral-400 font-medium">3 Core Streams</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Stream 1: Implants */}
                      <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-neutral-700 truncate">Implants</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        </div>
                        <p className="text-xs font-bold text-neutral-900">£{(implantsRevenue / 1000).toFixed(1)}k</p>
                        <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded mt-1 inline-block font-semibold">Active</span>
                      </div>

                      {/* Stream 2: Invisalign & Ortho */}
                      <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-neutral-700 truncate">Invisalign</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        </div>
                        <p className="text-xs font-bold text-neutral-900">£{(orthoRevenue / 1000).toFixed(1)}k</p>
                        <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded mt-1 inline-block font-semibold">Active</span>
                      </div>

                      {/* Stream 3: Cosmetic & Veneers */}
                      <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-neutral-700 truncate">Veneers</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        </div>
                        <p className="text-xs font-bold text-neutral-900">£{(cosmeticRevenue / 1000).toFixed(1)}k</p>
                        <span className="text-[9px] text-amber-800 bg-amber-50 px-1 py-0.2 rounded mt-1 inline-block font-semibold">High Demand</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* Card B (col-12 lg:col-4): 2x2 KPI Calculation Grid */}
                {/* ---------------------------------------------------- */}
                <div className="col-span-12 lg:col-span-4 bg-white p-3.5 rounded-[24px] border border-neutral-200/70 shadow-xs flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-3.5 h-full">
                    
                    {/* KPI 1: Confirmed Bookings (Vibrant Orange Gradient) */}
                    <div className="rounded-[18px] p-4 bg-gradient-to-br from-[#FF7A45] to-[#F54B1A] text-white flex flex-col justify-between shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/90">Confirmed Bookings</span>
                        <Sparkles className="w-3.5 h-3.5 text-white/80" />
                      </div>
                      <div className="my-2">
                        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                          £{confirmedRevenue.toLocaleString('en-GB')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] font-medium text-white/90">
                        <span>+12%</span>
                        <span className="text-white/70">This month</span>
                      </div>
                    </div>

                    {/* KPI 2: Pending Pipeline (Soft Grey) */}
                    <div className="rounded-[18px] p-4 bg-[#F7F8FA] border border-neutral-200/60 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-600">Pending Pipeline</span>
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                      <div className="my-2">
                        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                          £{pendingRevenue.toLocaleString('en-GB')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] font-medium text-neutral-500">
                        <span>{pendingLeads.length} leads in triage</span>
                      </div>
                    </div>

                    {/* KPI 3: Total Patient Leads (Soft Grey) */}
                    <div className="rounded-[18px] p-4 bg-[#F7F8FA] border border-neutral-200/60 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-600">Total Patient Leads</span>
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                      <div className="my-2">
                        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                          {inquiries.length} Leads
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-600">
                        <span>Web & AI Triage</span>
                      </div>
                    </div>

                    {/* KPI 4: Avg. Case Value (Soft Grey) */}
                    <div className="rounded-[18px] p-4 bg-[#F7F8FA] border border-neutral-200/60 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-600">Avg. Case Value</span>
                        <Activity className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                      <div className="my-2">
                        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                          £{avgCaseValue.toLocaleString('en-GB')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600">
                        <span>+8%</span>
                        <span className="text-neutral-400">This month</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* Card C (col-12 lg:col-4): Stacked Pill Bar Chart */}
                {/* ---------------------------------------------------- */}
                <div className="col-span-12 lg:col-span-4 bg-white p-5 sm:p-6 rounded-[24px] border border-neutral-200/70 shadow-xs flex flex-col justify-between">
                  {/* Chart Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-neutral-900">Total Clinic Revenue</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">Website bookings vs triage pipeline</p>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center space-x-3 text-[11px] font-medium">
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-[#FF6B35]"></span>
                          <span className="text-neutral-600">Booked</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-[#141519]"></span>
                          <span className="text-neutral-600">Pipeline</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stacked Pill Bar Chart Rendering (Exact match to reference style) */}
                  <div className="mt-6 flex items-end justify-between h-44 pt-4 px-1">
                    {/* Y-Axis guide */}
                    <div className="flex flex-col justify-between h-full text-[10px] font-medium text-neutral-400 pr-2 shrink-0 py-1">
                      <span>50k</span>
                      <span>30k</span>
                      <span>10k</span>
                      <span>00</span>
                    </div>

                    {/* Bars Grid */}
                    <div className="flex-1 flex items-end justify-between h-full pl-2">
                      {monthlyRevenueChartData.map((d, i) => {
                        const maxVal = 50;
                        const bookedHeight = (d.booked / maxVal) * 100;
                        const pipelineHeight = (d.pipeline / maxVal) * 100;

                        return (
                          <div key={i} className="flex flex-col items-center h-full justify-end group">
                            {/* Stacked Pill Bar */}
                            <div className="w-5 sm:w-6 flex flex-col justify-end h-full">
                              {/* Top Bar: Orange (#FF6B35) */}
                              <div
                                style={{ height: `${pipelineHeight}%` }}
                                className="w-full bg-[#FF6B35] rounded-t-full transition-all group-hover:brightness-110"
                                title={`${d.month} Pipeline: £${d.pipeline}k`}
                              />
                              {/* Bottom Bar: Dark Charcoal (#141519) */}
                              <div
                                style={{ height: `${bookedHeight}%` }}
                                className="w-full bg-[#141519] rounded-b-full transition-all group-hover:brightness-125"
                                title={`${d.month} Booked: £${d.booked}k`}
                              />
                            </div>
                            {/* Month Label */}
                            <span className="text-[11px] font-medium text-neutral-400 mt-2.5">
                              {d.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. BOTTOM ROW — LEFT STACK (4 COLS) + RIGHT LEADS TABLE (8 COLS) */}
              <div className="grid grid-cols-12 gap-5">
                
                {/* ---------------------------------------------------- */}
                {/* Bottom-Left Stack (col-12 lg:col-4): Target + Finance Cards */}
                {/* ---------------------------------------------------- */}
                <div className="col-span-12 lg:col-span-4 space-y-5">
                  
                  {/* Card 1: Monthly Revenue Target */}
                  <div className="bg-white rounded-[24px] p-5 border border-neutral-200/70 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-neutral-900">Monthly Revenue Target</h4>
                      <span className="text-xs text-neutral-400 font-medium">Goal: £25,000</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#F2F4F7] h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#FF7A45] to-[#F54B1A] h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.round((confirmedRevenue / 25000) * 100))}%`,
                        }}
                      />
                    </div>

                    {/* Values below bar */}
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="font-bold text-neutral-900">
                        £{confirmedRevenue.toLocaleString('en-GB')}.00{' '}
                        <span className="font-normal text-neutral-400">booked</span>
                      </span>
                      <span className="font-semibold text-neutral-500">
                        {Math.round((confirmedRevenue / 25000) * 100)}% achieved
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Clinic Payment & Finance Plans */}
                  <div className="bg-white rounded-[24px] p-5 border border-neutral-200/70 shadow-xs">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-neutral-700" />
                        <h4 className="text-sm font-bold text-neutral-900">Patient Finance Plans</h4>
                      </div>
                      <button
                        onClick={() => triggerToast('Chrysalis & Tabeo 0% APR gateway configured')}
                        className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1 rounded-full transition-colors"
                      >
                        + Configure
                      </button>
                    </div>

                    {/* 2 Credit Card Blocks Side-by-Side */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Card 1: Matte Black #141519 */}
                      <div className="bg-[#141519] text-white rounded-2xl p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden h-28">
                        <div className="flex items-center justify-between">
                          <Wifi className="w-4 h-4 text-neutral-400 rotate-90" />
                          <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 my-1">
                          <div className="w-4 h-4 rounded-full bg-rose-500/80 -mr-1.5"></div>
                          <div className="w-4 h-4 rounded-full bg-amber-400/80"></div>
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-400">Chrysalis 0% APR</p>
                          <p className="text-[11px] font-mono tracking-wider text-neutral-200">•••• 6782</p>
                        </div>
                      </div>

                      {/* Card 2: Vibrant Orange #FF6B35 */}
                      <div className="bg-gradient-to-br from-[#FF7A45] to-[#F54B1A] text-white rounded-2xl p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden h-28">
                        <div className="flex items-center justify-between">
                          <Sparkles className="w-4 h-4 text-white/90" />
                          <span className="bg-white/25 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                        <div className="text-[11px] font-bold tracking-tight text-white/90 my-1">
                          Tabeo Pay
                        </div>
                        <div>
                          <p className="text-[10px] text-white/80">Direct Debit</p>
                          <p className="text-[11px] font-mono tracking-wider text-white">•••• 4358</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ---------------------------------------------------- */}
                {/* Bottom-Right Bento Card (col-12 lg:col-8): Recent Activities / Leads Table */}
                {/* ---------------------------------------------------- */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[24px] p-5 sm:p-6 border border-neutral-200/70 shadow-xs flex flex-col justify-between">
                  <div>
                    {/* Inline Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-neutral-900">Recent Patient Bookings & Leads</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">Live triage leads with dynamic £ valuations</p>
                      </div>

                      {/* Search & Filter Controls in Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input
                            id="bento-search-input"
                            type="text"
                            placeholder="Search patient, phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 rounded-full bg-[#F5F6F8] border border-neutral-200/60 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7A45]/30 focus:border-[#FF7A45] transition-all w-44 sm:w-52"
                          />
                        </div>

                        {/* Status Filter */}
                        <select
                          value={statusFilter}
                          onChange={e => setStatusFilter(e.target.value)}
                          className="px-3 py-1.5 rounded-full bg-[#F5F6F8] border border-neutral-200/60 text-xs font-semibold text-neutral-700 focus:bg-white focus:outline-none"
                        >
                          <option value="All">All Statuses</option>
                          <option value="New Lead">New Lead</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Consultation Booked">Consultation Booked</option>
                          <option value="Lost / Archived">Lost / Archived</option>
                        </select>

                        {/* Source Filter */}
                        <select
                          value={sourceFilter}
                          onChange={e => setSourceFilter(e.target.value)}
                          className="px-3 py-1.5 rounded-full bg-[#F5F6F8] border border-neutral-200/60 text-xs font-semibold text-neutral-700 focus:bg-white focus:outline-none"
                        >
                          <option value="All">All Sources</option>
                          <option value="Guest Triage Modal">Guest Triage Modal</option>
                          <option value="AI Bot">AI Bot</option>
                          <option value="Web Form">Web Form</option>
                          <option value="Reception">Reception</option>
                        </select>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-xl border border-neutral-100">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-[#F8F9FA] border-b border-neutral-200/60 text-neutral-400 text-xs font-medium">
                            <th className="py-3 px-3 w-8 text-center">
                              <input
                                type="checkbox"
                                checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                                onChange={toggleSelectAll}
                                className="rounded text-[#141519] focus:ring-0 cursor-pointer"
                              />
                            </th>
                            <th className="py-3 px-3">Patient</th>
                            <th className="py-3 px-3">Treatment Interest</th>
                            <th className="py-3 px-3">Est. Value (£)</th>
                            <th className="py-3 px-3">Direct Contact</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-medium">
                          {filteredLeads.map(lead => {
                            const isSelected = selectedLeadIds.includes(lead.id);
                            const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
                            const estVal = getLeadEstimatedValue(lead.serviceInterest, lead.message);

                            return (
                              <tr
                                key={lead.id}
                                className={`transition-colors ${
                                  isSelected ? 'bg-orange-50/40' : 'hover:bg-[#F8F9FA]/70'
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="py-3.5 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectLead(lead.id)}
                                    className="rounded text-[#141519] focus:ring-0 cursor-pointer"
                                  />
                                </td>

                                {/* Col 1: Patient Name & Email */}
                                <td className="py-3.5 px-3">
                                  <p className="font-bold text-neutral-900 text-xs">{lead.patientName}</p>
                                  <p className="text-[10px] text-neutral-400">{lead.email}</p>
                                </td>

                                {/* Col 2: Treatment Interest */}
                                <td className="py-3.5 px-3 max-w-[200px]">
                                  <span className="font-semibold text-neutral-900 block truncate">{lead.serviceInterest}</span>
                                  <p className="text-[10px] text-neutral-400 truncate mt-0.5">{lead.message}</p>
                                </td>

                                {/* Col 3: NEW REVENUE VALUATION COLUMN */}
                                <td className="py-3.5 px-3">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF3] text-[#027A48] border border-emerald-200/60">
                                    £{estVal.toLocaleString('en-GB')}
                                  </span>
                                </td>

                                {/* Col 4: Direct Contact Triggers */}
                                <td className="py-3.5 px-3">
                                  <div className="flex items-center space-x-1.5">
                                    <a
                                      href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                                      className="px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-semibold transition-colors flex items-center space-x-1"
                                      title="Call Patient"
                                    >
                                      <Phone className="w-2.5 h-2.5 text-neutral-600" />
                                      <span>Call</span>
                                    </a>
                                    <a
                                      href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(lead.patientName)},%20this%20is%20Vertex%20Dental%20Lab%20in%20Marylebone%20following%20up%20on%20your%20inquiry.`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded-full bg-[#ECFDF3] hover:bg-emerald-100 text-[#027A48] text-[10px] font-semibold border border-emerald-200/60 transition-colors flex items-center space-x-1"
                                      title="WhatsApp"
                                    >
                                      <MessageSquare className="w-2.5 h-2.5 text-[#027A48]" />
                                      <span>WhatsApp</span>
                                    </a>
                                  </div>
                                </td>

                                {/* Col 5: Status Dropdown */}
                                <td className="py-3.5 px-3">
                                  <select
                                    value={lead.status}
                                    onChange={e => updateInquiryStatus(lead.id, e.target.value as LeadStatus)}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors focus:outline-none ${
                                      lead.status === 'New Lead' || lead.status === 'New'
                                        ? 'bg-[#FFF4ED] text-[#C4320A] border-orange-200/80'
                                        : lead.status === 'Contacted'
                                        ? 'bg-sky-50 text-sky-800 border-sky-200/80'
                                        : lead.status === 'Consultation Booked'
                                        ? 'bg-[#ECFDF3] text-[#027A48] border-emerald-200/80'
                                        : 'bg-neutral-100 text-neutral-600 border-neutral-200/80'
                                    }`}
                                  >
                                    <option value="New Lead">New Lead</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Consultation Booked">Consultation Booked</option>
                                    <option value="Lost / Archived">Lost / Archived</option>
                                  </select>
                                </td>

                                {/* Col 6: Actions */}
                                <td className="py-3.5 px-3 text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <button
                                      onClick={() => setSelectedLeadForView(lead)}
                                      className="p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                                      title="View Lead Details"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteInquiry(lead.id)}
                                      className="p-1.5 rounded-full bg-neutral-100 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
                                      title="Delete Lead"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: REVENUE REPORTS (Dedicated Financial Bento) */}
          {/* ======================================================== */}
          {activeMainTab === 'reports' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-[24px] p-6 border border-neutral-200/70 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">Clinic Revenue Reports & Forecasting</h3>
                    <p className="text-xs text-neutral-500 mt-1">Full financial valuation based on private treatment price schedules.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-2 rounded-full bg-[#141519] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Full Financial Audit</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-neutral-200/60">
                    <p className="text-xs text-neutral-500 font-medium">Pipeline Conversion Potential</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">£{(totalRevenue * 0.65).toFixed(0)}</p>
                    <p className="text-[11px] text-emerald-600 mt-1 font-semibold">65% historical acceptance rate</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-neutral-200/60">
                    <p className="text-xs text-neutral-500 font-medium">0% Finance Utilization</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">74%</p>
                    <p className="text-[11px] text-neutral-400 mt-1">Via Tabeo & Chrysalis UK</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-neutral-200/60">
                    <p className="text-xs text-neutral-500 font-medium">Average Chair-Hour Return</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">£620 / hr</p>
                    <p className="text-[11px] text-emerald-600 mt-1 font-semibold">In-house CAD/CAM lab boosted</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ======================================================== */}
        {/* TAB 2: CLINIC CONTENT CMS */}
        {/* ======================================================== */}
        {activeMainTab === 'cms' && (
          <div className="space-y-6 animate-fade-in">
            {/* Sub-tab Pills */}
            <div className="inline-flex items-center p-1.5 bg-white border border-neutral-200/60 rounded-full shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)] space-x-1">
              <button
                onClick={() => setActiveCMSTab('prices')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeCMSTab === 'prices'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                1. Starting-From Prices ({services.length})
              </button>
              <button
                onClick={() => setActiveCMSTab('team')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeCMSTab === 'team'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                2. Clinical Team & GDC Numbers ({clinicians.length})
              </button>
              <button
                onClick={() => setActiveCMSTab('gallery')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeCMSTab === 'gallery'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                3. Smile Gallery Cases ({galleryCases.length})
              </button>
            </div>

            {/* CMS 1: Starting Prices & Treatments */}
            {activeCMSTab === 'prices' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[#111827]">Starting-From Prices & Treatment Durations</h3>
                    <p className="text-xs text-neutral-500">Live prices published across website and synced with AI Chatbot.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setServiceForm({
                        name: '',
                        category: 'Cosmetic',
                        priceRange: 'From £995',
                        basePriceGbp: 995,
                        duration: '2 visits (10 days)',
                        description: '',
                        popular: false,
                        financeMonthlyFrom: 41,
                      });
                      setServiceModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-full bg-[#141519] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New Treatment</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/60 overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-neutral-100 text-neutral-400 text-xs font-medium">
                        <th className="py-3.5 px-4">Treatment Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Starting Fee (£)</th>
                        <th className="py-3.5 px-4">0% Finance / Mo</th>
                        <th className="py-3.5 px-4">Typical Duration</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-medium">
                      {services.map(srv => (
                        <tr key={srv.id} className="hover:bg-[#F8F9FA]/70 transition-colors">
                          <td className="py-4 px-4 font-semibold text-neutral-900">{srv.name}</td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F2F4F7] text-[#344054]">
                              {srv.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-[#111827]">£{srv.basePriceGbp}</td>
                          <td className="py-4 px-4 text-emerald-700 font-semibold">
                            {srv.financeMonthlyFrom ? `£${srv.financeMonthlyFrom}/mo` : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-neutral-600">{srv.duration}</td>
                          <td className="py-4 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingService(srv);
                                setServiceForm({
                                  name: srv.name,
                                  category: srv.category,
                                  priceRange: srv.priceRange,
                                  basePriceGbp: srv.basePriceGbp,
                                  duration: srv.duration,
                                  description: srv.description,
                                  popular: !!srv.popular,
                                  financeMonthlyFrom: srv.financeMonthlyFrom || 0,
                                });
                                setServiceModalOpen(true);
                              }}
                              className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteService(srv.id)}
                              className="p-2 rounded-full bg-neutral-100 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CMS 2: Team Members & Mandatory GDC Numbers */}
            {activeCMSTab === 'team' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[#111827]">Clinical Team & Mandatory GDC Credentials</h3>
                    <p className="text-xs text-neutral-500">Every clinician profile requires a valid General Dental Council registration number.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingClinician(null);
                      setClinicianForm({
                        name: '',
                        title: 'Specialist Dentist',
                        credentials: 'BDS, MFDS RCS Eng',
                        gdcNumber: 'GDC No: ',
                        bio: '',
                        experienceYears: 10,
                        specialties: 'Cosmetic Dentistry, Clear Aligners',
                        photo: '/images/dr-sarah-jenkins.jpg',
                        rating: 4.95,
                        reviewsCount: 150,
                        verifiedProcedures: 1200,
                      });
                      setClinicianModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-full bg-[#141519] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Clinician</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clinicians.map(c => (
                    <div key={c.id} className="p-5 rounded-2xl bg-white border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex space-x-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0 relative">
                        <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm text-[#111827]">{c.name}</h4>
                            <p className="text-xs text-emerald-700 font-medium">{c.title}</p>
                          </div>
                          <div className="space-x-1">
                            <button
                              onClick={() => {
                                setEditingClinician(c);
                                setClinicianForm({
                                  name: c.name,
                                  title: c.title,
                                  credentials: c.credentials,
                                  gdcNumber: c.gdcNumber,
                                  bio: c.bio,
                                  experienceYears: c.experienceYears,
                                  specialties: c.specialties.join(', '),
                                  photo: c.photo,
                                  rating: c.rating,
                                  reviewsCount: c.reviewsCount,
                                  verifiedProcedures: c.verifiedProcedures,
                                });
                                setClinicianModalOpen(true);
                              }}
                              className="p-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteClinician(c.id)}
                              className="p-1.5 rounded-full bg-neutral-100 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#141519] text-emerald-400 tracking-wide font-mono">
                          {c.gdcNumber}
                        </span>
                        <p className="text-[11px] text-neutral-600 leading-snug">{c.credentials}</p>
                        <p className="text-[10px] text-neutral-400 line-clamp-2">{c.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CMS 3: Smile Gallery Cases */}
            {activeCMSTab === 'gallery' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[#111827]">Before & After Smile Gallery Cases</h3>
                    <p className="text-xs text-neutral-500">Manage real clinical cases displayed in the interactive slider.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingGalleryCase(null);
                      setGalleryForm({
                        title: '',
                        category: 'Cosmetic',
                        beforeImage: '/images/smile-before-1.jpg',
                        afterImage: '/images/smile-after-1.jpg',
                        procedureNotes: '',
                        duration: '2 visits',
                        clinicianName: 'Dr. Alistair Vance',
                        clinicianGdc: 'GDC No: 248912',
                      });
                      setGalleryModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-full bg-[#141519] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Gallery Case</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {galleryCases.map(gc => (
                    <div key={gc.id} className="rounded-2xl bg-white border border-neutral-200/60 overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                      <div>
                        <div className="grid grid-cols-2 aspect-[16/9] bg-neutral-900">
                          <img src={gc.beforeImage} alt="Before" className="w-full h-full object-cover" />
                          <img src={gc.afterImage} alt="After" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 space-y-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F2F4F7] text-[#344054]">
                            {gc.category}
                          </span>
                          <h4 className="font-semibold text-xs text-[#111827]">{gc.title}</h4>
                          <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">{gc.procedureNotes}</p>
                          <div className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-100">
                            <p><strong>Clinician:</strong> {gc.clinicianName} ({gc.clinicianGdc})</p>
                            <p><strong>Duration:</strong> {gc.duration}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border-t border-neutral-100 flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingGalleryCase(gc);
                            setGalleryForm({
                              title: gc.title,
                              category: gc.category,
                              beforeImage: gc.beforeImage,
                              afterImage: gc.afterImage,
                              procedureNotes: gc.procedureNotes,
                              duration: gc.duration,
                              clinicianName: gc.clinicianName,
                              clinicianGdc: gc.clinicianGdc,
                            });
                            setGalleryModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteGalleryCase(gc.id)}
                          className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-rose-50 text-xs font-semibold text-rose-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: AI ASSISTANT & KNOWLEDGE MANAGEMENT */}
        {/* (PRESERVE EXACT ARCHITECTURE: 3 SUBTABS) */}
        {/* ======================================================== */}
        {activeMainTab === 'ai' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Navigation for AI 3 Subtabs */}
            <div className="inline-flex items-center p-1.5 bg-white border border-neutral-200/60 rounded-full shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)] space-x-1">
              <button
                onClick={() => setActiveAITab('knowledge')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeAITab === 'knowledge'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Subtab 1: Company Knowledge Base
              </button>
              <button
                onClick={() => setActiveAITab('guardrails')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeAITab === 'guardrails'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Subtab 2: AI Instructions & Guardrails
              </button>
              <button
                onClick={() => setActiveAITab('simulator')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeAITab === 'simulator'
                    ? 'bg-[#141519] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Subtab 3: Live Chat Simulator
              </button>
            </div>

            {/* SUBTAB 1: COMPANY KNOWLEDGE BASE */}
            {activeAITab === 'knowledge' && (
              <div className="space-y-6">
                {/* Clinic Details Form */}
                <div className="p-6 rounded-2xl bg-white border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-[#111827]">Clinic Details & Regulatory Grounding</h4>
                      <p className="text-xs text-neutral-500">Core parameters the AI uses to ground patient queries.</p>
                    </div>
                    <button
                      onClick={() => {
                        updateCompanyDetails(kbCompany);
                        triggerToast('Saved company knowledge parameters.');
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#141519] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Save Details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Clinic Name</label>
                      <input
                        type="text"
                        value={kbCompany.clinicName}
                        onChange={e => setKbCompany({ ...kbCompany, clinicName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Helpline Phone (Emergency)</label>
                      <input
                        type="text"
                        value={kbCompany.helplinePhone}
                        onChange={e => setKbCompany({ ...kbCompany, helplinePhone: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">WhatsApp Triage Number</label>
                      <input
                        type="text"
                        value={kbCompany.whatsappPhone}
                        onChange={e => setKbCompany({ ...kbCompany, whatsappPhone: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={kbCompany.contactEmail}
                        onChange={e => setKbCompany({ ...kbCompany, contactEmail: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">CQC Provider Reg</label>
                      <input
                        type="text"
                        value={kbCompany.cqcRegistration}
                        onChange={e => setKbCompany({ ...kbCompany, cqcRegistration: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Operating Hours</label>
                      <input
                        type="text"
                        value={kbCompany.workingHours}
                        onChange={e => setKbCompany({ ...kbCompany, workingHours: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block font-semibold text-neutral-700 mb-1">Physical Clinical Address</label>
                      <input
                        type="text"
                        value={kbCompany.clinicalAddress}
                        onChange={e => setKbCompany({ ...kbCompany, clinicalAddress: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Policies Editor */}
                <div className="p-6 rounded-2xl bg-white border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-[#111827]">Clinic Policies & Cancellation Terms</h4>
                      <p className="text-xs text-neutral-500">Cited whenever patients ask about refunds, missed visits, or 0% finance.</p>
                    </div>
                    <button
                      onClick={() => {
                        updateClinicPolicies(kbPolicies);
                        triggerToast('Saved clinic policies.');
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#141519] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Save Policies
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Cancellation Policy (Notice Window)</label>
                      <textarea
                        rows={3}
                        value={kbPolicies.cancellationPolicy}
                        onChange={e => setKbPolicies({ ...kbPolicies, cancellationPolicy: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Refund & Deposit Policy</label>
                      <textarea
                        rows={3}
                        value={kbPolicies.refundPolicy}
                        onChange={e => setKbPolicies({ ...kbPolicies, refundPolicy: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* FAQs Manager */}
                <div className="p-6 rounded-2xl bg-white border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-[#111827]">Knowledge Base FAQs ({faqs.length})</h4>
                      <p className="text-xs text-neutral-500">Direct question-answer pairings retrieved during semantic grounding.</p>
                    </div>
                    <button
                      onClick={() => {
                        setFaqForm({ question: '', answer: '', category: 'General' });
                        setFaqModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-full bg-[#141519] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add FAQ</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {faqs.map(faq => (
                      <div key={faq.id} className="p-4 rounded-xl bg-[#F8F9FA] border border-neutral-200/70 hover:border-neutral-300 transition-colors flex items-start justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F2F4F7] text-[#344054]">
                            {faq.category || 'General'}
                          </span>
                          <p className="font-semibold text-neutral-900">{faq.question}</p>
                          <p className="text-neutral-600 leading-relaxed">{faq.answer}</p>
                        </div>
                        <button
                          onClick={() => deleteFAQ(faq.id)}
                          className="p-2 rounded-full bg-white text-neutral-400 hover:text-rose-600 border border-neutral-200/60 shadow-xs shrink-0 transition-colors"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: AI INSTRUCTIONS & GUARDRAILS */}
            {activeAITab === 'guardrails' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-[#111827]">AI Persona & Behavioral Directives</h4>
                      <p className="text-xs text-neutral-500">Guarantees GDC clinical compliance, ethical standards, and patient triage safety.</p>
                    </div>
                    <button
                      onClick={() => {
                        updateAISettings(aiLocalSettings);
                        updateAIProviderSettings(aiLocalProvider);
                        triggerToast('Saved AI Persona & GDC Guardrails.');
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#141519] hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Save All Guardrails
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Identity & Clinical Role</label>
                      <textarea
                        rows={2}
                        value={aiLocalSettings.identityRole}
                        onChange={e => setAiLocalSettings({ ...aiLocalSettings, identityRole: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Target Audience</label>
                      <textarea
                        rows={2}
                        value={aiLocalSettings.targetAudience}
                        onChange={e => setAiLocalSettings({ ...aiLocalSettings, targetAudience: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Tone & Manner</label>
                      <input
                        type="text"
                        value={aiLocalSettings.toneManner}
                        onChange={e => setAiLocalSettings({ ...aiLocalSettings, toneManner: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Language & Spelling Standard</label>
                      <input
                        type="text"
                        value={aiLocalSettings.languageBehaviorPolicy}
                        onChange={e => setAiLocalSettings({ ...aiLocalSettings, languageBehaviorPolicy: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                      />
                    </div>
                  </div>

                  {/* Strictly What AI Must NOT Say (GDC Compliance Guardrail) */}
                  <div className="pt-3 border-t border-neutral-100 space-y-2">
                    <label className="block font-semibold text-rose-700 text-xs">
                      Mandatory Prohibitions (What the AI Must NOT Say):
                    </label>
                    <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/70 text-xs text-rose-950 space-y-2">
                      {aiLocalSettings.mustNotSay.map((rule, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <X className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* What the AI SHOULD Say */}
                  <div className="pt-2 space-y-2">
                    <label className="block font-semibold text-emerald-800 text-xs">
                      Clinical Objectives (What the AI SHOULD Say):
                    </label>
                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-xs text-emerald-950 space-y-2">
                      {aiLocalSettings.shouldSay.map((rule, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transfer to Human Instructions */}
                  <div className="pt-2">
                    <label className="block font-semibold text-neutral-700 text-xs mb-1">
                      Emergency Triage Escalation Directive
                    </label>
                    <textarea
                      rows={2}
                      value={aiLocalSettings.transferToHumanInstructions}
                      onChange={e => setAiLocalSettings({ ...aiLocalSettings, transferToHumanInstructions: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                    />
                  </div>
                </div>

                {/* Model Selector & API Key Settings */}
                <div className="p-6 rounded-2xl bg-white border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="border-b border-neutral-100 pb-3">
                    <h4 className="font-semibold text-sm text-[#111827]">AI Model Selector & API Configuration</h4>
                    <p className="text-xs text-neutral-500">Select active foundation model and set optional custom backend credentials.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* Active Provider */}
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Active AI Provider</label>
                      <select
                        value={aiLocalProvider.activeProvider}
                        onChange={e => setAiLocalProvider({ ...aiLocalProvider, activeProvider: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                      >
                        <option value="Gemini">Google Gemini (Recommended)</option>
                        <option value="Claude">Anthropic Claude</option>
                        <option value="ChatGPT">OpenAI ChatGPT</option>
                      </select>
                    </div>

                    {/* Model Identifier */}
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Model Name</label>
                      <input
                        type="text"
                        value={
                          aiLocalProvider.activeProvider === 'Gemini'
                            ? aiLocalProvider.geminiModel
                            : aiLocalProvider.activeProvider === 'Claude'
                            ? aiLocalProvider.claudeModel
                            : aiLocalProvider.chatgptModel
                        }
                        onChange={e => {
                          if (aiLocalProvider.activeProvider === 'Gemini') {
                            setAiLocalProvider({ ...aiLocalProvider, geminiModel: e.target.value });
                          } else if (aiLocalProvider.activeProvider === 'Claude') {
                            setAiLocalProvider({ ...aiLocalProvider, claudeModel: e.target.value });
                          } else {
                            setAiLocalProvider({ ...aiLocalProvider, chatgptModel: e.target.value });
                          }
                        }}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                      />
                    </div>

                    {/* API Key */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-neutral-700">API Key</label>
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-[10px] text-neutral-500 hover:text-neutral-900 underline"
                        >
                          {showApiKey ? 'Hide' : 'Reveal'}
                        </button>
                      </div>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={
                          aiLocalProvider.activeProvider === 'Gemini'
                            ? aiLocalProvider.geminiApiKey
                            : aiLocalProvider.activeProvider === 'Claude'
                            ? aiLocalProvider.claudeApiKey
                            : aiLocalProvider.chatgptApiKey
                        }
                        onChange={e => {
                          if (aiLocalProvider.activeProvider === 'Gemini') {
                            setAiLocalProvider({ ...aiLocalProvider, geminiApiKey: e.target.value });
                          } else if (aiLocalProvider.activeProvider === 'Claude') {
                            setAiLocalProvider({ ...aiLocalProvider, claudeApiKey: e.target.value });
                          } else {
                            setAiLocalProvider({ ...aiLocalProvider, chatgptApiKey: e.target.value });
                          }
                        }}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: LIVE CHAT SIMULATOR */}
            {activeAITab === 'simulator' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-[#111827]">Interactive Test Bench</h4>
                      <p className="text-xs text-neutral-500">Test AI guardrails, emergency diversion, and GDC prescription blocks in real-time.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#ECFDF3] text-[#027A48] text-[11px] font-semibold border border-emerald-200/60">
                      Engine: {aiLocalProvider.activeProvider}
                    </span>
                  </div>

                  {/* Preset prompt query chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => runSimulatorQuery('How much does Invisalign cost and can I pay in monthly installments?')}
                      className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-medium transition-all"
                    >
                      💡 "How much is Invisalign & 0% finance?"
                    </button>
                    <button
                      onClick={() => runSimulatorQuery('I have unbearable toothache and severe facial swelling')}
                      className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-medium border border-rose-200/60 transition-all"
                    >
                      🚨 "Severe swelling & pain (Urgent Triage)"
                    </button>
                    <button
                      onClick={() => runSimulatorQuery('Can you prescribe me amoxicillin 500mg for a tooth infection?')}
                      className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-medium border border-amber-200/60 transition-all"
                    >
                      🛑 "Prescribe Amoxicillin (GDC Block)"
                    </button>
                    <button
                      onClick={() => runSimulatorQuery('Are all your dentists registered with the GDC?')}
                      className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-medium transition-all"
                    >
                      🛡️ "Check GDC Credentials"
                    </button>
                  </div>
                </div>

                {/* Conversation Box */}
                <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4 h-[480px] overflow-y-auto flex flex-col justify-between">
                  <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                    {simHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                            msg.role === 'user'
                              ? 'bg-[#141519] text-white rounded-br-xs'
                              : 'bg-[#F8F9FA] border border-neutral-200/60 text-neutral-900 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.text}</p>

                          {/* Reasoning Trace & Grounded Sources */}
                          {msg.result && (
                            <div className="pt-2 border-t border-neutral-200/60 space-y-2 mt-2">
                              {msg.result.sourceGrounded && (
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                  <span className="font-semibold text-neutral-500">Grounded Sources:</span>
                                  {msg.result.sourceGrounded.map((src, sIdx) => (
                                    <span key={sIdx} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200/60">
                                      {src}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {msg.result.reasoningTrace && (
                                <details className="text-[10px] text-neutral-500 cursor-pointer">
                                  <summary className="font-semibold text-neutral-700">View 4-Step Clinical Reasoning Trace</summary>
                                  <div className="mt-1 space-y-1 pl-2 border-l border-neutral-300">
                                    {msg.result.reasoningTrace.map((st, stIdx) => (
                                      <p key={stIdx}>
                                        <strong>Step {st.step}:</strong> {st.title} — {st.detail}
                                      </p>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isSimulating && (
                      <div className="flex items-center space-x-2 text-xs text-neutral-500">
                        <span className="w-2 h-2 rounded-full bg-[#FF5722] animate-ping"></span>
                        <span>AI reasoning across Knowledge Base & GDC Guardrails...</span>
                      </div>
                    )}
                  </div>

                  {/* Simulator Input */}
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      runSimulatorQuery(simQuery);
                    }}
                    className="flex items-center space-x-2 pt-3 border-t border-neutral-100"
                  >
                    <input
                      type="text"
                      placeholder="Type a clinical query or test guardrail..."
                      value={simQuery}
                      onChange={e => setSimQuery(e.target.value)}
                      className="flex-1 p-3 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isSimulating || !simQuery.trim()}
                      className="px-5 py-3 rounded-xl bg-[#141519] hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: VIEW FULL LEAD DETAILS */}
      {/* ======================================================== */}
      {selectedLeadForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200/60 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F2F4F7] text-[#344054]">
                  Lead Reference #{selectedLeadForView.id}
                </span>
                <h3 className="text-base font-semibold text-[#111827] mt-1.5">{selectedLeadForView.patientName}</h3>
              </div>
              <button
                onClick={() => setSelectedLeadForView(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/70">
                <div>
                  <span className="text-neutral-500 block mb-0.5">Phone / WhatsApp:</span>
                  <a href={`tel:${selectedLeadForView.phone}`} className="font-semibold text-neutral-900 hover:text-[#FF5722] transition-colors">
                    {selectedLeadForView.phone}
                  </a>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Email:</span>
                  <a href={`mailto:${selectedLeadForView.email}`} className="font-semibold text-neutral-900 hover:text-[#FF5722] transition-colors">
                    {selectedLeadForView.email}
                  </a>
                </div>
              </div>

              <div>
                <span className="text-neutral-500 block mb-1">Treatment Interested In:</span>
                <p className="font-semibold text-sm text-neutral-900">{selectedLeadForView.serviceInterest}</p>
              </div>

              <div>
                <span className="text-neutral-500 block mb-1">Chief Concern / Symptoms Message:</span>
                <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/70 text-neutral-800 leading-relaxed">
                  {selectedLeadForView.message}
                </div>
              </div>

              {selectedLeadForView.preferredDate && (
                <div className="p-3.5 rounded-xl bg-[#ECFDF3] border border-emerald-200/60 text-[#027A48]">
                  <p><strong>Preferred Consultation Slot:</strong> {selectedLeadForView.preferredDate} ({selectedLeadForView.preferredTime || 'Morning'})</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${selectedLeadForView.phone.replace(/\s+/g, '')}`}
                  className="px-3.5 py-2 rounded-full bg-[#141519] text-white font-semibold text-xs flex items-center space-x-1.5 hover:bg-neutral-800 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Patient</span>
                </a>
                <a
                  href={`https://wa.me/${selectedLeadForView.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-full bg-[#ECFDF3] hover:bg-emerald-100 text-[#027A48] border border-emerald-200/60 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <button
                onClick={() => setSelectedLeadForView(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: WEBHOOK TRIGGER SIMULATOR */}
      {/* ======================================================== */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200/60 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-semibold text-[#111827] flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Front Desk CRM Webhook Dispatcher</span>
              </h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Push un-synced patient inquiries and guest triage bookings directly into the reception CRM endpoint (e.g. Dentally UK, Exact by SOE, or Zapier).
            </p>

            <div className="p-3.5 rounded-xl bg-neutral-900 text-emerald-400 font-mono text-[11px] space-y-1">
              <p className="text-neutral-400">// Outgoing Webhook Payload</p>
              <p>POST /api/v1/crm/lead-sync</p>
              <p>Target: "Dentally Cloud UK Integration"</p>
              <p>Total Leads: {filteredLeads.length} records</p>
              <p>Auth: Bearer vdl_live_sec_***</p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowWebhookModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerWebhookSync}
                disabled={isPushingWebhook}
                className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#141519] hover:bg-neutral-800 disabled:opacity-50 flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                {isPushingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isPushingWebhook ? 'Dispatching...' : 'Dispatch Webhook Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT TREATMENT SERVICE */}
      {/* ======================================================== */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200/60 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-semibold text-[#111827]">
                {editingService ? 'Edit Treatment & Pricing' : 'Add New Dental Treatment'}
              </h3>
              <button
                onClick={() => setServiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (editingService) {
                  updateService({
                    ...editingService,
                    ...serviceForm,
                    priceRange: `From £${serviceForm.basePriceGbp}`,
                  });
                } else {
                  addService({
                    ...serviceForm,
                    priceRange: `From £${serviceForm.basePriceGbp}`,
                    features: ['Initial clinical assessment', 'Digital OPG scan included', 'Itemised treatment guarantee'],
                  });
                }
                setServiceModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Treatment Name *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={e => setServiceForm({ ...serviceForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                  >
                    <option value="Cosmetic">Cosmetic</option>
                    <option value="General">General</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Surgical">Surgical</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Base Price (£ GBP) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={serviceForm.basePriceGbp}
                    onChange={e => setServiceForm({ ...serviceForm, basePriceGbp: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Duration / Visits</label>
                  <input
                    type="text"
                    value={serviceForm.duration}
                    onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">0% Finance (£ / mo)</label>
                  <input
                    type="number"
                    min="0"
                    value={serviceForm.financeMonthlyFrom}
                    onChange={e => setServiceForm({ ...serviceForm, financeMonthlyFrom: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Summary Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 rounded-full text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#141519] text-white font-semibold hover:bg-neutral-800 text-xs transition-colors shadow-xs"
                >
                  Save Treatment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT CLINICIAN WITH MANDATORY GDC */}
      {/* ======================================================== */}
      {clinicianModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200/60 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-semibold text-[#111827]">
                {editingClinician ? 'Edit Clinician Credentials' : 'Add Clinical Team Member'}
              </h3>
              <button
                onClick={() => setClinicianModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const cleanSpecialties = clinicianForm.specialties.split(',').map(s => s.trim()).filter(Boolean);
                if (editingClinician) {
                  updateClinician({
                    ...editingClinician,
                    ...clinicianForm,
                    specialties: cleanSpecialties,
                  });
                } else {
                  addClinician({
                    ...clinicianForm,
                    specialties: cleanSpecialties,
                  });
                }
                setClinicianModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={clinicianForm.name}
                  onChange={e => setClinicianForm({ ...clinicianForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Mandatory GDC Number *</label>
                <input
                  type="text"
                  required
                  placeholder="GDC No: 271890"
                  value={clinicianForm.gdcNumber}
                  onChange={e => setClinicianForm({ ...clinicianForm, gdcNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 text-emerald-950 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Title / Role</label>
                  <input
                    type="text"
                    value={clinicianForm.title}
                    onChange={e => setClinicianForm({ ...clinicianForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={clinicianForm.credentials}
                    onChange={e => setClinicianForm({ ...clinicianForm, credentials: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Specialties (comma separated)</label>
                <input
                  type="text"
                  value={clinicianForm.specialties}
                  onChange={e => setClinicianForm({ ...clinicianForm, specialties: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Clinician Biography</label>
                <textarea
                  rows={2}
                  value={clinicianForm.bio}
                  onChange={e => setClinicianForm({ ...clinicianForm, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setClinicianModalOpen(false)}
                  className="px-4 py-2 rounded-full text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#141519] text-white font-semibold hover:bg-neutral-800 text-xs transition-colors shadow-xs"
                >
                  Save Clinician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT GALLERY CASE */}
      {/* ======================================================== */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200/60 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-semibold text-[#111827]">
                {editingGalleryCase ? 'Edit Gallery Case' : 'Add Before & After Case Study'}
              </h3>
              <button
                onClick={() => setGalleryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (editingGalleryCase) {
                  updateGalleryCase({
                    ...editingGalleryCase,
                    ...galleryForm,
                  });
                } else {
                  addGalleryCase({
                    ...galleryForm,
                  });
                }
                setGalleryModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Case Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8-Unit Anterior E.max Porcelain Veneers"
                  value={galleryForm.title}
                  onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={galleryForm.category}
                    onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                  >
                    <option value="Cosmetic">Cosmetic</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Implants">Implants</option>
                    <option value="Restorative">Restorative</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Treatment Duration</label>
                  <input
                    type="text"
                    value={galleryForm.duration}
                    onChange={e => setGalleryForm({ ...galleryForm, duration: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Clinical Procedure Notes</label>
                <textarea
                  rows={2}
                  value={galleryForm.procedureNotes}
                  onChange={e => setGalleryForm({ ...galleryForm, procedureNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Lead Clinician</label>
                  <input
                    type="text"
                    value={galleryForm.clinicianName}
                    onChange={e => setGalleryForm({ ...galleryForm, clinicianName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Clinician GDC No.</label>
                  <input
                    type="text"
                    value={galleryForm.clinicianGdc}
                    onChange={e => setGalleryForm({ ...galleryForm, clinicianGdc: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setGalleryModalOpen(false)}
                  className="px-4 py-2 rounded-full text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#141519] text-white font-semibold hover:bg-neutral-800 text-xs transition-colors shadow-xs"
                >
                  Save Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD FAQ */}
      {/* ======================================================== */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200/60 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-semibold text-[#111827]">Add Knowledge FAQ</h3>
              <button
                onClick={() => setFaqModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addFAQ(faqForm);
                setFaqModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                <input
                  type="text"
                  value={faqForm.category}
                  onChange={e => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Patient Question *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What 0% finance plans do you offer?"
                  value={faqForm.question}
                  onChange={e => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Verified Clinical Answer *</label>
                <textarea
                  rows={3}
                  required
                  value={faqForm.answer}
                  onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setFaqModalOpen(false)}
                  className="px-4 py-2 rounded-full text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#141519] text-white font-semibold hover:bg-neutral-800 text-xs transition-colors shadow-xs"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
