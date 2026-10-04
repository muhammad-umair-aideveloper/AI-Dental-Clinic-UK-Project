'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useClinic } from '@/context/ClinicContext';
import {
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowLeftRight,
  UserCheck,
} from 'lucide-react';

export const SmileGallery: React.FC = () => {
  const { galleryCases, openBookingModal } = useClinic();
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100 percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCase = galleryCases[activeCaseIndex] || galleryCases[0];

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleSliderMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
  };

  return (
    <section id="gallery" className="py-20 lg:py-28 bg-white text-slate-900 scroll-mt-16 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold mb-3 uppercase tracking-[0.18em]">
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>ASA-COMPLIANT CLINICAL CASES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-tight font-sans">
            Genuine Patient Outcomes &{' '}
            <span className="font-editorial italic font-normal text-slate-800">
              Smile Transformations.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal">
            Drag the divider to compare unedited before-and-after clinical results. Every case is planned with 3D digital smile design and crafted in-house.
          </p>
        </div>

        {/* Case Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {galleryCases.map((caseItem, idx) => (
            <button
              key={caseItem.id}
              onClick={() => {
                setActiveCaseIndex(idx);
                setSliderPosition(50);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeCaseIndex === idx
                  ? 'bg-[#0F172A] text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <span>Case {idx + 1}: {caseItem.category}</span>
            </button>
          ))}
        </div>

        {/* Interactive Before/After Comparison Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF9F6] p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
          
          {/* Draggable Slider Component */}
          <div className="lg:col-span-7">
            <div
              ref={containerRef}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-xl select-none cursor-ew-resize border border-slate-200 bg-slate-900"
            >
              {/* After Image (Background layer) */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src={currentCase.afterImage}
                  alt={`${currentCase.title} - After Treatment`}
                  fill
                  className="object-cover"
                  priority
                />
                <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-[#0F172A]/85 text-white backdrop-blur-md shadow-md">
                  AFTER TREATMENT
                </span>
              </div>

              {/* Before Image (Clipped layer) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <div className="relative w-full h-full aspect-[16/9]">
                  <Image
                    src={currentCase.beforeImage}
                    alt={`${currentCase.title} - Before Treatment`}
                    fill
                    className="object-cover"
                    priority
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-900 backdrop-blur-md shadow-md">
                    BEFORE TREATMENT
                  </span>
                </div>
              </div>

              {/* Draggable Divider Line & Knob */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-slate-950 shadow-xl flex items-center justify-center border-2 border-slate-900 pointer-events-auto cursor-ew-resize">
                  <ArrowLeftRight className="w-4 h-4 text-slate-950" />
                </div>
              </div>
            </div>

            {/* Mobile / Accessible Range Slider Control */}
            <div className="mt-4 flex items-center justify-between space-x-3 text-xs text-slate-500 font-medium">
              <span>Before (0%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={e => setSliderPosition(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                aria-label="Drag before and after position"
              />
              <span>After (100%)</span>
            </div>
          </div>

          {/* Clinical Procedure Notes & Case Details */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-2">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Verified Clinical Case Study</span>
              </div>
              <h3 className="text-2xl font-black text-[#0F172A] tracking-tight leading-snug">
                {currentCase.title}
              </h3>
            </div>

            {/* Procedure Notes */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2 text-xs">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Procedure & Clinical Notes:</p>
              <p className="text-slate-600 leading-relaxed">{currentCase.procedureNotes}</p>
            </div>

            {/* Metrics: Timeline & Clinician Credentials */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-500 flex items-center space-x-1.5 font-medium">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Clinical Duration:</span>
                </span>
                <span className="font-bold text-slate-900">{currentCase.duration}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80">
                <span className="text-slate-500 flex items-center space-x-1.5 font-medium">
                  <UserCheck className="w-4 h-4 text-slate-700" />
                  <span>Lead Clinician:</span>
                </span>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{currentCase.clinicianName}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">{currentCase.clinicianGdc}</p>
                </div>
              </div>
            </div>

            {/* Consultation Action */}
            <div className="pt-2">
              <button
                onClick={() => openBookingModal(currentCase.title, 'Cosmetic')}
                className="w-full py-3.5 rounded-full font-bold text-xs text-white bg-[#0F172A] hover:bg-slate-800 shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Book Similar Treatment Consultation</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

        </div>

        {/* Mandatory ASA & CAP Compliance Notice */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-700">ASA & CAP Clinical Compliance Statement</p>
            <p className="mt-0.5">
              In accordance with Committee of Advertising Practice (CAP) and Advertising Standards Authority (ASA) healthcare codes: All photography shows genuine, unedited clinical cases treated at Vertex Dental Lab with informed patient consent. Clinical results vary based on individual dentition and biological healing.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
