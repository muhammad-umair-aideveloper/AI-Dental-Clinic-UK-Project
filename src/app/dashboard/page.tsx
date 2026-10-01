'use client';

import React from 'react';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';
import {
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Plus,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Phone,
  LogOut,
} from 'lucide-react';

export default function PatientDashboardPage() {
  const {
    currentUser,
    appointments,
    openBookingModal,
    openChatDrawer,
    logout,
    companyDetails,
  } = useClinic();

  // If user is guest, show guest view with patient default demo data
  const patientName = currentUser.isLoggedIn ? currentUser.name : 'Charlotte Kensington';
  const patientEmail = currentUser.isLoggedIn ? currentUser.email : 'patient@vertexdental.co.uk';
  const patientPhone = currentUser.isLoggedIn ? currentUser.phone : '+44 7712 345678';

  // Filter appointments for this patient or show all initial for demo
  const userAppointments = appointments.filter(
    a => a.patientEmail.toLowerCase() === patientEmail.toLowerCase() || a.patientName.toLowerCase() === patientName.toLowerCase()
  );
  const displayAppointments = userAppointments.length > 0 ? userAppointments : appointments.slice(0, 2);

  const careStages = [
    {
      num: 1,
      title: 'Booked & Confirmed',
      desc: 'Digital reservation created in Vertex clinic system.',
      status: 'completed',
    },
    {
      num: 2,
      title: 'Triage & Verification',
      desc: 'Pre-clinical symptoms review & digital health check.',
      status: 'current',
    },
    {
      num: 3,
      title: 'Consultation Day',
      desc: 'In-person 3D scan & oral check with Dr. Vance.',
      status: 'upcoming',
    },
    {
      num: 4,
      title: 'Treatment & Aftercare',
      desc: 'Pain-free computerized therapy & lab follow-up.',
      status: 'upcoming',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Portal Nav */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Clinic Site</span>
            </Link>
            <span className="text-slate-600">|</span>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                Vertex Dental<span className="text-sky-400">Lab</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-900 text-sky-300 border border-sky-700">
                Patient Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => openBookingModal()}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-teal-300 hover:opacity-90 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Appointment</span>
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Verified UK Patient Account • GDC Practice Standards</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome back, {patientName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-sky-400" />
                  Role: Private Dental Patient
                </span>
                <span>•</span>
                <span>Email: {patientEmail}</span>
                <span>•</span>
                <span>Phone: {patientPhone}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={() => openBookingModal()}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 hover:opacity-95 shadow-md flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Book Another Treatment</span>
              </button>
              <button
                onClick={() => openChatDrawer('I want to ask about my current treatment plan and aftercare.')}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>AI Clinical Assistant</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4-Stage Patient Care Journey Tracker */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Active Care Journey</h2>
              <p className="text-xs text-slate-500">
                Current progress for your booked consultation & clinical pathway at Vertex Dental Lab.
              </p>
            </div>
            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Phase 2: Triage & Verification Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {careStages.map(stage => {
              const isDone = stage.status === 'completed';
              const isCurrent = stage.status === 'current';
              return (
                <div
                  key={stage.num}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : isCurrent
                      ? 'bg-sky-50 border-sky-300 text-sky-950 ring-2 ring-sky-500/10'
                      : 'bg-slate-50 border-slate-200 text-slate-500 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isDone ? '✓' : stage.num}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {isDone ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{stage.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments Table / List */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Appointments & Diary Entries</h2>
              <p className="text-xs text-slate-500">
                View confirmed bookings, procedure times, and lead clinician details.
              </p>
            </div>
            <button
              onClick={() => openBookingModal()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-sky-600 transition-colors shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Appointment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Treatment</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Clinician</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {apt.id}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div>
                        {apt.serviceName}
                        {apt.notes && (
                          <p className="text-[11px] font-normal text-slate-500 truncate max-w-xs">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 whitespace-nowrap">
                      <div className="flex items-center space-x-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 mr-1" />
                        <span>{apt.date}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400 mr-1" />
                        <span>{apt.timeSlot}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{apt.clinicianName}</span>
                      <p className="text-[10px] text-slate-400">GDC No. 248912</p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          apt.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : apt.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {apt.status === 'Confirmed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openChatDrawer(`I need to ask a question regarding appointment ${apt.id} for ${apt.serviceName}`)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                      >
                        Ask AI / Reschedule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinical Preparation & Clinic Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Arrive 10 Minutes Early</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please arrive 10 minutes prior to your time slot to complete digital medical history validation in our patient lounge.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Class-B Sterilization</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              All clinical suites undergo 100% vacuum autoclave sterilization and hospital-grade air turnover between every patient.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Emergency Support</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              If your symptoms change or worsen prior to your visit, call our emergency hotline directly at {companyDetails.helplinePhone}.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
