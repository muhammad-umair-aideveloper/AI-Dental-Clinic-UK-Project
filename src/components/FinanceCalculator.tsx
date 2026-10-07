'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  Calculator,
  BadgePercent,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react';

export const FinanceCalculator: React.FC = () => {
  const { openBookingModal } = useClinic();

  // Finance slider state
  const [treatmentCost, setTreatmentCost] = useState<number>(2450);
  const [depositPercent, setDepositPercent] = useState<number>(10);
  const [termMonths, setTermMonths] = useState<number>(12); // 12, 24, 36, 60

  const depositAmount = Math.round((treatmentCost * depositPercent) / 100);
  const loanAmount = Math.max(0, treatmentCost - depositAmount);

  const isInterestFree = termMonths <= 24;
  const aprRate = isInterestFree ? 0 : 0.099; // 9.9% APR

  // Monthly calculation
  const totalPayable = isInterestFree
    ? treatmentCost
    : depositAmount + Math.round(loanAmount * (1 + aprRate * (termMonths / 12)));

  const monthlyPayment = Math.round((totalPayable - depositAmount) / termMonths);
  const totalInterest = Math.max(0, totalPayable - treatmentCost);

  // Tabulated Fee Guide items
  const feeGuide = [
    { category: 'Diagnostics & Exams', item: 'Comprehensive Oral Exam + 3D Scan', price: 'From £95', timeline: '45 mins' },
    { category: 'Diagnostics & Exams', item: 'CBCT 3D Cone Beam Bone Scan', price: 'From £150', timeline: '30 mins' },
    { category: 'Hygiene & Prevention', item: 'Guided Biofilm Therapy & Airflow®', price: 'From £110', timeline: '50 mins' },
    { category: 'Hygiene & Prevention', item: 'Deep Periodontal Therapy (Per Quad)', price: 'From £220', timeline: '60 mins' },
    { category: 'Cosmetic & Ortho', item: 'Invisalign® Clear Aligners (Both Arches)', price: 'From £2,450', timeline: '3-9 months', finance: '£102/mo' },
    { category: 'Cosmetic & Ortho', item: 'E.max® Porcelain Veneers (Per Tooth)', price: 'From £795', timeline: '2 visits', finance: '£66/mo' },
    { category: 'Cosmetic & Ortho', item: 'Philips Zoom!® In-Chair Laser Whitening', price: 'From £395', timeline: '60 mins', finance: '£33/mo' },
    { category: 'Restorative & Implants', item: 'Straumann® Titanium Implant + Crown', price: 'From £1,650', timeline: '12 weeks', finance: '£68/mo' },
    { category: 'Restorative & Implants', item: 'Same-Day 5-Axis Milled CEREC Crown', price: 'From £695', timeline: 'Single visit' },
    { category: 'Restorative & Implants', item: 'Microscopic Root Canal (Molar)', price: 'From £550', timeline: '90 mins' },
    { category: 'Urgent Care', item: '24/7 Same-Day Emergency Triage', price: 'From £120', timeline: 'Immediate' },
  ];

  const [activeFeeCategory, setActiveFeeCategory] = useState<string>('All');
  const feeCategories = ['All', 'Cosmetic & Ortho', 'Restorative & Implants', 'Diagnostics & Exams', 'Hygiene & Prevention'];

  const filteredFees = activeFeeCategory === 'All'
    ? feeGuide
    : feeGuide.filter(f => f.category === activeFeeCategory);

  return (
    <section id="pricing-finance" className="py-20 lg:py-28 bg-[#FAF9F6] text-slate-900 scroll-mt-16 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold mb-3 uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>TRANSPARENT UK PRICING & FINANCE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-tight font-sans">
            Tabulated Fee Guide &{' '}
            <span className="font-editorial italic font-normal text-slate-800">
              0% APR Finance Calculator.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Never encounter hidden clinical surcharges. Spread payments comfortably with 0% APR interest-free direct debits through Tabeo and Chrysalis Finance UK.
          </p>
        </div>

        {/* 2-Column Split: Fee Guide Table on Left + Interactive Finance Calculator Slider on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Tabulated Fee Guide */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#0F172A]">Official Clinic Fee Schedule</h3>
                <p className="text-xs text-slate-500 mt-0.5">Published under GDC & CQC transparency guidelines</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                GBP (£) Verified
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
              {feeCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFeeCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    activeFeeCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Fees Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold">Treatment / Procedure</th>
                    <th className="pb-3 font-bold">Timeline</th>
                    <th className="pb-3 font-bold text-right">Starting Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredFees.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 text-slate-900 font-semibold">
                        {item.item}
                        {item.finance && (
                          <span className="block text-[10px] text-emerald-700 font-bold whitespace-nowrap">
                            or {item.finance} (0% APR)
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500 whitespace-nowrap">{item.timeline}</td>
                      <td className="py-3 text-slate-950 font-black text-right whitespace-nowrap">{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
              <span>* Includes initial clinical consultation & 3D scan.</span>
              <button
                onClick={() => openBookingModal()}
                className="font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                Book Consultation ↗
              </button>
            </div>
          </div>

          {/* Right Column: 0% Finance Calculator Slider */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/30 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-bl-2xl">
              0% APR Available
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xl font-black text-[#0F172A]">0% APR Patient Finance Slider</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Calculate your monthly direct debit with zero interest via Tabeo or Chrysalis.
              </p>
            </div>

            {/* Slider 1: Treatment Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Estimated Treatment Cost:</span>
                <span className="text-lg font-black text-slate-950">£{treatmentCost.toLocaleString('en-GB')}</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="50"
                value={treatmentCost}
                onChange={e => setTreatmentCost(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>£500</span>
                <span>£5,000</span>
                <span>£10,000</span>
              </div>
            </div>

            {/* Slider 2: Deposit Percentage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Optional Deposit ({depositPercent}%):</span>
                <span className="text-sm font-bold text-slate-900">£{depositAmount.toLocaleString('en-GB')}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={depositPercent}
                onChange={e => setDepositPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>0% (£0)</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Term Options */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Repayment Duration:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { months: 12, label: '12 Months', rate: '0% APR' },
                  { months: 24, label: '24 Months', rate: '0% APR' },
                  { months: 36, label: '36 Months', rate: '9.9% APR' },
                  { months: 60, label: '60 Months', rate: '9.9% APR' },
                ].map(opt => (
                  <button
                    key={opt.months}
                    onClick={() => setTermMonths(opt.months)}
                    className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all ${
                      termMonths === opt.months
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className={`text-[10px] font-semibold ${termMonths === opt.months ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {opt.rate}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculation Output Card */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex flex-wrap justify-between items-baseline gap-2">
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Monthly Direct Debit</p>
                  <p className="text-3xl font-black text-slate-950">£{monthlyPayment} <span className="text-xs font-medium text-slate-600">/ month</span></p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white whitespace-nowrap">
                    {isInterestFree ? '0% Interest Free' : '9.9% APR'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                <div>
                  <span className="text-slate-500 block">Deposit:</span>
                  <span className="font-bold">£{depositAmount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Interest:</span>
                  <span className="font-bold">{totalInterest === 0 ? '£0 (0% APR)' : `£${totalInterest}`}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Payable:</span>
                  <span className="font-bold">£{totalPayable.toLocaleString('en-GB')}</span>
                </div>
              </div>
            </div>

            {/* Regulatory FCA note */}
            <div className="flex items-start space-x-2 text-[10px] text-slate-500 leading-tight">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Vertex Dental Lab is an appointed representative of Chrysalis Finance UK and Tabeo Ltd, which are authorised and regulated by the Financial Conduct Authority (FCA). Terms and conditions apply.
              </span>
            </div>

            {/* Apply button */}
            <button
              onClick={() => openBookingModal(`0% Finance Plan - £${monthlyPayment}/mo for ${termMonths} months`)}
              className="w-full py-3.5 rounded-full font-bold text-xs text-white bg-[#0F172A] hover:bg-slate-800 shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <span>Apply for 0% Finance with Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>
    </section>
  );
};
