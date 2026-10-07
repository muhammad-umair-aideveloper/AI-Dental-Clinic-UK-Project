'use client';

import React from 'react';
import { Star, CheckCircle, Quote, ThumbsUp } from 'lucide-react';

export const PatientReviews: React.FC = () => {
  const reviews = [
    {
      id: 'rev-1',
      name: 'Charlotte Kensington',
      location: 'Kensington & Chelsea, London',
      treatment: 'Invisalign® & Teeth Whitening',
      rating: 5,
      date: '2 weeks ago',
      quote:
        'Dr. Vance and the Vertex team are extraordinary. Having the 3D lab on site meant my aligners were ready in days rather than weeks. The AI booking assistant even reminded me of my morning appointment. I cannot stop smiling!',
    },
    {
      id: 'rev-2',
      name: 'Edward Montgomery',
      location: 'Mayfair, Central London',
      treatment: 'Precision Dental Implants (Straumann®)',
      rating: 5,
      date: '1 month ago',
      quote:
        'I had been anxious about implant surgery for years. The Wand computerized anaesthesia was truly painless—I felt no syringe prick at all. The custom crown matches my natural teeth seamlessly. Worth every pound.',
    },
    {
      id: 'rev-3',
      name: 'Siobhan O’Connor',
      location: 'Richmond upon Thames',
      treatment: 'Same-Day Root Canal Therapy',
      rating: 5,
      date: '3 weeks ago',
      quote:
        'I developed an agonizing toothache on a Sunday evening. Vertex Dental Lab triaged me via their AI chatbot and booked me into an emergency slot first thing Monday. Completely pain-free and relieved.',
    },
    {
      id: 'rev-4',
      name: 'Alexander Davies',
      location: 'Westminster, London',
      treatment: 'Hygiene Therapy & Airflow Polishing',
      rating: 5,
      date: 'Last month',
      quote:
        'The Airflow hygiene treatment removed years of coffee and tea staining in 45 minutes. The clinic is pristine, modern, and feels more like a calm private club than a typical dental surgery.',
    },
    {
      id: 'rev-5',
      name: 'Dr. Priya Patel',
      location: 'Hampstead, London',
      treatment: 'Porcelain Ceramic Veneers',
      rating: 5,
      date: '2 months ago',
      quote:
        'As an NHS medical consultant, clinical sterility and practitioner qualifications are paramount to me. Vertex Dental Lab exceeds every CQC and GDC benchmark. Outstanding aesthetic results.',
    },
    {
      id: 'rev-6',
      name: 'George H. Bennett',
      location: 'Marylebone, London',
      treatment: 'General Checkup & Digital OPG X-Rays',
      rating: 5,
      date: '3 weeks ago',
      quote:
        'Very thorough 14-point oral assessment. Dr. Vance walked me through the 3D OPG scan on a large monitor and clearly explained preventive steps. No pushy upselling, just honest British clinical expertise.',
    },
  ];

  return (
    <section id="reviews" className="py-20 lg:py-28 bg-white text-slate-900 scroll-mt-16 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 uppercase tracking-wider">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Verified Patient Feedback</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted by Over 4,200 London & UK Patients
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <div className="flex text-amber-400 shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400" />
              ))}
            </div>
            <span className="text-base font-extrabold text-slate-900 shrink-0">4.9 / 5.0</span>
            <span className="text-sm text-slate-500 whitespace-nowrap">• Google Verified Patient Reviews</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map(review => (
            <div
              key={review.id}
              className="rounded-3xl bg-slate-50 border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between hover:shadow-xl hover:border-sky-300 hover:bg-white transition-all duration-300 relative group"
            >
              <div>
                {/* Stars and Verification Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-amber-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                    Verified Patient
                  </span>
                </div>

                <Quote className="w-6 h-6 text-slate-300 group-hover:text-sky-300 transition-colors mb-2" />

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>

              {/* Patient Info Footer */}
              <div className="mt-6 pt-4 border-t border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {review.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {review.location}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">{review.date}</span>
                </div>
                <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 text-[10px] font-semibold border border-sky-200/60">
                  {review.treatment}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
