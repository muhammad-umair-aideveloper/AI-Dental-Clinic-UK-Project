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
  Calendar,
  HelpCircle,
} from 'lucide-react';

export const ServicesSection: React.FC = () => {
  const { services, openBookingModal, formatPrice, currency } = useClinic();
  const [activeTab, setActiveTab] = useState<'All' | 'General' | 'Cosmetic'>('Cosmetic');
  const [activeFinanceTooltip, setActiveFinanceTooltip] = useState<string | null>(null);

  // Group services
  const generalServices = services.filter(
    s => s.category === 'General' || s.category === 'Preventive' || s.category === 'Endodontics' || s.category === 'Surgical' || s.category === 'Emergency'
  );

  const cosmeticServices = services.filter(
    s => s.category === 'Cosmetic' || s.category === 'Orthodontics'
  );

  const displayedServices =
    activeTab === 'All'
      ? services
      : activeTab === 'General'
      ? generalServices
      : cosmeticServices;

  return (
    <section id="services" className="relative py-20 lg:py-28 bg-[#FAF9F6] text-slate-900 scroll-mt-16 overflow-hidden border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold mb-4 uppercase tracking-[0.18em]">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>TRANSPARENT UK PRIVATE DENTAL CARE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-tight font-sans">
            Specialist Treatments &{' '}
            <span className="font-editorial italic font-normal text-slate-800">
              Clear Pricing.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal">
            Precision clinical dentistry crafted in our Marylebone 5-axis CAD/CAM laboratory. Split between daily general health and transformative cosmetic aesthetics.
          </p>
        </div>

        {/* Category Split Toggle: General vs Cosmetic Dentistry */}
        <div className="flex justify-center mb-12 px-2">
          <div className="flex flex-wrap sm:inline-flex justify-center gap-1 p-1 sm:p-1.5 rounded-2xl sm:rounded-full bg-slate-200/80 border border-slate-300/60 shadow-inner max-w-full">
            <button
              onClick={() => setActiveTab('Cosmetic')}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'Cosmetic'
                  ? 'bg-[#0F172A] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              ✨ Cosmetic & Orthodontics
            </button>
            <button
              onClick={() => setActiveTab('General')}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'General'
                  ? 'bg-[#0F172A] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              🦷 General & Specialist
            </button>
            <button
              onClick={() => setActiveTab('All')}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'All'
                  ? 'bg-[#0F172A] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              All Treatments ({services.length})
            </button>
          </div>
        </div>

        {/* Treatments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedServices.map(service => {
            const isCosmetic = service.category === 'Cosmetic' || service.category === 'Orthodontics';
            const isEmergency = service.category === 'Emergency';
            const displayPrice =
              currency === 'GBP'
                ? service.priceRange
                : `From ${formatPrice(service.basePriceGbp)}`;

            // Calculate 0% finance monthly (12 months on amount > £1,000)
            const monthlyFinance = service.financeMonthlyFrom
              ? `£${service.financeMonthlyFrom}/mo`
              : service.basePriceGbp >= 1000
              ? `£${Math.round(service.basePriceGbp / 24)}/mo`
              : null;

            return (
              <div
                key={service.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative"
              >
                <div>
                  {/* Category Pill & Popular Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isEmergency
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isCosmetic
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {service.category} Dentistry
                    </span>

                    {service.popular && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Most Requested</span>
                      </span>
                    )}
                  </div>

                  {/* Treatment Name */}
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug group-hover:text-emerald-800 transition-colors font-sans">
                    {service.name}
                  </h3>

                  {/* Treatment Summary */}
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                    {service.description}
                  </p>

                  {/* "What to Expect" & Timeline Box */}
                  <div className="mt-5 p-3.5 rounded-2xl bg-[#FAF9F6] border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Typical Timeline:</span>
                      </span>
                      <span className="text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md text-[11px]">
                        {service.duration}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200/60 space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">What to expect:</p>
                      {service.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Pricing & Interactive 0% Finance Widget */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  {/* Transparent Fee */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Transparent Fee</p>
                      <p className="text-2xl font-black text-[#0F172A] tracking-tight">{displayPrice}</p>
                    </div>

                    {/* Interactive 0% Finance Widget */}
                    {monthlyFinance && (
                      <div className="text-right shrink-0">
                        <div
                          className="relative inline-block"
                          onMouseEnter={() => setActiveFinanceTooltip(service.id)}
                          onMouseLeave={() => setActiveFinanceTooltip(null)}
                        >
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold cursor-pointer hover:bg-emerald-100 transition-colors">
                            <BadgePercent className="w-3.5 h-3.5 text-emerald-600" />
                            <span>From {monthlyFinance}</span>
                            <span className="text-[9px] bg-emerald-200/80 px-1 rounded text-emerald-900 ml-0.5">0% APR</span>
                          </span>

                          {/* Hover Tooltip */}
                          {activeFinanceTooltip === service.id && (
                            <div className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-slate-950 text-white text-[11px] rounded-xl shadow-xl z-30 space-y-1">
                              <p className="font-bold text-white">0% APR via Tabeo / Chrysalis</p>
                              <p className="text-slate-300">Spread costs interest-free over 12 or 24 months. Subject to status.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action CTA: Book Consultation */}
                  <button
                    onClick={() => openBookingModal(service.name, isCosmetic ? 'Cosmetic' : 'General')}
                    className="mt-4 w-full py-3 rounded-2xl font-bold text-xs text-white bg-[#0F172A] hover:bg-slate-800 shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                  >
                    <span>Book Consultation</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
