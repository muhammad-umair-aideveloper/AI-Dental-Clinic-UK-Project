'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { generateGroundingResponse, AIResponseResult } from '@/lib/ai-engine';
import {
  Sparkles,
  X,
  Send,
  MessageSquare,
  Phone,
  Calendar,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  groundedSources?: string[];
  actionType?: 'book' | 'emergency' | 'whatsapp' | 'call' | 'none';
  actionPayload?: string;
  isEmergencyAlert?: boolean;
}

export const ChatDrawer: React.FC = () => {
  const {
    isChatDrawerOpen,
    openChatDrawer,
    closeChatDrawer,
    chatInitialMessage,
    services,
    companyDetails,
    clinicPolicies,
    faqs,
    aiSettings,
    openBookingModal,
  } = useClinic();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Hello! I am the official AI Clinical Triage & Booking Assistant for **Vertex Dental Lab** in London. 

How can I help you today? You can ask about our verified UK pricing, book an appointment, check our cancellation policy, or report urgent symptoms.`,
      timestamp: 'Just now',
      groundedSources: ['Vertex Knowledge Base V2'],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedInitialRef = useRef<string>('');

  const quickChips = [
    'Book an appointment',
    'Invisalign pricing?',
    'I have an emergency toothache',
    'Check cancellation policy',
  ];

  const handleUserSend = useCallback(
    (textToSend?: string) => {
      const text = (textToSend || input).trim();
      if (!text) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      setTimeout(() => {
        const response: AIResponseResult = generateGroundingResponse(text, {
          services,
          companyDetails,
          policies: clinicPolicies,
          faqs,
          guardrails: aiSettings,
        });

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: response.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          groundedSources: response.sourceGrounded,
          actionType: response.actionType,
          actionPayload: response.actionPayload,
          isEmergencyAlert: response.isEmergencyAlert,
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 600);
    },
    [input, services, companyDetails, clinicPolicies, faqs, aiSettings]
  );

  // Auto-send initial message if opened via CTA
  useEffect(() => {
    if (chatInitialMessage && chatInitialMessage !== lastProcessedInitialRef.current) {
      lastProcessedInitialRef.current = chatInitialMessage;
      handleUserSend(chatInitialMessage);
    }
  }, [chatInitialMessage, handleUserSend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleActionClick = (msg: ChatMessage) => {
    if (msg.actionType === 'book') {
      closeChatDrawer();
      openBookingModal(msg.actionPayload);
    } else if (msg.actionType === 'emergency' || msg.actionType === 'call') {
      window.open(`tel:${companyDetails.helplinePhone.replace(/\s+/g, '')}`, '_self');
    } else if (msg.actionType === 'whatsapp') {
      window.open(
        `https://wa.me/${companyDetails.whatsappPhone.replace(/[^0-9]/g, '')}`,
        '_blank'
      );
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Collapsed Button */}
      {!isChatDrawerOpen && (
        <button
          onClick={() => openChatDrawer()}
          className="group relative flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-slate-900 via-sky-900 to-sky-700 text-white shadow-2xl hover:shadow-sky-900/50 hover:scale-105 transition-all duration-200 border border-sky-400/40"
          aria-label="Open AI Dental Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Sparkles className="w-5 h-5 text-sky-300 group-hover:rotate-12 transition-transform" />
          <div className="text-left">
            <p className="text-xs font-bold leading-none">Vertex AI Assistant</p>
            <p className="text-[10px] text-sky-200">24/7 Triage & Booking</p>
          </div>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isChatDrawerOpen && (
        <div className="relative w-[340px] sm:w-[400px] h-[550px] max-h-[85vh] rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
          {/* Top Bar */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold">
                <Sparkles className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h4 className="text-xs font-bold flex items-center space-x-1.5">
                  <span>Vertex Dental AI Assistant</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </h4>
                <p className="text-[10px] text-slate-400">Grounded in UK Clinical Knowledge</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  setMessages([messages[0]]);
                }}
                title="Reset conversation"
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => closeChatDrawer()}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick-Action Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleUserSend(chip)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-700 hover:bg-sky-50 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-slate-50/50">
            {messages.map(m => {
              const isAi = m.sender === 'ai';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 shadow-xs ${
                      isAi
                        ? m.isEmergencyAlert
                          ? 'bg-red-50 text-red-950 border border-red-200'
                          : 'bg-white text-slate-800 border border-slate-200/90'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">
                      {m.text}
                    </div>

                    {/* Grounded Source Tag */}
                    {isAi && m.groundedSources && m.groundedSources.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center space-x-1 text-[9px] text-slate-400 font-mono">
                        <ShieldCheck className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="truncate">Source: {m.groundedSources.join(' • ')}</span>
                      </div>
                    )}

                    {/* Dynamic Action Trigger inside message */}
                    {isAi && m.actionType && m.actionType !== 'none' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        {m.actionType === 'book' && (
                          <button
                            onClick={() => handleActionClick(m)}
                            className="w-full py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Open Instant Booking Modal</span>
                          </button>
                        )}

                        {m.actionType === 'emergency' && (
                          <button
                            onClick={() => handleActionClick(m)}
                            className="w-full py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Emergency Hotline Now</span>
                          </button>
                        )}

                        {m.actionType === 'whatsapp' && (
                          <button
                            onClick={() => handleActionClick(m)}
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Connect on WhatsApp</span>
                          </button>
                        )}

                        {m.actionType === 'call' && (
                          <button
                            onClick={() => handleActionClick(m)}
                            className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Reception ({companyDetails.helplinePhone})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-white border border-slate-200 text-slate-400 text-xs w-28">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[10px] text-slate-400 ml-1">Analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleUserSend();
              }}
              placeholder="Ask about dental fees, implants, or book..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={() => handleUserSend()}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
