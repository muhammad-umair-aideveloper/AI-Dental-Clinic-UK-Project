import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, FileText, ArrowLeft, Building, CheckCircle, Mail, Phone } from 'lucide-react';
import { clinicConfig } from '@/config/clinic.config';

export const metadata = {
  title: `UK GDPR Privacy & Health Data Notice | ${clinicConfig.name}`,
  description: `Privacy policy and special category health data protection terms for ${clinicConfig.name}, London.`,
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-[#0F172A] text-white border-b border-slate-800 py-6 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Clinic Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-semibold text-emerald-400">UK GDPR & DPA 2018 Compliant</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8">
        {/* Title & Introduction */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clinical Data Protection Notice</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Privacy Policy & Health Data Governance
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Effective Date: October 2026 • Registered with the Information Commissioner&apos;s Office (ICO)
          </p>
        </div>

        {/* Practice Identity */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Building className="w-5 h-5 text-emerald-600" />
            <span>1. Data Controller Identity</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            <strong>{clinicConfig.name}</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the Clinic&quot;) acts as the Data Controller under the UK General Data Protection Regulation (UK GDPR) and Data Protection Act 2018. Lead Clinician: <strong>{clinicConfig.leadDentist}</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
            <div><strong>Location:</strong> Marylebone, London, United Kingdom (Europe/London)</div>
            <div><strong>Clinical Governance:</strong> General Dental Council (GDC) Regulated</div>
            <div><strong>Data Protection Enquiries:</strong> {clinicConfig.ownerContact.email} • {clinicConfig.ownerContact.phone}</div>
          </div>
        </section>

        {/* Lawful Basis for Processing */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>2. Lawful Basis for Processing (UK GDPR Articles 6 &amp; 9)</span>
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              We process personal and special category dental health data strictly under the following lawful grounds:
            </p>
            <ul className="space-y-2.5 list-disc pl-5">
              <li>
                <strong>Article 6(1)(b) - Contractual Necessity:</strong> Processing your contact details and requested dental procedures to facilitate consultation reservations, clinician diary booking, and clinical appointments.
              </li>
              <li>
                <strong>Article 6(1)(a) - Explicit Consent:</strong> Sending automated 1-hour appointment reminder notifications via SMS or WhatsApp. You may opt out at any time.
              </li>
              <li>
                <strong>Article 9(2)(h) - Provision of Healthcare:</strong> Processing special category health data (such as dental symptoms, tooth pain level, and treatment history) strictly for clinical diagnosis and direct healthcare provision by licensed dental professionals.
              </li>
            </ul>
          </div>
        </section>

        {/* Zero-PII AI & Chatbot Architecture */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>3. AI Chatbot Health Data Protection &amp; Zero-PII Scrubber</span>
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Our 24/7 Clinical AI Assistant operates under strict automated data minimization safeguards:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs space-y-1">
                <strong className="text-emerald-900">Zero Third-Party PII Transmission</strong>
                <p className="text-slate-700">Patient identifiable data (NHS numbers, phone numbers, payment information) is strictly scrubbed and redacted prior to any natural language processing.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <strong className="text-slate-900">Non-Clinical Diagnostic Advice</strong>
                <p className="text-slate-700">The AI assistant provides triage guidance, emergency pain relief home protocols, and transparent fee schedules. Formal diagnosis is solely conducted in-chair by GDC-registered surgeons.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Retention & Storage */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>4. Data Retention &amp; Security</span>
          </h2>
          <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              <strong>Data Residency:</strong> All patient databases and appointment storage are hosted within United Kingdom / European Union sovereign data centers (London `eu-west-2` or Ireland `eu-west-1`).
            </p>
            <p>
              <strong>Retention Periods:</strong> In compliance with British Dental Association (BDA) regulations and NHS guidelines, primary clinical records are retained for a minimum of 11 years following completion of treatment. Operational reminder logs are retained for 30 days.
            </p>
            <p>
              <strong>Encryption:</strong> Data in transit is secured using TLS 1.3 encryption; database records are encrypted at rest using AES-256.
            </p>
          </div>
        </section>

        {/* Your Rights */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <h2 className="text-lg font-black text-slate-900">5. Your Statutory Patient Rights</h2>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>Under the UK GDPR, you maintain enforceable rights including:</p>
            <ul className="space-y-1.5 list-disc pl-5">
              <li><strong>Right to Access:</strong> Request a copy of your personal dental data (Subject Access Request - SAR free of charge within 30 days).</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate contact or demographic details.</li>
              <li><strong>Right to Withdraw Consent:</strong> Opt out of SMS/email reminder communications at any time.</li>
              <li><strong>Right to Lodge a Complaint:</strong> If dissatisfied, contact the UK Information Commissioner&apos;s Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-semibold">ico.org.uk</a>.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
