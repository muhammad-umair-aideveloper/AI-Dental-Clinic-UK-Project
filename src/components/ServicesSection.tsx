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
    <section id="services" className="relative py-20 lg:py-28 bg-[#ECECEE] text-neutral-900 scroll-mt-16 overflow-hidden border-b border-neutral-300/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-neutral-900 text-white text-[11px] font-bold mb-4 uppercase tracking-[0.16em] shadow-xs">
            <Sparkles className="w-3 h-3 text-neutral-300" />
            <span>TRANSPARENT UK PRIVATE DENTAL CARE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight leading-tight font-sans">
            Specialist Treatments &{' '}
            <span className="font-editorial italic font-normal text-neutral-700">
              Clear Pricing.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 font-normal">
            Precision clinical dentistry crafted in our Marylebone 5-axis CAD/CAM laboratory. Split between daily general health and transformative cosmetic aesthetics.
          </p>
        </div>

        {/* Category Split Toggle: General vs Cosmetic Dentistry */}
        <div className="flex justify-center mb-14 px-2">
          <div className="flex flex-wrap sm:inline-flex justify-center gap-1 p-1.5 rounded-full bg-neutral-200/90 border border-neutral-300/80 shadow-xs max-w-full">
            <button
              onClick={() => setActiveTab('Cosmetic')}
              className={`px-5 py-2 sm:py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'Cosmetic'
                  ? 'bg-neutral-950 text-white shadow-sm'
                  : 'text-neutral-700 hover:text-neutral-950 hover:bg-white/40'
              }`}
            >
              ✨ Cosmetic & Orthodontics
            </button>
            <button
              onClick={() => setActiveTab('General')}
              className={`px-5 py-2 sm:py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'General'
                  ? 'bg-neutral-950 text-white shadow-sm'
                  : 'text-neutral-700 hover:text-neutral-950 hover:bg-white/40'
              }`}
            >
              🦷 General & Specialist
            </button>
            <button
              onClick={() => setActiveTab('All')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'All'
                  ? 'bg-neutral-950 text-white shadow-sm'
                  : 'text-neutral-700 hover:text-neutral-950 hover:bg-white/40'
              }`}
            >
              All Treatments ({services.length})
            </button>
          </div>
        </div>

        {/* Treatments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-2 pb-4">
          {displayedServices.map((service, index) => {
            const isCosmetic = service.category === 'Cosmetic' || service.category === 'Orthodontics';
            const isEmergency = service.category === 'Emergency';
            
            // Spotlight hierarchy: Center card (Index 1 when 3 cards, or middle card in 3-col grid, or Philips Zoom! Laser Whitening)
            const isCenterCard =
              displayedServices.length === 3
                ? index === 1
                : displayedServices.length > 3
                ? index % 3 === 1
                : service.id === 'srv-whitening';

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
                className={`rounded-[28px] p-6 sm:p-7 flex flex-col justify-between relative transition-all duration-300 group ${
                  isCenterCard
                    ? 'bg-[#0F0F12] text-white border border-neutral-800 shadow-2xl md:-translate-y-2 z-10 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]'
                    : 'bg-white text-neutral-900 border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                <div>
                  {/* Category Pill & Popular Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCenterCard
                          ? 'bg-white/10 text-white border border-white/15 backdrop-blur-sm'
                          : isEmergency
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-200/80'
                      }`}
                    >
                      {service.category} Dentistry
                    </span>

                    {service.popular && (
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 ${
                          isCenterCard
                            ? 'bg-white/10 text-white border border-white/15 backdrop-blur-sm'
                            : 'bg-neutral-100 text-neutral-900 border border-neutral-200/80'
                        }`}
                      >
                        <Sparkles className={`w-3 h-3 ${isCenterCard ? 'text-amber-300' : 'text-neutral-500'}`} />
                        <span>Most Requested</span>
                      </span>
                    )}
                  </div>

                  {/* Treatment Name */}
                  <h3
                    className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug font-sans transition-colors ${
                      isCenterCard
                        ? 'text-white'
                        : 'text-[#111827] group-hover:text-black'
                    }`}
                  >
                    {service.name}
                  </h3>

                  {/* Treatment Summary */}
                  <p
                    className={`mt-2.5 text-xs leading-relaxed ${
                      isCenterCard ? 'text-[#9CA3AF]' : 'text-[#6B7280]'
                    }`}
                  >
                    {service.description}
                  </p>

                  {/* "What to Expect" & Timeline Box */}
                  <div
                    className={`mt-5 p-4 rounded-2xl space-y-2.5 ${
                      isCenterCard
                        ? 'bg-white/[0.04] border border-white/10'
                        : 'bg-[#F8F9FA] border border-neutral-200/70'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between text-xs font-semibold ${
                        isCenterCard ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      <span className="flex items-center space-x-1.5">
                        <Clock className={`w-3.5 h-3.5 ${isCenterCard ? 'text-neutral-400' : 'text-neutral-500'}`} />
                        <span>Typical Timeline:</span>
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          isCenterCard
                            ? 'bg-white/10 text-neutral-200 border border-white/10'
                            : 'bg-neutral-200/70 text-neutral-800'
                        }`}
                      >
                        {service.duration}
                      </span>
                    </div>

                    <div
                      className={`pt-2 border-t space-y-2 ${
                        isCenterCard ? 'border-white/10' : 'border-neutral-200/60'
                      }`}
                    >
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        What to expect:
                      </p>
                      {service.features.slice(0, 3).map((feat, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start space-x-2 text-xs ${
                            isCenterCard ? 'text-neutral-300' : 'text-neutral-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 stroke-[1.5] shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Pricing & Interactive 0% Finance Widget */}
                <div
                  className={`mt-6 pt-5 border-t ${
                    isCenterCard ? 'border-neutral-800' : 'border-neutral-200/70'
                  }`}
                >
                  {/* Transparent Fee */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">
                        Transparent Fee
                      </p>
                      <p
                        className={`text-3xl font-bold tracking-tight ${
                          isCenterCard ? 'text-white' : 'text-[#111827]'
                        }`}
                      >
                        {displayPrice}
                      </p>
                    </div>

                    {/* Interactive 0% Finance Widget */}
                    {monthlyFinance && (
                      <div className="text-right shrink-0">
                        <div
                          className="relative inline-block"
                          onMouseEnter={() => setActiveFinanceTooltip(service.id)}
                          onMouseLeave={() => setActiveFinanceTooltip(null)}
                        >
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              isCenterCard
                                ? 'bg-white/10 text-neutral-200 border border-white/15 hover:bg-white/15'
                                : 'bg-neutral-100 text-neutral-800 border border-neutral-200/90 hover:bg-neutral-200/80'
                            }`}
                          >
                            <BadgePercent className={`w-3.5 h-3.5 ${isCenterCard ? 'text-neutral-300' : 'text-neutral-600'}`} />
                            <span>From {monthlyFinance}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full ml-0.5 font-semibold ${
                                isCenterCard
                                  ? 'bg-white/20 text-white'
                                  : 'bg-neutral-200 text-neutral-900'
                              }`}
                            >
                              0% APR
                            </span>
                          </span>

                          {/* Hover Tooltip */}
                          {activeFinanceTooltip === service.id && (
                            <div
                              className={`absolute right-0 bottom-full mb-2 w-56 p-3 text-[11px] rounded-xl shadow-xl z-30 space-y-1 ${
                                isCenterCard
                                  ? 'bg-neutral-900 border border-neutral-700 text-white'
                                  : 'bg-neutral-950 text-white'
                              }`}
                            >
                              <p className="font-bold text-white">0% APR via Tabeo / Chrysalis</p>
                              <p className="text-neutral-300">Spread costs interest-free over 12 or 24 months. Subject to status.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action CTA: Book Consultation */}
                  <button
                    onClick={() => openBookingModal(service.name, isCosmetic ? 'Cosmetic' : 'General')}
                    className={`mt-4 w-full py-3.5 rounded-full font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center space-x-1.5 ${
                      isCenterCard
                        ? 'bg-white text-neutral-950 hover:bg-neutral-200 shadow-md'
                        : 'bg-white text-neutral-900 border border-neutral-200/90 shadow-sm hover:bg-neutral-100'
                    }`}
                  >
                    <span>Book Consultation</span>
                    <ArrowUpRight className={`w-4 h-4 ${isCenterCard ? 'text-neutral-950' : 'text-neutral-700'}`} />
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
