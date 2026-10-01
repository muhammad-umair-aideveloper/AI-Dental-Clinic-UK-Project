'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, loginAs } = useClinic();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isAuthModalOpen) return null;

  // Quick Demo Autofills
  const fillDemoAdmin = () => {
    setEmail('admin@vertexdental.co.uk');
    setPassword('admin123');
    setErrorMessage('');
  };

  const fillDemoPatient = () => {
    setEmail('patient@vertexdental.co.uk');
    setPassword('patient123');
    setErrorMessage('');
  };

  // Validation
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailValid) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // Role check: if email contains 'admin'
    if (email.toLowerCase().includes('admin')) {
      loginAs('admin', email, name || 'Clinic Director');
      closeAuthModal();
      router.push('/admin-dashboard');
    } else {
      loginAs('patient', email, name || 'Charlotte Kensington');
      closeAuthModal();
      router.push('/dashboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Vertex Dental Lab Portal</h3>
              <p className="text-xs text-slate-400">Secure Patient & Clinical Administration</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Login Ribbon */}
        <div className="p-4 bg-sky-50 border-b border-sky-100 text-xs">
          <p className="font-bold text-sky-900 flex items-center space-x-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Click to Pre-Fill Demo Credentials:</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoPatient}
              className="p-2 rounded-xl bg-white border border-sky-200 hover:border-sky-400 text-left transition-colors shadow-xs"
            >
              <p className="font-bold text-slate-800 text-[11px]">👤 Patient Account</p>
              <p className="text-[10px] text-slate-500 font-mono">patient@vertexdental...</p>
            </button>

            <button
              type="button"
              onClick={fillDemoAdmin}
              className="p-2 rounded-xl bg-white border border-sky-200 hover:border-sky-400 text-left transition-colors shadow-xs"
            >
              <p className="font-bold text-slate-800 text-[11px]">🛡️ Admin & AI System</p>
              <p className="text-[10px] text-slate-500 font-mono">admin@vertexdental...</p>
            </button>
          </div>
        </div>

        {/* Toggle Sign In / Sign Up */}
        <div className="px-6 pt-5">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              New Patient Sign Up
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Charlotte Kensington"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              {email.length > 0 && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    isEmailValid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isEmailValid ? 'Valid Format' : 'Check @ domain'}
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="patient@vertexdental.co.uk"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              {password.length > 0 && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    isPasswordValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isPasswordValid ? 'Min Length Met' : 'Min 6 Chars'}
                </span>
              )}
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-sky-600 transition-all flex items-center justify-center space-x-2 shadow-md shadow-slate-900/10 active:scale-95"
          >
            <span>{mode === 'signin' ? 'Sign In to Portal' : 'Register Patient Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>UK NHS & Private Health Records Encrypted (256-bit TLS)</span>
          </p>
        </form>
      </div>
    </div>
  );
};
