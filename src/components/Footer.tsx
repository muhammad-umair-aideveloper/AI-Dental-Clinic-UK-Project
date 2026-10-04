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
  LayoutDashboard,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { companyDetails, openBookingModal } = useClinic();
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  return (
    <footer className="bg-[#0F172A] text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Col 1 & 2: Clinic Overview & Official UK Compliance Markers */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-5 bg-white rounded-full"></span>
                <span className="w-1.5 h-3.5 bg-slate-400 rounded-full"></span>
                <span className="w-1.5 h-6 bg-emerald-400 rounded-full"></span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-[0.24em] text-white uppercase font-sans">
                  VERTEX
                </span>
                <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase -mt-0.5">
                  PRIVATE DENTAL LAB
                </span>
              </div>
            </Link>

            <p className="text-slate-300 leading-relaxed text-xs">
              Vertex Dental Lab is an independent Central London private dental practice and in-house 5-axis digital laboratory. Specialising in painless implantology, digital smile design, and bespoke ceramic veneers.
            </p>

            {/* Mandatory Regulatory Trust Badges */}
            <div className="pt-2 space-y-2 text-slate-300">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">CQC Provider ID: 1-104928374 (Care Quality Commission)</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">ICO Registration: ZA892147 (Data Protection & GDPR)</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>General Dental Council (GDC) Practice Registration No. 248912</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>British Dental Association (BDA) Good Practice Member</span>
              </div>
            </div>
          </div>

          {/* Col 3: Treatments */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">Treatments</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => openBookingModal('Invisalign® Clear Aligners & 3D Simulation', 'Cosmetic')}
                  className="hover:text-white transition-colors text-left"
                >
                  Invisalign® Clear Aligners
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('Bespoke Hand-Layered E.max® Porcelain Veneers', 'Cosmetic')}
                  className="hover:text-white transition-colors text-left"
                >
                  E.max® Porcelain Veneers
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('Precision Straumann® Titanium Dental Implant', 'General')}
                  className="hover:text-white transition-colors text-left"
                >
                  Straumann® Dental Implants
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('Philips Zoom!® In-Chair Laser Whitening', 'Cosmetic')}
                  className="hover:text-white transition-colors text-left"
                >
                  Philips Zoom! Whitening
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('Guided Biofilm Therapy & Airflow® Polishing', 'General')}
                  className="hover:text-white transition-colors text-left"
                >
                  Airflow® Hygiene Therapy
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('Microscopic Root Canal Therapy (Molar / Premolar)', 'General')}
                  className="hover:text-white transition-colors text-left"
                >
                  Zeiss Microscopic Root Canal
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('24/7 Same-Day Emergency Dental Triage', 'General')}
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors text-left"
                >
                  24/7 Urgent Triage
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Operating Hours & Accessibility */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">Hours & Transport</h4>
            
            <div className="space-y-2 text-slate-300">
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Opening Hours</p>
                  <p className="text-[11px] text-slate-400">Mon - Fri: 08:30 - 18:00</p>
                  <p className="text-[11px] text-slate-400">Saturday: 09:00 - 17:00</p>
                  <p className="text-[11px] text-amber-300 font-medium">Sunday: Emergency Triage On-Call</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2 border-t border-slate-800">
                <Train className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Underground Access</p>
                  <p className="text-[11px] text-slate-400">Oxford Circus (Bakerloo/Central/Victoria) — 4 min walk</p>
                  <p className="text-[11px] text-slate-400">Bond Street (Elizabeth Line/Jubilee) — 6 min walk</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-1">
                <Car className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Parking</p>
                  <p className="text-[11px] text-slate-400">Q-Park Cavendish Square (2 min walk)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Col 5: Clinic Location & Admin Access */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">Central London Clinic</h4>
            <div className="space-y-2.5 text-slate-300">
              <p className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>42 Harley Place, Marylebone, London, W1G 9PH</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${companyDetails.helplinePhone.replace(/\s+/g, '')}`} className="hover:text-white">
                  {companyDetails.helplinePhone}
                </a>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${companyDetails.contactEmail}`} className="hover:text-white">
                  {companyDetails.contactEmail}
                </a>
              </p>

              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() => setPrivacyModalOpen(true)}
                  className="text-left text-[11px] text-slate-400 hover:text-white flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>GDPR Privacy & Data Policy</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal Copyright Strip */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Vertex Dental Lab Ltd. Company Reg No. 12948210. Registered in England & Wales.</p>
          <div className="flex items-center space-x-4">
            <button onClick={() => setPrivacyModalOpen(true)} className="hover:text-white underline">
              Privacy Policy (GDPR)
            </button>
            <span>•</span>
            <button onClick={() => setPrivacyModalOpen(true)} className="hover:text-white underline">
              Cookie Preferences
            </button>
            <span>•</span>
            <a href="#services" className="hover:text-white underline">
              Fee Schedule
            </a>
            <span>•</span>
            <Link
              href="/admin-login"
              className="text-slate-500 hover:text-slate-300 transition-colors text-[10px]"
            >
              Staff Access
            </Link>
          </div>
        </div>
      </div>

      {/* GDPR Privacy Modal */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-900">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
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
