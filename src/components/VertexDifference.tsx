'use client';

import React from 'react';
import {
  Award,
  Cpu,
  HeartHandshake,
  CreditCard,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const VertexDifference: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'Experienced GDC Clinicians',
      subtitle: 'Harley Street Proven Clinical Director',
      description:
        'Every procedure is governed by GDC-registered UK specialists with Royal College of Surgeons fellowships. We never cut corners with unsupervised dental work.',
      points: [
        'MFDS RCS Eng & Royal College accredited surgeons',
        'Strict General Dental Council regulatory auditing',
        'Over 16 years of private London clinical cases',
      ],
      icon: Award,
      badge: 'GDC Accredited',
    },
    {
      num: '02',
      title: 'Advanced Digital Diagnostics & Lab Tech',
      subtitle: 'On-Site 5-Axis Milling & 3D Printing',
      description:
        'Unlike clinics that outsource crowns and veneers abroad, our in-house Vertex Dental Lab manufactures porcelain and zirconia restorations directly on-site.',
      points: [
        'Robotic CAD/CAM milling for same-day restorations',
        'Low-radiation 3D CBCT digital bone scanning',
        'iTero® optical 3D scanning with zero messy putty',
      ],
      icon: Cpu,
      badge: 'In-House Lab',
    },
    {
      num: '03',
      title: 'Painless Computerized Treatment',
      subtitle: 'The Wand® & Gentle Laser Dentistry',
      description:
        'We have eliminated dental anxiety. Our computer-controlled local anaesthesia delivers precise, pressure-free numbness without syringe trauma.',
      points: [
        'The Wand® micro-sensor computerized anaesthesia',
        'Minimally invasive soft-tissue laser hygiene',
        'Optional conscious IV twilight sedation',
      ],
      icon: HeartHandshake,
      badge: 'Zero Syringe Pain',
    },
    {
      num: '04',
      title: 'Transparent UK Pricing & 0% Finance',
      subtitle: 'Zero Hidden Fees & 24-Month Spread',
      description:
        'You receive a comprehensive, itemized treatment guarantee before any clinical work commences. Spread payments seamlessly at 0% APR interest.',
      points: [
        '0% APR interest-free finance up to 24 months',
        'No hidden clinical facility or PPE surcharges',
        'Free iTero® smile simulation with orthodontics',
      ],
      icon: CreditCard,
      badge: '0% APR Available',
    },
  ];

  return (
    <section id="why-choose-us" className="py-20 lg:py-28 bg-[#F8F9FA] text-slate-900 border-b border-slate-200/80 scroll-mt-16 relative overflow-hidden">
      {/* Ambient glass glows */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-slate-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs text-slate-800 text-xs font-bold mb-3 uppercase tracking-[0.18em]">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>THE VERTEX CLINICAL DIFFERENCE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight uppercase font-sans">
            Why Patients Across The UK Choose Us
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 font-medium">
            Four foundational pillars that bridge clinical surgery, high-precision laboratory engineering, and patient comfort.
          </p>
        </div>

        {/* 4-Pillar Grid with Frosted Glassmorphism & High-Contrast Visible Text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="relative rounded-[28px] bg-white/80 backdrop-blur-xl border border-white/95 p-8 transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.07)] hover:border-slate-300 hover:bg-white/95 group"
              >
                {/* Specular Glare */}
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/40 via-transparent to-transparent pointer-events-none" />

                {/* Header with Number and Icon */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6 relative z-10">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-300 group-hover:text-slate-900 transition-colors">
                      {pillar.num}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-all shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs shrink-0 whitespace-nowrap">
                    {pillar.badge}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-950 group-hover:text-sky-700 transition-colors relative z-10 font-sans">
                  {pillar.title}
                </h3>
                <p className="text-xs font-bold text-sky-700 mt-1 uppercase tracking-wider relative z-10">
                  {pillar.subtitle}
                </p>

                <p className="mt-4 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed relative z-10">
                  {pillar.description}
                </p>

                <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-2.5 relative z-10">
                  {pillar.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-center space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
