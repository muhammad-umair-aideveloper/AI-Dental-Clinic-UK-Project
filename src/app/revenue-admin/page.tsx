'use client';

/**
 * src/app/revenue-admin/page.tsx
 *
 * Admin Revenue Dashboard — requires Google OAuth (allow-listed staff emails).
 * Features:
 *   - Today's appointments: Attended / No-show / Completed / Cancelled buttons
 *   - Lead list with HOT (🔴) and EMERGENCY (🚨) highlighting
 *   - KPI cards: no-show rate, deposit conversion, reviews requested
 *   - GDPR delete and export actions
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  status: string;
  emergency: boolean;
  score?: 'HOT' | 'WARM' | 'COLD';
  fullName?: string;
  mobile?: string;
  email?: string;
  treatment?: string;
  timeline?: string;
  appointmentDateTime?: string;
  createdAt: string;
  depositPaidAt?: string;
  reviewMessageCount: number;
  source: string;
}

interface KpiSnapshot {
  leadsTotal: number;
  leadsHot: number;
  emergencies: number;
  depositsPaid: number;
  depositsIssued: number;
  depositConversionRate: number;
  noShows: number;
  attended: number;
  reviewsRequested: number;
  reviewLinksClicked: number;
}

const AUTOMATION_API = process.env['NEXT_PUBLIC_AUTOMATION_URL'] ?? 'http://localhost:8080';

// ─── Status badge colours ─────────────────────────────────────────────────────

const STATUS_COLOURS: Record<string, string> = {
  NEW:              'bg-slate-100 text-slate-700',
  QUALIFYING:       'bg-blue-100 text-blue-700',
  QUALIFIED:        'bg-indigo-100 text-indigo-700',
  DEPOSIT_PENDING:  'bg-amber-100 text-amber-700',
  CONFIRMED:        'bg-green-100 text-green-700',
  ATTENDED:         'bg-teal-100 text-teal-700',
  NO_SHOW:          'bg-red-100 text-red-700',
  CANCELLED:        'bg-gray-100 text-gray-500',
  COMPLETED:        'bg-emerald-100 text-emerald-700',
  REVIEW_REQUESTED: 'bg-purple-100 text-purple-700',
};

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, emergency }: { score?: string; emergency?: boolean }) {
  if (emergency) return <span className="font-bold text-red-600 animate-pulse">🚨 EMERGENCY</span>;
  if (score === 'HOT')  return <span className="font-bold text-red-500">🔴 HOT</span>;
  if (score === 'WARM') return <span className="font-bold text-amber-500">🟡 WARM</span>;
  return <span className="text-slate-400 text-sm">🔵 COLD</span>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className={`rounded-2xl p-6 border ${color} shadow-sm`}>
      <p className="text-sm font-medium opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function RevenueAdminPage() {
  const [leads,   setLeads]   = useState<Lead[]>([]);
  const [kpi,     setKpi]     = useState<KpiSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [token,   setToken]   = useState<string>('');
  const [tab,     setTab]     = useState<'today' | 'all'>('today');
  const [updating, setUpdating] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState('');

  // In production this token comes from Google OAuth (NextAuth)
  // For this demo: stored in state after manual paste
  const fetchData = useCallback(async (authToken: string) => {
    if (!authToken) return;
    setLoading(true);
    setError(null);

    try {
      const [leadsRes, kpiRes] = await Promise.all([
        fetch(`${AUTOMATION_API}/api/admin/leads${tab === 'today' ? '/today' : ''}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${AUTOMATION_API}/api/admin/kpis`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (leadsRes.status === 401 || leadsRes.status === 403) {
        setError('Access denied. Your email is not in the allow-list.');
        return;
      }

      const leadsData = await leadsRes.json() as { leads: Lead[] };
      const kpiData   = await kpiRes.json()   as { kpi: KpiSnapshot };

      // Sort: EMERGENCY first, then HOT, then by createdAt desc
      const sorted = (leadsData.leads ?? []).sort((a, b) => {
        if (a.emergency && !b.emergency) return -1;
        if (!a.emergency && b.emergency) return 1;
        if (a.score === 'HOT' && b.score !== 'HOT') return -1;
        if (a.score !== 'HOT' && b.score === 'HOT') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setLeads(sorted);
      setKpi(kpiData.kpi);
    } catch (e) {
      setError(`Failed to load data: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (token) void fetchData(token);
  }, [token, fetchData, tab]);

  const updateStatus = async (leadId: string, status: string) => {
    setUpdating(leadId);
    try {
      const res = await fetch(`${AUTOMATION_API}/api/admin/leads/${leadId}/status`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        alert(`Error: ${err.error}`);
        return;
      }

      // Refresh
      void fetchData(token);
    } finally {
      setUpdating(null);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm(`Permanently delete PII for lead ${leadId}? This cannot be undone.`)) return;
    await fetch(`${AUTOMATION_API}/api/admin/leads/${leadId}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    void fetchData(token);
  };

  const exportLead = (leadId: string) => {
    window.open(`${AUTOMATION_API}/api/admin/leads/${leadId}/export?token=${token}`, '_blank');
  };

  const filteredLeads = leads.filter((l) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      l.fullName?.toLowerCase().includes(q) ||
      l.treatment?.toLowerCase().includes(q) ||
      l.status?.toLowerCase().includes(q) ||
      l.mobile?.includes(q)
    );
  });

  const pct = (n: number, d: number) =>
    d > 0 ? `${Math.round((n / d) * 100)}%` : 'N/A';

  // ── Auth screen ─────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <span className="text-4xl">🦷</span>
            <h1 className="text-2xl font-bold text-slate-800 mt-2">Revenue Admin</h1>
            <p className="text-slate-500 text-sm mt-1">Vertex Dental Lab — Staff Only</p>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Paste your Google OAuth ID token (from the OAuth flow). In production, this
            will use NextAuth with Google Sign-In.
          </p>
          <textarea
            id="admin-token-input"
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono h-24 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste Google ID token here..."
            onChange={(e) => setToken((e.target as HTMLTextAreaElement).value.trim())}
          />
          <p className="text-xs text-slate-400 text-center">
            Only allow-listed staff emails can access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦷</span>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-none">Revenue Admin</h1>
              <p className="text-xs text-slate-500">Vertex Dental Lab</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              id="tab-today"
              onClick={() => setTab('today')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'today' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Today
            </button>
            <button
              id="tab-all"
              onClick={() => setTab('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All Leads
            </button>
            <button
              onClick={() => void fetchData(token)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm hover:bg-slate-200"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── KPI Cards ── */}
        {kpi && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KpiCard
              label="New Leads Today"
              value={kpi.leadsTotal}
              sub={`${kpi.leadsHot} HOT · ${kpi.emergencies} Emergency`}
              color="border-blue-100 bg-blue-50 text-blue-900"
            />
            <KpiCard
              label="Deposit Conversion"
              value={pct(kpi.depositsPaid, kpi.depositsIssued)}
              sub={`${kpi.depositsPaid} paid / ${kpi.depositsIssued} issued`}
              color="border-green-100 bg-green-50 text-green-900"
            />
            <KpiCard
              label="No-Show Rate"
              value={pct(kpi.noShows, kpi.attended + kpi.noShows)}
              sub={`${kpi.noShows} no-shows / ${kpi.attended + kpi.noShows} appointments`}
              color="border-amber-100 bg-amber-50 text-amber-900"
            />
            <KpiCard
              label="Reviews Requested"
              value={kpi.reviewsRequested}
              sub={`${kpi.reviewLinksClicked} links clicked`}
              color="border-purple-100 bg-purple-50 text-purple-900"
            />
          </div>
        )}

        {/* ── Search ── */}
        <div className="mb-4">
          <input
            id="admin-search"
            type="search"
            placeholder="Search by name, treatment, status, phone..."
            className="w-full md:w-80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter((e.target as HTMLInputElement).value)}
          />
        </div>

        {/* ── Lead Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400 text-sm animate-pulse">Loading leads...</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No leads found.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Priority</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Patient</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Treatment</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Appt Time</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Actions</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">GDPR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-50 transition-colors ${lead.emergency ? 'bg-red-50' : lead.score === 'HOT' ? 'bg-orange-50/40' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <ScoreBadge score={lead.score} emergency={lead.emergency} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{lead.fullName ?? '—'}</div>
                      <div className="text-slate-400 text-xs">{lead.source}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{lead.treatment ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-600 text-xs">
                      {lead.appointmentDateTime
                        ? new Date(lead.appointmentDateTime).toLocaleString('en-GB', {
                            timeZone: 'Europe/London',
                            day: '2-digit', month: 'short',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOURS[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {lead.status === 'CONFIRMED' && (
                          <>
                            <ActionButton
                              id={`btn-attended-${lead.id}`}
                              label="✅ Attended"
                              color="green"
                              disabled={updating === lead.id}
                              onClick={() => void updateStatus(lead.id, 'ATTENDED')}
                            />
                            <ActionButton
                              id={`btn-noshow-${lead.id}`}
                              label="❌ No-show"
                              color="red"
                              disabled={updating === lead.id}
                              onClick={() => void updateStatus(lead.id, 'NO_SHOW')}
                            />
                            <ActionButton
                              id={`btn-cancel-${lead.id}`}
                              label="Cancel"
                              color="gray"
                              disabled={updating === lead.id}
                              onClick={() => void updateStatus(lead.id, 'CANCELLED')}
                            />
                          </>
                        )}
                        {lead.status === 'ATTENDED' && (
                          <ActionButton
                            id={`btn-completed-${lead.id}`}
                            label="⭐ Completed"
                            color="purple"
                            disabled={updating === lead.id}
                            onClick={() => void updateStatus(lead.id, 'COMPLETED')}
                          />
                        )}
                        {lead.mobile && (
                          <a
                            href={`tel:${lead.mobile}`}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                          >
                            📞 Call
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button
                          id={`btn-export-${lead.id}`}
                          onClick={() => exportLead(lead.id)}
                          title="GDPR Export"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-xs"
                        >
                          ↓
                        </button>
                        <button
                          id={`btn-delete-${lead.id}`}
                          onClick={() => void deleteLead(lead.id)}
                          title="GDPR Delete PII"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors text-xs"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-4 text-center">
          Vertex Dental Lab Revenue Automation • Data processed in EU/UK regions only • UK GDPR compliant
        </p>
      </main>
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionButton({ id, label, color, disabled, onClick }: {
  id: string;
  label: string;
  color: 'green' | 'red' | 'gray' | 'purple';
  disabled?: boolean;
  onClick: () => void;
}) {
  const colours = {
    green:  'bg-green-50  text-green-700  hover:bg-green-100',
    red:    'bg-red-50    text-red-700    hover:bg-red-100',
    gray:   'bg-slate-100 text-slate-600  hover:bg-slate-200',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
  };

  return (
    <button
      id={id}
      disabled={disabled}
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colours[color]}`}
    >
      {label}
    </button>
  );
}
