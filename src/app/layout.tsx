import type { Metadata } from 'next';
import './globals.css';
import { ClinicProvider } from '@/context/ClinicContext';
import { BookingModal } from '@/components/BookingModal';
import { ChatDrawer } from '@/components/ChatDrawer';
import { DentalAgentWidget } from '@/components/DentalAgentWidget';

export const metadata: Metadata = {
  title: 'Vertex Dental Lab | Award-Winning Central London Private & Cosmetic Dentistry',
  description:
    'Harley Street & Marylebone private dentistry specializing in Invisalign®, Straumann® dental implants, and bespoke porcelain veneers. Backed by our in-house 5-axis 3D CAD/CAM milling laboratory and 24/7 emergency triage. GDC registered & CQC regulated.',
  keywords: [
    'Private Dentist London',
    'Vertex Dental Lab',
    'Marylebone Cosmetic Dentist',
    'Invisalign Central London',
    'Dental Implants London',
    'Harley Street Dental Surgeon',
    'Emergency Dentist Marylebone',
    '0% Dental Finance UK',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" data-scroll-behavior="smooth" className="h-full antialiased scroll-smooth overflow-x-hidden w-full max-w-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF9F6] text-slate-900 selection:bg-slate-900 selection:text-white overflow-x-hidden w-full max-w-full" suppressHydrationWarning>
        <ClinicProvider>
          {children}
          <BookingModal />
          <DentalAgentWidget />
        </ClinicProvider>
      </body>
    </html>
  );
}
