'use client';

import React, { useState } from 'react';
import { Phone, AlertCircle, X, Clock, ArrowRight } from 'lucide-react';
import { useClinic } from '@/context/ClinicContext';

export const UrgentCareStickyBanner: React.FC = () => {
  const { companyDetails, openBookingModal } = useClinic();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-[#0F172A] text-white border-b border-amber-500/30 text-xs py-2 px-3 sm:px-6 relative z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left min-w-0 flex-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase border border-amber-500/40 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1"></span>
            Urgent Dental Care
          </span>
          <p className="text-[11px] sm:text-xs text-slate-200 leading-snug">
            Acute toothache, severe facial swelling, or dental trauma? Same-day private emergency triage slots are open.
          </p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <a
            href={`tel:${companyDetails.helplinePhone.replace(/\s+/g, '')}`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xs active:scale-95 whitespace-nowrap"
            title="Dial Emergency Dental Hotline"
          >
            <Phone className="w-3.5 h-3.5 fill-slate-950" />
            <span>Call {companyDetails.helplinePhone}</span>
          </a>

          <button
            onClick={() => openBookingModal('24/7 Same-Day Emergency Dental Triage', 'General')}
            className="hidden md:inline-flex items-center space-x-1 text-slate-300 hover:text-white font-medium text-xs underline underline-offset-2"
          >
            <span>Emergency Triage Form</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Dismiss notice"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
