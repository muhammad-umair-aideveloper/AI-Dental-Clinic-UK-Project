'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Train,
  Send,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const LocationAndContact: React.FC = () => {
  const { companyDetails, addInquiry, services } = useClinic();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceInterest: 'General Checkup & Digital OPG X-Rays',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    addInquiry({
      patientName: formData.name,
      email: formData.email,
      phone: formData.phone,
      serviceInterest: formData.serviceInterest,
      message: formData.message || 'Interested in booking a clinical consultation.',
    });

    setSubmitted(true);
    setErrorMsg('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      serviceInterest: 'General Checkup & Digital OPG X-Rays',
      message: '',
    });
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-slate-900 text-white scroll-mt-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Contact Info & Transport */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950 border border-sky-800 text-sky-400 text-xs font-bold mb-3 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>London Marylebone Clinic & Laboratory</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Visit Vertex Dental Lab in Central London
              </h2>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Centrally located in Marylebone close to Harley Street, with direct underground transport access and patient valet parking options.
              </p>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href={`tel:${companyDetails.helplinePhone.replace(/\s+/g, '')}`}
                className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-sky-500 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-900/60 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Direct Telephone</p>
                  <p className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                    {companyDetails.helplinePhone}
                  </p>
                  <p className="text-[10px] text-slate-400">Lines open 08:30 - 19:00</p>
                </div>
              </a>

              <a
                href={`https://wa.me/${companyDetails.whatsappPhone.replace(/[^0-9]/g, '')}?text=Hello%20Vertex%20Dental%20Lab`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500 transition-all flex items-start space-x-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">WhatsApp Triage</p>
                  <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {companyDetails.whatsappPhone}
                  </p>
                  <p className="text-[10px] text-slate-400">Instant patient messaging</p>
                </div>
              </a>
            </div>

            {/* Address & Hours */}
            <div className="p-6 rounded-3xl bg-slate-850 border border-slate-800 space-y-4">
              <div className="flex items-start space-x-3.5">
                <MapPin className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Physical Clinical Address</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{companyDetails.clinicalAddress}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 pt-3 border-t border-slate-800">
                <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Operating Schedule</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{companyDetails.workingHours}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 pt-3 border-t border-slate-800">
                <Train className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">London Underground Transport</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    3 min walk from Oxford Circus (Bakerloo, Central, Victoria) & Bond Street (Elizabeth line).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Patient Inquiry Form */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-slate-800/90 border border-slate-700 p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Send a Private Clinical Inquiry</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Our patient coordinators reply within 2 working hours.
                </p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-800 text-emerald-300 mx-auto flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Inquiry Received</h4>
                  <p className="text-xs text-emerald-200">
                    Thank you. Your message has been logged in our clinic management system. A coordinator will contact you shortly via email or WhatsApp.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-3 text-xs text-white underline hover:text-emerald-300"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="patient@example.co.uk"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        UK Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+44 7700 900000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Treatment of Interest
                    </label>
                    <select
                      value={formData.serviceInterest}
                      onChange={e => setFormData({ ...formData, serviceInterest: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.priceRange})
                        </option>
                      ))}
                      <option value="General Clinical Inquiry">General Clinical Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Message / Dental Concerns
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your symptoms, desired timeframe, or any dental anxiety questions..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 hover:opacity-95 transition-all shadow-lg shadow-sky-500/10 flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>Send Message to Vertex Dental Lab</span>
                  </button>

                  <p className="text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Your clinical details are protected under UK GDPR & GDC confidentiality.</span>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
