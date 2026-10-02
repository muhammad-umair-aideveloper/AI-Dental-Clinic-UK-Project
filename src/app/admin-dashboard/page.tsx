'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  ExternalLink,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  name: string;
  amount: number;
}

interface Invoice {
  id: string;
  customerName: string;
  customerRole: string;
  customerAvatar: string;
  companyName: string;
  dueDate: string;
  status: 'Unsent' | 'Viewed' | 'Paid' | 'Draft';
  amount: number;
  items: InvoiceItem[];
}

const INITIAL_INVOICES: Invoice[] = [
  {
    id: '# INV-1001',
    customerName: 'Elena Rostova',
    customerRole: 'Product Director',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    companyName: 'Vertex BioTech',
    dueDate: 'In 2 days',
    status: 'Unsent',
    amount: 68750.00,
    items: [
      { id: 'item-1', name: 'Cloud Infrastructure Setup', amount: 28500.00 },
      { id: 'item-2', name: 'Security Audit & Compliance', amount: 24250.00 },
      { id: 'item-3', name: 'Database Optimization', amount: 16000.00 },
    ],
  },
  {
    id: '# INV-1002',
    customerName: 'Marcus Vance',
    customerRole: 'Chief Technology Officer',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    companyName: 'Nexus AI Studio',
    dueDate: 'In 4 days',
    status: 'Viewed',
    amount: 21480.00,
    items: [
      { id: 'item-1', name: 'Brand Identity Architecture', amount: 8480.00 },
      { id: 'item-2', name: 'Design System & Tokens', amount: 13000.00 },
    ],
  },
  {
    id: '# INV-1003',
    customerName: 'James Carter',
    customerRole: 'Marketing Director',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    companyName: 'BrightWave',
    dueDate: 'In 5 days',
    status: 'Unsent',
    amount: 47980.00,
    items: [
      { id: 'item-1', name: 'UI/UX Design', amount: 15990.00 },
      { id: 'item-2', name: 'Development', amount: 21250.00 },
      { id: 'item-3', name: 'QA & Testing', amount: 10740.00 },
    ],
  },
  {
    id: '# INV-1004',
    customerName: 'Sophia Chen',
    customerRole: 'VP of Operations',
    customerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
    companyName: 'Starlight MedTech',
    dueDate: 'In 16 days',
    status: 'Viewed',
    amount: 55230.00,
    items: [
      { id: 'item-1', name: 'Digital Lab Automation', amount: 32000.00 },
      { id: 'item-2', name: 'Integration Endpoints', amount: 23230.00 },
    ],
  },
  {
    id: '# INV-1005',
    customerName: 'David Kim',
    customerRole: 'Head of Growth',
    customerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80',
    companyName: 'Pulse Stream',
    dueDate: 'In 19 days',
    status: 'Viewed',
    amount: 6880.00,
    items: [
      { id: 'item-1', name: 'Performance Analytics Setup', amount: 6880.00 },
    ],
  },
];

export default function AdminDashboardPage() {
  // Top nav active tab
  const [navTab, setNavTab] = useState<'overview' | 'estimates' | 'invoices' | 'payments' | 'recurring' | 'checkouts'>('invoices');

  // Invoices list state
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('# INV-1003');
  const [subFilterTab, setSubFilterTab] = useState<'all' | 'draft' | 'unpaid'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Payment Method in Card 4
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'visa' | 'stripe' | 'paypal'>('stripe');

  // Modal & Toast States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Invoice Form
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    customerName: '',
    customerRole: 'Product Lead',
    companyName: '',
    dueDate: 'In 7 days',
    itemTitle: 'Consulting & Design',
    itemAmount: '12500.00',
  });

  // New Item Form
  const [newItemForm, setNewItemForm] = useState({
    title: '',
    amount: '',
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Find currently active invoice
  const currentInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || invoices[2] || invoices[0];

  // Filtering invoices
  const filteredInvoices = invoices.filter(inv => {
    if (subFilterTab === 'draft' && inv.status !== 'Draft') return false;
    if (subFilterTab === 'unpaid' && inv.status === 'Paid') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.id.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.companyName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate totals for active invoice
  const activeSubTotal = currentInvoice.items.reduce((acc, curr) => acc + curr.amount, 0);
  const formattedSubTotal = `$ ${activeSubTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Handle Add Item to current invoice
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.title.trim() || !newItemForm.amount) return;

    const val = parseFloat(newItemForm.amount);
    if (isNaN(val)) return;

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      name: newItemForm.title.trim(),
      amount: val,
    };

    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === currentInvoice.id) {
          const updatedItems = [...inv.items, newItem];
          const newTotal = updatedItems.reduce((acc, i) => acc + i.amount, 0);
          return {
            ...inv,
            items: updatedItems,
            amount: newTotal,
          };
        }
        return inv;
      })
    );

    setNewItemForm({ title: '', amount: '' });
    setShowAddItemModal(false);
    triggerToast(`Added "${newItem.name}" to ${currentInvoice.id}`);
  };

  // Handle Create Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceForm.customerName.trim() || !newInvoiceForm.companyName.trim()) return;

    const initialAmount = parseFloat(newInvoiceForm.itemAmount) || 15000;
    const newId = `# INV-${1000 + invoices.length + 1}`;

    const createdInvoice: Invoice = {
      id: newId,
      customerName: newInvoiceForm.customerName.trim(),
      customerRole: newInvoiceForm.customerRole,
      customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      companyName: newInvoiceForm.companyName.trim(),
      dueDate: newInvoiceForm.dueDate,
      status: 'Unsent',
      amount: initialAmount,
      items: [
        {
          id: `item-${Date.now()}`,
          name: newInvoiceForm.itemTitle || 'Professional Services',
          amount: initialAmount,
        },
      ],
    };

    setInvoices([createdInvoice, ...invoices]);
    setSelectedInvoiceId(newId);
    setShowCreateModal(false);
    triggerToast(`Created invoice ${newId} for ${createdInvoice.companyName}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F5FB] text-slate-900 flex flex-col font-sans selection:bg-[#4F46E5] selection:text-white p-3 sm:p-5 md:p-7 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#131627] text-white shadow-2xl flex items-center space-x-3 border border-slate-700 animate-fade-in">
          <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Main Wrapper */}
      <div className="max-w-[1520px] w-full mx-auto space-y-6">

        {/* ======================================================== */}
        {/* TOP NAVBAR (Exact copy of reference brand & pill nav) */}
        {/* ======================================================== */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-4 py-1">
          
          {/* Logo & Brand & Pill 80 */}
          <div className="flex items-center space-x-3 self-start lg:self-center">
            {/* Finnova Ribbon Mark */}
            <div className="w-10 h-10 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 28V12C10 9.79086 11.7909 8 14 8H16C18.2091 8 20 9.79086 20 12V24C20 26.2091 21.7909 28 24 28H26C28.2091 28 30 26.2091 30 24V12"
                  stroke="url(#finnova-grad)"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="finnova-grad" x1="10" y1="8" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#818CF8" />
                    <stop offset="0.5" stopColor="#6366F1" />
                    <stop offset="1" stopColor="#4F46E5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-slate-950 font-sans">FINNOVA</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Smart Finances, Better Business</p>
            </div>

            {/* Pill 80 */}
            <div className="ml-3 px-3 py-1 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-600">
              80
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
              Estimates
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
              <span>Invoices</span>
            </button>

            <button
              onClick={() => setNavTab('payments')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                navTab === 'payments'
                  ? 'bg-[#4F46E5] text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Payments
            </button>

            <button
              onClick={() => setNavTab('recurring')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                navTab === 'recurring'
                  ? 'bg-[#4F46E5] text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Recurring
            </button>

            <button
              onClick={() => setNavTab('checkouts')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                navTab === 'checkouts'
                  ? 'bg-[#4F46E5] text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Checkouts
            </button>
          </nav>

          {/* Right Action Icons & Avatar */}
          <div className="flex items-center space-x-2.5 self-end lg:self-center">
            {/* 1. Document / Spreadsheet Icon */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Spreadsheets"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            {/* 2. Currency Badge Icon */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Financial Statements"
            >
              <BadgeDollarSign className="w-4 h-4" />
            </button>

            {/* 3. Calendar Icon */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Calendar Schedules"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>

            {/* 4. Bag / Shopping Icon */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Orders & Payouts"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            {/* 5. Shuffle / Exchange Icon */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Transactions"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            {/* 6. Bell Notification with Alert Dot */}
            <button
              className="relative w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white"></span>
            </button>

            {/* 7. Settings Icon */}
            <button
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition"
              title="System Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Profile Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-2xs ml-1 cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* INVOICES TITLE ROW & CTA BUTTONS */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center space-x-3.5">
            {/* Back Button */}
            <button
              onClick={() => triggerToast('Navigating back...')}
              className="w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition active:scale-95 shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Invoices
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Manage and track all your invoices in one place.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Sliders / Filter Button */}
            <button
              className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95"
              title="Adjust Views"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Create an invoice Primary Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create an invoice</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TOP 4 SUMMARY METRIC CARDS */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* ---------------- CARD 1: OVERDUE ---------------- */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[230px] relative overflow-hidden">
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Overdue</span>
                <div className="w-5 h-5 rounded-full border border-red-300 bg-red-50 text-red-500 flex items-center justify-center font-bold text-[11px]">
                  !
                </div>
              </div>

              {/* Amount */}
              <div className="mt-1">
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">$ 24,850.00</h3>
                <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1 mt-0.5">
                  <ArrowUp className="w-3 h-3 stroke-[3]" />
                  <span>12.5% from last month</span>
                </p>
              </div>
            </div>

            {/* Bottom Desk Setup Photo (Minimalist Plant, Laptop, Desk Lamp) */}
            <div className="w-full h-24 rounded-2xl overflow-hidden mt-2 relative border border-slate-100 shadow-2xs">
              <img
                src="/images/desk-workspace.jpg"
                alt="Workspace Desk"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* ---------------- CARD 2: DUE WITHIN NEXT MONTH ---------------- */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[230px]">
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Due within next month</span>
                <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center">
                  <CalendarIcon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Amount */}
              <div className="mt-1">
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">$ 142,560.00</h3>
                <p className="text-[11px] font-semibold text-[#4F46E5] flex items-center gap-1 mt-0.5">
                  <ArrowUp className="w-3 h-3 stroke-[3]" />
                  <span>8.2% from last month</span>
                </p>
              </div>
            </div>

            {/* Vertical Bar Chart (Jul, Aug, Sep, Sep, Oct, Nov, Dec) */}
            <div className="w-full pt-2">
              <div className="flex items-end justify-between h-20 px-1 gap-2">
                {/* Jul */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[30%] bg-indigo-200 rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Jul</span>
                </div>
                {/* Aug */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[45%] bg-indigo-300 rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Aug</span>
                </div>
                {/* Sep 1 */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[60%] bg-indigo-400 rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Sep</span>
                </div>
                {/* Sep 2 */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[52%] bg-indigo-400 rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Sep</span>
                </div>
                {/* Oct */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[72%] bg-[#6366F1] rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Oct</span>
                </div>
                {/* Nov */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[85%] bg-[#4F46E5] rounded-full"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Nov</span>
                </div>
                {/* Dec */}
                <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full max-w-[12px] h-[100%] bg-[#4338CA] rounded-full shadow-xs"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Dec</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------- CARD 3: AVERAGE TIME TO GET PAID ---------------- */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[230px]">
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Average time to get paid</span>
                <div className="w-6 h-6 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-500 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Metric 16 days */}
              <div className="mt-1">
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                  16 <span className="text-sm font-semibold text-slate-500">days</span>
                </h3>
                <p className="text-[11px] font-semibold text-cyan-600 flex items-center gap-1 mt-0.5">
                  <ArrowDown className="w-3 h-3 stroke-[3]" />
                  <span>2 days from last month</span>
                </p>
              </div>
            </div>

            {/* Smooth SVG Trend Line Chart */}
            <div className="w-full h-20 pt-2 flex items-end">
              <svg viewBox="0 0 240 80" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="paid-line-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Gradient Fill under path */}
                <path
                  d="M 5,72 C 30,68 50,60 70,62 C 90,64 110,48 130,46 C 150,44 170,30 190,26 C 210,22 225,12 235,10 L 235,80 L 5,80 Z"
                  fill="url(#paid-line-gradient)"
                />
                {/* Curved Line */}
                <path
                  d="M 5,72 C 30,68 50,60 70,62 C 90,64 110,48 130,46 C 150,44 170,30 190,26 C 210,22 225,12 235,10"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Node Points */}
                <circle cx="5" cy="72" r="3" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="70" cy="62" r="3" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="130" cy="46" r="3" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="190" cy="26" r="3" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="235" cy="10" r="3.5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* ---------------- CARD 4: AVAILABLE FOR INSTANT PAYOUT ---------------- */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[230px]">
            <div>
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Available for Instant Payout</span>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <button className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Amount & Expects Badge */}
              <div className="mt-1 flex items-baseline space-x-2">
                <h3 className="text-2xl font-black text-slate-950 tracking-tight">$ 186,540.00</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                  Expects
                </span>
              </div>
            </div>

            {/* Bottom Row: 3 Payment Cards & Payout Button */}
            <div className="pt-2">
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Visa */}
                <button
                  onClick={() => setSelectedPaymentMethod('visa')}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                    selectedPaymentMethod === 'visa'
                      ? 'bg-gradient-to-b from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-[10px] tracking-widest font-mono">•••• 4242</p>
                  <p className="text-[10px] font-bold mt-1">Visa</p>
                </button>

                {/* 2. Stripe */}
                <button
                  onClick={() => setSelectedPaymentMethod('stripe')}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                    selectedPaymentMethod === 'stripe'
                      ? 'bg-gradient-to-b from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-[10px] tracking-widest font-mono">•••• 6789</p>
                  <p className="text-[10px] font-bold mt-1">Stripe</p>
                </button>

                {/* 3. PayPal */}
                <button
                  onClick={() => setSelectedPaymentMethod('paypal')}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                    selectedPaymentMethod === 'paypal'
                      ? 'bg-gradient-to-b from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-[10px] tracking-widest font-mono">•••• 1234</p>
                  <p className="text-[10px] font-bold mt-1">PayPal</p>
                </button>
              </div>

              {/* Payout Now Button */}
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => triggerToast(`Initiated instant payout to ${selectedPaymentMethod.toUpperCase()}!`)}
                  className="px-3.5 py-1.5 rounded-full bg-[#121626] hover:bg-slate-800 text-white text-[11px] font-bold shadow-2xs transition active:scale-95"
                >
                  Payout now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FILTERS BAR (Active filters, Customers, Status, Dates, Search) */}
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

            {/* Dropdown: All customers */}
            <button className="px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition">
              <span>All customers</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown: All statuses */}
            <button className="px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition">
              <span>All statuses</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Date Pill: November 2023 */}
            <button className="px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition">
              <span>November 2023</span>
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Date Pill: December 2023 */}
            <button className="px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition">
              <span>December 2023</span>
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Right: Search Input */}
          <div className="relative w-full lg:w-64">
            <input
              type="text"
              placeholder="Enter invoice #"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN BOTTOM WORKSPACE (Dark Slate/Navy Container) */}
        {/* ======================================================== */}
        <div className="bg-[#121526] rounded-3xl p-5 sm:p-7 text-white shadow-2xl space-y-6">
          
          {/* Header row of dark section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            {/* Title */}
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Unpaid Invoices
            </h2>

            {/* Tabs: All Invoices | Draft 3 | Unpaid 5 */}
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
              <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Two-Column Layout: Left Invoices List (40%) + Right Active Details (60%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* ---------------- LEFT: INVOICES LIST (5 Cols) ---------------- */}
            <div className="lg:col-span-5 space-y-2.5">
              {filteredInvoices.map(inv => {
                const isSelected = inv.id === selectedInvoiceId;
                const formattedPrice = `$ ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoiceId(inv.id)}
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
                          src={inv.customerAvatar}
                          alt={inv.customerName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{inv.id}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{inv.dueDate}</p>
                      </div>
                    </div>

                    {/* Middle: Badge */}
                    <div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'bg-[#1D2138] text-slate-400 border border-slate-700/50'
                        }`}
                      >
                        {inv.status}
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

            {/* ---------------- RIGHT: INVOICE DETAILS PANEL (7 Cols) ---------------- */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#4D45BD] via-[#3E379F] to-[#342D8E] rounded-3xl p-6 sm:p-7 border border-indigo-400/20 shadow-2xl flex flex-col justify-between space-y-6">
              
              {/* Row 1: Invoice details | Company | Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start border-b border-white/10 pb-5">
                {/* Col 1: Invoice Details */}
                <div>
                  <p className="text-[11px] text-indigo-200 font-medium">Invoice details</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <h3 className="text-2xl font-black text-white tracking-tight">{currentInvoice.id}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-semibold backdrop-blur-xs border border-white/10">
                      {currentInvoice.status}
                    </span>
                  </div>
                </div>

                {/* Col 2: Company */}
                <div>
                  <p className="text-[11px] text-indigo-200 font-medium">Company</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg font-bold text-white">{currentInvoice.companyName}</span>
                    {/* BrightWave stylized wave mark */}
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

                {/* Col 3: Customer */}
                <div>
                  <p className="text-[11px] text-indigo-200 font-medium">Customer</p>
                  <div className="flex items-center space-x-2.5 mt-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                      <img
                        src={currentInvoice.customerAvatar}
                        alt={currentInvoice.customerName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{currentInvoice.customerName}</p>
                      <p className="text-[10px] text-indigo-200">{currentInvoice.customerRole}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Line Items Cards Grid (3 item cards + 1 Add item card) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {currentInvoice.items.map(item => {
                  const itemFormatted = `$ ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  return (
                    <div
                      key={item.id}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-extrabold text-white">{itemFormatted}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-indigo-200" />
                      </div>
                      <p className="text-[11px] text-indigo-200 font-medium mt-3 leading-tight">
                        {item.name}
                      </p>
                    </div>
                  );
                })}

                {/* 4th Card: + Add item */}
                <button
                  onClick={() => setShowAddItemModal(true)}
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
                    <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{formattedSubTotal}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-indigo-200 uppercase font-semibold tracking-wider">Total</p>
                    <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{formattedSubTotal}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-indigo-200 uppercase font-semibold tracking-wider">Balance Due</p>
                    <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{formattedSubTotal}</p>
                  </div>
                </div>

                {/* Right Tools & Payout Now CTA */}
                <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                  {/* Link / Paperclip Icon */}
                  <button
                    onClick={() => triggerToast(`Copied payment link for ${currentInvoice.id}`)}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition active:scale-95"
                    title="Copy Share Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>

                  {/* Calendar Icon */}
                  <button
                    onClick={() => triggerToast(`Due date: ${currentInvoice.dueDate}`)}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/15 text-white flex items-center justify-center transition active:scale-95"
                    title="Change Schedule"
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>

                  {/* Payout Now CTA */}
                  <button
                    onClick={() => triggerToast(`Processing immediate payout of ${formattedSubTotal} via Stripe!`)}
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
      <div className="fixed bottom-4 left-4 z-40">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold hover:bg-slate-950 transition border border-white/10 shadow-lg"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Visit site</span>
        </Link>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE AN INVOICE */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950">Create New Invoice</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newInvoiceForm.customerName}
                  onChange={e => setNewInvoiceForm({ ...newInvoiceForm, customerName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Clinical Labs"
                  value={newInvoiceForm.companyName}
                  onChange={e => setNewInvoiceForm({ ...newInvoiceForm, companyName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Service</label>
                  <input
                    type="text"
                    value={newInvoiceForm.itemTitle}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, itemTitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoiceForm.itemAmount}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, itemAmount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD ITEM TO CURRENT INVOICE */}
      {/* ======================================================== */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950">Add Line Item</h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud API Architecture"
                  value={newItemForm.title}
                  onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 8500"
                  value={newItemForm.amount}
                  onChange={e => setNewItemForm({ ...newItemForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
