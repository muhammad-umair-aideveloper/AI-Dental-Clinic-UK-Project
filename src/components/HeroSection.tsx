'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useClinic } from '@/context/ClinicContext';
import {
  ArrowUpRight,
  Play,
  ShieldCheck,
  Star,
  CheckCircle2,
  Sparkles,
  Award,
  Clock,
  Cpu,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { openBookingModal } = useClinic();
  const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);

  return (
    <section className="relative overflow-hidden bg-[#FAF9F6] text-slate-900 pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-200/80">
      {/* Subtle Warm Porcelain Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-50/60 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-emerald-50/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Trust Badges Bar (Google 4.9★, GDC Registered, CQC Good/Outstanding) */}
        <div className="flex flex-wrap items-center justify-start gap-3 sm:gap-4 mb-8">
          {/* Google Review Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-900">4.9★</span>
            <span className="text-[11px] text-slate-500 font-medium">(350+ Verified Google Reviews)</span>
          </div>

          {/* GDC Registered Badge */}
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">100% GDC Registered Team</span>
          </div>

          {/* CQC Rating Badge */}
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
            <Award className="w-4 h-4 text-slate-900" />
            <span className="text-xs font-bold text-slate-800">CQC Regulated • Good / Outstanding</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: High-Ticket Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold tracking-[0.18em] uppercase">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Marylebone, Central London • Private Dental Studio</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0F172A] leading-[1.08] font-sans">
              Award-Winning Private & Cosmetic Dentistry in{' '}
              <span className="font-editorial italic font-normal text-slate-800">
                Central London.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
              Experience pain-free clinical care powered by in-house 5-axis German CAD/CAM milling, GDC-registered specialists, and bespoke smile transformations with transparent 0% APR financing.
            </p>

            {/* Feature Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 font-medium">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero waitlists • Same-day appointments</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>In-house robotic 3D porcelain milling</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>0% APR interest-free finance via Tabeo & Chrysalis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>The Wand® painless computerised anaesthesia</span>
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              {/* Primary CTA: Book Consultation */}
              <button
                onClick={() => openBookingModal()}
                className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-full font-bold text-sm text-white bg-[#0F172A] hover:bg-slate-800 shadow-lg shadow-slate-900/15 transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <span>Book Consultation</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              {/* Secondary CTA: Check Invisalign Suitability */}
              <button
                onClick={() => openBookingModal('Invisalign® Clear Aligners & 3D Simulation', 'Cosmetic')}
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full font-bold text-sm text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-all hover:scale-[1.02] active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Check Invisalign Suitability</span>
              </button>

              {/* Watch Clinic Tour */}
              <button
                onClick={() => setVideoModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-slate-800 ml-0.5 text-slate-800" />
                </span>
                <span>Virtual Tour</span>
              </button>
            </div>
          </div>

          {/* Right Column: High-End Clinical Visual Framing */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[440px] aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border-4 border-white bg-white group">
              <Image
                src="/images/futuristic-dental-hero.jpg"
                alt="Vertex Dental Lab Central London Operatory Suite & 3D Guided Implant Surgery"
                width={700}
                height={875}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

              {/* Floating Bottom Card: Clinician on Duty */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-lg text-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Clinical Leadership</p>
                    <p className="text-sm font-black text-slate-900">Dr. Alistair Vance</p>
                    <p className="text-[11px] text-slate-600 font-medium">BDS (Hons) Lond, MFDS RCS Eng | GDC: 248912</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Slots Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Floating Badge */}
              <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 shadow-md flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>In-House 5-Axis CAD/CAM Lab</span>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Core Pillars Dock */}
        <div className="mt-14 pt-8 border-t border-slate-200/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">01. Precision</p>
              <h4 className="text-base font-extrabold text-slate-950 mt-1">5-Axis Milling Lab</h4>
              <p className="text-xs text-slate-600 mt-0.5">On-site German Ceramill milling for micron-accurate restorations.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">02. Finance</p>
              <h4 className="text-base font-extrabold text-slate-950 mt-1">0% APR Over 12-24 Mo</h4>
              <p className="text-xs text-slate-600 mt-0.5">Interest-free patient finance through Tabeo & Chrysalis UK.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">03. Comfort</p>
              <h4 className="text-base font-extrabold text-slate-950 mt-1">Pain-Free Dentistry</h4>
              <p className="text-xs text-slate-600 mt-0.5">The Wand® computerized local anaesthesia & IV sedation options.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">04. Standards</p>
              <h4 className="text-base font-extrabold text-slate-950 mt-1">GDC & CQC Certified</h4>
              <p className="text-xs text-slate-600 mt-0.5">Hospital-grade vacuum autoclave sterilization for every procedure.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Inside Vertex Dental Lab — Marylebone, London
              </h3>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 my-4 relative flex items-center justify-center">
              <Image
                src="/images/clinic-suite.jpg"
                alt="Clinic Tour"
                width={800}
                height={450}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute text-center p-6 text-white space-y-2">
                <Play className="w-12 h-12 fill-white mx-auto text-white opacity-90" />
                <p className="font-bold text-sm">3D Clinical Suite & Robotic CAD/CAM Tour</p>
                <p className="text-xs text-slate-300">Harley Place, Marylebone, London W1G 9PH</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setVideoModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                Close Tour
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
