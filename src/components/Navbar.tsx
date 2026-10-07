'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinic, Currency } from '@/context/ClinicContext';
import {
  ArrowUpRight,
  Menu,
  X,
  ShieldCheck,
  Phone,
  Globe,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currency,
    setCurrency,
    openBookingModal,
    openChatDrawer,
    companyDetails,
  } = useClinic();

  const [menuOpen, setMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const currencies: { code: Currency; label: string; symbol: string }[] = [
    { code: 'GBP', label: 'GBP (£ UK)', symbol: '£' },
    { code: 'EUR', label: 'EUR (€ EU)', symbol: '€' },
    { code: 'USD', label: 'USD ($ US)', symbol: '$' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAF9F6]/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      {/* Top Clinical Accreditation Strip */}
      <div className="bg-[#0F172A] text-slate-300 text-[11px] py-1.5 px-4 font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              Central London Private Clinic
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline-flex items-center text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
              <span>GDC Registered Clinicians • CQC Regulated Provider</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <a
              href={`tel:${companyDetails.helplinePhone.replace(/\s+/g, '')}`}
              className="hidden md:inline-flex items-center text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            >
              <Phone className="w-3 h-3 mr-1 text-emerald-400 shrink-0" />
              <span>{companyDetails.helplinePhone}</span>
            </a>

            {/* Currency Selector */}
            <div className="relative shrink-0">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors border border-slate-700"
                title="Change display currency"
              >
                <Globe className="w-3 h-3 text-slate-400" />
                <span className="font-semibold">{currency}</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-32 bg-white text-slate-900 rounded-xl shadow-xl py-1 border border-slate-200 z-50">
                  {currencies.map(c => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        currency === c.code ? 'font-bold text-slate-950 bg-slate-100' : 'text-slate-700'
                      }`}
                    >
                      <span>{c.label}</span>
                      <span>{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Luxury Boutique Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 w-full">
        {/* Brand Logo - High-End Minimalist Mark */}
        <Link href="/" className="flex items-center space-x-3 group shrink-0">
          <div className="flex items-center space-x-1 shrink-0">
            <span className="w-1.5 h-5 bg-[#0F172A] rounded-full transition-transform group-hover:scale-y-110"></span>
            <span className="w-1.5 h-3.5 bg-slate-600 rounded-full transition-transform group-hover:scale-y-125"></span>
            <span className="w-1.5 h-6 bg-emerald-600 rounded-full transition-transform group-hover:scale-y-95"></span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="font-extrabold text-base tracking-[0.24em] text-[#0F172A] uppercase font-sans whitespace-nowrap">
              VERTEX
            </span>
            <span className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase -mt-0.5 whitespace-nowrap">
              PRIVATE DENTAL LAB
            </span>
          </div>
        </Link>

        {/* Center Nav Links - Responsive Gaps & Font Sizing to Prevent Text Overlap */}
        <div className="hidden lg:flex items-center gap-3.5 xl:gap-6 2xl:gap-8 text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-slate-700 shrink-0">
          <a href="#services" className="hover:text-slate-950 transition-colors whitespace-nowrap">
            Treatments
          </a>
          <a href="#pricing-finance" className="hover:text-slate-950 transition-colors whitespace-nowrap">
            Fees & 0% Finance
          </a>
          <a href="#gallery" className="hover:text-slate-950 transition-colors whitespace-nowrap">
            Smile Gallery
          </a>
          <a href="#clinical-team" className="hover:text-slate-950 transition-colors whitespace-nowrap">
            Clinical Team
          </a>
          <a href="#technology" className="hover:text-slate-950 transition-colors whitespace-nowrap">
            5-Axis Lab
          </a>
          <a href="#location" className="hover:text-slate-950 transition-colors whitespace-nowrap">
            Contact
          </a>
        </div>

        {/* Right CTA Group */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Secondary CTA: Check Invisalign Suitability (Shown on xl+ to avoid crowding navbar on laptop/tablet) */}
          <button
            onClick={() => openBookingModal('Invisalign® Clear Aligners & 3D Simulation', 'Cosmetic')}
            className="hidden xl:inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300/80 shadow-2xs transition-all hover:scale-[1.02] active:scale-95 shrink-0 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Check Invisalign Suitability</span>
          </button>

          {/* Primary CTA: Frictionless Guest Consultation */}
          <button
            onClick={() => openBookingModal()}
            className="inline-flex items-center space-x-1.5 px-3.5 sm:px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#0F172A] hover:bg-slate-800 shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95 shrink-0 whitespace-nowrap"
          >
            <span>Book Consultation</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl shadow-xl px-4 py-5 animate-fade-in">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2.5 text-sm font-semibold text-slate-800">
              <a
                href="#services"
                onClick={() => setMenuOpen(false)}
                className="py-1.5 flex items-center justify-between border-b border-slate-100"
              >
                <span>Treatments (General & Cosmetic)</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#pricing-finance"
                onClick={() => setMenuOpen(false)}
                className="py-1.5 flex items-center justify-between border-b border-slate-100"
              >
                <span>Fee Guide & 0% Finance Slider</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#gallery"
                onClick={() => setMenuOpen(false)}
                className="py-1.5 flex items-center justify-between border-b border-slate-100"
              >
                <span>ASA-Compliant Smile Gallery</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#clinical-team"
                onClick={() => setMenuOpen(false)}
                className="py-1.5 flex items-center justify-between border-b border-slate-100"
              >
                <span>Clinical Team & GDC Numbers</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#location"
                onClick={() => setMenuOpen(false)}
                className="py-1.5 flex items-center justify-between border-b border-slate-100"
              >
                <span>Marylebone Clinic & Tube Access</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  openBookingModal('Invisalign® Clear Aligners & 3D Simulation', 'Cosmetic');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200"
              >
                Check Invisalign Suitability
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  openBookingModal();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F172A]"
              >
                Book Guest Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
