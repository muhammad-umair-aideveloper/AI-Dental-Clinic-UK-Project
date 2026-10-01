'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ServicesSection } from '@/components/ServicesSection';
import { VertexDifference } from '@/components/VertexDifference';
import { ClinicianSpotlight } from '@/components/ClinicianSpotlight';
import { SmileGallery } from '@/components/SmileGallery';
import { PatientReviews } from '@/components/PatientReviews';
import { LocationAndContact } from '@/components/LocationAndContact';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <VertexDifference />
      <ClinicianSpotlight />
      <SmileGallery />
      <PatientReviews />
      <LocationAndContact />
      <Footer />
    </main>
  );
}
