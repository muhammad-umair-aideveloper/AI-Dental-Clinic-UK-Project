'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useClinic } from '@/context/ClinicContext';
import {
  ArrowUpRight,
  Play,
  Camera,
  Volume2,
  Cpu,
  Shield,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { openBookingModal, openChatDrawer } = useClinic();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);

  return (
    <section className="relative overflow-hidden bg-[#F6F7F9] text-slate-900 pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Subtle Background Glows and Rings */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Subtitle, CTAs */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            {/* NEXT GENERATION Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-slate-800">
                NEXT GENERATION DENTAL LAB
              </span>
            </div>

            {/* Massive Bold Editorial Headline (matching reference image) */}
            <div className="space-y-1">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 uppercase leading-[0.98] font-sans">
                PRECISION.
                <br />
                REIMAGINED.
                <br />
                <span className="text-slate-900">FUTURE.</span>
              </h1>
            </div>

            {/* Accent divider line */}
            <div className="flex items-center space-x-2">
              <span className="w-10 h-[2px] bg-slate-900"></span>
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-700 max-w-lg font-normal leading-relaxed">
              AI-powered clinical precision and in-house 5-axis CAD/CAM milling that see more, craft faster, and keep your smile ahead.
            </p>

            {/* CTAs matching reference: Black Pill Button + Video Pill Button */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Discover More ↗ */}
              <button
                onClick={() => openBookingModal()}
                className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-full font-bold text-sm text-white bg-slate-950 hover:bg-slate-800 shadow-md shadow-slate-950/20 transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <span>Discover More</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              {/* Watch Video */}
              <button
                onClick={() => setVideoModalOpen(true)}
                className="inline-flex items-center space-x-3 px-6 py-3.5 rounded-full font-semibold text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Play className="w-3 h-3 fill-white ml-0.5" />
                </span>
                <span>Watch Tour</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual with Circular Halo Framing & Right Pagination */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Ambient Circular Halo Rings (exact match to reference design) */}
            <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
              {/* Outer Thin Ring */}
              <div className="absolute inset-0 rounded-full border border-slate-300/60 pointer-events-none animate-spin-slow" />
              {/* Inner Glowing Ring */}
              <div className="absolute inset-6 rounded-full border border-slate-200/90 pointer-events-none" />

              {/* Center Masked Artwork / Futuristic Dental Lab Image */}
              <div className="relative w-[85%] h-[85%] rounded-full overflow-hidden shadow-2xl border-4 border-white bg-white">
                <Image
                  src="/images/futuristic-dental-hero.jpg"
                  alt="Vertex Dental Lab Next Generation Clinical Suite and Robotic 3D Scanner"
                  width={700}
                  height={700}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  priority
                />
                
                {/* Floating Minimal Badge inside Visual */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide border border-white/20 whitespace-nowrap shadow-lg flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>3D Optical AI Visor & Guided Surgery</span>
                </div>
              </div>

              {/* Step indicator on the right (matching reference 01 / line / 02 / 03) */}
              <div className="hidden sm:flex flex-col items-center space-y-3 absolute -right-6 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                <button
                  onClick={() => setActiveStep(1)}
                  className={`transition-colors ${activeStep === 1 ? 'text-slate-950 font-bold' : 'hover:text-slate-700'}`}
                >
                  01
                </button>
                <div className="w-[1.5px] h-8 bg-slate-300">
                  <div
                    className={`w-full bg-slate-950 transition-all ${
                      activeStep === 1 ? 'h-1/3' : activeStep === 2 ? 'h-2/3' : 'h-full'
                    }`}
                  ></div>
                </div>
                <button
                  onClick={() => setActiveStep(2)}
                  className={`transition-colors ${activeStep === 2 ? 'text-slate-950 font-bold' : 'hover:text-slate-700'}`}
                >
                  02
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className={`transition-colors ${activeStep === 3 ? 'text-slate-950 font-bold' : 'hover:text-slate-700'}`}
                >
                  03
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Glassmorphism Service Dock at Bottom (matching the reference image dock exactly!) */}
        <div className="mt-14 sm:mt-18">
          <div className="p-3 sm:p-4 rounded-3xl sm:rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Feature 1: Capture Everything / 3D Scanners */}
              <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-white/60 hover:bg-white/95 border border-white/80 transition-all hover:shadow-sm group">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Camera className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-950 leading-tight">
                    Capture Everything
                  </h4>
                  <p className="text-[11px] text-slate-700 font-normal leading-normal mt-0.5">
                    Sub-micron 3D digital impressions for instant fit.
                  </p>
                </div>
              </div>

              {/* Feature 2: Open-Ear Audio / Wand Anaesthesia */}
              <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-white/60 hover:bg-white/95 border border-white/80 transition-all hover:shadow-sm group">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Volume2 className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-950 leading-tight">
                    Pain-Free Wand®
                  </h4>
                  <p className="text-[11px] text-slate-700 font-normal leading-normal mt-0.5">
                    Computer-guided painless local anesthesia delivery.
                  </p>
                </div>
              </div>

              {/* Feature 3: Same-Day CAD/CAM Milling */}
              <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-white/60 hover:bg-white/95 border border-white/80 transition-all hover:shadow-sm group">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Cpu className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-950 leading-tight">
                    5-Axis Milling Lab
                  </h4>
                  <p className="text-[11px] text-slate-700 font-normal leading-normal mt-0.5">
                    Zirconia crowns precision milled in under 60 mins.
                  </p>
                </div>
              </div>

              {/* Feature 4: AI Clinical Reasoning Assistance */}
              <div
                onClick={() => openChatDrawer('What dental treatments are available at Vertex Dental Lab?')}
                className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-white/60 hover:bg-white/95 border border-white/80 transition-all hover:shadow-sm group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Shield className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-950 leading-tight flex items-center space-x-1">
                    <span>AI Assistance</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </h4>
                  <p className="text-[11px] text-slate-700 font-normal leading-normal mt-0.5">
                    Step-by-step triage reasoning whenever you need.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Video Virtual Tour Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 text-sm font-bold"
            >
              ✕
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h3 className="text-lg font-bold text-slate-950">
                  Virtual Tour: Inside Vertex Dental Lab (Marylebone, London)
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Explore our dual 5-axis DMG MORI dental mills, class-B sterilization suites, and intraoral 3D scanning workflows.
              </p>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                <Image
                  src="/images/dental-lab.jpg"
                  alt="Vertex Dental Laboratory milling equipment"
                  width={640}
                  height={360}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center text-white space-y-2">
                  <div className="w-14 h-14 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 fill-slate-950 ml-1" />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase">
                    Interactive Clinical Suite Showcase
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">Duration: 2 min 14 sec</span>
                <button
                  onClick={() => {
                    setVideoModalOpen(false);
                    openBookingModal();
                  }}
                  className="px-4 py-2 rounded-full text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-colors"
                >
                  Book In-Person Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
