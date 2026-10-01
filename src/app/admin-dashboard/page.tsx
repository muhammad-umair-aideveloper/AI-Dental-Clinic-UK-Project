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
    resetToDefaults,
  } = useClinic();

  // Primary Navigation Tabs
  const [activeMainTab, setActiveMainTab] = useState<'appointments' | 'inquiries' | 'walkin' | 'ai-knowledge'>('ai-knowledge');

  // AI & Knowledge Management Sub-Tabs (Tab 1, Tab 2, Tab 3)
  const [aiSubTab, setAiSubTab] = useState<'knowledge' | 'behavior' | 'simulator'>('knowledge');

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
  const [localProvider, setLocalProvider] = useState(aiProviderSettings);
  const [showApiKey, setShowApiKey] = useState(false);

  // New Service Modal / Form inside Knowledge Base
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    priceRange: 'From £',
    basePriceGbp: 150,
    category: 'General' as ServiceCategory,
    duration: '45 mins',
    description: '',
  });

  // New FAQ form
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [newFAQForm, setNewFAQForm] = useState({
    question: '',
    answer: '',
    category: 'General',
  });

  // Simulator State
  const [simulatorQuery, setSimulatorQuery] = useState('');
  const [simulatorHistory, setSimulatorHistory] = useState<
    Array<{
      query: string;
      result: AIResponseResult;
      timestamp: string;
    }>
  >([
    {
      query: 'What services do you offer?',
      result: {
        reply: `Vertex Dental Lab offers a complete spectrum of UK private dentistry including:
• General Checkup & Digital OPG X-Rays (From £95)
• Hygiene Therapy & Airflow Polishing (From £110)
• Same-Day Root Canal Therapy (From £450)
• Invisalign® Clear Aligners (From £1,800)
• Straumann® Bio-Compatible Dental Implants (From £1,500)
• Laser Teeth Whitening (From £350)
• 24/7 Emergency Dental Care (Immediate Relief)

All prosthetic crowns and aligners are custom-engineered in our Marylebone 3D lab. Would you like to schedule a consultation?`,
        sourceGrounded: ['Dental Services & Verified Pricing', 'Company Overview'],
        actionType: 'book',
      },
      timestamp: 'Demo Run',
    },
  ]);
  const [simulatorLoading, setSimulatorLoading] = useState(false);

  // Top Metrics Calculation
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(a => a.date === '2026-10-01').length;
  const confirmedPatients = appointments.filter(a => a.status === 'Confirmed').length;
  const totalInquiries = inquiries.length;

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

    // 4. Save Provider Settings
    updateAIProviderSettings(localProvider);

    // Feedback
    setSaveSuccessBanner(true);
    setTimeout(() => setSaveSuccessBanner(false), 4000);
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

  // Simulator Run
  const handleRunSimulator = (presetQuery?: string) => {
    const q = (presetQuery || simulatorQuery).trim();
    if (!q) return;

    setSimulatorLoading(true);

    setTimeout(() => {
      // Evaluate using the local buffer and saved store
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
      });

      setSimulatorHistory(prev => [
        {
          query: q,
          result,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      setSimulatorLoading(false);
      setSimulatorQuery('');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Vertex Dental<span className="text-sky-400">Lab</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden md:inline-flex items-center text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Authenticated: Clinic Director
            </span>
            <button
              onClick={resetToDefaults}
              className="text-[11px] text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded bg-slate-900 border border-slate-800"
              title="Reset all demo data to initial defaults"
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Save Success Alert Notification */}
        {saveSuccessBanner && (
          <div className="fixed top-16 right-6 z-50 p-4 rounded-2xl bg-emerald-900/90 border border-emerald-500 text-white shadow-2xl flex items-center space-x-3 animate-fade-in backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <p className="text-xs font-bold">AI Knowledge & Behavior Successfully Deployed</p>
              <p className="text-[11px] text-emerald-200">
                Live patient triage assistant and chat simulator updated immediately.
              </p>
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Appointments</span>
              <div className="w-8 h-8 rounded-xl bg-sky-950 text-sky-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{totalAppointments}</p>
            <p className="text-[11px] text-sky-400">All-time bookings in calendar</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Today&apos;s Schedule</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{todayAppointments}</p>
            <p className="text-[11px] text-emerald-400">Scheduled clinical slots today</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Confirmed Patients</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{confirmedPatients}</p>
            <p className="text-[11px] text-cyan-400">Active validated patients</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Patient Web Inquiries</span>
              <div className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{totalInquiries}</p>
            <p className="text-[11px] text-purple-400">Incoming contact form submissions</p>
          </div>
        </div>

        {/* Primary Management Navigation Bar */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveMainTab('ai-knowledge')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeMainTab === 'ai-knowledge'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Assistant & Knowledge Management</span>
          </button>

          <button
            onClick={() => setActiveMainTab('appointments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeMainTab === 'appointments'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments & Diary ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('inquiries')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeMainTab === 'inquiries'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Web Inquiries ({inquiries.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('walkin')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeMainTab === 'walkin'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Walk-In / Phone Booking</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* SECTION 4.1: APPOINTMENTS TAB */}
        {/* ============================================================ */}
        {activeMainTab === 'appointments' && (
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="rounded-3xl bg-slate-850 border border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={aptSearch}
                  onChange={e => setAptSearch(e.target.value)}
                  placeholder="Search by patient name, phone, or treatment..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Date Filter */}
                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl text-xs border border-slate-700">
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

                {/* Status Filter */}
                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl text-xs border border-slate-700">
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

            {/* Appointments Table */}
            <div className="rounded-3xl bg-slate-850 border border-slate-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Ref #</th>
                      <th className="py-3.5 px-4">Patient Name & Contact</th>
                      <th className="py-3.5 px-4">Treatment</th>
                      <th className="py-3.5 px-4">Date & Slot</th>
                      <th className="py-3.5 px-4">Source</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No appointments matching the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map(apt => (
                        <tr key={apt.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-sky-400">
                            {apt.id}
                          </td>
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
                            {apt.isEmergency && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-800">
                                Emergency
                              </span>
                            )}
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
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {apt.source}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                apt.status === 'Confirmed'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : apt.status === 'Pending'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                            {apt.status === 'Pending' && (
                              <button
                                onClick={() => updateAppointmentStatus(apt.id, 'Confirmed')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                              >
                                Confirm
                              </button>
                            )}
                            <button
                              onClick={() => setDeletingAptId(apt.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              title="Delete appointment"
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

            {/* Delete Confirmation Modal */}
            {deletingAptId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl text-center">
                  <div className="w-12 h-12 rounded-full bg-red-950 text-red-400 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Delete Appointment?</h4>
                  <p className="text-xs text-slate-300">
                    Are you sure you want to remove appointment <strong>#{deletingAptId}</strong> from the clinic diary? This action cannot be undone.
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
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 4.2: WEB INQUIRIES TAB */}
        {/* ============================================================ */}
        {activeMainTab === 'inquiries' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Incoming Patient Web Inquiries</h3>
              <p className="text-xs text-slate-400">
                Messages submitted via the public contact form with direct WhatsApp and telephone call CTAs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inquiries.map(inq => (
                <div
                  key={inq.id}
                  className="rounded-3xl bg-slate-850 border border-slate-800 p-6 space-y-4 shadow-md flex flex-col justify-between"
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
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      &ldquo;{inq.message}&rdquo;
                    </p>
                    <div className="text-[11px] text-slate-500 pt-1">
                      Received: {new Date(inq.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                    <a
                      href={`tel:${inq.phone.replace(/\s+/g, '')}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-sky-400" />
                      <span>Call {inq.phone}</span>
                    </a>

                    <a
                      href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(inq.patientName)},%20thank%20you%20for%20contacting%20Vertex%20Dental%20Lab.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply on WhatsApp</span>
                    </a>

                    {inq.status !== 'Resolved' && (
                      <button
                        onClick={() => updateInquiryStatus(inq.id, 'Resolved')}
                        className="ml-auto px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700"
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

        {/* ============================================================ */}
        {/* SECTION 4.3: ADD WALK-IN / PHONE BOOKING */}
        {/* ============================================================ */}
        {activeMainTab === 'walkin' && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-slate-850 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950 text-sky-400 text-xs font-bold mb-2">
                <Plus className="w-3.5 h-3.5" />
                <span>Reception Desk & Call Reservations</span>
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={walkInForm.timeSlot}
                    onChange={e => setWalkInForm({ ...walkInForm, timeSlot: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:15 AM">10:15 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:45 AM">11:45 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:15 PM">04:15 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reception Notes
                </label>
                <textarea
                  rows={2}
                  value={walkInForm.notes}
                  onChange={e => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-300 hover:opacity-90 transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Save Directly to Clinic Calendar</span>
              </button>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 5: AI ASSISTANT & KNOWLEDGE MANAGEMENT */}
        {/* EXACT ARCHITECTURE: STICKY SAVE BUTTON + 3 DISTINCT TABS */}
        {/* ============================================================ */}
        {activeMainTab === 'ai-knowledge' && (
          <div className="space-y-6 relative">
            {/* Sticky Save All Action Header */}
            <div className="sticky top-[61px] z-20 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-sky-600/30 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Assistant & Knowledge Management</h3>
                  <p className="text-[11px] text-slate-400">
                    Changes made here directly govern patient triage, pricing answers, and live chatbot guardrails.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveAllAISettings}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 hover:opacity-90 shadow-lg shadow-sky-500/20 active:scale-95 flex items-center justify-center space-x-2 transition-all"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>Save All AI Settings</span>
              </button>
            </div>

            {/* 3 Distinct Sub-Tabs */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setAiSubTab('knowledge')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  aiSubTab === 'knowledge'
                    ? 'bg-slate-800 text-sky-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Tab 1: Company Knowledge Base</span>
              </button>

              <button
                onClick={() => setAiSubTab('behavior')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  aiSubTab === 'behavior'
                    ? 'bg-slate-800 text-sky-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Tab 2: AI Instructions & Behavior</span>
              </button>

              <button
                onClick={() => setAiSubTab('simulator')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  aiSubTab === 'simulator'
                    ? 'bg-slate-800 text-sky-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Tab 3: Live Chat Simulator</span>
              </button>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* TAB 1: COMPANY KNOWLEDGE BASE */}
            {/* ------------------------------------------------------------ */}
            {aiSubTab === 'knowledge' && (
              <div className="space-y-8 animate-fade-in">
                {/* 1. Company Details & Contact Information */}
                <div className="rounded-3xl bg-slate-850 border border-slate-800 p-6 space-y-6">
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Helpline Phone Number (+44 UK format)
                      </label>
                      <input
                        type="text"
                        value={localCompany.helplinePhone}
                        onChange={e => setLocalCompany({ ...localCompany, helplinePhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        WhatsApp Contact (+44 UK format)
                      </label>
                      <input
                        type="text"
                        value={localCompany.whatsappPhone}
                        onChange={e => setLocalCompany({ ...localCompany, whatsappPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={localCompany.contactEmail}
                        onChange={e => setLocalCompany({ ...localCompany, contactEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Clinical Physical Address
                      </label>
                      <input
                        type="text"
                        value={localCompany.clinicalAddress}
                        onChange={e => setLocalCompany({ ...localCompany, clinicalAddress: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Company Description
                    </label>
                    <textarea
                      rows={3}
                      value={localCompany.companyDescription}
                      onChange={e => setLocalCompany({ ...localCompany, companyDescription: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                    />
                  </div>
                </div>

                {/* 2. Dental Services & Verified Pricing */}
                <div className="rounded-3xl bg-slate-850 border border-slate-800 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>Dental Services & Verified Pricing ({services.length} Registered)</span>
                    </div>

                    <button
                      onClick={() => setIsAddingService(!isAddingService)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Service</span>
                    </button>
                  </div>

                  {/* Add New Service Form */}
                  {isAddingService && (
                    <form
                      onSubmit={handleCreateService}
                      className="p-5 rounded-2xl bg-slate-900 border border-sky-500/40 space-y-4 animate-fade-in"
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
                            placeholder="e.g. Composite Bonding Smile Makeover"
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">Category</label>
                          <select
                            value={newServiceForm.category}
                            onChange={e => setNewServiceForm({ ...newServiceForm, category: e.target.value as ServiceCategory })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="General">General</option>
                            <option value="Preventive">Preventive</option>
                            <option value="Endodontics">Endodontics</option>
                            <option value="Cosmetic">Cosmetic</option>
                            <option value="Surgical">Surgical</option>
                            <option value="Orthodontics">Orthodontics</option>
                            <option value="Pediatric">Pediatric</option>
                            <option value="Emergency">Emergency</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">Duration</label>
                          <input
                            type="text"
                            value={newServiceForm.duration}
                            onChange={e => setNewServiceForm({ ...newServiceForm, duration: e.target.value })}
                            placeholder="e.g. 60 mins"
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">Service Description</label>
                          <input
                            type="text"
                            value={newServiceForm.description}
                            onChange={e => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                            placeholder="Clinical procedure breakdown..."
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                        >
                          Save Service to Clinic Catalog
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingService(false)}
                          className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Services List Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Service Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Verified Price (GBP £)</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {services.map(srv => (
                          <tr key={srv.id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-bold text-white">{srv.name}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-sky-300 border border-slate-700">
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
                                title="Delete service"
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

                {/* 3. Refund, Cancellation & Clinic Policies */}
                <div className="rounded-3xl bg-slate-850 border border-slate-800 p-6 space-y-6">
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Additional Business Policies (one policy rule per line)
                      </label>
                      <textarea
                        rows={4}
                        value={localPolicies.additionalPoliciesText}
                        onChange={e => setLocalPolicies({ ...localPolicies, additionalPoliciesText: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Frequently Asked Questions (FAQs) */}
                <div className="rounded-3xl bg-slate-850 border border-slate-800 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4" />
                      <span>Frequently Asked Questions ({faqs.length} FAQs Grounded)</span>
                    </div>

                    <button
                      onClick={() => setIsAddingFAQ(!isAddingFAQ)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add FAQ</span>
                    </button>
                  </div>

                  {/* Add FAQ form */}
                  {isAddingFAQ && (
                    <form
                      onSubmit={handleCreateFAQ}
                      className="p-5 rounded-2xl bg-slate-900 border border-sky-500/40 space-y-3 animate-fade-in"
                    >
                      <h4 className="text-xs font-bold text-sky-300">Add New FAQ to Knowledge Base</h4>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Question *</label>
                        <input
                          type="text"
                          required
                          value={newFAQForm.question}
                          onChange={e => setNewFAQForm({ ...newFAQForm, question: e.target.value })}
                          placeholder="e.g. Do you offer evening appointments?"
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Verified Clinical Answer *</label>
                        <textarea
                          rows={2}
                          required
                          value={newFAQForm.answer}
                          onChange={e => setNewFAQForm({ ...newFAQForm, answer: e.target.value })}
                          placeholder="Clinical explanation grounded in clinic policy..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                        >
                          Save FAQ
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingFAQ(false)}
                          className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* FAQ List */}
                  <div className="space-y-3">
                    {faqs.map(faq => (
                      <div
                        key={faq.id}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">{faq.question}</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{faq.answer}</p>
                        </div>
                        <button
                          onClick={() => deleteFAQ(faq.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors shrink-0"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB 2: AI INSTRUCTIONS & BEHAVIOR */}
            {/* ------------------------------------------------------------ */}
            {aiSubTab === 'behavior' && (
              <div className="space-y-8 animate-fade-in">
                {/* 1. AI Identity, Role & Audience */}
                <div className="rounded-3xl bg-slate-850 border border-slate-800 p-6 space-y-6">
                  <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                    <Bot className="w-4 h-4" />
                    <span>AI Identity, Role & Audience</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        AI Role & Persona
                      </label>
                      <textarea
                        rows={2}
                        value={localGuardrails.identityRole}
                        onChange={e => setLocalGuardrails({ ...localGuardrails, identityRole: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Target Audience
                        </label>
                        <textarea
                          rows={2}
                          value={localGuardrails.targetAudience}
                          onChange={e => setLocalGuardrails({ ...localGuardrails, targetAudience: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tone & Manner
                        </label>
                        <textarea
                          rows={2}
                          value={localGuardrails.toneManner}
                          onChange={e => setLocalGuardrails({ ...localGuardrails, toneManner: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Response Length Guideline
                        </label>
                        <input
                          type="text"
                          value={localGuardrails.responseLength}
                          onChange={e => setLocalGuardrails({ ...localGuardrails, responseLength: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Language Behavior Policy
                        </label>
                        <input
                          type="text"
                          value={localGuardrails.languageBehaviorPolicy}
                          onChange={e => setLocalGuardrails({ ...localGuardrails, languageBehaviorPolicy: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Business Goals
                      </label>
                      <textarea
                        rows={2}
                        value={localGuardrails.businessGoals}
                        onChange={e => setLocalGuardrails({ ...localGuardrails, businessGoals: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Guardrails (What the AI Should & Should NOT Say) */}
                <div className="rounded-3xl bg-slate-850 border border-slate-800 p-6 space-y-6">
                  <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Guardrails (What the AI Should & Should NOT Say)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Should Say */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>&ldquo;What the AI SHOULD say&rdquo; (one per line)</span>
                      </label>
                      <textarea
                        rows={6}
                        value={localGuardrails.shouldSayText}
                        onChange={e => setLocalGuardrails({ ...localGuardrails, shouldSayText: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-900/60 text-xs text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[11px] leading-relaxed"
                      />
                    </div>

                    {/* Must NOT Say */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-red-400 flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>&ldquo;What the AI must NOT say&rdquo; (one per line)</span>
                      </label>
                      <textarea
                        rows={6}
                        value={localGuardrails.mustNotSayText}
                        onChange={e => setLocalGuardrails({ ...localGuardrails, mustNotSayText: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-red-900/60 text-xs text-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-[11px] leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Fallback & Escalation textareas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        &ldquo;What to do when information is unavailable&rdquo;
                      </label>
                      <textarea
                        rows={3}
                        value={localGuardrails.informationUnavailableInstructions}
                        onChange={e => setLocalGuardrails({ ...localGuardrails, informationUnavailableInstructions: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        &ldquo;When to transfer to human support&rdquo; (Emergency Escalation)
                      </label>
                      <textarea
                        rows={3}
                        value={localGuardrails.transferToHumanInstructions}
                        onChange={e => setLocalGuardrails({ ...localGuardrails, transferToHumanInstructions: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. AI Model & Backend Provider Settings (Secure) */}
                <div className="rounded-3xl bg-slate-850 border border-slate-800 p-6 space-y-6">
                  <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                    <Key className="w-4 h-4" />
                    <span>AI Model & Backend Provider Settings (Secure)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        AI Provider
                      </label>
                      <select
                        value={localProvider.provider}
                        onChange={e => setLocalProvider({ ...localProvider, provider: e.target.value as AIProvider })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="OpenAI">OpenAI</option>
                        <option value="OpenRouter">OpenRouter</option>
                        <option value="Custom Endpoint">Custom Endpoint</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={localProvider.modelName}
                        onChange={e => setLocalProvider({ ...localProvider, modelName: e.target.value })}
                        placeholder="gpt-4o-mini"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Backend API Key
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                        >
                          {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showApiKey ? 'Mask' : 'Reveal'}</span>
                        </button>
                      </div>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={localProvider.apiKey}
                        onChange={e => setLocalProvider({ ...localProvider, apiKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>API keys are encrypted in secure storage and never exposed to the public client bundle.</span>
                  </p>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* TAB 3: LIVE CHAT SIMULATOR */}
            {/* ------------------------------------------------------------ */}
            {aiSubTab === 'simulator' && (
              <div className="rounded-3xl bg-slate-850 border border-slate-800 p-6 space-y-6 animate-fade-in">
                <div>
                  <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Terminal className="w-4 h-4" />
                    <span>Live Chat Simulator (Sandboxed Evaluation)</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Test Real-Time Assistant Grounding</h3>
                  <p className="text-xs text-slate-400">
                    Verify how the assistant formulates answers using the current knowledge base, price list, and guardrails before publishing.
                  </p>
                </div>

                {/* Preset Test Chips */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Preset Test Query Chips:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'What services do you offer?',
                      'What is the cancellation timeline?',
                      'How much are dental implants?',
                      'Do you take emergency patients?',
                      'Can you prescribe amoxicillin?',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRunSimulator(preset)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-sky-400 hover:text-sky-300 text-slate-300 transition-colors"
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
                    placeholder="Enter test patient query or symptom question..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    onClick={() => handleRunSimulator()}
                    disabled={simulatorLoading || !simulatorQuery.trim()}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-md"
                  >
                    <span>Run Query</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Simulator Output Window */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Simulator Output Log ({simulatorHistory.length} Runs)
                    </span>
                    <button
                      onClick={() => setSimulatorHistory([])}
                      className="text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      Clear Log
                    </button>
                  </div>

                  {simulatorLoading && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-sky-400 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                      <span>Evaluating knowledge graph against guardrails...</span>
                    </div>
                  )}

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {simulatorHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3"
                      >
                        {/* User Prompt */}
                        <div className="flex items-start justify-between text-xs">
                          <div className="flex items-center space-x-2 font-bold text-sky-300">
                            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                            <span>Patient: &ldquo;{item.query}&rdquo;</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                        </div>

                        {/* AI Output */}
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                          {item.result.reply}
                        </div>

                        {/* Grounding Source Tags */}
                        {item.result.sourceGrounded && item.result.sourceGrounded.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-500 font-semibold">Grounded in:</span>
                            {item.result.sourceGrounded.map((src, srcIdx) => (
                              <span
                                key={srcIdx}
                                className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800"
                              >
                                {src}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
