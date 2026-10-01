'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClinic } from '@/context/ClinicContext';
import { generateGroundingResponse, AIResponseResult } from '@/lib/ai-engine';
import { ReasoningStep } from '@/types/clinic';
import {
  Sparkles,
  X,
  Send,
  MessageSquare,
  Phone,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Brain,
  ChevronDown,
  ChevronUp,
  Cpu,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  reasoningTrace?: ReasoningStep[];
  groundedSources?: string[];
  actionType?: 'book' | 'emergency' | 'whatsapp' | 'call' | 'none';
  actionPayload?: string;
  isEmergencyAlert?: boolean;
  appointmentApprovalStatus?: 'Auto-Approved' | 'Held for Manual Clinical Review' | 'Not Applicable';
  activeAgentEngine?: string;
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
    approvalPolicy,
    aiProviderSettings,
    openBookingModal,
  } = useClinic();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Hello! I am the **Vertex Dental Lab AI Reasoning & Clinical Triage Assistant** for our London clinic.

I reason through patient inquiries in real time by evaluating our verified website treatments, British clinical standards, and custom directives set by our clinic director.

How can I assist your smile today?`,
      timestamp: 'Just now',
      groundedSources: ['Vertex Dental Lab Official Website', 'GDC Practice Standards'],
      activeAgentEngine: `${aiProviderSettings.activeProvider}`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<{ [id: string]: boolean }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedInitialRef = useRef<string>('');

  const quickChips = [
    'Book an appointment',
    'Invisalign pricing?',
    'I have an emergency toothache',
    'Check cancellation policy',
    'Can AI auto-approve my booking?',
  ];

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoningIds(prev => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

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
          approvalPolicy,
          providerSettings: aiProviderSettings,
        });

        const newAiId = `ai-${Date.now()}`;
        const aiMsg: ChatMessage = {
          id: newAiId,
          sender: 'ai',
          text: response.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reasoningTrace: response.reasoningTrace,
          groundedSources: response.sourceGrounded,
          actionType: response.actionType,
          actionPayload: response.actionPayload,
          isEmergencyAlert: response.isEmergencyAlert,
          appointmentApprovalStatus: response.appointmentApprovalStatus,
          activeAgentEngine: response.activeAgentEngine,
        };

        setMessages(prev => [...prev, aiMsg]);
        // By default, open reasoning trace on the new message so user sees the reasoning tool in action
        setExpandedReasoningIds(prev => ({ ...prev, [newAiId]: true }));
        setIsTyping(false);
      }, 700);
    },
    [input, services, companyDetails, clinicPolicies, faqs, aiSettings, approvalPolicy, aiProviderSettings]
  );

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
          className="group relative flex items-center space-x-3 px-4 py-3 rounded-full bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white shadow-2xl hover:shadow-sky-500/20 hover:scale-105 transition-all duration-200 border border-sky-400/40"
          aria-label="Open AI Dental Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-none flex items-center space-x-1">
              <span>Vertex AI Agent</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-900 text-sky-300 font-mono font-normal">
                {aiProviderSettings.activeProvider}
              </span>
            </p>
            <p className="text-[10px] text-sky-200">Reasoning Triage Tool</p>
          </div>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isChatDrawerOpen && (
        <div className="relative w-[350px] sm:w-[440px] h-[600px] max-h-[88vh] rounded-3xl bg-[#0f1420] text-slate-100 shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden animate-fade-in font-sans">
          {/* Top Bar - Stitch Style */}
          <div className="px-4 py-3 bg-[#141b2b] text-white flex items-center justify-between border-b border-slate-700/70">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold flex items-center space-x-1.5">
                  <span>Vertex AI Reasoning Tool</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </h4>
                <p className="text-[10px] text-sky-300 font-mono flex items-center space-x-1">
                  <Cpu className="w-3 h-3" />
                  <span>Powered by {aiProviderSettings.activeProvider} Engine</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  setMessages([messages[0]]);
                  setExpandedReasoningIds({});
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
          <div className="px-3 py-2 bg-[#101623] border-b border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleUserSend(chip)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1a2336] border border-slate-700 text-slate-300 hover:border-sky-400 hover:text-sky-300 hover:bg-[#202b42] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-4 text-xs bg-[#0b0f17]">
            {messages.map(m => {
              const isAi = m.sender === 'ai';
              const showReasoning = expandedReasoningIds[m.id];
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl p-3.5 shadow-md ${
                      isAi
                        ? m.isEmergencyAlert
                          ? 'bg-red-950/80 text-red-100 border border-red-800'
                          : 'bg-[#151c2c] text-slate-200 border border-slate-700/80'
                        : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white'
                    }`}
                  >
                    {/* Header for AI response showing Engine */}
                    {isAi && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60 text-[10px] text-slate-400">
                        <span className="flex items-center space-x-1 text-sky-400 font-mono">
                          <Cpu className="w-3 h-3" />
                          <span>{m.activeAgentEngine || aiProviderSettings.activeProvider}</span>
                        </span>
                        {m.appointmentApprovalStatus && (
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold ${
                              m.appointmentApprovalStatus === 'Auto-Approved'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {m.appointmentApprovalStatus}
                          </span>
                        )}
                      </div>
                    )}

                    {/* AI Clinical Reasoning Trace Dropdown (Chain-of-Thought) */}
                    {isAi && m.reasoningTrace && m.reasoningTrace.length > 0 && (
                      <div className="mb-3 rounded-xl bg-[#0d121c] border border-slate-700/80 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleReasoning(m.id)}
                          className="w-full px-2.5 py-1.5 text-left text-[11px] font-bold text-sky-300 bg-[#121927] hover:bg-[#162032] flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center space-x-1.5">
                            <Brain className="w-3.5 h-3.5 text-sky-400" />
                            <span>🧠 AI Reasoning & Context Trace</span>
                          </span>
                          {showReasoning ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {showReasoning && (
                          <div className="p-2.5 space-y-2 text-[10px] text-slate-300 font-mono border-t border-slate-800 bg-[#0a0e17]">
                            {m.reasoningTrace.map(step => (
                              <div key={step.step} className="space-y-0.5">
                                <p className="font-bold text-sky-400 flex items-center space-x-1">
                                  <span>Step {step.step}: {step.title}</span>
                                </p>
                                <p className="text-slate-400 leading-relaxed pl-2 border-l border-slate-700">
                                  {step.detail}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Primary Reply Text */}
                    <div className="whitespace-pre-line leading-relaxed text-xs">
                      {m.text}
                    </div>

                    {/* Grounded Source Tag */}
                    {isAi && m.groundedSources && m.groundedSources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center space-x-1 text-[9px] text-slate-400 font-mono">
                        <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">Grounded in: {m.groundedSources.join(' • ')}</span>
                      </div>
                    )}

                    {/* Dynamic Action Buttons */}
                    {isAi && m.actionType && m.actionType !== 'none' && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                        {m.actionType === 'book' && (
                          <button
                            onClick={() => handleActionClick(m)}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Launch Instant Booking Calendar</span>
                          </button>
                        )}

                        {m.actionType === 'emergency' && (
                          <button
                            onClick={() => handleActionClick(m)}
                            className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-md"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Emergency Hotline ({companyDetails.helplinePhone})</span>
                          </button>
                        )}

                        {m.actionType === 'whatsapp' && (
                          <button
                            onClick={() => handleActionClick(m)}
                            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-md"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message on WhatsApp</span>
                          </button>
                        )}

                        {m.actionType === 'call' && (
                          <button
                            onClick={() => handleActionClick(m)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors border border-slate-700"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Clinic Reception ({companyDetails.helplinePhone})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-[#151c2c] border border-slate-700 text-sky-400 text-xs w-44">
                <Brain className="w-4 h-4 animate-spin text-sky-400" />
                <span className="text-[11px] text-slate-300">Reasoning over website data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[#141b2b] border-t border-slate-700/70 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleUserSend();
              }}
              placeholder={`Ask ${aiProviderSettings.activeProvider} reasoning tool...`}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={() => handleUserSend()}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
