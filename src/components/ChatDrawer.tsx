'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import { generateGroundingResponse, AIResponseResult } from '@/lib/ai-engine';
import { ReasoningStep } from '@/types/clinic';
import {
  X,
  Send,
  RefreshCw,
  Brain,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Phone,
  Calendar,
  MessageSquare,
  Bot,
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
  alertText?: string;
  activeAgentEngine?: string;
}

export const ChatDrawer: React.FC = () => {
  const pathname = usePathname();
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
      text: 'Good day. I am the Vertex Dental Lab clinical AI concierge in Marylebone, London. How may I assist you with private treatments, 0% APR finance, or emergency triage today?',
      timestamp: 'Just now',
      groundedSources: ['Vertex Marylebone Fee Schedule', 'GDC Clinical Guidelines'],
      activeAgentEngine: `${aiProviderSettings.activeProvider}`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<{ [id: string]: boolean }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedInitialRef = useRef<string>('');

  const quickChips = [
    'How much is Invisalign?',
    'Severe toothache relief',
    'What 0% finance plans do you offer?',
    'Are your dentists GDC registered?',
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
        const result: AIResponseResult = generateGroundingResponse(text, {
          services,
          companyDetails,
          policies: clinicPolicies,
          faqs,
          guardrails: aiSettings,
          approvalPolicy,
          providerSettings: aiProviderSettings,
        });

        const isPainQuery = /pain|hurt|swelling|broken|emergency|antibiotic/i.test(text);

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: result.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reasoningTrace: result.reasoningTrace,
          groundedSources: result.sourceGrounded,
          actionType: result.actionType,
          actionPayload: result.actionPayload,
          isEmergencyAlert: isPainQuery || result.isEmergencyAlert,
          alertText: isPainQuery
            ? 'Acute dental pain requires an immediate clinical evaluation by Dr. Alistair Vance.'
            : undefined,
          activeAgentEngine: result.activeAgentEngine,
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 400);
    },
    [input, services, companyDetails, clinicPolicies, faqs, aiSettings, approvalPolicy, aiProviderSettings]
  );

  useEffect(() => {
    if (isChatDrawerOpen && chatInitialMessage && chatInitialMessage !== lastProcessedInitialRef.current) {
      lastProcessedInitialRef.current = chatInitialMessage;
      handleUserSend(chatInitialMessage);
    }
  }, [isChatDrawerOpen, chatInitialMessage, handleUserSend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (pathname?.startsWith('/admin-dashboard')) {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isChatDrawerOpen && (
        <button
          onClick={() => openChatDrawer()}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-2.5 border-2 border-white/80"
          title="Open Clinical AI Assistant"
          aria-label="Open AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 border-2 border-[#0F172A]"></span>
          </div>
          <span className="text-xs font-bold hidden sm:inline">AI Dental Concierge</span>
        </button>
      )}

      {/* Slide-out Drawer container */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] shadow-2xl transition-transform duration-300 flex flex-col bg-white border-l border-slate-200 ${
          isChatDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-[#0F172A] text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white leading-tight">
                Vertex Clinical AI Concierge
              </h4>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Marylebone Studio • <span className="text-emerald-400 font-semibold">GDC Guardrails Active</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                setMessages([messages[0]]);
                setExpandedReasoningIds({});
              }}
              title="Reset conversation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={closeChatDrawer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Latency & Model Status Bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Engine: {aiProviderSettings.activeProvider}</span>
          </span>
          <span>Response Grounded: 100%</span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF9F6]">
          {messages.map(m => {
            if (m.sender === 'user') {
              return (
                <div key={m.id} className="flex items-end justify-end space-x-2">
                  <div className="max-w-[85%] p-3.5 rounded-2xl rounded-br-xs bg-[#0F172A] text-white text-xs leading-relaxed shadow-sm">
                    {m.text}
                  </div>
                </div>
              );
            }

            // AI Bot Message
            const isTraceExpanded = expandedReasoningIds[m.id];
            return (
              <div key={m.id} className="flex items-start space-x-2.5">
                <span className="w-7 h-7 rounded-full bg-[#0F172A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  V
                </span>
                <div className="max-w-[88%] space-y-2">
                  <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed shadow-xs space-y-2.5">
                    <p className="whitespace-pre-line">{m.text}</p>

                    {/* Emergency Alert Callout */}
                    {m.isEmergencyAlert && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start space-x-2">
                        <span className="text-rose-600 font-bold text-sm leading-none mt-0.5">!</span>
                        <p className="text-[11px] font-semibold leading-snug">
                          {m.alertText || 'Acute symptoms require immediate clinical examination. Emergency triage slots available.'}
                        </p>
                      </div>
                    )}

                    {/* Action button if booking recommended */}
                    {m.actionType === 'book' && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            closeChatDrawer();
                            openBookingModal(m.actionPayload);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs"
                        >
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Book Guest Consultation</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Chain of Thought Reasoning Trace Accordion */}
                  {m.reasoningTrace && m.reasoningTrace.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-700 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => toggleReasoning(m.id)}
                        className="font-bold text-slate-900 flex items-center justify-between w-full"
                      >
                        <span className="flex items-center space-x-1.5">
                          <Brain className="w-3.5 h-3.5 text-emerald-700" />
                          <span>🧠 Reasoning Trace ({m.reasoningTrace.length} Steps)</span>
                        </span>
                        {isTraceExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>

                      {isTraceExpanded && (
                        <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[10px]">
                          {m.reasoningTrace.map((st, i) => (
                            <p key={i}>
                              <strong className="text-slate-900">Step {st.step} ({st.title}):</strong> {st.detail}
                            </p>
                          ))}
                          {m.groundedSources && (
                            <p className="text-slate-500 font-semibold pt-1 border-t border-slate-200">
                              Sources: {m.groundedSources.join(' • ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 pl-10">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-700" />
              <span>Checking Marylebone fee schedule & GDC safety guidelines...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Test Prompts */}
        <div className="p-2.5 px-4 bg-white border-t border-slate-100 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            SUGGESTIONS:
          </span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleUserSend(chip)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUserSend()}
            placeholder="Ask about treatments, fees, or emergency guidance..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
          <button
            onClick={() => handleUserSend()}
            disabled={isTyping || !input.trim()}
            className="w-10 h-10 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-white flex items-center justify-center transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};
