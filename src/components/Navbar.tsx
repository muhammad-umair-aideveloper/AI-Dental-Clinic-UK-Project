'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinic, Currency } from '@/context/ClinicContext';
import {
  ArrowUpRight,
  Sun,
  Menu,
  X,
  User,
  ShieldCheck,
  Phone,
  Globe,
  Sparkles,
  Calendar,
  Lock,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currency,
    setCurrency,
    openBookingModal,
    openAuthModal,
    openChatDrawer,
    logout,
    companyDetails,
  } = useClinic();

  const [menuOpen, setMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Home' | 'Treatments' | 'Technology' | 'About' | 'Contact'>('Home');

  const currencies: { code: Currency; label: string; symbol: string }[] = [
    { code: 'GBP', label: 'GBP (£ UK)', symbol: '£' },
    { code: 'EUR', label: 'EUR (€ EU)', symbol: '€' },
    { code: 'USD', label: 'USD ($ US)', symbol: '$' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FBFBFD]/85 backdrop-blur-xl border-b border-slate-200/60 transition-all">
      {/* Micro Clinical Announcement Strip */}
      <div className="bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              Emergency Triage & Daily Slots Open
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline-flex items-center text-slate-300">
              <ShieldCheck className="w-3 h-3 mr-1 text-sky-400" />
              GDC Reg. 248912 • CQC Registered London Clinic
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href={`tel:${companyDetails.helplinePhone.replace(/\s+/g, '')}`}
              className="hidden md:inline-flex items-center text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 mr-1 text-sky-400" />
              <span>{companyDetails.helplinePhone}</span>
            </a>

            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] transition-colors border border-slate-800"
                title="Change currency"
              >
                <Globe className="w-2.5 h-2.5 text-sky-400" />
                <span>{currency}</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white text-slate-900 rounded-xl shadow-xl py-1 border border-slate-200 z-50">
                  {currencies.map(c => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-100 ${
                        currency === c.code ? 'font-bold text-sky-700 bg-sky-50' : 'text-slate-700'
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

      {/* Main Luxury Minimalist Navbar (Modeled after reference image) */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo - Minimal Geometric Mark & Uppercase Typography */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-5 bg-slate-950 rounded-full transition-transform group-hover:scale-y-110"></span>
            <span className="w-1.5 h-3.5 bg-slate-950 rounded-full transition-transform group-hover:scale-y-125"></span>
            <span className="w-1.5 h-6 bg-sky-600 rounded-full transition-transform group-hover:scale-y-90"></span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-[0.22em] text-slate-950 uppercase font-sans">
              VERTEX
            </span>
            <span className="text-[9px] font-semibold text-slate-500 tracking-[0.18em] uppercase -mt-0.5">
              DENTAL LAB
            </span>
          </div>
        </Link>

        {/* Center Nav Links with Active Dot indicator */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-700">
          <a
            href="#"
            onClick={() => setActiveTab('Home')}
            className={`relative transition-colors hover:text-slate-950 ${
              activeTab === 'Home' ? 'text-slate-950 font-semibold' : 'text-slate-600'
            }`}
          >
            Home
            {activeTab === 'Home' && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 absolute -bottom-2 left-1/2 -translate-x-1/2"></span>
            )}
          </a>

          <a
            href="#services"
            onClick={() => setActiveTab('Treatments')}
            className={`relative transition-colors hover:text-slate-950 ${
              activeTab === 'Treatments' ? 'text-slate-950 font-semibold' : 'text-slate-600'
            }`}
          >
            Treatments
            {activeTab === 'Treatments' && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 absolute -bottom-2 left-1/2 -translate-x-1/2"></span>
            )}
          </a>

          <a
            href="#why-choose-us"
            onClick={() => setActiveTab('Technology')}
            className={`relative transition-colors hover:text-slate-950 ${
              activeTab === 'Technology' ? 'text-slate-950 font-semibold' : 'text-slate-600'
            }`}
          >
            Technology
            {activeTab === 'Technology' && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 absolute -bottom-2 left-1/2 -translate-x-1/2"></span>
            )}
          </a>

          <a
            href="#clinicians"
            onClick={() => setActiveTab('About')}
            className={`relative transition-colors hover:text-slate-950 ${
              activeTab === 'About' ? 'text-slate-950 font-semibold' : 'text-slate-600'
            }`}
          >
            About
            {activeTab === 'About' && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 absolute -bottom-2 left-1/2 -translate-x-1/2"></span>
            )}
          </a>

          <a
            href="#contact"
            onClick={() => setActiveTab('Contact')}
            className={`relative transition-colors hover:text-slate-950 ${
              activeTab === 'Contact' ? 'text-slate-950 font-semibold' : 'text-slate-600'
            }`}
          >
            Contact
            {activeTab === 'Contact' && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 absolute -bottom-2 left-1/2 -translate-x-1/2"></span>
            )}
          </a>
        </div>

        {/* Right Controls: Circular Action Icons & Solid Black Pill Button (exact reference match) */}
        <div className="flex items-center space-x-2.5">
          {/* Circular Theme / Ambient Sun Icon Button */}
          <button
            onClick={() => openChatDrawer('Explain your clinical technology and 3D milling lab.')}
            className="w-9 h-9 rounded-full border border-slate-200/90 bg-white/80 hover:bg-slate-100 flex items-center justify-center text-slate-800 transition-all hover:scale-105 active:scale-95 shadow-2xs"
            title="AI Clinical Assistant"
            aria-label="Clinical AI"
          >
            <Sun className="w-4 h-4 text-slate-700" />
          </button>

          {/* Circular Menu Hamburger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-full border border-slate-200/90 bg-white/80 hover:bg-slate-100 flex items-center justify-center text-slate-800 transition-all hover:scale-105 active:scale-95 shadow-2xs"
            title="Open Portal Navigation"
            aria-label="Open Navigation Menu"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Solid Black Pill Button with Up-Right Arrow (matching 'Explore Now ↗') */}
          <button
            onClick={() => openBookingModal()}
            className="inline-flex items-center space-x-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-sm shadow-slate-950/20 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <span>Book Now</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Slide-down Portal & Navigation Menu */}
      {menuOpen && (
        <div className="border-t border-slate-200/80 bg-white/95 backdrop-blur-2xl shadow-xl px-4 sm:px-8 py-5 animate-fade-in">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Quick Navigation
              </p>
              <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
                <a
                  href="#services"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-sky-600 transition-colors flex items-center justify-between py-1"
                >
                  <span>Services & Verified Pricing</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="#why-choose-us"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-sky-600 transition-colors flex items-center justify-between py-1"
                >
                  <span>In-House 5-Axis Milling Lab</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="#clinicians"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-sky-600 transition-colors flex items-center justify-between py-1"
                >
                  <span>Lead Clinicians & Harley St Team</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="#reviews"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-sky-600 transition-colors flex items-center justify-between py-1"
                >
                  <span>Patient Reviews & Case Studies</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Patient & Admin Access
              </p>
              {currentUser.isLoggedIn ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                      {currentUser.role === 'admin' ? 'Clinic Director' : 'Patient'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={currentUser.role === 'admin' ? '/admin-dashboard' : '/dashboard'}
                      onClick={() => setMenuOpen(false)}
                      className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center space-x-1"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{currentUser.role === 'admin' ? 'Open Admin Panel' : 'My Appointments'}</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Access your booked appointments, digital x-rays, or test administrative controls.
                  </p>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      openAuthModal();
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sign In or Test Demo Accounts</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Emergency & Direct Contact
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950 text-white space-y-2">
                <p className="text-xs font-bold text-slate-200">Central London Clinic</p>
                <p className="text-[11px] text-slate-400 leading-snug">{companyDetails.clinicalAddress}</p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[11px] text-emerald-400 font-semibold">Triage Open</span>
                  <a
                    href={`tel:${companyDetails.helplinePhone.replace(/\s+/g, '')}`}
                    className="text-xs font-bold text-sky-400 hover:underline"
                  >
                    {companyDetails.helplinePhone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
