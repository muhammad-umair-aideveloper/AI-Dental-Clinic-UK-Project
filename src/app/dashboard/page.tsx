'use client';

/**
 * src/app/dashboard/page.tsx
 *
 * Vertex Dental Lab — Live Admin Dashboard (London, UK)
 * 
 * Features:
 * - Fetches appointments from Supabase sorted by appointment_date ASC, appointment_time ASC
 * - Supabase Realtime (postgres_changes on public.appointments) for live updates without page refresh
 * - Filter toggle: "Today's Appointments" vs "All Upcoming Appointments" vs "All"
 * - Displays: Customer Name, Date, Time, Service, Phone, 1-Hr SMS Reminder status, Google Sheets status
 * - Quick search by patient name, phone, or service
 */

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Calendar,
  Clock,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Radio,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

interface AppointmentItem {
  id: string;
  customer_name: string;
  phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reminder_1hr_sent: boolean;
  google_sheet_synced: boolean;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'today' | 'upcoming' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Compute current date in Europe/London timezone (YYYY-MM-DD)
  const todayLondon = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date());

      const m: Record<string, string> = {};
      for (const p of parts) if (p.type !== 'literal') m[p.type] = p.value;
      return `${m.year}-${m.month}-${m.day}`;
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }, []);

  // Fetch appointments from Supabase (or fallback to /api/book)
  const fetchAppointments = async () => {
    setLoading(true);
    setErrorNotice(null);

    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          const mapped: AppointmentItem[] = data.map((d: any) => ({
            id: d.id,
            customer_name: d.customer_name || d.patient_name || 'Patient',
            phone: d.phone || d.phone_number || '',
            service: d.service || d.reason || 'General Consultation',
            appointment_date: d.appointment_date || (d.slot_time ? d.slot_time.slice(0, 10) : ''),
            appointment_time: (d.appointment_time || (d.slot_time ? d.slot_time.slice(11, 16) : '')).slice(0, 5),
            status: d.status || 'CONFIRMED',
            reminder_1hr_sent: !!d.reminder_1hr_sent,
            google_sheet_synced: !!d.google_sheet_synced,
            created_at: d.created_at || new Date().toISOString(),
          }));
          setAppointments(mapped);
          setLastRefreshed(new Date());
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn('[Dashboard] Supabase client query failed, falling back to API:', err.message);
      }
    }

    // Fallback: Fetch via Next.js internal API
    try {
      const res = await fetch('/api/appointments');
      const json = await res.json();
      if (json.success && Array.isArray(json.appointments)) {
        const mapped: AppointmentItem[] = json.appointments.map((d: any) => ({
          id: d.id,
          customer_name: d.customer_name || d.patient_name || 'Patient',
          phone: d.phone || d.phone_number || '',
          service: d.service || d.reason || 'General Consultation',
          appointment_date: d.appointment_date || (d.slot_time ? d.slot_time.slice(0, 10) : ''),
          appointment_time: (d.appointment_time || (d.slot_time ? d.slot_time.slice(11, 16) : '')).slice(0, 5),
          status: d.status || 'CONFIRMED',
          reminder_1hr_sent: !!d.reminder_1hr_sent,
          google_sheet_synced: !!d.google_sheet_synced,
          created_at: d.created_at || new Date().toISOString(),
        }));
        setAppointments(mapped);
      }
    } catch (err: any) {
      setErrorNotice('Could not load appointments. Please check network connection.');
    } finally {
      setLastRefreshed(new Date());
      setLoading(false);
    }
  };

  // Setup Supabase Realtime Subscription
  useEffect(() => {
    fetchAppointments();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('live-admin-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('[Supabase Realtime] Change received:', payload);

          if (payload.eventType === 'INSERT') {
            const raw = payload.new as any;
            const apptDate = raw.appt_date || raw.appointment_date || (raw.slot_time ? raw.slot_time.slice(0, 10) : '');
            const apptTime = (raw.appt_time || raw.appointment_time || (raw.slot_time ? raw.slot_time.slice(11, 16) : '')).slice(0, 5);

            const newItem: AppointmentItem = {
              id: raw.id,
              customer_name: raw.customer_name || raw.patient_name || 'Patient',
              phone: raw.customer_phone || raw.phone || raw.phone_number || '',
              service: raw.service || raw.reason || 'General Consultation',
              appointment_date: apptDate,
              appointment_time: apptTime,
              status: raw.status || 'CONFIRMED',
              reminder_1hr_sent: !!(raw.reminder_sent || raw.reminder_1hr_sent),
              google_sheet_synced: !!raw.google_sheet_synced,
              created_at: raw.created_at || new Date().toISOString(),
            };

            setAppointments((prev) => {
              const filtered = prev.filter((a) => a.id !== newItem.id);
              const combined = [...filtered, newItem];
              return combined.sort((a, b) => {
                const cmpDate = a.appointment_date.localeCompare(b.appointment_date);
                if (cmpDate !== 0) return cmpDate;
                return a.appointment_time.localeCompare(b.appointment_time);
              });
            });
          } else if (payload.eventType === 'UPDATE') {
            const raw = payload.new as any;
            const apptDate = raw.appt_date || raw.appointment_date;
            const apptTime = (raw.appt_time || raw.appointment_time);

            setAppointments((prev) =>
              prev.map((a) =>
                a.id === raw.id
                  ? {
                      ...a,
                      customer_name: raw.customer_name || raw.patient_name || a.customer_name,
                      phone: raw.customer_phone || raw.phone || raw.phone_number || a.phone,
                      service: raw.service || raw.reason || a.service,
                      appointment_date: apptDate || a.appointment_date,
                      appointment_time: apptTime ? apptTime.slice(0, 5) : a.appointment_time,
                      status: raw.status || a.status,
                      reminder_1hr_sent: !!(raw.reminder_sent || raw.reminder_1hr_sent),
                      google_sheet_synced: !!raw.google_sheet_synced,
                    }
                  : a
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const raw = payload.old as any;
            setAppointments((prev) => prev.filter((a) => a.id !== raw.id));
          }
          setLastRefreshed(new Date());
        }
      )
      .subscribe((status) => {
        setRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered & Searched Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // 1. Tab filter
      if (filterMode === 'today') {
        if (apt.appointment_date !== todayLondon) return false;
      } else if (filterMode === 'upcoming') {
        if (apt.appointment_date < todayLondon || apt.status === 'CANCELLED') return false;
      }

      // 2. Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = apt.customer_name.toLowerCase().includes(q);
        const matchesPhone = apt.phone.includes(q);
        const matchesService = apt.service.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesService;
      }

      return true;
    });
  }, [appointments, filterMode, searchQuery, todayLondon]);

  // Statistics counters
  const stats = useMemo(() => {
    const todayCount = appointments.filter((a) => a.appointment_date === todayLondon).length;
    const upcomingCount = appointments.filter((a) => a.appointment_date >= todayLondon && a.status !== 'CANCELLED').length;
    const remindersSentCount = appointments.filter((a) => a.reminder_1hr_sent).length;
    const sheetsSyncedCount = appointments.filter((a) => a.google_sheet_synced).length;

    return { todayCount, upcomingCount, remindersSentCount, sheetsSyncedCount };
  }, [appointments, todayLondon]);

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 font-bold text-lg">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Vertex Dental Lab</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  London Practice
                </span>
              </div>
              <p className="text-xs text-slate-400">Live Clinical Reception & Booking Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Realtime Status Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                realtimeActive
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-800 text-amber-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${realtimeActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {realtimeActive ? 'Live Realtime Active' : 'Polling Sync'}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAppointments}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Refresh Appointments"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/admin-dashboard"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition shadow-sm"
            >
              Staff CMS & Leads →
            </Link>

            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-sm"
            >
              Patient Website →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1e293b]/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Today&apos;s Appointments</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.todayCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">London Date: {todayLondon}</div>
          </div>

          <div className="bg-[#1e293b]/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Upcoming Bookings</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.upcomingCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Confirmed clinical visits</div>
          </div>

          <div className="bg-[#1e293b]/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>1-Hr SMS Reminders</span>
              <Phone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.remindersSentCount}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Twilio UK SMS active
            </div>
          </div>

          <div className="bg-[#1e293b]/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Google Sheets Synced</span>
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.sheetsSyncedCount}</div>
            <div className="text-[11px] text-teal-400 mt-1">Real-time spreadsheet mirror</div>
          </div>
        </div>

        {/* Action Bar: Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start">
            <button
              onClick={() => setFilterMode('today')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                filterMode === 'today'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Today&apos;s Appointments ({stats.todayCount})
            </button>
            <button
              onClick={() => setFilterMode('upcoming')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                filterMode === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Upcoming ({stats.upcomingCount})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Records ({appointments.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, phone, service..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* Error Notice if any */}
        {errorNotice && (
          <div className="p-4 mb-6 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center justify-between">
            <span>{errorNotice}</span>
            <button onClick={() => setErrorNotice(null)} className="underline hover:no-underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Appointments Table Card */}
        <div className="bg-[#131d31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Time (London)</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">1-Hr SMS Reminder</th>
                  <th className="py-3.5 px-4">Google Sheet</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                        <span>Synchronizing live clinic appointments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Calendar className="w-8 h-8 text-slate-600" />
                        <span className="font-medium text-slate-300">No appointments found</span>
                        <span className="text-xs text-slate-500">
                          {searchQuery
                            ? `No records match "${searchQuery}"`
                            : filterMode === 'today'
                            ? `No appointments scheduled for today (${todayLondon})`
                            : 'No upcoming appointments in the database'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Customer Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-xs uppercase">
                            {apt.customer_name.charAt(0)}
                          </div>
                          <span>{apt.customer_name}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{apt.appointment_date}</span>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 font-bold text-cyan-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-500" />
                          <span>{apt.appointment_time}</span>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3.5 px-4 text-slate-200">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700">
                          {apt.service}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <a
                          href={`tel:${apt.phone}`}
                          className="font-mono text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-500" />
                          {apt.phone}
                        </a>
                      </td>

                      {/* 1-Hr SMS Reminder status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {apt.reminder_1hr_sent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/80">
                            <Clock3 className="w-3 h-3" /> Scheduled
                          </span>
                        )}
                      </td>

                      {/* Google Sheet Synced */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {apt.google_sheet_synced ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-950 text-teal-400 border border-teal-800">
                            <CheckCircle2 className="w-3 h-3" /> Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : apt.status === 'COMPLETED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="py-3 px-4 bg-[#0f172a] border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Showing {filteredAppointments.length} of {appointments.length} total records
            </span>
            <span>
              Last refreshed: {lastRefreshed.toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })} London Time
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
