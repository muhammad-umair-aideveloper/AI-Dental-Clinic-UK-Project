'use client';

import React from 'react';
import Image from 'next/image';
import { useClinic } from '@/context/ClinicContext';
import {
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Star,
  CheckCircle2,
  Calendar,
  Award,
  Zap,
  ArrowRight,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { openBookingModal, openChatDrawer, companyDetails } = useClinic();

  const trustBadges = [
    { label: 'GDC Registered Specialists', detail: 'General Dental Council Reg. 248912' },
    { label: 'CQC Compliant Clinic', detail: 'Care Quality Commission Rated' },
    { label: '100% Hospital-Grade Sterilization', detail: 'Class-B Autoclave Protocol' },
    { label: '15+ Years Clinical Excellence', detail: 'Harley Street Proven Standards' },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Decorative Clinical Glow Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Subtitle, Trust Metrics, CTAs */}
          <div className="lg:col-span-7 space-y-7">
            {/* Live Availability Tag */}
            <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-300 text-xs font-medium shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Accepting New Patients • Next Available: Today at 2:30 PM</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Your Smile, Precision Crafted —{' '}
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
                Vertex Dental Lab
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              Bespoke, pain-free dental care backed by state-of-the-art British clinical technology and our 24/7 AI-powered dental assistant. From routine checkups to full smile reconstructions.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => openChatDrawer('Hello! I would like to book a dental consultation with your AI assistant.')}
                className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-900 bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 hover:opacity-95 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-200 active:scale-95 group"
              >
                <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>Book Consultation via AI</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href={`https://wa.me/${companyDetails.whatsappPhone.replace(/[^0-9]/g, '')}?text=Hello%20Vertex%20Dental%20Lab,%20I%20would%20like%20to%20inquire%20about%20an%20appointment`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all duration-200 active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Us</span>
              </a>

              <button
                onClick={() => openBookingModal()}
                className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white transition-colors"
              >
                <Calendar className="w-4 h-4 text-sky-400" />
                <span className="underline decoration-slate-600 hover:decoration-sky-400 underline-offset-4">
                  Direct Diary Picker
                </span>
              </button>
            </div>

            {/* Floating Rating & Clinical Highlights */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-base font-bold text-white">4.9 / 5.0</span>
                </div>
                <p className="text-xs text-slate-400">Google Verified Reviews (380+)</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-sky-400">
                  <Award className="w-4 h-4" />
                  <span className="text-base font-bold text-white">15+ Years</span>
                </div>
                <p className="text-xs text-slate-400">British Clinical Practice</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-base font-bold text-white">GDC & CQC</span>
                </div>
                <p className="text-xs text-slate-400">Strict UK Regulatory Reg.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-cyan-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-base font-bold text-white">In-House Lab</span>
                </div>
                <p className="text-xs text-slate-400">Same-Day 3D Milled Crowns</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual with Real Clinic Imagery & Floating Badges */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Card with Gradient Border */}
              <div className="relative rounded-3xl p-1 bg-gradient-to-tr from-sky-500/40 via-cyan-400/20 to-slate-800 shadow-2xl shadow-sky-950/60 overflow-hidden">
                <div className="relative rounded-[22px] overflow-hidden bg-slate-900 aspect-[4/3] sm:aspect-[16/11]">
                  <Image
                    src="/images/clinic-suite.jpg"
                    alt="Vertex Dental Lab Clinical Operatory Suite overlooking London"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                  {/* Bottom Image Caption Card */}
                  <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <p className="text-xs font-bold text-slate-100">London Marylebone Suite</p>
                      </div>
                      <p className="text-[11px] text-slate-300">MedFit Intraoral 3D Scanners & Wand® Anaesthesia</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-sky-900/70 text-sky-300 text-[10px] font-semibold border border-sky-700">
                      Private Suite
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1: 100% Hospital Grade Sterilization */}
              <div className="hidden sm:flex absolute -top-5 -left-5 bg-white text-slate-900 p-3 rounded-2xl shadow-xl border border-slate-100 items-center space-x-3 max-w-[210px] animate-fade-in">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">100% Hospital-Grade</p>
                  <p className="text-[10px] text-slate-500">Class-B Sterilization</p>
                </div>
              </div>

              {/* Floating Badge 2: In-House 3D Robotic Lab */}
              <div className="hidden sm:flex absolute -bottom-5 -right-5 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-700 items-center space-x-3 max-w-[230px]">
                <div className="w-9 h-9 rounded-xl bg-sky-600/30 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">In-House CAD/CAM Lab</p>
                  <p className="text-[10px] text-sky-300">Zero Temporary Crown Delay</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* British Healthcare Trust Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800/80">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Clinical Governance & British Regulatory Affiliations
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-3 p-3 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-200">{badge.label}</p>
                  <p className="text-[10px] text-slate-400">{badge.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
