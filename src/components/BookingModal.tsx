'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { SlotAvailability } from '@/lib/appointments/types';

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

  // Generate dynamic upcoming dates (skipping weekends and bank holidays)
  const getInitialDates = () => {
    const dates: { label: string; date: string }[] = [];
    const d = new Date();
    d.setDate(d.getDate() + 1); // Start tomorrow

    while (dates.length < 5) {
      const day = d.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (day !== 0 && day !== 6) {
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
        dates.push({ label: dayName, date: dateStr });
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  const [recommendedDates] = useState(getInitialDates);
  const [selectedDate, setSelectedDate] = useState<string>(() => recommendedDates[0]?.date || new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('09:30');

  // Slot availability from server
  const [availableSlots, setAvailableSlots] = useState<SlotAvailability[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Form fields
  const [patientDetails, setPatientDetails] = useState({
    name: '',
    phone: '',
    email: '',
    concern: '',
    reminderConsent: true, // UK GDPR consent checkbox
  });

  const [confirmedAptId, setConfirmedAptId] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingErrorMessage, setBookingErrorMessage] = useState<string | null>(null);

  const currentService =
    services.find(s => s.id === selectedServiceId) || filteredServices[0] || services[0];

  // Fetch slot availability from server
  const fetchAvailability = useCallback(async (date: string) => {
    setIsLoadingSlots(true);
    setSlotError(null);
    try {
      const res = await fetch(`/api/appointments?checkAvailability=true&date=${date}`);
      const data = await res.json();
      if (data.success && data.availability) {
        setAvailableSlots(data.availability);
        // If current selected time is unavailable, pick first available
        const firstAvail = data.availability.find((s: SlotAvailability) => s.available);
        if (firstAvail) {
          setSelectedTime(firstAvail.timeStr);
        }
      } else {
        setSlotError('Clinic is closed on this date (weekend or UK bank holiday).');
        setAvailableSlots([]);
      }
    } catch {
      setSlotError('Unable to load availability. Please select another date.');
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (step === 2 && selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [step, selectedDate, fetchAvailability]);

  const validateStep3 = () => {
    const errs: { [key: string]: string } = {};
    if (!patientDetails.name.trim() || patientDetails.name.trim().length < 2) {
      errs.name = 'Full name is required (minimum 2 characters)';
    }
    if (!patientDetails.phone.trim() || patientDetails.phone.length < 8) {
      errs.phone = 'Valid UK phone number is required (e.g. 07123 456789 or +447123456789)';
    }
    if (patientDetails.email && patientDetails.email.trim().length > 0 && !patientDetails.email.includes('@')) {
      errs.email = 'Please provide a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCompleteGuestBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsSubmitting(true);
    setBookingErrorMessage(null);

    try {
      const payload = {
        patientName: patientDetails.name.trim(),
        phoneNumber: patientDetails.phone.trim(),
        email: patientDetails.email.trim() || undefined,
        reason: currentService?.name || 'General Consultation',
        customer_name: patientDetails.name.trim(),
        phone: patientDetails.phone.trim(),
        service: currentService.title,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        date: selectedDate,
        time: selectedTime,
        reminderConsent: patientDetails.reminderConsent,
        clinicianName: 'Dr. Alistair Vance',
        notes: patientDetails.concern.trim() || 'Online Consultation Booking',
        source: 'Website',
      };

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 409 || data.code === 'DOUBLE_BOOKED') {
          // Double booking caught!
          setBookingErrorMessage(
            '⚠️ This appointment slot has just been booked by another patient. Please return to step 2 and select another available time.'
          );
          triggerToast('Slot just taken! Please select another time.');
          setStep(2);
          fetchAvailability(selectedDate);
        } else {
          setBookingErrorMessage(data.error || 'Failed to confirm booking. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      const confirmedRecord = data.appointment;
      const aptId = confirmedRecord.id;

      // Also append to local context for optimistic UI
      addAppointment({
        patientName: patientDetails.name.trim(),
        patientEmail: patientDetails.email.trim(),
        patientPhone: confirmedRecord?.phone || confirmedRecord?.phone_number || patientDetails.phone.trim(),
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

      addInquiry({
        patientName: patientDetails.name.trim(),
        email: patientDetails.email.trim(),
        phone: confirmedRecord.phone_number || patientDetails.phone.trim(),
        serviceInterest: currentService.name,
        treatmentCategory: selectedCategory,
        message: patientDetails.concern.trim() || `Booked consultation for ${selectedDate} at ${selectedTime}`,
        preferredDate: selectedDate,
        preferredTime: selectedTime,
        status: 'New Lead',
        source: 'Guest Triage Modal',
      });

      triggerToast(`Consultation confirmed! Ref: #${aptId.slice(-6)}.`);
      setConfirmedAptId(aptId);
      setStep(4);
    } catch (err: any) {
      setBookingErrorMessage('Network error while booking. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setBookingErrorMessage(null);
    closeBookingModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-xl rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-[#0F172A]" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Guest Triage & Consultation Booking</h3>
              <p className="text-[11px] text-slate-400">Vertex Dental Lab • Marylebone, London (Europe/London)</p>
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
              <span className={step >= 1 ? 'text-slate-950 font-extrabold' : ''}>1. Treatment</span>
              <span className={step >= 2 ? 'text-slate-950 font-extrabold' : ''}>2. Live Slot</span>
              <span className={step >= 3 ? 'text-slate-950 font-extrabold' : ''}>3. Details & Consent</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification Banner */}
        {bookingErrorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{bookingErrorMessage}</p>
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
                  Choose between cosmetic transformations and general private dentistry.
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

          {/* STEP 2: Live Slot Availability Picker */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-base font-extrabold text-slate-950">Choose Date & Real-Time Slot</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Booked slots and bank holidays are automatically blocked with double-booking prevention.
                </p>
              </div>

              {/* Quick Date Pills */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Upcoming Clinic Days:</label>
                <div className="grid grid-cols-5 gap-2">
                  {recommendedDates.map(d => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(d.date)}
                      className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition-all border ${
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

              {/* Specific Date Picker */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Or Pick a Specific Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
                />
              </div>

              {/* Slots Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Available Slots for {selectedDate}:</span>
                  {isLoadingSlots && (
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Checking calendar...</span>
                    </span>
                  )}
                </div>

                {slotError && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    {slotError}
                  </div>
                )}

                {!isLoadingSlots && availableSlots.length === 0 && !slotError && (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No slots available for this date. Clinic is closed or all slots booked.
                  </p>
                )}

                {!isLoadingSlots && availableSlots.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.timeStr}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.timeStr)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                          selectedTime === slot.timeStr
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : slot.available
                            ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                            : 'bg-slate-100 text-slate-400 border-slate-200/60 line-through cursor-not-allowed opacity-60'
                        }`}
                        title={slot.available ? 'Available' : `Unavailable (${slot.reasonDisabled})`}
                      >
                        {slot.time12}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Slot Summary */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-700">
                <span>Selected: <strong>{currentService?.name}</strong></span>
                <span className="font-bold text-emerald-800">{selectedDate} @ {selectedTime}</span>
              </div>
            </div>
          )}

          {/* STEP 3: Patient Contact & Consent */}
          {step === 3 && (
            <form onSubmit={handleCompleteGuestBooking} className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-950">Patient Details & Consent</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  We normalize your phone number to UK international format (+447...) and verify attendance.
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

              {/* UK Phone Number */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">UK Mobile or WhatsApp *</label>
                  <span className="text-[10px] text-emerald-700 font-semibold">Normalized to UK format</span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 07123 456789 or +44 7123 456789"
                    value={patientDetails.phone}
                    onChange={e => setPatientDetails({ ...patientDetails, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-600 font-semibold">{errors.phone}</p>}
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="e.g. charlotte.k@example.co.uk"
                    value={patientDetails.email}
                    onChange={e => setPatientDetails({ ...patientDetails, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-rose-600 font-semibold">{errors.email}</p>}
              </div>

              {/* Symptoms / Chief Concern */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Reason for Visit / Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Looking for Invisalign consultation or tooth sensitivity check."
                  value={patientDetails.concern}
                  onChange={e => setPatientDetails({ ...patientDetails, concern: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                ></textarea>
              </div>

              {/* UK GDPR Reminder Consent Checkbox */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-1">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={patientDetails.reminderConsent}
                    onChange={e => setPatientDetails({ ...patientDetails, reminderConsent: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                  />
                  <span className="text-[11px] text-slate-800 font-medium leading-relaxed">
                    <strong>Patient Reminder Consent:</strong> I agree to receive an automated appointment reminder 1 hour prior to my consultation via SMS or WhatsApp, subject to Vertex Dental Lab's UK GDPR privacy terms.
                  </span>
                </label>
              </div>

              {/* Summary Box */}
              <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Procedure:</span>
                  <span className="font-bold text-slate-900">{currentService?.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Date & Slot:</span>
                  <span className="font-semibold text-slate-900">{selectedDate} at {selectedTime} (Europe/London)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Locking Slot with Double-Booking Prevention...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Confirm & Lock Appointment Slot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success View */}
          {step === 4 && (
            <div className="text-center py-5 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Slot Locked & Confirmed • #{confirmedAptId.slice(-6)}
                </span>
                <h3 className="text-2xl font-black text-slate-950 mt-2">
                  Thank You, {patientDetails.name}!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Your appointment for <strong>{currentService?.name}</strong> is officially secured for <strong>{selectedDate} at {selectedTime}</strong>. 
                  Our database exclusion constraint has locked this slot exclusively for you.
                </p>
              </div>

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
                  <span className="text-slate-500">Reminder Status:</span>
                  <span className="font-semibold text-emerald-800">
                    {patientDetails.reminderConsent ? '✅ Active (1h before consultation)' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <a
                  href={`https://wa.me/${companyDetails.whatsappPhone.replace(/[^0-9]/g, '')}?text=Hello%20Vertex%20Dental%20Lab,%20I%20have%20booked%20consultation%20%23${confirmedAptId}%20for%20${encodeURIComponent(currentService?.name)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message Reception on WhatsApp</span>
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
                onClick={() => setStep(1)}
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
              <span>Continue to {step === 1 ? 'Date & Time' : 'Patient Details'}</span>
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
