'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ShieldCheck,
  Building,
  LogOut,
  ChevronRight,
  ExternalLink,
  Lock,
  Send,
} from 'lucide-react';
import { AppointmentRecord, AppointmentStatus } from '@/lib/appointments/types';

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [quickDateFilter, setQuickDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW'>('ALL');

  // Action notification banner
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSendingReport, setIsSendingReport] = useState(false);

  const getTodayDateStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Fetch appointments from protected API
  const fetchAppointments = useCallback(async (dateParam?: string) => {
    setIsRefreshing(true);
    setErrorMessage(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
    const dateQuery = dateParam !== undefined ? dateParam : selectedDate;
    const url = `/api/appointments${dateQuery ? `?date=${dateQuery}` : ''}`;

    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401) {
        // Unauthorized: redirect to login
        router.replace('/admin-login');
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setAppointments(data.appointments || []);
      } else {
        setErrorMessage(data.error || 'Failed to load appointments.');
      }
    } catch {
      setErrorMessage('Network error while connecting to clinic database.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router, selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Handle Quick Date Pill change
  const handleQuickDateChange = (filter: 'ALL' | 'TODAY' | 'TOMORROW') => {
    setQuickDateFilter(filter);
    if (filter === 'ALL') {
      setSelectedDate('');
      fetchAppointments('');
    } else if (filter === 'TODAY') {
      const today = getTodayDateStr();
      setSelectedDate(today);
      fetchAppointments(today);
    } else {
      const tomorrow = getTomorrowDateStr();
      setSelectedDate(tomorrow);
      fetchAppointments(tomorrow);
    }
  };

  // Handle Specific Date Input change
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedDate(val);
    setQuickDateFilter(val === getTodayDateStr() ? 'TODAY' : val === getTomorrowDateStr() ? 'TOMORROW' : 'ALL');
    fetchAppointments(val);
  };

  // Status Update: Mark Completed or Cancel
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    setProcessingId(id);
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;

    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (newStatus === 'CANCELLED') {
          showNotification(`⚠️ Appointment #${id.slice(-6)} CANCELLED. Slot released back to public availability.`);
        } else if (newStatus === 'COMPLETED') {
          showNotification(`✅ Appointment #${id.slice(-6)} marked as COMPLETED.`);
        } else {
          showNotification(`Appointment #${id.slice(-6)} status updated to ${newStatus}.`);
        }
        fetchAppointments();
      } else {
        showNotification(`Failed to update appointment: ${data.error || 'Unknown error'}`);
      }
    } catch {
      showNotification('Network error while updating appointment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_session_token');
      localStorage.removeItem('vdl_user_v5');
    }
    router.replace('/admin-login');
  };

  // Filter in-memory for search query and status tab
  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      apt.patient_name.toLowerCase().includes(q) ||
      apt.phone_number.includes(q) ||
      apt.reason.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Calculate dynamic stats
  const todayStr = getTodayDateStr();
  const todayCount = appointments.filter(a => (a.london_date || a.slot_time.slice(0, 10)) === todayStr && a.status !== 'CANCELLED').length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter(a => a.status === 'CANCELLED').length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans flex flex-col">
      {/* Top Clinical Admin Navbar */}
      <header className="bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
              V
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-black tracking-tight text-white">Vertex Dental Lab</h1>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Staff Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Appointments Diary • Europe/London (BST/GMT)</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-xs text-slate-300 hover:text-white flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <span>Public Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        
        {/* Top Metric Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Today's Schedule</span>
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0F172A]">
              {todayCount}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              {todayCount === 1 ? '1 appointment today' : `${todayCount} appointments today`}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Active Confirmed</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              {confirmedCount}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Awaiting treatment</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              {completedCount}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Care finished</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Cancelled / Freed</span>
              <XCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-500">
              {cancelledCount}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Slots reclaimed</p>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center justify-between animate-fade-in border border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Controls, Filters & Search Strip */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">
                Clinic Appointments Diary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Protected administrative view • Real-time double-booking exclusion constraint active
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => fetchAppointments()}
                disabled={isRefreshing}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-2 border-t border-slate-100">
            {/* Quick Date Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => handleQuickDateChange('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  quickDateFilter === 'ALL' && !selectedDate
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Dates
              </button>
              <button
                type="button"
                onClick={() => handleQuickDateChange('TODAY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  quickDateFilter === 'TODAY'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Today ({todayCount})
              </button>
              <button
                type="button"
                onClick={() => handleQuickDateChange('TOMORROW')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  quickDateFilter === 'TOMORROW'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Tomorrow
              </button>

              {/* Specific Date Picker */}
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateInputChange}
                className="p-1.5 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
              />
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, phone, reason..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1 border-b border-slate-100 pb-2 text-xs">
            {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                  statusFilter === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL' ? 'All Statuses' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments Table Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Loading State */}
          {isLoading && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Loading appointments from Supabase...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && errorMessage && (
            <div className="py-16 text-center space-y-3 px-4">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-sm font-bold text-slate-900">{errorMessage}</p>
              <button
                onClick={() => fetchAppointments()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !errorMessage && filteredAppointments.length === 0 && (
            <div className="py-20 text-center space-y-3 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Appointments Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {selectedDate
                  ? `There are no appointments scheduled for ${selectedDate}.`
                  : 'There are no appointments matching your current filter criteria.'}
              </p>
              {selectedDate && (
                <button
                  onClick={() => handleQuickDateChange('ALL')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  View All Dates
                </button>
              )}
            </div>
          )}

          {/* Appointments List View */}
          {!isLoading && !errorMessage && filteredAppointments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Patient Name & Phone</th>
                    <th className="py-3 px-4">Treatment / Reason</th>
                    <th className="py-3 px-4">Date & Time (London)</th>
                    <th className="py-3 px-4">Clinician</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map(apt => {
                    const isProcessing = processingId === apt.id;
                    const isCancelled = apt.status === 'CANCELLED';
                    const isCompleted = apt.status === 'COMPLETED';

                    return (
                      <tr
                        key={apt.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCancelled ? 'opacity-50 bg-slate-50/40' : ''
                        }`}
                      >
                        {/* Patient & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{apt.patient_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{apt.phone_number}</span>
                          </div>
                          {apt.reminder_consent && (
                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 inline-block mt-0.5">
                              Reminder Consented
                            </span>
                          )}
                        </td>

                        {/* Reason / Treatment */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="font-semibold text-slate-800 line-clamp-1">{apt.reason}</div>
                          {apt.notes && (
                            <div className="text-[10px] text-slate-400 line-clamp-1 italic">{apt.notes}</div>
                          )}
                        </td>

                        {/* Date & Time (Europe/London) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {apt.london_date || apt.slot_time.slice(0, 10)}
                          </div>
                          <div className="text-[11px] text-emerald-800 font-semibold flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{apt.london_time || apt.slot_time.slice(11, 16)}</span>
                          </div>
                        </td>

                        {/* Clinician */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium">
                          {apt.clinician_name}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {apt.status === 'CONFIRMED' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              Confirmed
                            </span>
                          )}
                          {apt.status === 'COMPLETED' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Completed
                            </span>
                          )}
                          {apt.status === 'CANCELLED' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 line-through">
                              Cancelled
                            </span>
                          )}
                          {apt.status === 'PENDING' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* 1-Click Administrative Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            {!isCompleted && !isCancelled && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/80 transition-colors disabled:opacity-50"
                                title="Mark Completed"
                              >
                                Mark Completed
                              </button>
                            )}

                            {!isCancelled && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200/80 transition-colors disabled:opacity-50"
                                title="Cancel appointment (slot becomes free again)"
                              >
                                Cancel Slot
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
