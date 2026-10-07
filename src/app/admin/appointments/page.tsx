'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Send,
  MapPin,
  HeartPulse,
  History,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  Bot,
  Database,
  Building,
} from 'lucide-react';
import { DBAppointment, DBAppointmentStatus, DBMessageLog, DBWaitlistEntry } from '@/lib/db';

export default function ReceptionistMicroDashboardPage() {
  const [appointments, setAppointments] = useState<DBAppointment[]>([]);
  const [messageLogs, setMessageLogs] = useState<DBMessageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | DBAppointmentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinician, setSelectedClinician] = useState('All Clinicians');
  const [selectedDate, setSelectedDate] = useState('');

  // Active Tab: Appointments Table vs WhatsApp Logs Audit vs Simulator
  const [activeTab, setActiveTab] = useState<'appointments' | 'logs' | 'automations'>('appointments');

  // Trigger feedback banner
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal / Preview state
  const [previewLog, setPreviewLog] = useState<DBMessageLog | null>(null);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const [aptRes, logsRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/messages'),
      ]);

      const aptData = await aptRes.json();
      const logsData = await logsRes.json();

      if (aptData.success) {
        setAppointments(aptData.appointments);
      }
      if (logsData.success) {
        setMessageLogs(logsData.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // 1-Click Status Update Handler
  const handleUpdateStatus = async (id: string, newStatus: DBAppointmentStatus) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, triggerAutomations: true }),
      });

      const data = await res.json();
      if (data.success) {
        if (newStatus === 'CANCELLED' && data.reclaimedSlot) {
          showNotification(
            `⚠️ Appointment #${id.slice(-6)} marked as CANCELLED. Slot released! ${
              data.waitlistAlerted
                ? `Waitlist patient ${data.waitlistAlerted.patientName} was automatically notified.`
                : 'No pending waitlist inquiries.'
            }`
          );
        } else if (newStatus === 'COMPLETED') {
          showNotification(`✅ Appointment marked COMPLETED. Post-Op Care WhatsApp payload dispatched to patient!`);
        } else {
          showNotification(`Appointment marked as ${newStatus}.`);
        }

        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Automated WhatsApp Lifecycle Trigger Simulation
  const handleTriggerLifecycleAction = async (action: 'SEND_T24' | 'SEND_T2' | 'SEND_POST_OP', appointmentId: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, appointmentId }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(
          action === 'SEND_T24'
            ? '⚡ T-24h Reminder Interactive Template dispatched via WhatsApp!'
            : action === 'SEND_T2'
            ? '🚗 T-2h Final Alert with Google Maps pin dispatched via WhatsApp!'
            : '💊 Post-Op Care Instructions dispatched via WhatsApp!'
        );
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run 6-Month Patient Recall Cron
  const handleRunRecallCron = async () => {
    try {
      const res = await fetch('/api/cron/patient-recall?force=true', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(`⏰ 6-Month Patient Recall Cron executed! Dispatched WhatsApp invites to ${data.dispatchedCount} overdue patients.`);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(apt => {
    if (statusFilter !== 'ALL' && apt.status !== statusFilter) return false;
    if (selectedClinician !== 'All Clinicians' && apt.clinicianName !== selectedClinician) return false;
    if (selectedDate && !apt.slotTime.startsWith(selectedDate)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.phoneNumber.includes(q) ||
        apt.treatmentType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans pb-16">
      {/* Top Reception Header */}
      <header className="bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
                V
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-wider uppercase">VERTEX DENTAL LAB</span>
                <span className="text-[10px] text-emerald-400 block -mt-1 font-semibold">Intelligence & Automation Engine</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
            >
              <span>Patient Website</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Banner Alert if action triggered */}
        {actionNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-white border-l-4 border-emerald-400 shadow-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-2.5 text-xs font-medium">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Title & Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Receptionist & Practice Automation Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time slot state management, WhatsApp lifecycle triggers, and 6-month retention recalls.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunRecallCron}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Run 6-Month Recall Cron</span>
            </button>
          </div>
        </div>

        {/* Real-Time Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Bookings</p>
            <p className="text-2xl font-black text-slate-950 mt-1">{appointments.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Live diary slots</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Confirmed</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {appointments.filter(a => a.status === 'CONFIRMED').length}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Ready for surgery</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending T-24h</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {appointments.filter(a => a.status === 'PENDING').length}
            </p>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">Awaiting patient reply</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Cancelled / Reclaimed</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {appointments.filter(a => a.status === 'CANCELLED').length}
            </p>
            <p className="text-[10px] text-rose-700 font-medium mt-0.5">Slot reclaimed for waitlist</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">WhatsApp Audit Logs</p>
            <p className="text-2xl font-black text-sky-600 mt-1">{messageLogs.length}</p>
            <p className="text-[10px] text-sky-700 font-medium mt-0.5">100% verified dispatches</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 space-x-2">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'appointments'
                ? 'border-slate-900 text-slate-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Appointments & Slot Engine ({filteredAppointments.length})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'logs'
                ? 'border-slate-900 text-slate-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Lifecycle Logs ({messageLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: APPOINTMENTS TABLE */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search patient, phone, or treatment..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50"
                  />
                </div>

                {/* Clinician Selector */}
                <select
                  value={selectedClinician}
                  onChange={e => setSelectedClinician(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
                >
                  <option value="All Clinicians">All Clinicians</option>
                  <option value="Dr. Alistair Vance">Dr. Alistair Vance</option>
                  <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins</option>
                  <option value="Dr. Michael Zhao">Dr. Michael Zhao</option>
                </select>

                {/* Date Filter */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
                />

                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                  >
                    Clear Date
                  </button>
                )}
              </div>

              {/* Status Pills */}
              <div className="flex items-center space-x-1">
                {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Patient & Contact</th>
                      <th className="py-3 px-4">Treatment</th>
                      <th className="py-3 px-4">Slot Time</th>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">1-Click Status Update</th>
                      <th className="py-3 px-4 text-right">Automations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          No appointments found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map(apt => {
                        const dateFormatted = new Date(apt.slotTime).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        });
                        const timeFormatted = new Date(apt.slotTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">{apt.patientName}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{apt.phoneNumber}</p>
                              {apt.isEmergency && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                                  Emergency Triage
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {apt.treatmentType}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <p className="font-bold text-slate-900">{dateFormatted}</p>
                              <p className="text-[11px] text-slate-500">{timeFormatted}</p>
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                              {apt.clinicianName}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  apt.status === 'CONFIRMED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : apt.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : apt.status === 'COMPLETED'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {apt.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center space-x-1">
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                                  disabled={apt.status === 'CONFIRMED'}
                                  title="Mark Confirmed"
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    apt.status === 'CONFIRMED'
                                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                                  disabled={apt.status === 'COMPLETED'}
                                  title="Mark Completed & Dispatch Post-Op Care"
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    apt.status === 'COMPLETED'
                                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                      : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                                  }`}
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                                  disabled={apt.status === 'CANCELLED'}
                                  title="Cancel & Reclaim Slot for Waitlist"
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    apt.status === 'CANCELLED'
                                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center space-x-1.5">
                                <button
                                  onClick={() => handleTriggerLifecycleAction('SEND_T24', apt.id)}
                                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                                  title="Test T-24h Reminder WhatsApp"
                                >
                                  ⚡ T-24h
                                </button>
                                <button
                                  onClick={() => handleTriggerLifecycleAction('SEND_T2', apt.id)}
                                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                                  title="Test T-2h Final Alert WhatsApp"
                                >
                                  📍 T-2h
                                </button>
                                <button
                                  onClick={() => handleTriggerLifecycleAction('SEND_POST_OP', apt.id)}
                                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                                  title="Test Post-Op Care WhatsApp"
                                >
                                  💊 Post-Op
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WHATSAPP LIFECYCLE AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Automated WhatsApp Notification & Lifecycle Audit Trail
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time webhook events, delivery receipts, and automated care dispatches.
                </p>
              </div>

              <div className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Cloud API Webhook: Active
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Trigger Type</th>
                      <th className="py-3 px-4">Template Name</th>
                      <th className="py-3 px-4">Message Snippet</th>
                      <th className="py-3 px-4">Delivery Status</th>
                      <th className="py-3 px-4 text-right">Dispatched At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {messageLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          No message logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      messageLogs.map(log => (
                        <tr
                          key={log.id}
                          onClick={() => setPreviewLog(log)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900">{log.patientName || 'Patient'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{log.patientPhone}</p>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.messageType === 'T24_REMINDER'
                                  ? 'bg-amber-100 text-amber-800'
                                  : log.messageType === 'T2_FINAL_ALERT'
                                  ? 'bg-purple-100 text-purple-800'
                                  : log.messageType === 'POST_OP_CARE'
                                  ? 'bg-sky-100 text-sky-800'
                                  : log.messageType === 'RECALL_6_MONTH'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {log.messageType}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {log.templateName}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">
                            {log.content}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                log.status === 'READ'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.status === 'DELIVERED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              ✓✓ {log.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right text-slate-500 whitespace-nowrap">
                            {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Message Log Details Drawer Modal */}
        {previewLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp Payload Preview</h3>
                </div>
                <button onClick={() => setPreviewLog(null)} className="text-slate-400 hover:text-slate-700 text-sm">
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Recipient:</span>
                  <span className="font-bold text-slate-800">{previewLog.patientName} ({previewLog.patientPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Template Name:</span>
                  <span className="font-mono text-slate-700">{previewLog.templateName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Delivery Status:</span>
                  <span className="font-bold text-emerald-700">✓✓ {previewLog.status}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans shadow-inner">
                {previewLog.content}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setPreviewLog(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
