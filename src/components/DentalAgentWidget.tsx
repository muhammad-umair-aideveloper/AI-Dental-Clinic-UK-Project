'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  AlertTriangle,
  Calendar,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Globe,
  RefreshCw,
  HeartPulse,
  Info,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { processDentalTriage, SupportedLanguage, TriageResult } from '@/lib/triage-engine';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  triageData?: TriageResult;
}

export const DentalAgentWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Interactive Booking Calendar State
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState('Comprehensive Exam & 3D Scan');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Slot availability
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; available: boolean }[]>([
    { slot: '09:00 AM', available: true },
    { slot: '09:45 AM', available: true },
    { slot: '10:30 AM', available: true },
    { slot: '11:15 AM', available: false },
    { slot: '02:00 PM', available: true },
    { slot: '02:45 PM', available: true },
    { slot: '03:30 PM', available: false },
    { slot: '04:15 PM', available: true },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getWelcomeText = (lang: SupportedLanguage) => {
    if (lang === 'urdu') {
      return 'خوش آمدید! میں ورٹیکس ڈینٹل لیب کا AI اسسٹنٹ ہوں۔ میں آپ کو علاج کی قیمتوں، دانت کے شدید درد میں فوری آرام کی تدابیر، اور ڈاکٹر کے ساتھ اپائنٹمنٹ بک کرنے میں مدد کر سکتا ہوں۔';
    }
    if (lang === 'roman_urdu') {
      return 'Khush Amdeed! Main Vertex Dental Lab ka AI assistant hoon. Danton ke dard ka fori ilaaj, kharcha (prices), ya doctor ke sath appointment ke liye mujh se poochein.';
    }
    return 'Welcome to Vertex Dental Lab Marylebone. I am your 24/7 clinical AI concierge. Ask me about transparent treatment fees, emergency toothache relief, or reserve an appointment with Dr. Vance.';
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: getWelcomeText('en'),
      timestamp: 'Just now',
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showSlotPicker, isTyping]);

  // Handle Language Toggle
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const welcomeMsg: ChatMessage = {
      id: `lang-change-${Date.now()}`,
      sender: 'ai',
      text: getWelcomeText(newLang),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, welcomeMsg]);
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Process Natural Language Triage
    setTimeout(() => {
      const triage = processDentalTriage(query, language);
      setIsTyping(false);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: triage.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        triageData: triage,
      };

      setMessages(prev => [...prev, aiMessage]);

      if (triage.suggestedAction === 'open_booking' || triage.suggestedAction === 'select_slot') {
        setShowSlotPicker(true);
        if (triage.treatmentRecommended) {
          setSelectedTreatment(triage.treatmentRecommended);
        }
      }
    }, 600);
  };

  const handleDirectBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) return;

    setIsSubmittingBooking(true);
    try {
      const slotDateTime = new Date(`${selectedDate}T${selectedSlot.includes('PM') && !selectedSlot.startsWith('12') ? `${parseInt(selectedSlot) + 12}` : selectedSlot.split(':')[0].padStart(2, '0')}:${selectedSlot.split(':')[1].slice(0, 2)}:00`).toISOString();

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          phoneNumber: patientPhone,
          treatmentType: selectedTreatment,
          slotTime: slotDateTime,
          clinicianName: 'Dr. Alistair Vance',
          notes: `Booked via DentalAgentWidget (${language.toUpperCase()})`,
          isEmergency: selectedTreatment.includes('Emergency'),
          source: `DentalAgentWidget (${language})`,
          sendImmediateConfirmation: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBookingSuccess(data.appointment);
        setShowSlotPicker(false);

        // Add confirmed message in chat
        setMessages(prev => [
          ...prev,
          {
            id: `booking-success-${Date.now()}`,
            sender: 'ai',
            text: language === 'urdu'
              ? `✅ مبارک ہو ${patientName}! آپ کی اپائنٹمنٹ (${selectedTreatment}) ${selectedDate} بوقت ${selectedSlot} محفوظ ہو چکی ہے۔ تصدیقی واٹس ایپ میسج آپ کے نمبر ${patientPhone} پر بھیج دیا گیا ہے۔`
              : language === 'roman_urdu'
              ? `✅ Mubarak ho ${patientName}! Aapki appointment for ${selectedTreatment} on ${selectedDate} at ${selectedSlot} confirm ho chuki hai. WhatsApp confirmation ${patientPhone} par bhej di gayi hai.`
              : `✅ Appointment Confirmed! Thank you, ${patientName}. Your reservation for ${selectedTreatment} on ${selectedDate} at ${selectedSlot} is secured. An interactive confirmation WhatsApp has been dispatched to ${patientPhone}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* 1. Floating Launch Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-3 bg-[#0F172A] hover:bg-slate-800 text-white px-5 py-3.5 rounded-full shadow-2xl border-2 border-emerald-400/80 transition-all hover:scale-105 active:scale-95 duration-200"
          aria-label="Open Dental Triage & Booking Widget"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0F172A] animate-pulse"></span>
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-xs font-black tracking-wide flex items-center space-x-1.5">
              <span>Vertex Dental AI</span>
              <span className="text-[10px] font-semibold bg-emerald-400/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/40">24/7 Triage</span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">EN • Roman Urdu • اردو</p>
          </div>
        </button>
      )}

      {/* 2. Expanded Chat & Booking Modal Drawer */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-300 animate-fade-in ${
            isExpanded
              ? 'w-[95vw] sm:w-[580px] h-[90vh]'
              : 'w-[92vw] sm:w-[420px] h-[640px]'
          }`}
        >
          {/* Top Clinical Header */}
          <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-black tracking-tight">Vertex Clinical Concierge</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-slate-400">Marylebone, London • GDC Regulated</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multi-Lingual Switcher Strip */}
          <div className="bg-slate-900 text-xs px-3.5 py-1.5 flex items-center justify-between border-b border-slate-800 text-slate-300 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <Globe className="w-3 h-3 text-emerald-400 mr-1" />
              <span>Language:</span>
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  language === 'en'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('roman_urdu')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  language === 'roman_urdu'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Roman Urdu
              </button>
              <button
                onClick={() => handleLanguageChange('urdu')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-serif transition-all ${
                  language === 'urdu'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                اردو
              </button>
            </div>
          </div>

          {/* Messages & Interactive Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FAF9F6]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-[#0F172A] text-white rounded-br-xs'
                      : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Emergency Soothing Accordion */}
                  {msg.triageData?.isEmergency && msg.triageData.emergencySoothingProtocol && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
                      <div className="flex items-center space-x-1.5 text-rose-700 font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{msg.triageData.emergencySoothingProtocol.title}</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-rose-900 pl-4 list-disc">
                        {msg.triageData.emergencySoothingProtocol.steps.map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                      </ul>
                      <div className="pt-1 border-t border-rose-200/60 text-[10px] font-bold text-rose-700 flex items-center justify-between">
                        <span>{msg.triageData.emergencySoothingProtocol.earliestSlotNotice}</span>
                      </div>
                    </div>
                  )}

                  {/* Pricing Table View if requested */}
                  {msg.triageData?.pricingTable && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 text-[11px]">
                      <div className="p-2 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                        UK Private Dental Fee Schedule
                      </div>
                      <div className="divide-y divide-slate-200">
                        {msg.triageData.pricingTable.map((p, idx) => (
                          <div key={idx} className="p-2 flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{p.treatment}</span>
                            <span className="font-black text-[#0F172A] text-right">{p.priceEstimate}</span>
                          </div>
                        ))}
                      </div>
                      {msg.triageData.priceDisclaimer && (
                        <div className="p-2.5 bg-amber-50 text-amber-900 text-[10px] border-t border-amber-200/70 font-medium leading-tight">
                          <Info className="w-3 h-3 inline mr-1 text-amber-700" />
                          <span>{msg.triageData.priceDisclaimer}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 pl-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Vertex clinical engine analyzing symptoms & availability...</span>
              </div>
            )}

            {/* Embedded Calendar Slot Picker */}
            {showSlotPicker && (
              <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-4 shadow-lg space-y-3.5 animate-fade-in text-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Live Doctor Availability Booking</span>
                  </div>
                  <button
                    onClick={() => setShowSlotPicker(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleDirectBookingSubmit} className="space-y-3">
                  {/* Treatment Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Treatment:</label>
                    <select
                      value={selectedTreatment}
                      onChange={e => setSelectedTreatment(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="Comprehensive Exam & 3D Scan">Comprehensive Exam & 3D Scan (From £95)</option>
                      <option value="24/7 Overnight Emergency Triage">24/7 Overnight Emergency Triage (Priority)</option>
                      <option value="Airflow® Hygiene & Scaling">Airflow® Hygiene & Scaling (From £110)</option>
                      <option value="Microscopic Root Canal (RCT)">Microscopic Root Canal Therapy (From £450)</option>
                      <option value="Invisalign® Clear Aligners">Invisalign® Clear Aligners (0% Finance £75/mo)</option>
                      <option value="Surgical Tooth Extraction">Surgical Tooth Extraction (From £180)</option>
                      <option value="In-Chair Laser Teeth Whitening">Laser Teeth Whitening (From £350)</option>
                    </select>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Appointment Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-none"
                    />
                  </div>

                  {/* Available Time Slots */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Select Time Slot:</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {availableSlots.map(s => (
                        <button
                          key={s.slot}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setSelectedSlot(s.slot)}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center ${
                            selectedSlot === s.slot
                              ? 'bg-[#0F172A] text-white shadow-xs'
                              : s.available
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {s.slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={patientName}
                        onChange={e => setPatientName(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="WhatsApp / Phone (+44...)"
                        value={patientPhone}
                        onChange={e => setPatientPhone(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>{isSubmittingBooking ? 'Securing Slot...' : `Confirm Slot for ${selectedSlot}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="p-2 bg-white border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
            <button
              onClick={() => handleSendMessage(language === 'urdu' ? 'شدید دانت میں درد ہے کیا کروں؟' : language === 'roman_urdu' ? 'Dant me bohot shadeed dard hai' : 'Severe toothache, what can I do?')}
              className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 shrink-0 whitespace-nowrap flex items-center space-x-1"
            >
              <span>🚨</span>
              <span>{language === 'urdu' ? 'شدید دانت میں درد' : language === 'roman_urdu' ? 'Dant Ka Dard' : 'Toothache Relief'}</span>
            </button>

            <button
              onClick={() => handleSendMessage(language === 'urdu' ? 'علاج کا کتنا خرچہ ہوگا؟' : language === 'roman_urdu' ? 'Treatments ka kitna kharcha aayega?' : 'What are your treatment prices?')}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold border border-slate-200 shrink-0 whitespace-nowrap flex items-center space-x-1"
            >
              <span>💰</span>
              <span>{language === 'urdu' ? 'قیمتیں اور فیس' : language === 'roman_urdu' ? 'Price Estimates' : 'Fee Guide'}</span>
            </button>

            <button
              onClick={() => {
                setShowSlotPicker(true);
              }}
              className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 shrink-0 whitespace-nowrap flex items-center space-x-1"
            >
              <span>📅</span>
              <span>{language === 'urdu' ? 'اپائنٹمنٹ بکنگ' : language === 'roman_urdu' ? 'Book Slot' : 'Calendar Slots'}</span>
            </button>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                language === 'urdu'
                  ? 'یہاں سوال لکھیں (جیسے دانت میں درد، فیس، یا بکنگ)...'
                  : language === 'roman_urdu'
                  ? 'Apna sawal likhein (e.g. dant dard, kharcha, booking)...'
                  : 'Ask about fees, emergency toothache, or booking...'
              }
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isTyping || !input.trim()}
              className="w-9 h-9 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-white flex items-center justify-center transition-colors shadow-xs shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
