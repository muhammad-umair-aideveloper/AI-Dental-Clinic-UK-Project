import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClinicProvider } from '@/context/ClinicContext';
import { BookingModal } from '@/components/BookingModal';
import { AuthModal } from '@/components/AuthModal';
import { ChatDrawer } from '@/components/ChatDrawer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Vertex Dental Lab | London Private Clinic & 3D Milling Laboratory',
  description:
    'Bespoke, pain-free dental care backed by state-of-the-art British clinical technology, in-house 5-axis CAD/CAM milling, and our 24/7 AI-powered dental assistant. GDC registered and CQC compliant clinic in Marylebone, Central London.',
  keywords: [
    'Dental Clinic London',
    'Vertex Dental Lab',
    'Marylebone Dentist',
    'Invisalign London',
    'Dental Implants UK',
    'Harley Street Dental Surgeon',
    'Emergency Dentist London',
    'CAD/CAM Dental Lab',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased scroll-smooth`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Text:wght@400;500;600;700&family=Google+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-slate-900 selection:bg-sky-500 selection:text-white">
        <ClinicProvider>
          {children}
          <BookingModal />
          <AuthModal />
          <ChatDrawer />
        </ClinicProvider>
      </body>
    </html>
  );
}
