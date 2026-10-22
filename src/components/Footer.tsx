'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';
import {
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Car,
  Train,
  Lock,
  FileText,
  Check,
  ArrowUpRight,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { companyDetails, openBookingModal } = useClinic();
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
      setEmailInput('');
    }
  };

  return (
    <footer className="relative bg-[#0B0F17] text-white overflow-hidden border-t border-white/10 selection:bg-emerald-500 selection:text-white">
      {/* 
        HALTONE DOT-MATRIX & DIAGONAL AMBIENT LIGHT SWEEP
        Strictly adhering to Vertex Dental Lab signature Clinical Emerald/Teal & Medical Blue palette
      */}
      {/* 1. Diagonal Ambient Light Sweeps */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
        aria-hidden="true"
      >
        {/* Top-left ambient clinical teal/emerald glow */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-transparent blur-3xl transform -rotate-12" />
        
        {/* Center-to-bottom-right diagonal ambient sweep */}
        <div className="absolute -bottom-24 right-0 w-[750px] h-[500px] rounded-full bg-gradient-to-tl from-emerald-600/20 via-sky-600/15 to-transparent blur-3xl transform rotate-12" />

        {/* Diagonal soft illumination beam */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 via-transparent to-sky-950/20" />
      </div>

      {/* 2. Stippled Halftone Dot-Matrix Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:6px_6px] mix-blend-screen opacity-90"
        aria-hidden="true"
      />

      {/* MAIN FOOTER CONTENT CONTAINER */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-16 lg:py-20">
        
        {/* 12-Column Asymmetric Daylight-Inspired Split Layout */}
        <div className="grid grid-cols-12 gap-10 lg:gap-14">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Brand Lockup & Legal Meta (col-span-12 lg:col-span-5) */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between space-y-12">
            
            {/* Brand Emblem & Stacked Typography */}
            <div className="space-y-6">
              <Link href="/" className="inline-flex items-center space-x-4 group">
                {/* Precision Geometric Dental Emblem (Echoing Daylight's bold mark) */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-2.5 flex items-center justify-center shadow-lg group-hover:border-emerald-400/50 transition-all">
                  <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full text-white"
                  >
                    <path
                      d="M16 3C8.82 3 3 8.82 3 16s5.82 13 13 13 13-5.82 13-13S23.18 3 16 3zm0 5c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8z"
                      fill="currentColor"
                      fillOpacity="0.3"
                    />
                    <path
                      d="M16 8v8l6 3.5"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="16" cy="16" r="3.5" fill="#FFFFFF" />
                  </svg>
                </div>

                {/* Stacked Triple-Line Bold Brand Name */}
                <div className="flex flex-col tracking-tight font-extrabold uppercase text-white font-sans text-2xl sm:text-3xl leading-[0.92]">
                  <span>VERTEX</span>
                  <span>DENTAL</span>
                  <span>LAB</span>
                </div>
              </Link>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md font-normal">
                Central London private dental practice and in-house 5-axis digital milling laboratory. Specialising in painless implantology, smile design, and hand-layered ceramic restorations.
              </p>

              {/* Regulatory Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300 font-mono">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CQC: 1-104928374</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>GDC: 248912</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>ICO: ZA892147</span>
                </span>
              </div>
            </div>

            {/* Bottom Legal Meta (Roman Numeral Copyright & Links) */}
            <div className="space-y-3 pt-6 border-t border-white/10 lg:border-t-0">
              <p className="text-[11px] text-slate-400 font-sans tracking-wide">
                © MMXXVI • Vertex Dental Lab Ltd. • Independent Private Healthcare
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <button
                  onClick={() => setPrivacyModalOpen(true)}
                  className="hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  Privacy Policy (GDPR)
                </button>
                <span>•</span>
                <button
                  onClick={() => setPrivacyModalOpen(true)}
                  className="hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  Terms of Service
                </button>
                <span>•</span>
                <button
                  onClick={() => setPrivacyModalOpen(true)}
                  className="hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  Cookie Preferences
                </button>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: 3-Col Nav/Philosophy/Socials + Pill Bar (col-span-12 lg:col-span-7) */}
          {/* ========================================================= */}
          <div className="col-span-12 lg:col-span-7 flex flex-col justify-between space-y-12">
            
            {/* Top 3 Sub-Columns: NAVIGATION | WHO WE ARE | SOCIALS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              
              {/* Sub-col 1: NAVIGATION */}
              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.25em] font-mono uppercase text-slate-400 font-bold">
                  NAVIGATION
                </p>
                <ul className="space-y-2.5 text-sm font-medium">
                  <li>
                    <Link
                      href="/"
                      className="text-white hover:text-emerald-400 transition-colors inline-block"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => openBookingModal('Comprehensive Clinical Assessment & 3D Scan', 'General')}
                      className="text-white hover:text-emerald-400 transition-colors text-left"
                    >
                      Consultations
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openBookingModal('Invisalign® Clear Aligners & 3D Simulation', 'Cosmetic')}
                      className="text-white hover:text-emerald-400 transition-colors text-left"
                    >
                      Invisalign®
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openBookingModal('Precision Straumann® Titanium Dental Implant', 'General')}
                      className="text-white hover:text-emerald-400 transition-colors text-left"
                    >
                      Dental Implants
                    </button>
                  </li>
                  <li>
                    <a
                      href="#services"
                      className="text-white hover:text-emerald-400 transition-colors inline-block"
                    >
                      Fee Schedule
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors inline-flex items-center"
                    >
                      <span>Patient Portal</span>
                      <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Sub-col 2: WHO WE ARE */}
              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.25em] font-mono uppercase text-slate-400 font-bold">
                  WHO WE ARE
                </p>
                <div className="space-y-3 text-slate-200">
                  <p className="text-sm font-semibold leading-snug text-white">
                    A more caring, precision dental practice.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Lead Clinician Dr. Alistair Vance (GDC 248912) and our clinical team blend digital diagnostics with microscopic precision in the heart of London.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-300 space-y-1">
                    <p className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>42 Harley Place, Marylebone, London, W1G 9PH</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <a href={`tel:${companyDetails.helplinePhone.replace(/\s+/g, '')}`} className="hover:text-white">
                        {companyDetails.helplinePhone}
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-col 3: SOCIALS */}
              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.25em] font-mono uppercase text-slate-400 font-bold">
                  SOCIALS
                </p>
                <div className="flex items-center space-x-4 text-white">
                  {/* X / Twitter */}
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Vertex Dental Lab on X"
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/40 flex items-center justify-center hover:bg-white/15 transition-all text-white"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  {/* TikTok */}
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Vertex Dental Lab on TikTok"
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/40 flex items-center justify-center hover:bg-white/15 transition-all text-white"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Vertex Dental Lab on Instagram"
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-white/40 flex items-center justify-center hover:bg-white/15 transition-all text-white"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>

                <div className="pt-3 text-[11px] text-slate-400 space-y-1">
                  <p className="flex items-center space-x-1">
                    <Train className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Oxford Circus (4 min) • Bond St (6 min)</span>
                  </p>
                  <p className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Mon - Fri 08:30-18:00 • Sat 09:00-17:00</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Row: GET UPDATES Micro-Label + Pill Bar Geometry */}
            <div className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-[0.25em] font-mono uppercase text-slate-400 font-bold">
                  GET UPDATES
                </p>
                {subscribed && (
                  <span className="text-[11px] font-mono text-emerald-400 inline-flex items-center space-x-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>Subscribed to Clinical Updates</span>
                  </span>
                )}
              </div>

              {/* Exact Pill-Bar Geometry from Reference Image */}
              <form
                onSubmit={handleSubscribe}
                className="w-full rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center p-1.5 pl-6 shadow-2xl focus-within:border-white/50 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all"
              >
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="E-MAIL"
                  aria-label="Email address for clinical updates"
                  className="bg-transparent text-white placeholder-slate-400 text-xs sm:text-sm font-sans tracking-widest uppercase outline-none w-full mr-2"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs tracking-wider uppercase px-6 sm:px-8 py-2.5 sm:py-3 rounded-full transition-all shadow-md active:scale-95 hover:shadow-white/20"
                >
                  GET UPDATES
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* SECONDARY CLINICAL COMPLIANCE & STAFF PORTAL ACCESS STRIP */}
        {/* ========================================================= */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-400 gap-4 text-center md:text-left pb-16 lg:pb-8">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
            <span className="text-slate-300 font-medium">Vertex Dental Lab Ltd</span>
            <span>•</span>
            <span>Company Reg No. 12948210 (England & Wales)</span>
            <span>•</span>
            <span>British Dental Association (BDA) Member</span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-2 pr-0 md:pr-44 lg:pr-52">
            <Link
              href="/dashboard"
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-[11px] whitespace-nowrap"
            >
              Patient Live Appointments
            </Link>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <Link
              href="/admin-dashboard"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors text-[11px] whitespace-nowrap"
            >
              Admin CMS Dashboard
            </Link>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <Link
              href="/admin/appointments"
              className="text-slate-400 hover:text-slate-200 transition-colors text-[11px] whitespace-nowrap"
            >
              Reception Desk & Automations
            </Link>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <Link
              href="/admin-login"
              className="text-slate-400 hover:text-white transition-colors text-[11px] whitespace-nowrap"
            >
              Staff CMS Login
            </Link>
          </div>
        </div>

      </div>

      {/* GDPR Privacy Modal */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-900">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>UK GDPR & Data Protection Notice</span>
              </h3>
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>Data Controller:</strong> Vertex Dental Lab Ltd (ICO Reg: ZA892147). Under the UK Data Protection Act 2018 and UK GDPR, we handle all patient medical and contact information with strict confidentiality.
              </p>
              <p>
                <strong>Guest Triage & Inquiries:</strong> When you submit a consultation enquiry or use our guest booking modal, your data (Name, Contact, Concern) is used solely to coordinate your clinical appointment and provide triage advice. We do not sell or share patient records with third-party advertisers.
              </p>
              <p>
                <strong>Clinical Records:</strong> Once registered for treatment, clinical notes and digital scans are retained in compliance with NHS / GDC record retention schedules (minimum 11 years for adults).
              </p>
              <p>
                <strong>Your Rights:</strong> You have the right to request a copy of your personal data, rectify inaccuracies, or request erasure where not prohibited by statutory healthcare retention rules.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
