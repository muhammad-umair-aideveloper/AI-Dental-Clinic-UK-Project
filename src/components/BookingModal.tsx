'use client';

import React, { useState } from 'react';
import { useClinic } from '@/context/ClinicContext';
import {
  X,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Calendar as CalendarIcon,
  MessageSquare,
  Send,
  Building,
} from 'lucide-react';

type StepNumber = 1 | 2 | 3 | 4;

const BookingModalDialog: React.FC = () => {
  const {
    closeBookingModal,
    selectedServiceForBooking,
    selectedCategoryForBooking,
    services,
    addAppointment,
    addInquiry,
    triggerToast,
    formatPrice,
    currency,
    companyDetails,
  } = useClinic();

  const [step, setStep] = useState<StepNumber>(1);
  const [selectedCategory, setSelectedCategory] = useState<'Cosmetic' | 'General'>(
    selectedCategoryForBooking || 'Cosmetic'
  );

  // Filter services by category
  const filteredServices = services.filter(s => {
    if (selectedCategory === 'Cosmetic') {
      return s.category === 'Cosmetic' || s.category === 'Orthodontics';
    } else {
      return s.category !== 'Cosmetic' && s.category !== 'Orthodontics';
    }
  });

  const initialServiceId = () => {
    if (selectedServiceForBooking) {
      const found = services.find(
        s => s.name.toLowerCase() === selectedServiceForBooking.toLowerCase()
      );
      if (found) return found.id;
    }
    return filteredServices[0]?.id || services[0]?.id || '';
  };

  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-06');
  const [selectedTime, setSelectedTime] = useState<string>('11:45 AM');

  const [patientDetails, setPatientDetails] = useState({
    name: '',
    phone: '',
    email: '',
    concern: '',
  });

  const [confirmedAptId, setConfirmedAptId] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const currentService =
    services.find(s => s.id === selectedServiceId) || filteredServices[0] || services[0];

  const dayPills = [
    { label: 'Monday', date: '2026-10-06' },
    { label: 'Tuesday', date: '2026-10-07' },
    { label: 'Wednesday', date: '2026-10-08' },
    { label: 'Thursday', date: '2026-10-09' },
    { label: 'Friday', date: '2026-10-10' },
  ];

  const morningSlots = ['09:15 AM', '10:30 AM', '11:45 AM'];
  const afternoonSlots = ['02:00 PM', '03:15 PM', '04:30 PM', '05:15 PM'];

  const validateStep3 = () => {
    const errs: { [key: string]: string } = {};
    if (!patientDetails.name.trim()) errs.name = 'Full name is required';
    if (!patientDetails.phone.trim() || patientDetails.phone.length < 8) {
      errs.phone = 'Valid UK mobile or WhatsApp number is required';
    }
    if (!patientDetails.email.trim() || !patientDetails.email.includes('@')) {
      errs.email = 'Valid email address is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCompleteGuestBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    // 1. Append Appointment to Clinic State
    const aptId = addAppointment({
      patientName: patientDetails.name.trim(),
      patientEmail: patientDetails.email.trim(),
      patientPhone: patientDetails.phone.trim(),
      serviceId: currentService.id,
      serviceName: currentService.name,
      clinicianName: 'Dr. Alistair Vance',
      date: selectedDate,
      timeSlot: selectedTime,
      status: 'Confirmed',
      notes: patientDetails.concern.trim() || 'Guest consultation booking',
      isEmergency: currentService.category === 'Emergency',
      source: 'Guest Triage Modal',
    });

    // 2. Append Lead into Admin Lead Hub
    addInquiry({
      patientName: patientDetails.name.trim(),
      email: patientDetails.email.trim(),
      phone: patientDetails.phone.trim(),
      serviceInterest: currentService.name,
      treatmentCategory: selectedCategory,
      message: patientDetails.concern.trim() || `Booked consultation for ${selectedDate} at ${selectedTime}`,
      preferredDate: selectedDate,
      preferredTime: selectedTime,
      status: 'New Lead',
      source: 'Guest Triage Modal',
    });

    // 3. Trigger Optimistic Toast
    triggerToast(`Consultation enquiry received! Ref: #${aptId}. Our care coordinator has been notified.`);

    setConfirmedAptId(aptId);
    setStep(4);
  };

  const handleClose = () => {
    setStep(1);
    closeBookingModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-[#0F172A]" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Guest Triage & Consultation</h3>
              <p className="text-[11px] text-slate-400">Vertex Dental Lab • Marylebone, London</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker (Steps 1 to 3) */}
        {step < 4 && (
          <div className="px-6 pt-4 pb-2 bg-[#FAF9F6] border-b border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
              <span className={step >= 1 ? 'text-slate-950 font-extrabold' : ''}>1. Select Treatment</span>
              <span className={step >= 2 ? 'text-slate-950 font-extrabold' : ''}>2. Date & Time</span>
              <span className={step >= 3 ? 'text-slate-950 font-extrabold' : ''}>3. Contact Details</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* STEP 1: Select Treatment Category & Specific Treatment */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-950">Select Treatment Category</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose between cosmetic transformations and general dental health.
                </p>
              </div>

              {/* Category Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Cosmetic');
                    const firstCosmetic = services.find(s => s.category === 'Cosmetic' || s.category === 'Orthodontics');
                    if (firstCosmetic) setSelectedServiceId(firstCosmetic.id);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === 'Cosmetic'
                      ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✨ Cosmetic & Orthodontics
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('General');
                    const firstGeneral = services.find(s => s.category !== 'Cosmetic' && s.category !== 'Orthodontics');
                    if (firstGeneral) setSelectedServiceId(firstGeneral.id);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === 'General'
                      ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🦷 General & Restorative
                </button>
              </div>

              {/* Specific Treatments List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredServices.map(srv => {
                  const isSelected = srv.id === selectedServiceId;
                  const displayPrice =
                    currency === 'GBP' ? srv.priceRange : `From ${formatPrice(srv.basePriceGbp)}`;

                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedServiceId(srv.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-50 border-slate-900 shadow-xs ring-1 ring-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold text-slate-900">{srv.name}</p>
                          {srv.popular && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{srv.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-950">{displayPrice}</p>
                        <span className="text-[10px] text-slate-400 font-medium">{srv.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Interactive Date & Time Picker */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-base font-extrabold text-slate-950">Choose Date & Preferred Time</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a convenient clinical consultation slot at our Marylebone studio.
                </p>
              </div>

              {/* Day Pills */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Recommended Dates:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {dayPills.map(d => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(d.date)}
                      className={`py-2 px-2 rounded-xl text-center text-xs font-bold transition-all border ${
                        selectedDate === d.date
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>{d.label}</div>
                      <div className="text-[10px] font-normal opacity-80">{d.date.slice(5)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Or Select Specific Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                />
              </div>

              {/* Time Slots (Morning & Afternoon) */}
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">Morning Slots:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {morningSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedTime === time
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">Afternoon Slots:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {afternoonSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedTime === time
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Slot Summary */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-700">
                <span>Selected: <strong>{currentService?.name}</strong></span>
                <span className="font-bold text-emerald-800">{selectedDate} @ {selectedTime}</span>
              </div>
            </div>
          )}

          {/* STEP 3: Patient Contact & Chief Concern */}
          {step === 3 && (
            <form onSubmit={handleCompleteGuestBooking} className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-950">Patient Details & Chief Concern</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  No password or account creation required. We verify bookings directly via SMS or WhatsApp.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Charlotte Kensington"
                    value={patientDetails.name}
                    onChange={e => setPatientDetails({ ...patientDetails, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium"
                  />
                </div>
                {errors.name && <p className="text-[10px] text-rose-600 font-semibold">{errors.name}</p>}
              </div>

              {/* UK Mobile / WhatsApp */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">UK Mobile / WhatsApp *</label>
                  <span className="text-[10px] text-emerald-700 font-semibold">Instant confirmation SMS</span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+44 7700 900888"
                    value={patientDetails.phone}
                    onChange={e => setPatientDetails({ ...patientDetails, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-600 font-semibold">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.co.uk"
                    value={patientDetails.email}
                    onChange={e => setPatientDetails({ ...patientDetails, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-rose-600 font-semibold">{errors.email}</p>}
              </div>

              {/* Chief Concern / Symptoms */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Chief Concern / Symptoms / Goals (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Looking to fix a chipped incisor before an event, or feeling tooth sensitivity to cold liquids."
                  value={patientDetails.concern}
                  onChange={e => setPatientDetails({ ...patientDetails, concern: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                ></textarea>
              </div>

              {/* Summary Pill */}
              <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Procedure:</span>
                  <span className="font-bold text-slate-900">{currentService?.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Date & Slot:</span>
                  <span className="font-semibold text-slate-900">{selectedDate} at {selectedTime}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Starting Fee:</span>
                  <span className="font-bold text-emerald-800">
                    {currency === 'GBP' ? currentService?.priceRange : `From ${formatPrice(currentService.basePriceGbp)}`}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-[#0F172A] hover:bg-slate-800 shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirm Booking & Send Triage Request</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Instant Confirmation & Lead Generation Success */}
          {step === 4 && (
            <div className="text-center py-5 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Consultation Request Confirmed • #{confirmedAptId}
                </span>
                <h3 className="text-2xl font-black text-slate-950 mt-2">
                  Thank You, {patientDetails.name}!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Your appointment enquiry for <strong>{currentService?.name}</strong> has been secured for <strong>{selectedDate} at {selectedTime}</strong>. A confirmation has been logged with our Marylebone reception team.
                </p>
              </div>

              {/* Consultation Details Card */}
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lead Clinician:</span>
                  <span className="font-bold text-slate-800">Dr. Alistair Vance (GDC No. 248912)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Clinic Address:</span>
                  <span className="font-semibold text-slate-800">42 Harley Place, Marylebone, London</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Contact:</span>
                  <span className="font-semibold text-slate-800">{patientDetails.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cancellation Policy:</span>
                  <span className="font-semibold text-emerald-800">24-48 hrs notice • 0% cancellation fee</span>
                </div>
              </div>

              {/* Action Buttons: Zero Password Creation Required */}
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <a
                  href={`https://wa.me/${companyDetails.whatsappPhone.replace(/[^0-9]/g, '')}?text=Hello%20Vertex%20Dental%20Lab,%20I%20have%20booked%20consultation%20%23${confirmedAptId}%20for%20${encodeURIComponent(currentService?.name)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message Front Desk on WhatsApp</span>
                </a>

                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls (Steps 1 & 2) */}
        {step < 3 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === 2 ? 1 : 1))}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => setStep((prev) => (prev === 1 ? 2 : 3))}
              className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F172A] hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              <span>Continue to {step === 1 ? 'Date & Time' : 'Contact Details'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export const BookingModal: React.FC = () => {
  const { isBookingModalOpen } = useClinic();
  if (!isBookingModalOpen) return null;
  return <BookingModalDialog />;
};
