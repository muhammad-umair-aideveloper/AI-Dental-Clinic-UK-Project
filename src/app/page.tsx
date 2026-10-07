'use client';

import React from 'react';
import { UrgentCareStickyBanner } from '@/components/UrgentCareStickyBanner';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ServicesSection } from '@/components/ServicesSection';
import { FinanceCalculator } from '@/components/FinanceCalculator';
import { SmileGallery } from '@/components/SmileGallery';
import { ClinicianSpotlight } from '@/components/ClinicianSpotlight';
import { VertexDifference } from '@/components/VertexDifference';
import { PatientReviews } from '@/components/PatientReviews';
import { LocationAndContact } from '@/components/LocationAndContact';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF9F6] overflow-x-hidden w-full max-w-full">
      <UrgentCareStickyBanner />
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <FinanceCalculator />
      <SmileGallery />
      <ClinicianSpotlight />
      <VertexDifference />
      <PatientReviews />
      <LocationAndContact />
      <Footer />
    </main>
  );
}
