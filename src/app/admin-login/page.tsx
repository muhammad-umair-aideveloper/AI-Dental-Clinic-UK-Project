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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('admin_session_token', data.token);
        }
        loginAs('admin', data.user.email, data.user.name);
        triggerToast('Staff authenticated successfully. Redirecting to appointments dashboard...');
        router.push('/admin/appointments');
      } else {
        setErrorMessage(data.error || 'Invalid staff credentials. Please check your username and password.');
      }
    } catch {
      setErrorMessage('Network error while authenticating. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F6F6F8] text-[#111827] flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden antialiased">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-neutral-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Back Link */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-2 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 text-xs font-semibold border border-neutral-200/60 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Clinic Website</span>
        </Link>

        <div className="flex items-center space-x-2 text-[11px] text-neutral-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-Bit Encrypted Clinical Gateway</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="max-w-md w-full mx-auto my-auto relative z-10 py-8">
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5722] mx-auto flex items-center justify-center border border-orange-200/60 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <span className="font-extrabold text-sm tracking-tight text-neutral-950 uppercase font-sans">
                  VERTEX
                </span>
                <span className="text-[10px] font-semibold text-[#FF5722] bg-[#FFF4ED] border border-orange-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Marketing Hub
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Staff Authentication</h1>
              <p className="text-xs text-neutral-500 mt-1">
                Access Lead & Triage Hub, Content CMS & AI Concierge Settings
              </p>
            </div>
          </div>

          {/* Quick 1-Click Demo Credentials Chip */}
          <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF5722] flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Demo Staff Credentials:</span>
              </span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-[10px] font-semibold text-[#FF5722] hover:underline"
              >
                Auto-Fill
              </button>
            </div>
            <div className="flex items-center justify-between text-neutral-600 font-mono text-[11px]">
              <span>Username: <strong className="text-neutral-900">admin</strong></span>
              <span>Password: <strong className="text-neutral-900">admin123</strong></span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-start space-x-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-snug">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-neutral-700">Staff Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="admin or admin@vertexdental.co.uk"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-neutral-900 placeholder:text-neutral-400 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-neutral-700">Staff Access Key</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-neutral-500 hover:text-neutral-900 flex items-center space-x-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F8F9FA] border border-neutral-200/80 text-neutral-900 placeholder:text-neutral-400 text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full font-semibold text-xs text-white bg-[#141519] hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <span>{isLoading ? 'Verifying Staff Credentials...' : 'Authenticate & Enter Lead Hub'}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-2 text-center text-[10px] text-neutral-500 space-y-1 border-t border-neutral-100">
            <p>Protected under UK Caldicott Guardian & GDC Confidentiality Protocols.</p>
            <p>Authorised Marylebone clinical & front desk staff only.</p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-[11px] text-neutral-500 py-3 relative z-10">
        © {new Date().getFullYear()} Vertex Dental Lab Ltd • Marylebone, London W1G 9PH
      </footer>
    </div>
  );
}
