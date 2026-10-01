'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClinic, Currency } from '@/context/ClinicContext';
import {
  Sparkles,
  Phone,
  Calendar,
  User,
  ShieldCheck,
  Menu,
  X,
  Lock,
  ChevronDown,
  Globe,
  Clock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currency,
    setCurrency,
    openBookingModal,
    openAuthModal,
    logout,
    companyDetails,
  } = useClinic();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const currencies: { code: Currency; label: string; symbol: string }[] = [
    { code: 'GBP', label: 'GBP (£ UK)', symbol: '£' },
    { code: 'EUR', label: 'EUR (€ EU)', symbol: '€' },
    { code: 'USD', label: 'USD ($ US)', symbol: '$' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* Top Clinical Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              Emergency Triage & Daily Slots Open
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline-flex items-center text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-sky-400" />
              GDC Registered No. 248912 • CQC Compliant
            </span>
            <span className="hidden lg:inline text-slate-500">|</span>
            <span className="hidden lg:inline-flex items-center text-slate-300">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Mon-Sat: 09:00 - 18:00
            </span>
          </div>

          <div className="flex items-center space-x-4 ml-auto">
            <a
              href={`tel:${companyDetails.helplinePhone.replace(/\s+/g, '')}`}
              className="inline-flex items-center hover:text-white transition-colors font-medium text-sky-400"
            >
              <Phone className="w-3 h-3 mr-1" />
              <span>{companyDetails.helplinePhone}</span>
            </a>

            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs"
                title="Change display currency"
              >
                <Globe className="w-3 h-3 text-sky-400" />
                <span>{currency}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white text-slate-800 rounded-md shadow-lg py-1 border border-slate-200 z-50">
                  {currencies.map(c => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-sky-50 ${
                        currency === c.code ? 'font-semibold text-sky-700 bg-sky-50' : 'text-slate-700'
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

      {/* Main Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-sky-900 to-sky-700 flex items-center justify-center text-white shadow-md shadow-sky-900/10 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  Vertex Dental<span className="text-sky-600">Lab</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-800 rounded tracking-wider uppercase border border-sky-200">
                  UK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight">
                Private London Clinic & 3D Milling Lab
              </p>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-7 text-sm font-medium text-slate-600">
            <a href="#services" className="hover:text-sky-600 transition-colors">
              Services & Fees
            </a>
            <a href="#why-choose-us" className="hover:text-sky-600 transition-colors">
              Why Choose Us
            </a>
            <a href="#clinicians" className="hover:text-sky-600 transition-colors">
              Our Clinicians
            </a>
            <a href="#gallery" className="hover:text-sky-600 transition-colors">
              Smile Gallery
            </a>
            <a href="#reviews" className="hover:text-sky-600 transition-colors">
              Reviews
            </a>
            <a href="#contact" className="hover:text-sky-600 transition-colors">
              Contact & Tube
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center space-x-3">
            {currentUser.isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <Link
                  href={currentUser.role === 'admin' ? '/admin-dashboard' : '/dashboard'}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200"
                >
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>{currentUser.role === 'admin' ? 'Admin Panel' : 'My Portal'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="inline-flex items-center space-x-1 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-sky-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign In / Demo</span>
              </button>
            )}

            <button
              onClick={() => openBookingModal()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 shadow-md shadow-sky-600/20 hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={() => openBookingModal()}
              className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 rounded-lg shadow-sm"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden pt-4 pb-3 border-t border-slate-100 mt-3 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700 px-2">
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Services & Fees
              </a>
              <a
                href="#why-choose-us"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Why Choose Us
              </a>
              <a
                href="#clinicians"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Lead Clinician
              </a>
              <a
                href="#gallery"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Smile Gallery
              </a>
              <a
                href="#reviews"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Verified Patient Reviews
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-slate-100"
              >
                Contact & Tube
              </a>

              <hr className="my-2 border-slate-200" />

              {currentUser.isLoggedIn ? (
                <div className="space-y-2">
                  <Link
                    href={currentUser.role === 'admin' ? '/admin-dashboard' : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md font-semibold text-sky-700 bg-sky-50"
                  >
                    Go to {currentUser.role === 'admin' ? 'Admin Dashboard' : 'Patient Portal'}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600"
                  >
                    Sign Out ({currentUser.name})
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sky-700 font-semibold bg-sky-50"
                >
                  Sign In / Demo Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
