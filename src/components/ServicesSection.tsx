'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  BadgePercent,
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
    'Pediatric',
    'Emergency',
  ];

  const filteredServices = selectedCategory === 'All'
    ? services
    : services.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <section id="services" className="py-20 lg:py-28 bg-slate-50 text-slate-900 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vertex Dental Lab Services & Verified Fees</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Dental Treatments Crafted With In-House Precision
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Transparent UK pricing with zero surprise charges. All restorative prosthetics are engineered directly in our Marylebone 3D milling lab.
          </p>
        </div>

        {/* Emergency Acute Banner */}
        <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Experiencing Acute Pain, Severe Swelling, or a Fractured Tooth?
              </p>
              <p className="text-xs text-amber-700">
                We reserve daily emergency appointments for fast clinical relief. Priority triage is active today.
              </p>
            </div>
          </div>
          <button
            onClick={() => openBookingModal('24/7 Emergency Dental Care')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm shrink-0 whitespace-nowrap"
          >
            Emergency Appointment
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-8 gap-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredServices.map(service => {
            const isEmergency = service.category === 'Emergency';
            // Compute display price based on basePriceGbp and selected currency
            const displayPrice = currency === 'GBP' 
              ? service.priceRange 
              : `From ${formatPrice(service.basePriceGbp)}`;

            return (
              <div
                key={service.id}
                className={`relative rounded-2xl bg-white border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl group ${
                  isEmergency
                    ? 'border-red-200 bg-red-50/20'
                    : service.popular
                    ? 'border-sky-300 ring-2 ring-sky-500/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Popular / Category Ribbon */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                      isEmergency
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {service.category}
                  </span>

                  {service.popular && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-sky-600" />
                      <span>Most Popular</span>
                    </span>
                  )}
                </div>

                {/* Service Title & Pricing */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {service.name}
                  </h3>

                  <div className="mt-2.5 flex items-baseline space-x-2">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {displayPrice}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({currency})
                    </span>
                  </div>

                  <div className="mt-2 flex items-center space-x-3 text-xs text-slate-500">
                    <span className="inline-flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {service.duration}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center text-emerald-600 font-medium">
                      <BadgePercent className="w-3.5 h-3.5 mr-1" />
                      0% Finance Eligible
                    </span>
                  </div>

                  <p className="mt-3.5 text-xs text-slate-600 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Feature Checklist */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    {service.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => openBookingModal(service.name)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-2 active:scale-95 ${
                      isEmergency
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20'
                        : 'bg-slate-900 hover:bg-sky-600 text-white shadow-sm'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book This Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
