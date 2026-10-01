# Vertex Dental Lab — UK Private Dental Clinic & AI Triage Platform

A modern, responsive, full-stack Dental Clinic Web Application tailored for **Vertex Dental Lab**, a premier private dental clinic and digital 3D milling laboratory located in Marylebone, London, UK.

---

## 🏛️ Application Architecture & Views

### 1. Public Front-End Website (`/`)
- **British Private Dentistry Branding**: Clinical deep navy (`#0F172A`), electric/cyan blue (`#0284C7`), crisp slate (`#F8FAFC`), rounded modern cards, and official regulatory badges (**GDC Registered Specialists**, **CQC Compliant**, **BDA Good Practice**, **100% Hospital-Grade Class-B Sterilization**).
- **Navigation & Currency Selector**: Sticky navbar with live emergency triage status, phone link (`+44 20 7946 0888`), currency switcher (**GBP £ default**, **EUR €**, **USD $**), and instant booking CTA.
- **Hero Section**: Headline *"Your Smile, Precision Crafted — Vertex Dental Lab"*, subtitle, primary CTAs (*"Book Consultation via AI"* & *"WhatsApp Us"*), and verified patient metrics (4.9★ rating, 15+ years experience, 4,200+ procedures).
- **8 Comprehensive Dental Treatments**:
  - General Checkup & Digital OPG X-Rays (From £95)
  - Hygiene Therapy & Airflow Polishing (From £110)
  - Same-Day Root Canal Therapy (RCT) (From £450)
  - Invisalign® & Clear Aligners (From £1,800)
  - Precision Bio-Compatible Dental Implants (From £1,500)
  - In-Clinic Laser Teeth Whitening (From £350)
  - Pediatric & Family Dentistry (From £75)
  - 24/7 Emergency Dental Care (Immediate relief)
- **The Vertex Difference**: 4-pillar grid covering GDC clinicians, advanced digital CAD/CAM lab tech, painless computerized anaesthesia (The Wand®), and transparent UK pricing with 0% APR finance.
- **Lead Clinician Spotlight**: Dr. Alistair Vance (BDS Hons, MFDS RCS Eng, M.Sc Oral Implantology, GDC No. 248912) with credentials, stats, and an **interactive embedded date & time slot picker**.
- **Smile & Lab Gallery**: Transformations (Before/After) and clinic/lab interior views showing 3D digital scanners and 5-axis robotic milling units.
- **Verified Patient Reviews**: Star ratings, quotes, treatment tags, and London borough badges (Kensington, Mayfair, Westminster, Richmond).
- **Location & Contact**: Marylebone clinic address, tube directions (Oxford Circus & Bond Street), hours, phone, WhatsApp button, and contact form synced to Admin Inquiries.

---

## 🤖 2. Patient AI Chatbot & 4-Step Booking Modal
- **Floating AI Dental Assistant Drawer**: Anchored at bottom-right with quick chips (*"Book an appointment"*, *"Invisalign pricing?"*, *"I have an emergency toothache"*, *"Check cancellation policy"*). Grounded strictly in Admin Knowledge Base data with clickable action triggers.
- **Interactive Booking Modal**:
  - Step 1: Select Treatment / Service dropdown.
  - Step 2: Date Selector with day pills and calendar picker.
  - Step 3: Time Slot Picker with morning and afternoon availability badges.
  - Step 4: Patient Details with inline validation.
  - Confirmation: Instant appointment reference ID and write to shared storage.

---

## 👥 3. Patient Portal (`/dashboard`)
- **Welcome Banner**: Patient name, email, UK phone number, and verified private dental patient badge.
- **4-Stage Patient Care Journey Tracker**:
  1. *Booked & Confirmed* ➔ 2. *Triage & Clinic Verification* ➔ 3. *Consultation Day* ➔ 4. *Gentle Treatment & Aftercare*.
- **Appointments Table**: Live list of upcoming and past consultations with clinician name, date, time slot, and status badges (*Confirmed*, *Pending*).
- **New Appointment Action**: Triggers the interactive booking modal.

---

## 🛡️ 4. Admin Management Dashboard (`/admin-dashboard`)
- **Top Metric Cards**: Total Appointments, Today's Schedule count, Confirmed Active Patients, Patient Web Inquiries.
- **Management Tabs**:
  1. **Appointments**: Searchable by patient name/phone/treatment; date filters (*Today*, *Tomorrow*, *All*); status filters (*Confirmed*, *Pending*); confirm and delete actions with confirmation modals.
  2. **Web Inquiries**: Feed of incoming contact messages with timestamps and direct action buttons (*"Call +44..."*, *"Reply on WhatsApp"*, *"Mark Resolved"*).
  3. **Add Walk-In / Phone Booking**: Immediate calendar reservation form for receptionists.
  4. **AI Assistant & Knowledge Management**: (Exact 3-tab architecture).

---

## 🧠 5. AI Assistant & Knowledge Management System
- **Sticky "Save All AI Settings" Action Button** with instant deployment feedback.
- **Tab 1: Company Knowledge Base**:
  - Clinic Details & Contact Information (Name, Schedule, Description, Phone, WhatsApp, Email, Address).
  - Dental Services & Verified Pricing (Dynamic catalog with *+ Add Service*, GBP pricing, duration, category dropdown).
  - Refund, Cancellation & Clinic Policies (Refund timelines, 24-48h cancellation notice, line-by-line policies).
  - FAQs (Dynamic list with *+ Add FAQ*).
- **Tab 2: AI Instructions & Behavior**:
  - AI Persona, Target Audience, Tone & Manner, Response Length, Business Goals.
  - Guardrails: *"What the AI SHOULD say"*, *"What the AI must NOT say"* (prescriptions, remote diagnoses prohibited), Fallback instructions, Emergency escalation policy, British English formatting.
  - Secure AI Model & Backend Provider Settings (OpenAI, OpenRouter, Custom Endpoint, Model Name, Masked API Key with reveal toggle).
- **Tab 3: Live Chat Simulator**:
  - Sandboxed testing module with preset query chips and real-time response window showing grounded source tags.

---

## 🔑 Demo Access & Credentials

| Role | Username / Email | Password | Redirect Target |
|---|---|---|---|
| **Admin** | `admin@vertexdental.co.uk` | `admin123` | `/admin-dashboard` |
| **Patient** | `patient@vertexdental.co.uk` | `patient123` | `/dashboard` |

*(Note: Clickable 1-click demo chips are also available on the Sign In modal).*

---

## 🛠️ Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) 16+ (App Router)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: Persistent LocalStorage with React Context API

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run local development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

4. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📜 Regulatory & Clinical Compliance
- **General Dental Council (GDC)**: Standards for the Dental Team.
- **Care Quality Commission (CQC)**: Health and Social Care Act 2008 compliant.
- **British Dental Association (BDA)**: Good Practice Scheme.
