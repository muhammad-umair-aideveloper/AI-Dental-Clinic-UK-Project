'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useClinic } from '@/context/ClinicContext';
import {
  ShieldCheck,
  Star,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  Award,
} from 'lucide-react';

export const ClinicianSpotlight: React.FC = () => {
  const { clinicians, openBookingModal } = useClinic();
  const [selectedClinicianId, setSelectedClinicianId] = useState(clinicians[0]?.id || 'clin-alistair-vance');

  const activeClinician = clinicians.find(c => c.id === selectedClinicianId) || clinicians[0];

  const availableDays = [
    { day: 'Today', date: '2026-10-04' },
    { day: 'Tomorrow', date: '2026-10-05' },
    { day: 'Tuesday', date: '2026-10-06' },
    { day: 'Wednesday', date: '2026-10-07' },
  ];
  const [selectedDay, setSelectedDay] = useState(availableDays[0]);

  const slots = ['10:30 AM', '11:45 AM', '02:15 PM', '04:00 PM'];
  const [selectedSlot, setSelectedSlot] = useState(slots[1]);

  return (
    <section id="clinical-team" className="py-20 lg:py-28 bg-[#0F172A] text-white scroll-mt-16 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-slate-700/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold mb-3 uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>MANDATORY GDC REGISTERED CLINICIANS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-sans">
            Leading British Dental Surgeons &{' '}
            <span className="font-editorial italic font-normal text-emerald-300">
              Aesthetic Specialists.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Every clinician at Vertex Dental Lab is registered with the General Dental Council (GDC), ensuring the highest standard of UK clinical safety, continuous education, and ethical patient care.
          </p>
        </div>

        {/* 4 Clinician Profile Cards Grid (Mandatory GDC Credentials on each card) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {clinicians.map(clinician => {
            const isSelected = clinician.id === activeClinician.id;

            return (
              <div
                key={clinician.id}
                onClick={() => setSelectedClinicianId(clinician.id)}
                className={`rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-400/80 shadow-2xl ring-2 ring-emerald-500/30 -translate-y-1'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  {/* Portrait with GDC Overlay Badge */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-4 bg-slate-900 border border-slate-700">
                    <Image
                      src={clinician.photo}
                      alt={clinician.name}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    
                    {/* Mandatory GDC Registration Badge */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <span className="inline-block w-full text-center px-2 py-1 rounded-lg bg-[#0F172A]/90 backdrop-blur-md text-emerald-300 text-[11px] font-bold border border-emerald-500/40 truncate whitespace-nowrap">
                        {clinician.gdcNumber}
                      </span>
                    </div>
                  </div>

                  {/* Clinician Name & Title */}
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {clinician.name}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                    {clinician.title}
                  </p>

                  {/* Qualifications */}
                  <p className="text-[11px] text-slate-300 font-medium mt-1 leading-snug">
                    {clinician.credentials}
                  </p>

                  {/* Bio snippet */}
                  <p className="text-xs text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                    {clinician.bio}
                  </p>
                </div>

                {/* Specialties tags */}
                <div className="mt-4 pt-3 border-t border-slate-700/60">
                  <div className="flex flex-wrap gap-1">
                    {clinician.specialties.slice(0, 2).map((sp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                      {clinician.rating} ({clinician.reviewsCount})
                    </span>
                    <span className="text-[11px] text-slate-400">{clinician.experienceYears}+ Yrs Exp</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Clinician Deep-Dive & Embedded Interactive Booking Slot Picker */}
        <div className="rounded-3xl bg-slate-800/80 border border-slate-700 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Clinician Overview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Selected Lead Clinician</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {activeClinician.name}
              </h3>
              <p className="text-sm text-slate-300 font-semibold">
                {activeClinician.title} • {activeClinician.credentials}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeClinician.bio}
              </p>

              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-slate-900 text-emerald-300 font-bold border border-slate-700">
                  {activeClinician.gdcNumber}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 font-medium border border-slate-700">
                  {activeClinician.verifiedProcedures}+ Verified Procedures
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 font-medium border border-slate-700">
                  Harley St & London Practice
                </span>
              </div>
            </div>

            {/* Interactive Embedded Diary Slot Picker */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900 border border-slate-700 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
                    Book Directly with {activeClinician.name.split(' ')[1] || activeClinician.name}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  Diary Open
                </span>
              </div>

              {/* Day Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableDays.map(d => (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                      selectedDay.day === d.day
                        ? 'bg-emerald-500 text-slate-950 shadow-md scale-[1.02]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <div>{d.day}</div>
                    <div className="text-[10px] font-normal opacity-80">{d.date.slice(5)}</div>
                  </button>
                ))}
              </div>

              {/* Time Slots */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Timeslots:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {slots.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedSlot(t)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                        selectedSlot === t
                          ? 'bg-white text-slate-950 shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Consultation CTA */}
              <button
                onClick={() => openBookingModal(`Consultation with ${activeClinician.name}`)}
                className="w-full py-3.5 px-3 rounded-xl font-bold text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5 text-center"
              >
                <span className="truncate sm:whitespace-normal">Reserve Consultation for {selectedDay.day} at {selectedSlot}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
