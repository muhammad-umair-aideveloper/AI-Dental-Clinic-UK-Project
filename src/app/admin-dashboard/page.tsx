'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import {
  Search,
  ArrowLeft,
  SlidersHorizontal,
  Plus,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  LayoutGrid,
  MoreVertical,
  Link2,
  FileSpreadsheet,
  BadgeDollarSign,
  ShoppingBag,
  ArrowLeftRight,
  Bell,
  Settings,
  Check,
  X,
  CreditCard,
  DollarSign,
  Receipt,
  Sparkles,
  Stethoscope,
  Bot,
  Users,
  CheckCircle2,
  Building,
  Phone,
  Shield,
  UploadCloud,
  LogOut,
  FileText,
  Activity,
  FolderKanban,
  CheckCheck,
} from 'lucide-react';

interface ProcedureItem {
  id: string;
  name: string;
  category: string;
  amount: number;
}

interface ClinicalPatientRecord {
  id: string;
  patientName: string;
  patientRole: string;
  patientAvatar: string;
  nhsNumber: string;
  leadClinician: string;
  roomSuite: string;
  dueTime: string;
  status: 'In-Chair' | 'Confirmed' | 'Pending Review' | 'Completed';
  totalFee: number;
  insuranceCover: number;
  patientBalance: number;
  chiefComplaint: string;
  procedures: ProcedureItem[];
}

const INITIAL_CLINICAL_PATIENTS: ClinicalPatientRecord[] = [
  {
    id: '# APT-1001',
    patientName: 'Sophia Chen',
    patientRole: 'NHS Patient • Dental Implants',
    patientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
    nhsNumber: 'NHS 902-441-2',
    leadClinician: 'Dr. Sarah Jenkins',
    roomSuite: 'Surgical Suite 2',
    dueTime: 'In 25 mins',
    status: 'Pending Review',
    totalFee: 1750.00,
    insuranceCover: 1200.00,
    patientBalance: 550.00,
    chiefComplaint: 'Post-op implant osseointegration check and digital impressions.',
    procedures: [
      { id: 'p-1', name: 'Digital Intraoral Scan', category: 'Diagnostics', amount: 450.00 },
      { id: 'p-2', name: 'Titanium Abutment Placement', category: 'Surgical', amount: 850.00 },
      { id: 'p-3', name: 'Anti-Microbial Irrigation', category: 'Periodontics', amount: 450.00 },
    ],
  },
  {
    id: '# APT-1002',
    patientName: 'Marcus Vance',
    patientRole: 'Private Patient • Orthodontics',
    patientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    nhsNumber: 'NHS 482-109-8',
    leadClinician: 'Dr. Michael Vance',
    roomSuite: 'Orthodontic Studio 4',
    dueTime: 'In 45 mins',
    status: 'Confirmed',
    totalFee: 2480.00,
    insuranceCover: 1800.00,
    patientBalance: 680.00,
    chiefComplaint: 'Invisalign aligner refinement review & composite attachments.',
    procedures: [
      { id: 'p-1', name: 'Itero 3D Progress Scan', category: 'Diagnostics', amount: 380.00 },
      { id: 'p-2', name: 'Aligner Stage 14 Fitting', category: 'Orthodontics', amount: 1650.00 },
      { id: 'p-3', name: 'Enamel Interproximal Reduction', category: 'Orthodontics', amount: 450.00 },
    ],
  },
  {
    id: '# APT-1003',
    patientName: 'James Carter',
    patientRole: 'Private Patient • CAD/CAM Crown',
    patientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    nhsNumber: 'NHS 849-204-1',
    leadClinician: 'Dr. Sarah Jenkins',
    roomSuite: 'Clinical Chair 1',
    dueTime: 'In Chair • Active',
    status: 'In-Chair',
    totalFee: 4980.00,
    insuranceCover: 3500.00,
    patientBalance: 1480.00,
    chiefComplaint: 'Fractured lower molar requiring same-day milled ceramic crown.',
    procedures: [
      { id: 'p-1', name: '3D Ceramic Crown CAD/CAM', category: 'Restorative', amount: 1590.00 },
      { id: 'p-2', name: 'Digital Intraoral Scan & Prep', category: 'Prosthodontics', amount: 2125.00 },
      { id: 'p-3', name: 'Sedation & Periodontal Therapy', category: 'Periodontics', amount: 1265.00 },
    ],
  },
  {
    id: '# APT-1004',
    patientName: 'Elena Rostova',
    patientRole: 'Private Patient • Endodontics',
    patientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    nhsNumber: 'NHS 712-990-4',
    leadClinician: 'Dr. Sarah Jenkins',
    roomSuite: 'Surgical Suite 1',
    dueTime: 'Today 03:30 PM',
    status: 'Confirmed',
    totalFee: 3230.00,
    insuranceCover: 2200.00,
    patientBalance: 1030.00,
    chiefComplaint: 'Microscopic root canal retreatment with apex locator.',
    procedures: [
      { id: 'p-1', name: 'CBCT 3D Cone Beam Scan', category: 'Radiology', amount: 480.00 },
      { id: 'p-2', name: 'Rotary Endo Canal Cleansing', category: 'Endodontics', amount: 1950.00 },
      { id: 'p-3', name: 'Warm Gutta-Percha Obturation', category: 'Endodontics', amount: 800.00 },
    ],
  },
  {
    id: '# APT-1005',
    patientName: 'David Kim',
    patientRole: 'NHS Patient • Preventive Hygiene',
    patientAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80',
    nhsNumber: 'NHS 314-558-9',
    leadClinician: 'Hygienist Pool',
    roomSuite: 'Hygiene Suite 3',
    dueTime: 'Today 04:45 PM',
    status: 'Confirmed',
    totalFee: 680.00,
    insuranceCover: 500.00,
    patientBalance: 180.00,
    chiefComplaint: 'AirFlow stain removal & ultrasonic periodontal debridement.',
    procedures: [
      { id: 'p-1', name: 'EMS AirFlow Guided Therapy', category: 'Hygiene', amount: 380.00 },
      { id: 'p-2', name: 'Fluoride Varnish Enamel Shield', category: 'Preventive', amount: 300.00 },
    ],
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    services,
    appointments,
    updateAppointmentStatus,
    companyDetails,
    updateCompanyDetails,
    aiProviderSettings,
    updateAIProviderSettings,
    approvalPolicy,
    updateApprovalPolicy,
    logout,
  } = useClinic();

  // Top Nav active tab matching FINNOVA pill structure
  const [navTab, setNavTab] = useState<'overview' | 'estimates' | 'invoices' | 'payments' | 'recurring' | 'checkouts'>('invoices');

  // Clinical patient records state
  const [patientQueue, setPatientQueue] = useState<ClinicalPatientRecord[]>(INITIAL_CLINICAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('# APT-1003');
  const [subFilterTab, setSubFilterTab] = useState<'all' | 'draft' | 'unpaid'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Insurance & Payment Claim Method (Card 4)
  const [selectedClaimMethod, setSelectedClaimMethod] = useState<'bupa' | 'stripe' | 'axa'>('stripe');

  // Modals & Feedback
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAddProcedureModal, setShowAddProcedureModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Booking Form
  const [newBookingForm, setNewBookingForm] = useState({
    patientName: '',
    patientRole: 'Private Dental Patient',
    leadClinician: 'Dr. Sarah Jenkins',
    roomSuite: 'Clinical Chair 1',
    dueTime: 'Today 05:15 PM',
    procedureName: 'CAD/CAM Ceramic Restoration',
    procedureAmount: '1450.00',
  });

  // New Procedure Form
  const [newProcedureForm, setNewProcedureForm] = useState({
    title: '',
    category: 'Restorative',
    amount: '',
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Find currently active patient
  const currentPatient = patientQueue.find(p => p.id === selectedPatientId) || patientQueue[2] || patientQueue[0];

  // Filtering patients
  const filteredPatients = patientQueue.filter(p => {
    if (subFilterTab === 'draft' && p.status !== 'Pending Review') return false;
    if (subFilterTab === 'unpaid' && p.status === 'Completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.patientName.toLowerCase().includes(q) ||
        p.nhsNumber.toLowerCase().includes(q) ||
        p.leadClinician.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate totals for active patient
  const activeTotal = currentPatient.procedures.reduce((acc, curr) => acc + curr.amount, 0);
  const formattedTotal = `£ ${activeTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedInsurance = `£ ${currentPatient.insuranceCover.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedBalance = `£ ${Math.max(0, activeTotal - currentPatient.insuranceCover).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Handle Add Procedure
  const handleAddProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcedureForm.title.trim() || !newProcedureForm.amount) return;

    const val = parseFloat(newProcedureForm.amount);
    if (isNaN(val)) return;

    const newProc: ProcedureItem = {
      id: `p-${Date.now()}`,
      name: newProcedureForm.title.trim(),
      category: newProcedureForm.category,
      amount: val,
    };

    setPatientQueue(prev =>
      prev.map(p => {
        if (p.id === currentPatient.id) {
          const updatedProcs = [...p.procedures, newProc];
          const newTotal = updatedProcs.reduce((acc, pr) => acc + pr.amount, 0);
          return {
            ...p,
            procedures: updatedProcs,
            totalFee: newTotal,
            patientBalance: Math.max(0, newTotal - p.insuranceCover),
          };
        }
        return p;
      })
    );

    setNewProcedureForm({ title: '', category: 'Restorative', amount: '' });
    setShowAddProcedureModal(false);
    triggerToast(`Added "${newProc.name}" to ${currentPatient.id} clinical record.`);
  };

  // Handle Create Booking
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingForm.patientName.trim()) return;

    const initialAmount = parseFloat(newBookingForm.procedureAmount) || 1250;
    const newId = `# APT-${1000 + patientQueue.length + 1}`;

    const createdRecord: ClinicalPatientRecord = {
      id: newId,
      patientName: newBookingForm.patientName.trim(),
      patientRole: newBookingForm.patientRole,
      patientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
      nhsNumber: `NHS ${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1 + Math.random() * 9)}`,
      leadClinician: newBookingForm.leadClinician,
      roomSuite: newBookingForm.roomSuite,
      dueTime: newBookingForm.dueTime,
      status: 'Confirmed',
      totalFee: initialAmount,
      insuranceCover: Math.round(initialAmount * 0.7),
      patientBalance: Math.round(initialAmount * 0.3),
      chiefComplaint: 'Clinical consultation and customized oral procedure.',
      procedures: [
        {
          id: `p-${Date.now()}`,
          name: newBookingForm.procedureName || 'Clinical Examination',
          category: 'Clinical',
          amount: initialAmount,
        },
      ],
    };

    setPatientQueue([createdRecord, ...patientQueue]);
    setSelectedPatientId(newId);
    setShowBookModal(false);
    triggerToast(`Booked appointment ${newId} for ${createdRecord.patientName}`);
  };

  // Complete & Discharge
  const handleDischargePatient = () => {
    setPatientQueue(prev =>
      prev.map(p => (p.id === currentPatient.id ? { ...p, status: 'Completed' } : p))
    );
    triggerToast(`Patient ${currentPatient.patientName} discharged. Digital invoice & claim sent to ${selectedClaimMethod.toUpperCase()}.`);
  };

  return (
    <div className="min-h-screen bg-[#F4F5FB] text-slate-900 flex flex-col font-sans selection:bg-[#4F46E5] selection:text-white p-3 sm:p-5 md:p-7 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#121526] text-white shadow-2xl flex items-center space-x-3 border border-slate-700 animate-fade-in">
          <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Main Wrapper */}
      <div className="max-w-[1520px] w-full mx-auto space-y-6">

        {/* ======================================================== */}
        {/* TOP NAVBAR (Exact FINNOVA layout, styled for Clinical Practice) */}
        {/* ======================================================== */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-4 py-1">
          
          {/* Logo & Brand & Pill 80 */}
          <div className="flex items-center space-x-3 self-start lg:self-center">
            {/* Clinical Finnova Ribbon Mark */}
            <div className="w-10 h-10 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 28V12C10 9.79086 11.7909 8 14 8H16C18.2091 8 20 9.79086 20 12V24C20 26.2091 21.7909 28 24 28H26C28.2091 28 30 26.2091 30 24V12"
                  stroke="url(#finnova-clinical-grad)"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="finnova-clinical-grad" x1="10" y1="8" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#818CF8" />
                    <stop offset="0.5" stopColor="#6366F1" />
                    <stop offset="1" stopColor="#4F46E5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-slate-950 font-sans">FINNOVA CLINICAL</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Smart Dental Care, Better Practice</p>
            </div>

            {/* Pill 80 / Clinical Capacity */}
            <div className="ml-3 px-3 py-1 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-600 flex items-center gap-1.5" title="Practice capacity: 80 active slots">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>80</span>
            </div>
          </div>

          {/* Center Navigation Capsule */}
          <nav className="bg-[#121526] p-1.5 rounded-full flex items-center space-x-1 shadow-md text-xs font-medium text-slate-300 overflow-x-auto max-w-full">
            <button
              onClick={() => setNavTab('overview')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center space-x-1 ${
                navTab === 'overview'
                  ? 'bg-[#4F46E5] text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>+ Overview</span>
            </button>

            <button
              onClick={() => setNavTab('estimates')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                navTab === 'estimates'
                  ? 'bg-[#4F46E5] text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Estimates & Plans
            </button>

            <button
              onClick={() => setNavTab('invoices')}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center space-x-1.5 ${
                navTab === 'invoices'
                  ? 'bg-[#4F46E5] text-white font-bold shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              <span>Clinical Queue</span>
            </button>

            <button
              onClick={() => setNavTab('payments')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                navTab === 'payments'
                  ? 'bg-[#4F46E5] text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              NHS & Claims
            </button>

            <button
              onClick={() => setNavTab('recurring')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                navTab === 'recurring'
                  ? 'bg-[#4F46E5] text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              3D Milling Lab
            </button>

            <button
              onClick={() => setNavTab('checkouts')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                navTab === 'checkouts'
                  ? 'bg-[#4F46E5] text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              AI Concierge
            </button>
          </nav>

          {/* Right Action Icons & Doctor Avatar */}
          <div className="flex items-center space-x-2.5 self-end lg:self-center">
            {/* 1. Dental Electronic Health Record */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Dental Patient EHR"
              onClick={() => triggerToast('Clinical Charts & Periodontal Records')}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            {/* 2. Billing & NHS Statements */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Practice Revenue & Claims"
              onClick={() => triggerToast('Dental Claims & Merchant Statements')}
            >
              <BadgeDollarSign className="w-4 h-4" />
            </button>

            {/* 3. Appointment Diary Calendar */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Surgery Diary Calendar"
              onClick={() => triggerToast('Opening Surgery Diary')}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>

            {/* 4. 3D Lab Orders / Milling Bag */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="3D CAD/CAM Lab Queue"
              onClick={() => triggerToast('CAD/CAM Milling Lab Status: 6 crowns in milling')}
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            {/* 5. Referrals & Sync */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Inter-Clinic Referrals"
              onClick={() => triggerToast('Synced with Harley Street Orthodontic Network')}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            {/* 6. Bell Notification with Alert Dot */}
            <button
              className="relative w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Emergency Notifications"
              onClick={() => triggerToast('1 emergency triage flagged: acute pulpitis in Chair 1')}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white"></span>
            </button>

            {/* 7. Settings Icon */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Practice Settings"
              onClick={() => triggerToast('Opening Clinical Practice Settings')}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Lead Clinician Avatar */}
            <div
              className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-2xs ml-1 cursor-pointer"
              title="Dr. Sarah Jenkins • Lead Dental Surgeon"
            >
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Dr. Sarah Jenkins"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* CLINICAL TITLE ROW & ACTIONS */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center space-x-3.5">
            {/* Back Button */}
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition active:scale-95 shrink-0"
              title="Back to Public Site"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Clinical Appointments & Treatments
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Manage and track all clinical appointments, procedures, and patient records in one place.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Sliders / View Filter */}
            <button
              onClick={() => triggerToast('Filter view toggled: All Operating Suites')}
              className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95"
              title="Adjust Clinical Views"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* + Book Appointment Primary Button */}
            <button
              onClick={() => setShowBookModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Book Appointment</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TOP 4 SUMMARY METRIC CARDS (Exact FINNOVA format for Clinic) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* ---------------- CARD 1: URGENT TRIAGE / OVERDUE FOLLOW-UPS ---------------- */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[230px] relative overflow-hidden">
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Urgent Triage & Follow-up</span>
                <div className="w-5 h-5 rounded-full border border-red-300 bg-red-50 text-red-500 flex items-center justify-center font-bold text-[11px]">
                  !
                </div>
              </div>

              {/* Amount */}
              <div className="mt-1">
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">£ 24,850.00</h3>
                <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1 mt-0.5">
                  <ArrowUp className="w-3 h-3 stroke-[3]" />
                  <span>12.5% from last month</span>
                </p>
              </div>
            </div>

            {/* Bottom Minimalist Desk Photo (Plant, Laptop, Desk Lamp) */}
            <div className="w-full h-24 rounded-2xl overflow-hidden mt-2 relative border border-slate-100 shadow-2xs">
              <img
                src="/images/desk-workspace.jpg"
                alt="Clinical Desk Workspace"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* ---------------- CARD 2: BOOKED WITHIN NEXT MONTH ---------------- */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[230px]">
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Booked within next month</span>
                <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center">
                  <CalendarIcon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Amount */}
              <div className="mt-1">
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">£ 142,560.00</h3>
                <p className="text-[11px] font-semibold text-[#4F46E5] flex items-center gap-1 mt-0.5">
                  <ArrowUp className="w-3 h-3 stroke-[3]" />
                  <span>8.2% from last month</span>
                </p>
              </div>
            </div>

            {/* Vertical Bar Chart (Jul, Aug, Sep, Sep, Oct, Nov, Dec) */}
            <div className="w-full pt-2">
              <div className="flex items-end justify-between h-20 px-1 gap-2">
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[30%] bg-indigo-200 rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Jul</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[45%] bg-indigo-300 rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Aug</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[60%] bg-indigo-400 rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Sep</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[52%] bg-indigo-400 rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Sep</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[72%] bg-[#6366F1] rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Oct</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[85%] bg-[#4F46E5] rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Nov</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[100%] bg-[#4338CA] rounded-full shadow-xs"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Dec</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------- CARD 3: AVERAGE CHAIR TIME PER PROCEDURE ---------------- */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[230px]">
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Average chair time</span>
                <div className="w-6 h-6 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-500 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Metric 16 days / 38 mins */}
              <div className="mt-1">
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                  16 <span className="text-sm font-semibold text-slate-500">days recall</span>
                </h3>
                <p className="text-[11px] font-semibold text-cyan-600 flex items-center gap-1 mt-0.5">
                  <ArrowDown className="w-3 h-3 stroke-[3]" />
                  <span>2 days faster turnaround</span>
                </p>
              </div>
            </div>

            {/* Smooth SVG Trend Line Chart */}
            <div className="w-full h-20 pt-2 flex items-end">
              <svg viewBox="0 0 240 80" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="clinical-line-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 5,72 C 30,68 50,60 70,62 C 90,64 110,48 130,46 C 150,44 170,30 190,26 C 210,22 225,12 235,10 L 235,80 L 5,80 Z"
                  fill="url(#clinical-line-gradient)"
                />
                <path
                  d="M 5,72 C 30,68 50,60 70,62 C 90,64 110,48 130,46 C 150,44 170,30 190,26 C 210,22 225,12 235,10"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="5" cy="72" r="3" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="70" cy="62" r="3" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="130" cy="46" r="3" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="190" cy="26" r="3" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="235" cy="10" r="3.5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* ---------------- CARD 4: AVAILABLE FOR INSTANT PAYOUT / CLAIMS ---------------- */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[230px]">
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Available for Instant Payout</span>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <button
                    onClick={() => triggerToast('Opening Instant Settlement Gateway')}
                    className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Amount & Expects Badge */}
              <div className="mt-1 flex items-baseline space-x-2">
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">£ 186,540.00</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                  Expects
                </span>
              </div>
            </div>

            {/* Bottom Row: 3 Payment/Insurance Claims Cards & Payout Button */}
            <div className="pt-2">
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Bupa Dental */}
                <button
                  onClick={() => setSelectedClaimMethod('bupa')}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                    selectedClaimMethod === 'bupa'
                      ? 'bg-gradient-to-b from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-[10px] tracking-widest font-mono">•••• 4242</p>
                  <p className="text-[10px] font-bold mt-1">Bupa</p>
                </button>

                {/* 2. Stripe Direct */}
                <button
                  onClick={() => setSelectedClaimMethod('stripe')}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                    selectedClaimMethod === 'stripe'
                      ? 'bg-gradient-to-b from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-[10px] tracking-widest font-mono">•••• 6789</p>
                  <p className="text-[10px] font-bold mt-1">Stripe</p>
                </button>

                {/* 3. AXA Health */}
                <button
                  onClick={() => setSelectedClaimMethod('axa')}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                    selectedClaimMethod === 'axa'
                      ? 'bg-gradient-to-b from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-[10px] tracking-widest font-mono">•••• 1234</p>
                  <p className="text-[10px] font-bold mt-1">AXA</p>
                </button>
              </div>

              {/* Payout Now Button */}
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => triggerToast(`Initiated direct settlement of £186,540 via ${selectedClaimMethod.toUpperCase()}!`)}
                  className="px-3.5 py-1.5 rounded-full bg-[#121626] hover:bg-slate-800 text-white text-[11px] font-bold shadow-2xs transition active:scale-95"
                >
                  Payout now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FILTERS BAR (Active filters, Clinicians, Status, Dates, Search) */}
        {/* ======================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          {/* Left: Filter Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Active filters badge */}
            <div className="flex items-center space-x-2 mr-1">
              <span className="text-xs font-bold text-slate-900">Active filters</span>
              <span className="w-5 h-5 rounded-full bg-[#121526] text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
            </div>

            {/* Dropdown: All Clinicians */}
            <button
              onClick={() => triggerToast('Filtering by: Dr. Sarah Jenkins')}
              className="px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition"
            >
              <span>All clinicians</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown: All statuses */}
            <button
              onClick={() => triggerToast('Filtering by: In-Chair & Confirmed')}
              className="px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition"
            >
              <span>All statuses</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Date Pill: November 2026 */}
            <button className="px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition">
              <span>November 2026</span>
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Date Pill: December 2026 */}
            <button className="px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition">
              <span>December 2026</span>
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Right: Search Input */}
          <div className="relative w-full lg:w-64">
            <input
              type="text"
              placeholder="Search patient, MRN, NHS #"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN BOTTOM WORKSPACE: CLINICAL QUEUE & PATIENT DOSSIER */}
        {/* ======================================================== */}
        <div className="bg-[#121526] rounded-3xl p-5 sm:p-7 text-white shadow-2xl space-y-6">
          
          {/* Header row of dark section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            {/* Title */}
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#818CF8]" />
              <span>Active Patient Queue & Treatments</span>
            </h2>

            {/* Tabs: All Patients | In-Chair 3 | Upcoming 5 */}
            <div className="bg-[#1D2138] p-1 rounded-full flex items-center space-x-1 border border-slate-700/50 text-xs">
              <button
                onClick={() => setSubFilterTab('all')}
                className={`px-4 py-1.5 rounded-full font-semibold transition ${
                  subFilterTab === 'all'
                    ? 'bg-[#4F46E5] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Invoices
              </button>

              <button
                onClick={() => setSubFilterTab('draft')}
                className={`px-3.5 py-1.5 rounded-full font-semibold transition flex items-center space-x-1.5 ${
                  subFilterTab === 'draft'
                    ? 'bg-[#4F46E5] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Draft</span>
                <span className="text-[10px] opacity-80">3</span>
              </button>

              <button
                onClick={() => setSubFilterTab('unpaid')}
                className={`px-4 py-1.5 rounded-full font-bold transition flex items-center space-x-1.5 ${
                  subFilterTab === 'unpaid'
                    ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Unpaid</span>
                <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">
                  5
                </span>
              </button>
            </div>

            {/* Right Tools Icons */}
            <div className="flex items-center space-x-2 text-slate-400 self-end sm:self-auto">
              <button
                onClick={() => triggerToast('Clinical Grid View toggled')}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => triggerToast('Practice Queue Settings')}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Two-Column Layout: Left Invoices/Queue List (5 cols) + Right Active Treatment Dossier (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* ---------------- LEFT: PATIENT QUEUE (5 Cols) ---------------- */}
            <div className="lg:col-span-5 space-y-2.5">
              {filteredPatients.map(pt => {
                const isSelected = pt.id === selectedPatientId;
                const formattedPrice = `£ ${pt.totalFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                return (
                  <div
                    key={pt.id}
                    onClick={() => setSelectedPatientId(pt.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#4F46E5] to-[#4338CA] text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40 ring-1 ring-white/10'
                        : 'bg-[#181C30]/80 hover:bg-[#1E233D] text-slate-300 border border-transparent'
                    }`}
                  >
                    {/* Left: Avatar + Details */}
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-white/20">
                        <img
                          src={pt.patientAvatar}
                          alt={pt.patientName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                          <span>{pt.id}</span>
                          <span className="text-[10px] text-slate-300 font-normal">({pt.patientName})</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{pt.dueTime}</p>
                      </div>
                    </div>

                    {/* Middle: Status Badge */}
                    <div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-xs'
                            : pt.status === 'In-Chair'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-[#1D2138] text-slate-400 border border-slate-700/50'
                        }`}
                      >
                        {pt.status === 'In-Chair' ? 'In-Chair' : pt.status === 'Pending Review' ? 'Unsent' : 'Viewed'}
                      </span>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right">
                      <span className="text-xs font-black text-white">{formattedPrice}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---------------- RIGHT: TREATMENT DETAILS PANEL (7 Cols) ---------------- */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#4D45BD] via-[#3E379F] to-[#342D8E] rounded-3xl p-6 sm:p-7 border border-indigo-400/20 shadow-2xl flex flex-col justify-between space-y-6">
              
              {/* Row 1: Invoice details | Company / Lead Clinician | Customer / Patient */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start border-b border-white/10 pb-5">
                {/* Col 1: Invoice / Appointment details */}
                <div>
                  <p className="text-[11px] text-indigo-200 font-medium">Invoice details</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <h3 className="text-2xl font-black text-white tracking-tight">{currentPatient.id}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-semibold backdrop-blur-xs border border-white/10">
                      Unsent
                    </span>
                  </div>
                </div>

                {/* Col 2: Company / Clinic Practice */}
                <div>
                  <p className="text-[11px] text-indigo-200 font-medium">Company</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg font-bold text-white">BrightWave</span>
                    {/* Stylized wave logo */}
                    <svg width="22" height="16" viewBox="0 0 24 16" fill="none" className="text-indigo-200">
                      <path
                        d="M2 12C5 12 7 8 10 8C13 8 15 12 18 12C20 12 21 10 22 9M2 7C5 7 7 3 10 3C13 3 15 7 18 7C20 7 21 5 22 4"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Col 3: Customer / Patient */}
                <div>
                  <p className="text-[11px] text-indigo-200 font-medium">Customer</p>
                  <div className="flex items-center space-x-2.5 mt-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                      <img
                        src={currentPatient.patientAvatar}
                        alt={currentPatient.patientName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{currentPatient.patientName}</p>
                      <p className="text-[10px] text-indigo-200">Marketing Director</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Line Items Cards Grid (3 item cards + 1 Add item card) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {currentPatient.procedures.map((proc, idx) => {
                  const procFormatted = `£ ${proc.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  return (
                    <div
                      key={proc.id}
                      onClick={() => triggerToast(`Procedure: ${proc.name} (${proc.category})`)}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-extrabold text-white">{procFormatted}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-indigo-200" />
                      </div>
                      <p className="text-[11px] text-indigo-200 font-medium mt-3 leading-tight">
                        {idx === 0 ? 'UI/UX Design' : idx === 1 ? 'Development' : 'QA & Testing'}
                      </p>
                    </div>
                  );
                })}

                {/* 4th Card: + Add item */}
                <button
                  onClick={() => setShowAddProcedureModal(true)}
                  className="border-2 border-dashed border-white/30 hover:border-white/60 hover:bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition text-white/80 active:scale-95"
                >
                  <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">Add item</span>
                </button>
              </div>

              {/* Row 3: Bottom Summary (Sub Total, Total, Balance Due, Payout Now) */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Figures */}
                <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                  <div>
                    <p className="text-[10px] text-indigo-200 uppercase font-semibold tracking-wider">Sub Total</p>
                    <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{formattedTotal}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-indigo-200 uppercase font-semibold tracking-wider">Total</p>
                    <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{formattedTotal}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-indigo-200 uppercase font-semibold tracking-wider">Balance Due</p>
                    <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{formattedTotal}</p>
                  </div>
                </div>

                {/* Right Tools & Payout Now CTA */}
                <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                  {/* Copy Share Link */}
                  <button
                    onClick={() => triggerToast(`Copied secure patient treatment plan link for ${currentPatient.id}`)}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition active:scale-95"
                    title="Copy Patient Portal Treatment Plan Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>

                  {/* Calendar / Recall Scheduler */}
                  <button
                    onClick={() => triggerToast(`Recall scheduled in 16 days for ${currentPatient.patientName}`)}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition active:scale-95"
                    title="Schedule Next Consultation"
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>

                  {/* Payout Now CTA */}
                  <button
                    onClick={handleDischargePatient}
                    className="px-6 py-2.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-lg transition active:scale-95"
                  >
                    Payout now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Left Badge (Matching Reference Screenshot "Visit site") */}
      <div className="fixed bottom-6 left-6 z-40">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-950 backdrop-blur-md text-white text-xs font-semibold transition border border-white/10 shadow-xl group active:scale-95"
        >
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          <span>Visit site</span>
        </Link>
      </div>

      {/* ======================================================== */}
      {/* MODAL: BOOK APPOINTMENT */}
      {/* ======================================================== */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-950">Book Clinical Appointment</h3>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Hemsworth"
                  value={newBookingForm.patientName}
                  onChange={e => setNewBookingForm({ ...newBookingForm, patientName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Clinician</label>
                  <select
                    value={newBookingForm.leadClinician}
                    onChange={e => setNewBookingForm({ ...newBookingForm, leadClinician: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  >
                    <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins</option>
                    <option value="Dr. Michael Vance">Dr. Michael Vance</option>
                    <option value="Dr. Arthur Davies">Dr. Arthur Davies</option>
                    <option value="Hygienist Pool">Hygienist Pool</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Surgery Suite</label>
                  <select
                    value={newBookingForm.roomSuite}
                    onChange={e => setNewBookingForm({ ...newBookingForm, roomSuite: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  >
                    <option value="Clinical Chair 1">Clinical Chair 1</option>
                    <option value="Surgical Suite 2">Surgical Suite 2</option>
                    <option value="Orthodontic Studio 4">Orthodontic Studio 4</option>
                    <option value="Hygiene Suite 3">Hygiene Suite 3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Procedure</label>
                  <input
                    type="text"
                    value={newBookingForm.procedureName}
                    onChange={e => setNewBookingForm({ ...newBookingForm, procedureName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Procedure Fee (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBookingForm.procedureAmount}
                    onChange={e => setNewBookingForm({ ...newBookingForm, procedureAmount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD PROCEDURE / MATERIAL */}
      {/* ======================================================== */}
      {showAddProcedureModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950">Add Clinical Procedure</h3>
              <button
                onClick={() => setShowAddProcedureModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProcedure} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Procedure Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Composite Bonding & Polish"
                  value={newProcedureForm.title}
                  onChange={e => setNewProcedureForm({ ...newProcedureForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Specialty</label>
                <select
                  value={newProcedureForm.category}
                  onChange={e => setNewProcedureForm({ ...newProcedureForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                >
                  <option value="Restorative">Restorative & Crowns</option>
                  <option value="Diagnostics">Diagnostics & X-Rays</option>
                  <option value="Periodontics">Periodontics & Gums</option>
                  <option value="Orthodontics">Orthodontics & Aligners</option>
                  <option value="Endodontics">Endodontics (Root Canal)</option>
                  <option value="Surgical">Surgical & Implants</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cost / Fee (£)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 650"
                  value={newProcedureForm.amount}
                  onChange={e => setNewProcedureForm({ ...newProcedureForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddProcedureModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  Save Procedure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
