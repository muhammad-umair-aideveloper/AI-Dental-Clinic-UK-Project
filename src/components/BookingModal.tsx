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
} from 'lucide-react';
import Link from 'next/link';

type StepNumber = 1 | 2 | 3 | 4 | 5;

const BookingModalDialog: React.FC = () => {
  const {
    closeBookingModal,
    selectedServiceForBooking,
    services,
    addAppointment,
    currentUser,
    formatPrice,
    currency,
  } = useClinic();

  const [step, setStep] = useState<StepNumber>(1);

  const initialServiceId = () => {
    if (selectedServiceForBooking && services.length > 0) {
      const found = services.find(
        s => s.name.toLowerCase() === selectedServiceForBooking.toLowerCase()
      );
      if (found) return found.id;
    }
    return services[0]?.id || '';
  };

  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-02');
  const [selectedTime, setSelectedTime] = useState<string>('10:30 AM');
  const [patientDetails, setPatientDetails] = useState({
    name: currentUser.isLoggedIn && currentUser.role === 'patient' ? currentUser.name : '',
    email: currentUser.isLoggedIn && currentUser.role === 'patient' ? currentUser.email : '',
    phone: currentUser.isLoggedIn && currentUser.role === 'patient' ? currentUser.phone : '',
    notes: '',
  });
  const [confirmedAptId, setConfirmedAptId] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const currentService = services.find(s => s.id === selectedServiceId) || services[0];

  const dayPills = [
    { label: 'Today', date: '2026-10-01' },
    { label: 'Tomorrow', date: '2026-10-02' },
    { label: 'Friday', date: '2026-10-03' },
    { label: 'Saturday', date: '2026-10-04' },
    { label: 'Monday', date: '2026-10-06' },
  ];

  const morningSlots = ['09:00 AM', '10:15 AM', '11:30 AM', '11:45 AM'];
  const afternoonSlots = ['02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM', '05:00 PM'];

  const validateStep4 = () => {
    const errs: { [key: string]: string } = {};
    if (!patientDetails.name.trim()) errs.name = 'Full name is required';
    if (!patientDetails.email.trim() || !patientDetails.email.includes('@')) {
      errs.email = 'Valid UK email is required';
    }
    if (!patientDetails.phone.trim() || patientDetails.phone.length < 8) {
      errs.phone = 'Valid phone or WhatsApp number is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmBooking = () => {
    if (!validateStep4()) return;

    const aptId = addAppointment({
      patientName: patientDetails.name,
      patientEmail: patientDetails.email,
      patientPhone: patientDetails.phone,
      serviceId: currentService.id,
      serviceName: currentService.name,
      clinicianName: 'Dr. Alistair Vance',
      date: selectedDate,
      timeSlot: selectedTime,
      status: 'Confirmed',
      notes: patientDetails.notes,
      isEmergency: currentService.category === 'Emergency',
      source: 'Online Booking',
    });

    setConfirmedAptId(aptId);
    setStep(5);
  };

  const handleClose = () => {
    setStep(1);
    closeBookingModal();
  };

  const goToPrevStep = () => {
    setStep(prev => (prev === 2 ? 1 : prev === 3 ? 2 : prev === 4 ? 3 : 1));
  };

  const goToNextStep = () => {
    setStep(prev => (prev === 1 ? 2 : prev === 2 ? 3 : prev === 3 ? 4 : 4));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Vertex Dental Lab Booking</h3>
              <p className="text-[11px] text-slate-400">London Marylebone Clinic & Laboratory</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar (Steps 1 to 4) */}
        {step < 5 && (
          <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
              <span className={step >= 1 ? 'text-sky-600 font-bold' : ''}>1. Service</span>
              <span className={step >= 2 ? 'text-sky-600 font-bold' : ''}>2. Date</span>
              <span className={step >= 3 ? 'text-sky-600 font-bold' : ''}>3. Time</span>
              <span className={step >= 4 ? 'text-sky-600 font-bold' : ''}>4. Details</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 1: Choose Dental Treatment</h4>
                <p className="text-xs text-slate-500">
                  Select a clinical consultation, hygiene appointment, or aesthetic procedure.
                </p>
              </div>

              <div className="space-y-2.5">
                {services.map(s => {
                  const isSelected = s.id === selectedServiceId;
                  const displayPrice = currency === 'GBP' ? s.priceRange : `From ${formatPrice(s.basePriceGbp)}`;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedServiceId(s.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-bold text-slate-900">{s.name}</p>
                          {s.category === 'Emergency' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {s.duration} • {s.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-900">
                          {displayPrice}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Date Selector */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 2: Choose Appointment Date</h4>
                <p className="text-xs text-slate-500">
                  Select an available day for your visit at Vertex Dental Lab London.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {dayPills.map(dp => {
                  const isSelected = selectedDate === dp.date;
                  return (
                    <button
                      key={dp.date}
                      type="button"
                      onClick={() => setSelectedDate(dp.date)}
                      className={`p-3 rounded-2xl text-center border transition-all ${
                        isSelected
                          ? 'border-sky-600 bg-sky-600 text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
                      }`}
                    >
                      <p className="text-xs font-bold">{dp.label}</p>
                      <p className={`text-[11px] ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                        {dp.date}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Or pick a specific future date:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min="2026-10-01"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Selected treatment: <strong>{currentService?.name}</strong></span>
              </div>
            </div>
          )}

          {/* STEP 3: Time Slot Picker */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 3: Select Clinical Time Slot</h4>
                <p className="text-xs text-slate-500">
                  {selectedDate} with Dr. Alistair Vance & clinical team
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Morning Slots (9:00 - 12:00)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {morningSlots.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        selectedTime === time
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Afternoon Slots (14:00 - 18:00)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {afternoonSlots.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        selectedTime === time
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Selected: <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong></span>
              </div>
            </div>
          )}

          {/* STEP 4: Patient Details */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 4: Patient Contact Information</h4>
                <p className="text-xs text-slate-500">
                  Please provide your UK contact details for booking verification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={patientDetails.name}
                    onChange={e => setPatientDetails({ ...patientDetails, name: e.target.value })}
                    placeholder="e.g. Charlotte Kensington"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={patientDetails.email}
                      onChange={e => setPatientDetails({ ...patientDetails, email: e.target.value })}
                      placeholder="patient@example.co.uk"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UK Phone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={patientDetails.phone}
                      onChange={e => setPatientDetails({ ...patientDetails, phone: e.target.value })}
                      placeholder="+44 7700 900888"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Notes, Symptoms, or Dental Anxiety
                </label>
                <textarea
                  rows={2}
                  value={patientDetails.notes}
                  onChange={e => setPatientDetails({ ...patientDetails, notes: e.target.value })}
                  placeholder="e.g. Mild sensitivity, nervous patient requesting computerized anaesthesia..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <p className="font-bold text-slate-900">Summary of Booking:</p>
                <div className="flex justify-between text-slate-600">
                  <span>Treatment:</span>
                  <span className="font-semibold text-slate-800">{currentService?.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Date & Slot:</span>
                  <span className="font-semibold text-slate-800">{selectedDate} at {selectedTime}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Fee:</span>
                  <span className="font-bold text-sky-700">
                    {currency === 'GBP' ? currentService?.priceRange : `From ${formatPrice(currentService.basePriceGbp)}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Success Confirmation Screen */}
          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Booking Confirmed: #{confirmedAptId}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
                  We look forward to seeing you, {patientDetails.name}!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  Your appointment for <strong>{currentService?.name}</strong> has been secured for <strong>{selectedDate} at {selectedTime}</strong>. A confirmation SMS & email have been dispatched.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Clinician:</span>
                  <span className="font-semibold text-slate-800">Dr. Alistair Vance, GDC No. 248912</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-800">42 Harley Place, Marylebone, London</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Notice Policy:</span>
                  <span className="font-semibold text-slate-800">24-48 hrs cancellation notice</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  href="/dashboard"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-sky-600 transition-colors shadow-md"
                >
                  View in Patient Portal
                </Link>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Steps 1 to 4) */}
        {step < 5 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={goToPrevStep}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-sky-600 transition-all shadow-md active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 hover:opacity-90 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Confirm Appointment</span>
              </button>
            )}
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
