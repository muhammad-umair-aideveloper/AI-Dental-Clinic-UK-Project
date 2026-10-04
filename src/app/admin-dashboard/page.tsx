'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
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

  // Top Main Tabs
  type MainTab = 'leads' | 'cms' | 'ai';
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('leads');

  // Tab 1: Lead Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [selectedLeadForView, setSelectedLeadForView] = useState<WebInquiry | null>(null);

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
    const headers = ['Lead ID', 'Patient Name', 'Phone', 'Email', 'Service Interest', 'Source', 'Status', 'Date Received', 'Message'];
    const rows = filteredLeads.map(l => [
      `"${l.id}"`,
      `"${l.patientName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.serviceInterest.replace(/"/g, '""')}"`,
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

    triggerToast(`Exported ${filteredLeads.length} leads to CSV.`);
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-slate-800 shadow-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1 text-xs"
            title="Return to Public Site"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Public Site</span>
          </Link>

          <div className="flex items-center space-x-2">
            <span className="font-black text-base tracking-[0.2em] uppercase">VERTEX</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Marketing Lead Hub & CMS
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>GDC Reg: 248912 • Marylebone Central</span>
          </div>

          <button
            onClick={() => setShowWebhookModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Push to CRM</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Main 3-Tab Navigator */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto no-scrollbar">
            {/* TAB 1 */}
            <button
              onClick={() => setActiveMainTab('leads')}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                activeMainTab === 'leads'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>1. Lead & Triage Dashboard</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-emerald-300">
                {inquiries.length}
              </span>
            </button>

            {/* TAB 2 */}
            <button
              onClick={() => setActiveMainTab('cms')}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                activeMainTab === 'cms'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4 text-sky-400" />
              <span>2. Clinic Content CMS</span>
            </button>

            {/* TAB 3 */}
            <button
              onClick={() => setActiveMainTab('ai')}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                activeMainTab === 'ai'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>3. AI Assistant & Knowledge Base</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        
        {/* ======================================================== */}
        {/* TAB 1: LEAD & TRIAGE DASHBOARD */}
        {/* ======================================================== */}
        {activeMainTab === 'leads' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Patient Leads</p>
                <p className="text-2xl sm:text-3xl font-black text-[#0F172A] mt-1">{inquiries.length}</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">Web checkout & AI bot flow</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">New Leads Pending</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                  {inquiries.filter(i => i.status === 'New Lead' || i.status === 'New').length}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Awaiting coordinator call</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Consultations Booked</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                  {inquiries.filter(i => i.status === 'Consultation Booked').length}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Confirmed clinical diary slots</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contacted / In Triage</p>
                <p className="text-2xl sm:text-3xl font-black text-sky-600 mt-1">
                  {inquiries.filter(i => i.status === 'Contacted').length}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">WhatsApp & phone follow-up</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, phone, treatment..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Status Filter */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-semibold">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <option value="All">All Statuses</option>
                    <option value="New Lead">New Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Consultation Booked">Consultation Booked</option>
                    <option value="Lost / Archived">Lost / Archived</option>
                  </select>
                </div>

                {/* Source Filter */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-semibold">
                  <span>Source:</span>
                  <select
                    value={sourceFilter}
                    onChange={e => setSourceFilter(e.target.value)}
                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <option value="All">All Sources</option>
                    <option value="Guest Triage Modal">Guest Triage Modal</option>
                    <option value="AI Bot">AI Bot</option>
                    <option value="Web Form">Web Form</option>
                    <option value="Reception">Reception</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3.5 px-4">Patient Name & Contact</th>
                      <th className="py-3.5 px-4">Direct Contact Triggers</th>
                      <th className="py-3.5 px-4">Treatment Interest & Symptoms</th>
                      <th className="py-3.5 px-4">Source</th>
                      <th className="py-3.5 px-4">Date / Time</th>
                      <th className="py-3.5 px-4">Lead Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map(lead => {
                      const cleanPhone = lead.phone.replace(/[^0-9]/g, '');

                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Col 1: Patient Name & Email */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 text-sm">{lead.patientName}</p>
                            <p className="text-[11px] text-slate-500">{lead.email}</p>
                            <span className="text-[10px] text-slate-400">ID: #{lead.id}</span>
                          </td>

                          {/* Col 2: Direct Contact Triggers */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {/* Click-to-Call */}
                              <a
                                href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center space-x-1"
                                title="Click to Call"
                              >
                                <Phone className="w-3 h-3 text-slate-700" />
                                <span>Call</span>
                              </a>

                              {/* Click-to-WhatsApp */}
                              <a
                                href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(lead.patientName)},%20this%20is%20Vertex%20Dental%20Lab%20in%20Marylebone%20following%20up%20on%20your%20inquiry.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center space-x-1"
                                title="Open WhatsApp Chat"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                            <p className="text-[11px] text-slate-600 font-mono mt-1">{lead.phone}</p>
                          </td>

                          {/* Col 3: Treatment & Chief Concern */}
                          <td className="py-3 px-4 max-w-xs">
                            <span className="font-bold text-slate-900 block">{lead.serviceInterest}</span>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{lead.message}</p>
                            {lead.preferredDate && (
                              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                                Preferred: {lead.preferredDate} ({lead.preferredTime || 'Anytime'})
                              </span>
                            )}
                          </td>

                          {/* Col 4: Source */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                lead.source === 'Guest Triage Modal'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : lead.source === 'AI Bot'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}
                            >
                              {lead.source || 'Web Form'}
                            </span>
                          </td>

                          {/* Col 5: Date / Time */}
                          <td className="py-3 px-4 text-slate-600 text-[11px]">
                            <p className="font-semibold text-slate-800">
                              {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-slate-400">
                              {new Date(lead.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>

                          {/* Col 6: Status Dropdown */}
                          <td className="py-3 px-4">
                            <select
                              value={lead.status}
                              onChange={e => updateInquiryStatus(lead.id, e.target.value as LeadStatus)}
                              className={`text-xs font-bold p-1.5 rounded-xl border transition-colors ${
                                lead.status === 'New Lead' || lead.status === 'New'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : lead.status === 'Contacted'
                                  ? 'bg-sky-50 text-sky-900 border-sky-300'
                                  : lead.status === 'Consultation Booked'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <option value="New Lead">New Lead</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Consultation Booked">Consultation Booked</option>
                              <option value="Lost / Archived">Lost / Archived</option>
                            </select>
                          </td>

                          {/* Col 7: Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setSelectedLeadForView(lead)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="View Full Lead Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteInquiry(lead.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete Lead"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        )}

        {/* ======================================================== */}
        {/* TAB 2: CLINIC CONTENT CMS */}
        {/* ======================================================== */}
        {activeMainTab === 'cms' && (
          <div className="space-y-6 animate-fade-in">
            {/* Sub-tab Pills */}
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveCMSTab('prices')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCMSTab === 'prices'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                1. Starting-From Prices ({services.length})
              </button>
              <button
                onClick={() => setActiveCMSTab('team')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCMSTab === 'team'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                2. Clinical Team & GDC Numbers ({clinicians.length})
              </button>
              <button
                onClick={() => setActiveCMSTab('gallery')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCMSTab === 'gallery'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
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
                    <h3 className="text-lg font-black text-slate-900">Starting-From Prices & Treatment Durations</h3>
                    <p className="text-xs text-slate-500">Live prices published across website and synced with AI Chatbot.</p>
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
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New Treatment</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                        <th className="py-3 px-4">Treatment Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Starting Fee (£)</th>
                        <th className="py-3 px-4">0% Finance / Mo</th>
                        <th className="py-3 px-4">Typical Duration</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {services.map(srv => (
                        <tr key={srv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{srv.name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {srv.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-950">£{srv.basePriceGbp}</td>
                          <td className="py-3 px-4 text-emerald-700 font-bold">
                            {srv.financeMonthlyFrom ? `£${srv.financeMonthlyFrom}/mo` : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{srv.duration}</td>
                          <td className="py-3 px-4 text-right space-x-1">
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
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteService(srv.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600"
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
                    <h3 className="text-lg font-black text-slate-900">Clinical Team & Mandatory GDC Credentials</h3>
                    <p className="text-xs text-slate-500">Every clinician profile requires a valid General Dental Council registration number.</p>
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
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Clinician</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clinicians.map(c => (
                    <div key={c.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex space-x-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative">
                        <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                            <p className="text-xs text-emerald-700 font-semibold">{c.title}</p>
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
                              className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteClinician(c.id)}
                              className="p-1 rounded bg-slate-100 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F172A] text-emerald-400">
                          {c.gdcNumber}
                        </span>
                        <p className="text-[11px] text-slate-600 leading-snug">{c.credentials}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{c.bio}</p>
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
                    <h3 className="text-lg font-black text-slate-900">Before & After Smile Gallery Cases</h3>
                    <p className="text-xs text-slate-500">Manage real clinical cases displayed in the interactive slider.</p>
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
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Gallery Case</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {galleryCases.map(gc => (
                    <div key={gc.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="grid grid-cols-2 aspect-[16/9] bg-slate-900">
                          <img src={gc.beforeImage} alt="Before" className="w-full h-full object-cover" />
                          <img src={gc.afterImage} alt="After" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 space-y-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {gc.category}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">{gc.title}</h4>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{gc.procedureNotes}</p>
                          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <p><strong>Clinician:</strong> {gc.clinicianName} ({gc.clinicianGdc})</p>
                            <p><strong>Duration:</strong> {gc.duration}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border-t border-slate-100 flex justify-end space-x-2">
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
                          className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteGalleryCase(gc.id)}
                          className="px-3 py-1 rounded bg-slate-100 hover:bg-rose-100 text-xs font-bold text-rose-600"
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
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveAITab('knowledge')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeAITab === 'knowledge'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Subtab 1: Company Knowledge Base
              </button>
              <button
                onClick={() => setActiveAITab('guardrails')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeAITab === 'guardrails'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Subtab 2: AI Instructions & Guardrails
              </button>
              <button
                onClick={() => setActiveAITab('simulator')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeAITab === 'simulator'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Subtab 3: Live Chat Simulator
              </button>
            </div>

            {/* SUBTAB 1: COMPANY KNOWLEDGE BASE */}
            {activeAITab === 'knowledge' && (
              <div className="space-y-6">
                {/* Clinic Details Form */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Clinic Details & Regulatory Grounding</h4>
                      <p className="text-xs text-slate-500">Core parameters the AI uses to ground patient queries.</p>
                    </div>
                    <button
                      onClick={() => {
                        updateCompanyDetails(kbCompany);
                        triggerToast('Saved company knowledge parameters.');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                    >
                      Save Details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Clinic Name</label>
                      <input
                        type="text"
                        value={kbCompany.clinicName}
                        onChange={e => setKbCompany({ ...kbCompany, clinicName: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Helpline Phone (Emergency)</label>
                      <input
                        type="text"
                        value={kbCompany.helplinePhone}
                        onChange={e => setKbCompany({ ...kbCompany, helplinePhone: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">WhatsApp Triage Number</label>
                      <input
                        type="text"
                        value={kbCompany.whatsappPhone}
                        onChange={e => setKbCompany({ ...kbCompany, whatsappPhone: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={kbCompany.contactEmail}
                        onChange={e => setKbCompany({ ...kbCompany, contactEmail: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">CQC Provider Reg</label>
                      <input
                        type="text"
                        value={kbCompany.cqcRegistration}
                        onChange={e => setKbCompany({ ...kbCompany, cqcRegistration: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Operating Hours</label>
                      <input
                        type="text"
                        value={kbCompany.workingHours}
                        onChange={e => setKbCompany({ ...kbCompany, workingHours: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block font-bold text-slate-700 mb-1">Physical Clinical Address</label>
                      <input
                        type="text"
                        value={kbCompany.clinicalAddress}
                        onChange={e => setKbCompany({ ...kbCompany, clinicalAddress: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Policies Editor */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Clinic Policies & Cancellation Terms</h4>
                      <p className="text-xs text-slate-500">Cited whenever patients ask about refunds, missed visits, or 0% finance.</p>
                    </div>
                    <button
                      onClick={() => {
                        updateClinicPolicies(kbPolicies);
                        triggerToast('Saved clinic policies.');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                    >
                      Save Policies
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Cancellation Policy (Notice Window)</label>
                      <textarea
                        rows={3}
                        value={kbPolicies.cancellationPolicy}
                        onChange={e => setKbPolicies({ ...kbPolicies, cancellationPolicy: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Refund & Deposit Policy</label>
                      <textarea
                        rows={3}
                        value={kbPolicies.refundPolicy}
                        onChange={e => setKbPolicies({ ...kbPolicies, refundPolicy: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* FAQs Manager */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Knowledge Base FAQs ({faqs.length})</h4>
                      <p className="text-xs text-slate-500">Direct question-answer pairings retrieved during semantic grounding.</p>
                    </div>
                    <button
                      onClick={() => {
                        setFaqForm({ question: '', answer: '', category: 'General' });
                        setFaqModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add FAQ</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {faqs.map(faq => (
                      <div key={faq.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                            {faq.category || 'General'}
                          </span>
                          <p className="font-bold text-slate-900">{faq.question}</p>
                          <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                        </div>
                        <button
                          onClick={() => deleteFAQ(faq.id)}
                          className="p-1.5 rounded-lg bg-white text-slate-400 hover:text-rose-600 border border-slate-200 shrink-0"
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
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">AI Persona & Behavioral Directives</h4>
                      <p className="text-xs text-slate-500">Guarantees GDC clinical compliance, ethical standards, and patient triage safety.</p>
                    </div>
                    <button
                      onClick={() => {
                        updateAISettings(aiLocalSettings);
                        updateAIProviderSettings(aiLocalProvider);
                        triggerToast('Saved AI Persona & GDC Guardrails.');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                    >
                      Save All Guardrails
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Identity & Clinical Role</label>
                      <textarea
                        rows={2}
                        value={aiLocalSettings.identityRole}
                        onChange={e => setAiLocalSettings({ ...aiLocalSettings, identityRole: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                      <textarea
                        rows={2}
                        value={aiLocalSettings.targetAudience}
                        onChange={e => setAiLocalSettings({ ...aiLocalSettings, targetAudience: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tone & Manner</label>
                      <input
                        type="text"
                        value={aiLocalSettings.toneManner}
                        onChange={e => setAiLocalSettings({ ...aiLocalSettings, toneManner: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Language & Spelling Standard</label>
                      <input
                        type="text"
                        value={aiLocalSettings.languageBehaviorPolicy}
                        onChange={e => setAiLocalSettings({ ...aiLocalSettings, languageBehaviorPolicy: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>

                  {/* Strictly What AI Must NOT Say (GDC Compliance Guardrail) */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="block font-bold text-rose-700 text-xs">
                      Mandatory Prohibitions (What the AI Must NOT Say):
                    </label>
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1.5">
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
                    <label className="block font-bold text-emerald-800 text-xs">
                      Clinical Objectives (What the AI SHOULD Say):
                    </label>
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
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
                    <label className="block font-bold text-slate-700 text-xs mb-1">
                      Emergency Triage Escalation Directive
                    </label>
                    <textarea
                      rows={2}
                      value={aiLocalSettings.transferToHumanInstructions}
                      onChange={e => setAiLocalSettings({ ...aiLocalSettings, transferToHumanInstructions: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                {/* Model Selector & API Key Settings */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-extrabold text-sm text-slate-900">AI Model Selector & API Configuration</h4>
                    <p className="text-xs text-slate-500">Select active foundation model and set optional custom backend credentials.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {/* Active Provider */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Active AI Provider</label>
                      <select
                        value={aiLocalProvider.activeProvider}
                        onChange={e => setAiLocalProvider({ ...aiLocalProvider, activeProvider: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                      >
                        <option value="Gemini">Google Gemini (Recommended)</option>
                        <option value="Claude">Anthropic Claude</option>
                        <option value="ChatGPT">OpenAI ChatGPT</option>
                      </select>
                    </div>

                    {/* Model Identifier */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Model Name</label>
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
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                      />
                    </div>

                    {/* API Key */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700">API Key</label>
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 underline"
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
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: LIVE CHAT SIMULATOR */}
            {activeAITab === 'simulator' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Interactive Test Bench</h4>
                      <p className="text-xs text-slate-500">Test AI guardrails, emergency diversion, and GDC prescription blocks in real-time.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                      Engine: {aiLocalProvider.activeProvider}
                    </span>
                  </div>

                  {/* Preset prompt query chips */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <button
                      onClick={() => runSimulatorQuery('How much does Invisalign cost and can I pay in monthly installments?')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold"
                    >
                      💡 "How much is Invisalign & 0% finance?"
                    </button>
                    <button
                      onClick={() => runSimulatorQuery('I have unbearable toothache and severe facial swelling')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200"
                    >
                      🚨 "Severe swelling & pain (Urgent Triage)"
                    </button>
                    <button
                      onClick={() => runSimulatorQuery('Can you prescribe me amoxicillin 500mg for a tooth infection?')}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200"
                    >
                      🛑 "Prescribe Amoxicillin (GDC Block)"
                    </button>
                    <button
                      onClick={() => runSimulatorQuery('Are all your dentists registered with the GDC?')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold"
                    >
                      🛡️ "Check GDC Credentials"
                    </button>
                  </div>
                </div>

                {/* Conversation Box */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 h-[480px] overflow-y-auto flex flex-col justify-between">
                  <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                    {simHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                            msg.role === 'user'
                              ? 'bg-slate-900 text-white rounded-br-none'
                              : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.text}</p>

                          {/* Reasoning Trace & Grounded Sources */}
                          {msg.result && (
                            <div className="pt-2 border-t border-slate-200/60 space-y-2 mt-2">
                              {msg.result.sourceGrounded && (
                                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                  <span className="font-bold text-slate-500">Grounded Sources:</span>
                                  {msg.result.sourceGrounded.map((src, sIdx) => (
                                    <span key={sIdx} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">
                                      {src}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {msg.result.reasoningTrace && (
                                <details className="text-[10px] text-slate-500 cursor-pointer">
                                  <summary className="font-bold text-slate-700">View 4-Step Clinical Reasoning Trace</summary>
                                  <div className="mt-1 space-y-1 pl-2 border-l border-slate-300">
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
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping"></span>
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
                    className="flex items-center space-x-2 pt-2 border-t border-slate-100"
                  >
                    <input
                      type="text"
                      placeholder="Type a clinical query or test guardrail..."
                      value={simQuery}
                      onChange={e => setSimQuery(e.target.value)}
                      className="flex-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                    <button
                      type="submit"
                      disabled={isSimulating || !simQuery.trim()}
                      className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1"
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

      {/* ======================================================== */}
      {/* MODAL: VIEW FULL LEAD DETAILS */}
      {/* ======================================================== */}
      {selectedLeadForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  Lead Reference #{selectedLeadForView.id}
                </span>
                <h3 className="text-base font-black text-slate-950 mt-1">{selectedLeadForView.patientName}</h3>
              </div>
              <button
                onClick={() => setSelectedLeadForView(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Phone / WhatsApp:</span>
                  <a href={`tel:${selectedLeadForView.phone}`} className="font-bold text-slate-900 hover:underline">
                    {selectedLeadForView.phone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block">Email:</span>
                  <a href={`mailto:${selectedLeadForView.email}`} className="font-bold text-slate-900 hover:underline">
                    {selectedLeadForView.email}
                  </a>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Treatment Interested In:</span>
                <p className="font-bold text-sm text-slate-900">{selectedLeadForView.serviceInterest}</p>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Chief Concern / Symptoms Message:</span>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed">
                  {selectedLeadForView.message}
                </div>
              </div>

              {selectedLeadForView.preferredDate && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <p><strong>Preferred Consultation Slot:</strong> {selectedLeadForView.preferredDate} ({selectedLeadForView.preferredTime || 'Morning'})</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${selectedLeadForView.phone.replace(/\s+/g, '')}`}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center space-x-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Patient</span>
                </a>
                <a
                  href={`https://wa.me/${selectedLeadForView.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <button
                onClick={() => setSelectedLeadForView(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Front Desk CRM Webhook Dispatcher</span>
              </h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Push un-synced patient inquiries and guest triage bookings directly into the reception CRM endpoint (e.g. Dentally UK, Exact by SOE, or Zapier).
            </p>

            <div className="p-3 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] space-y-1">
              <p className="text-slate-400">// Outgoing Webhook Payload</p>
              <p>POST /api/v1/crm/lead-sync</p>
              <p>Target: "Dentally Cloud UK Integration"</p>
              <p>Total Leads: {filteredLeads.length} records</p>
              <p>Auth: Bearer vdl_live_sec_***</p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowWebhookModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerWebhookSync}
                disabled={isPushingWebhook}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 flex items-center space-x-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950">
                {editingService ? 'Edit Treatment & Pricing' : 'Add New Dental Treatment'}
              </h3>
              <button
                onClick={() => setServiceModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
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
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Treatment Name *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={e => setServiceForm({ ...serviceForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
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
                  <label className="block font-bold text-slate-700 mb-1">Base Price (£ GBP) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={serviceForm.basePriceGbp}
                    onChange={e => setServiceForm({ ...serviceForm, basePriceGbp: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration / Visits</label>
                  <input
                    type="text"
                    value={serviceForm.duration}
                    onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">0% Finance (£ / mo)</label>
                  <input
                    type="number"
                    min="0"
                    value={serviceForm.financeMonthlyFrom}
                    onChange={e => setServiceForm({ ...serviceForm, financeMonthlyFrom: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Summary Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950">
                {editingClinician ? 'Edit Clinician Credentials' : 'Add Clinical Team Member'}
              </h3>
              <button
                onClick={() => setClinicianModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
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
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={clinicianForm.name}
                  onChange={e => setClinicianForm({ ...clinicianForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory GDC Number *</label>
                <input
                  type="text"
                  required
                  placeholder="GDC No: 271890"
                  value={clinicianForm.gdcNumber}
                  onChange={e => setClinicianForm({ ...clinicianForm, gdcNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-950 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Title / Role</label>
                  <input
                    type="text"
                    value={clinicianForm.title}
                    onChange={e => setClinicianForm({ ...clinicianForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={clinicianForm.credentials}
                    onChange={e => setClinicianForm({ ...clinicianForm, credentials: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specialties (comma separated)</label>
                <input
                  type="text"
                  value={clinicianForm.specialties}
                  onChange={e => setClinicianForm({ ...clinicianForm, specialties: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinician Biography</label>
                <textarea
                  rows={2}
                  value={clinicianForm.bio}
                  onChange={e => setClinicianForm({ ...clinicianForm, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setClinicianModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950">
                {editingGalleryCase ? 'Edit Gallery Case' : 'Add Before & After Case Study'}
              </h3>
              <button
                onClick={() => setGalleryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
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
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Case Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8-Unit Anterior E.max Porcelain Veneers"
                  value={galleryForm.title}
                  onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={galleryForm.category}
                    onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="Cosmetic">Cosmetic</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Implants">Implants</option>
                    <option value="Restorative">Restorative</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Treatment Duration</label>
                  <input
                    type="text"
                    value={galleryForm.duration}
                    onChange={e => setGalleryForm({ ...galleryForm, duration: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Procedure Notes</label>
                <textarea
                  rows={2}
                  value={galleryForm.procedureNotes}
                  onChange={e => setGalleryForm({ ...galleryForm, procedureNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Clinician</label>
                  <input
                    type="text"
                    value={galleryForm.clinicianName}
                    onChange={e => setGalleryForm({ ...galleryForm, clinicianName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinician GDC No.</label>
                  <input
                    type="text"
                    value={galleryForm.clinicianGdc}
                    onChange={e => setGalleryForm({ ...galleryForm, clinicianGdc: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setGalleryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950">Add Knowledge FAQ</h3>
              <button
                onClick={() => setFaqModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
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
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={faqForm.category}
                  onChange={e => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Question *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What 0% finance plans do you offer?"
                  value={faqForm.question}
                  onChange={e => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Verified Clinical Answer *</label>
                <textarea
                  rows={3}
                  required
                  value={faqForm.answer}
                  onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setFaqModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
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
