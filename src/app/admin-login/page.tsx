'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/context/ClinicContext';
import {
  Lock,
  User,
  Key,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Building,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { currentUser, loginAs, triggerToast } = useClinic();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated as admin, redirect to /admin-dashboard
  useEffect(() => {
    if (currentUser.isLoggedIn && currentUser.role === 'admin') {
      router.replace('/admin-dashboard');
    }
  }, [currentUser, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Verify credentials against demo admin directives
    setTimeout(() => {
      if (
        (cleanUser === 'admin' || cleanUser === 'admin@vertexdental.co.uk' || cleanUser === 'dr.vance') &&
        cleanPass === 'admin123'
      ) {
        loginAs('admin', 'admin@vertexdental.co.uk', 'Dr. Alistair Vance (Lead Surgeon)');
        triggerToast('Staff authenticated successfully. Redirecting to Lead Hub...');
        router.push('/admin-dashboard');
      } else {
        setIsLoading(false);
        setErrorMessage('Invalid staff credentials. Please check your username and password or click the demo chip below.');
      }
    }, 400);
  };

  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Back Link */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-2 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Clinic Website</span>
        </Link>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>256-Bit Encrypted Clinical Gateway</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="max-w-md w-full mx-auto my-auto relative z-10 py-8">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-700/80 shadow-2xl p-6 sm:p-8 space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <span className="font-black text-sm tracking-[0.24em] text-white uppercase font-sans">
                  VERTEX
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.16em] uppercase">
                  PRIVATE DENTAL LAB
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Staff Authentication</h1>
              <p className="text-xs text-slate-400 mt-1">
                Access Lead & Triage Hub, Content CMS & AI Concierge Settings
              </p>
            </div>
          </div>

          {/* Quick 1-Click Demo Credentials Chip */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Demo Staff Credentials:</span>
              </span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 underline"
              >
                Auto-Fill
              </button>
            </div>
            <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
              <span>Username: <strong className="text-white">admin</strong></span>
              <span>Password: <strong className="text-white">admin123</strong></span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start space-x-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-snug">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300">Staff Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="admin or admin@vertexdental.co.uk"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-300">Staff Access Key</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <span>{isLoading ? 'Verifying Staff Credentials...' : 'Authenticate & Enter Lead Hub'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-2 text-center text-[10px] text-slate-500 space-y-1 border-t border-slate-800">
            <p>Protected under UK Caldicott Guardian & GDC Confidentiality Protocols.</p>
            <p>Authorised Marylebone clinical & front desk staff only.</p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-[11px] text-slate-500 py-3 relative z-10">
        © {new Date().getFullYear()} Vertex Dental Lab Ltd • Marylebone, London W1G 9PH
      </footer>
    </div>
  );
}
