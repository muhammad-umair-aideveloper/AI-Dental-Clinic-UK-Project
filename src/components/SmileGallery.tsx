'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle2 } from 'lucide-react';

export const SmileGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'Transformations' | 'ClinicLab'>('All');

  const galleryItems = [
    {
      id: 'gal-1',
      title: 'Full Arch Ceramic Veneers & Realignment',
      category: 'Transformations',
      image: '/images/smile-transformation.jpg',
      badge: 'Before & After Transformation',
      description: 'Custom laboratory-crafted porcelain veneers restoring worn incisal edges, shade correction from A3 to BL2, and gum contouring.',
      details: ['Treatment Duration: 2 visits (10 days)', 'Material: E.max® CAD Lithium Disilicate', 'Clinician: Dr. Alistair Vance'],
    },
    {
      id: 'gal-2',
      title: 'Marylebone Private Operatory Suite',
      category: 'ClinicLab',
      image: '/images/clinic-suite.jpg',
      badge: 'State-of-the-Art Clinical Suite',
      description: 'Equipped with MedFit 3D intraoral digital scanners, ergonomic memory-foam dental chair, and panoramic street views.',
      details: ['Hospital-Grade Air Filtration (HEPA-14)', 'The Wand® Computerized Anaesthesia', 'Dual Digital Patient Display Screens'],
    },
    {
      id: 'gal-3',
      title: 'In-House 5-Axis Robotic CAD/CAM Lab',
      category: 'ClinicLab',
      image: '/images/dental-lab.jpg',
      badge: 'In-House Precision Laboratory',
      description: 'German Ceramill® 5-axis wet/dry milling unit sculpting custom zirconia crowns and bio-compatible titanium abutments with micron tolerance.',
      details: ['exocad® Digital Smile Architecture', 'Same-Day CEREC Crown Fabrication', 'Custom Hand-Layered Staining & Glazing'],
    },
  ];

  const filteredItems = activeTab === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeTab);

  return (
    <section id="gallery" className="py-20 lg:py-28 bg-slate-50 text-slate-900 scroll-mt-16 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-3 uppercase tracking-wider">
            <Camera className="w-3.5 h-3.5" />
            <span>Visual Transformations & Modern Clinic</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            See the Clinical Precision & Laboratory Standards
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Real patient outcomes and our high-tech London private clinical facilities.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center space-x-2 mb-10">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'All'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            All Views
          </button>
          <button
            onClick={() => setActiveTab('Transformations')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'Transformations'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Transformations (Before / After)
          </button>
          <button
            onClick={() => setActiveTab('ClinicLab')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ClinicLab'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Clinic & Lab Interior
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={700}
                  height={450}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900/90 text-sky-300 backdrop-blur-md border border-slate-700">
                  {item.badge}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5">
                  {item.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
