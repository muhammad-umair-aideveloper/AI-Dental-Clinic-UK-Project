'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  BadgePercent,
  Layers,
} from 'lucide-react';

export const ServicesSection: React.FC = () => {
  const { services, openBookingModal, formatPrice, currency } = useClinic();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'General',
    'Preventive',
    'Endodontics',
    'Cosmetic',
    'Surgical',
    'Orthodontics',
    'Emergency',
  ];

  const filteredServices =
    selectedCategory === 'All'
      ? services
      : services.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <section id="services" className="relative py-20 lg:py-28 bg-[#F4F5F8] text-slate-900 scroll-mt-16 overflow-hidden">
      {/* Ambient background light spheres to accentuate glassmorphism refraction */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[480px] h-[480px] bg-slate-200/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-3/4 w-80 h-80 bg-cyan-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-2xs text-slate-800 text-xs font-bold mb-4 uppercase tracking-[0.18em]">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>CLINICAL TREATMENTS & VERIFIED FEES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight uppercase font-sans">
            In-House Precision.
            <br />
            <span className="text-slate-800">Transparent UK Pricing.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 font-medium">
            Every restoration is digitally scanned with 3D intraoral optical cameras and milled directly in our Marylebone 5-axis laboratory. Zero guesswork, zero hidden fees.
          </p>
        </div>

        {/* Emergency Fast-Track Glass Banner */}
        <div className="mb-12 p-4 sm:p-5 rounded-3xl bg-amber-50/80 backdrop-blur-xl border border-amber-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100/90 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950">
                Experiencing Acute Pain, Severe Swelling, or a Fractured Tooth?
              </p>
              <p className="text-xs text-amber-900 font-medium mt-0.5">
                We reserve daily emergency triage slots for fast clinical relief. Priority booking is currently open.
              </p>
            </div>
          </div>
          <button
            onClick={() => openBookingModal('24/7 Emergency Dental Care')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-xs text-white bg-amber-700 hover:bg-amber-800 transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-95"
          >
            Emergency Appointment
          </button>
        </div>

        {/* Category Filter Pills (Minimalist styling) */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-10 gap-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-950 text-white shadow-md shadow-slate-950/20 scale-[1.02]'
                  : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid with Luxury Glassmorphism and Ultra-Visible High-Contrast Text */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredServices.map(service => {
            const isEmergency = service.category === 'Emergency';
            const displayPrice =
              currency === 'GBP'
                ? service.priceRange
                : `From ${formatPrice(service.basePriceGbp)}`;

            return (
              <div
                key={service.id}
                className={`relative rounded-[28px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group ${
                  isEmergency
                    ? 'bg-rose-50/75 backdrop-blur-xl border border-rose-200/90 shadow-[0_8px_30px_rgb(225,29,72,0.06)] hover:shadow-[0_16px_40px_rgb(225,29,72,0.12)]'
                    : service.popular
                    ? 'bg-white/80 backdrop-blur-xl border border-white/95 shadow-[0_10px_35px_rgba(0,0,0,0.05)] ring-1 ring-sky-500/20 hover:border-sky-300 hover:bg-white/95 hover:shadow-[0_20px_45px_rgba(2,132,199,0.1)] hover:-translate-y-1'
                    : 'bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/5 hover:border-slate-300 hover:bg-white/95 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1'
                }`}
              >
                {/* Specular Inner Glare Overlay */}
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/50 via-transparent to-transparent pointer-events-none" />

                <div>
                  {/* Top Badges: Category & Popularity */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isEmergency
                          ? 'bg-rose-900 text-white shadow-2xs'
                          : 'bg-slate-900 text-white shadow-2xs'
                      }`}
                    >
                      {service.category}
                    </span>

                    {service.popular && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-200 flex items-center space-x-1 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-sky-600" />
                        <span>Most Popular</span>
                      </span>
                    )}
                  </div>

                  {/* Service Name - High contrast bold dark obsidian text */}
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug group-hover:text-sky-700 transition-colors relative z-10 font-sans">
                    {service.name}
                  </h3>

                  {/* Pricing Display - Bold, crisp, legible */}
                  <div className="mt-3 flex items-baseline space-x-2 relative z-10">
                    <span className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      {displayPrice}
                    </span>
                    <span className="text-xs font-bold text-slate-600 uppercase">
                      ({currency})
                    </span>
                  </div>

                  {/* Clinical Specs: Duration & 0% Finance */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold relative z-10">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100/90 text-slate-800 border border-slate-200/80">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-600" />
                      {service.duration}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold">
                      <BadgePercent className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                      0% Finance Eligible
                    </span>
                  </div>

                  {/* Description - High contrast dark slate (text-slate-700) */}
                  <p className="mt-4 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed relative z-10">
                    {service.description}
                  </p>

                  {/* Features Bullet List - Crisp dark text with checkmarks */}
                  {service.features && service.features.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-2 relative z-10">
                      {service.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-xs font-semibold text-slate-800 leading-snug">
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Pill Button */}
                <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center space-x-1.5 text-slate-700 text-[11px] font-bold">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>In-House Lab Warranty</span>
                  </div>

                  <button
                    onClick={() => openBookingModal(service.name)}
                    className="inline-flex items-center space-x-1.5 px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-sm shadow-slate-950/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <span>Book Now</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Clinical Guarantee Dock */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/95 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
              Vertex Dental Lab Precision Guarantee
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 font-medium max-w-2xl">
              All ceramic and zirconia restorations come with a 5-year structural warranty against chipping or breakage, backed by our in-house ISO certified 3D CAD/CAM laboratory in Marylebone.
            </p>
          </div>
          <button
            onClick={() => openBookingModal()}
            className="px-6 py-3 rounded-full text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-md shadow-slate-950/20 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            Schedule Consultation
          </button>
        </div>

      </div>
    </section>
  );
};
