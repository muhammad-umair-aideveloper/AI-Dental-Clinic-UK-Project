'use client';

import React from 'react';
import Link from 'next/link';
import { useClinic } from '@/context/ClinicContext';
import { Sparkles, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { companyDetails, openBookingModal } = useClinic();

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1 & 2: Clinic Overview & GDC/CQC Badges */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Vertex Dental<span className="text-sky-400">Lab</span>
              </span>
            </Link>

            <p className="text-slate-400 leading-relaxed text-xs">
              Vertex Dental Lab is an independent London private dental clinic and state-of-the-art CAD/CAM digital laboratory. Dedicated to clinical excellence, painless computerized dentistry, and same-day precision restorations.
            </p>

            <div className="pt-2 space-y-2 text-slate-300">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>General Dental Council (GDC) Practice Registration No. 248912</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{companyDetails.cqcRegistration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>{companyDetails.bdaMember}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Treatments */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">Clinical Treatments</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => openBookingModal('General Checkup & Digital OPG X-Rays')}
                  className="hover:text-white transition-colors text-left"
                >
                  General Checkups & OPG
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('Hygiene Therapy & Airflow Polishing')}
                  className="hover:text-white transition-colors text-left"
                >
                  Airflow Hygiene Therapy
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('Invisalign® & Clear Aligners')}
                  className="hover:text-white transition-colors text-left"
                >
                  Invisalign® Clear Aligners
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('Precision Bio-Compatible Dental Implants')}
                  className="hover:text-white transition-colors text-left"
                >
                  Straumann® Dental Implants
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('Same-Day Root Canal Therapy (RCT)')}
                  className="hover:text-white transition-colors text-left"
                >
                  Same-Day Root Canal (RCT)
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('In-Clinic Laser Teeth Whitening')}
                  className="hover:text-white transition-colors text-left"
                >
                  Zoom! Laser Whitening
                </button>
              </li>
              <li>
                <button
                  onClick={() => openBookingModal('24/7 Emergency Dental Care')}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors text-left"
                >
                  24/7 Emergency Relief
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Portals & Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">Navigation & Portals</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#services" className="hover:text-white transition-colors">
                  Services & Fees
                </a>
              </li>
              <li>
                <a href="#why-choose-us" className="hover:text-white transition-colors">
                  The Vertex Difference
                </a>
              </li>
              <li>
                <a href="#clinicians" className="hover:text-white transition-colors">
                  Lead Dental Surgeon
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-white transition-colors">
                  Smile & Lab Gallery
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="text-sky-400 hover:text-sky-300 transition-colors font-medium">
                  Patient Portal Login
                </Link>
              </li>
              <li>
                <Link href="/admin-dashboard" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                  Admin & Knowledge Base
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Clinic Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">Marylebone Clinic</h4>
            <div className="space-y-2 text-slate-400">
              <p className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{companyDetails.clinicalAddress}</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{companyDetails.helplinePhone}</span>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{companyDetails.contactEmail}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimers & Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 space-y-4 text-[11px] text-slate-400">
          <p className="leading-relaxed">
            <strong>Clinical Disclaimer:</strong> All information provided on this website and via our AI assistant is for informational and scheduling purposes only and should not be construed as definitive medical or dental diagnoses. Specific treatment recommendations and risk analyses require an in-person clinical examination by a GDC-registered practitioner. In the event of severe swelling, airway compromise, or uncontrolled trauma, please call 999 or attend your nearest NHS Accident & Emergency department immediately.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-900 text-slate-400">
            <p>© {new Date().getFullYear()} Vertex Dental Lab UK. All rights reserved. Registered in England & Wales.</p>
            <div className="flex space-x-4">
              <span>Privacy & UK GDPR</span>
              <span>•</span>
              <span>Terms of Clinical Care</span>
              <span>•</span>
              <span>CQC Statement of Purpose</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
