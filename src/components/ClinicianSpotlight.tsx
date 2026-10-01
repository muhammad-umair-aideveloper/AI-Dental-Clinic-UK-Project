'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useClinic } from '@/context/ClinicContext';
import { LEAD_CLINICIAN } from '@/lib/default-data';
import {
  ShieldCheck,
  Star,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const ClinicianSpotlight: React.FC = () => {
  const { openBookingModal } = useClinic();

  // Embedded instant slot picker state
  const availableDays = [
    { day: 'Today', date: '2026-10-01', active: true },
    { day: 'Tomorrow', date: '2026-10-02', active: false },
    { day: 'Friday', date: '2026-10-03', active: false },
    { day: 'Saturday', date: '2026-10-04', active: false },
  ];
  const [selectedDay, setSelectedDay] = useState(availableDays[0]);

  const slots = [
    { time: '10:30 AM', period: 'Morning', status: 'Available' },
    { time: '11:45 AM', period: 'Morning', status: 'Available' },
    { time: '02:00 PM', period: 'Afternoon', status: 'Available' },
    { time: '04:15 PM', period: 'Afternoon', status: 'Available' },
  ];
  const [selectedSlot, setSelectedSlot] = useState(slots[2].time);

  const handleBookWithClinician = () => {
    openBookingModal();
  };

  return (
    <section id="clinicians" className="py-20 lg:py-28 bg-slate-900 text-white scroll-mt-16 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950 border border-sky-800 text-sky-400 text-xs font-bold mb-3 uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Clinical Leadership</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Meet Our Clinical Director & Lead Dental Surgeon
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Dedicated to gentle surgical precision, CAD/CAM aesthetic mastery, and personalized patient care.
          </p>
        </div>

        {/* Spotlight Card */}
        <div className="rounded-3xl bg-slate-800/80 border border-slate-700/80 p-6 sm:p-10 shadow-2xl backdrop-blur-sm grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Clinician Portrait & Verification Badges */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-64 sm:w-72 aspect-square rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl group">
              <Image
                src={LEAD_CLINICIAN.photo}
                alt={LEAD_CLINICIAN.name}
                width={500}
                height={500}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-sky-900/90 text-sky-200 text-xs font-semibold border border-sky-600">
                  {LEAD_CLINICIAN.gdcNumber}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center space-x-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-sm font-bold text-white">
                {LEAD_CLINICIAN.rating}
              </span>
              <span className="text-xs text-slate-400">
                ({LEAD_CLINICIAN.reviewsCount} Verified UK Reviews)
              </span>
            </div>
          </div>

          {/* Clinician Credentials & Embedded Interactive Slot Picker */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Royal College of Surgeons of England Affiliate</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {LEAD_CLINICIAN.name}
              </h3>
              <p className="text-sm font-medium text-slate-300 mt-1">
                {LEAD_CLINICIAN.title} • {LEAD_CLINICIAN.credentials}
              </p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {LEAD_CLINICIAN.bio}
            </p>

            {/* Key Clinical Metric Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
                <p className="text-xs text-slate-400">Clinical Practice</p>
                <p className="text-lg font-bold text-white">{LEAD_CLINICIAN.experienceYears}+ Years</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
                <p className="text-xs text-slate-400">Implants Placed</p>
                <p className="text-lg font-bold text-white">{LEAD_CLINICIAN.verifiedProcedures}+</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-400">Success Rate</p>
                <p className="text-lg font-bold text-emerald-400">99.4%</p>
              </div>
            </div>

            {/* Interactive Embedded Date & Time Slot Picker */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Book Directly into Dr. Vance&apos;s Diary
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  Slots Open This Week
                </span>
              </div>

              {/* Day Pills */}
              <div className="grid grid-cols-4 gap-2">
                {availableDays.map(d => (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-semibold transition-all ${
                      selectedDay.day === d.day
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <p className="font-bold">{d.day}</p>
                    <p className="text-[10px] text-slate-300 opacity-80">{d.date.slice(5)}</p>
                  </button>
                ))}
              </div>

              {/* Slot Pills */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-slate-400">Select consultation time slot:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {slots.map(s => (
                    <button
                      key={s.time}
                      onClick={() => setSelectedSlot(s.time)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
                        selectedSlot === s.time
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{s.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleBookWithClinician}
                className="w-full py-3 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 hover:opacity-90 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/10 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Confirm {selectedDay.day} at {selectedSlot} with Dr. Vance</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
