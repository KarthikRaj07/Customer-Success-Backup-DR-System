import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import ActionQueue from './pages/ActionQueue';

const API = 'http://127.0.0.1:8001';

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'actions',
    label: 'Action Queue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [ctas, setCtas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, ctaRes] = await Promise.all([
        axios.get(`${API}/customers`),
        axios.get(`${API}/api/actions`),
      ]);
      setCustomers(custRes.data);
      setCtas(ctaRes.data);
    } catch {
      notify('Failed to reach backend. Is the server running on port 8001?', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSeed = async () => {
    setActionLoading(true);
    try {
      const r = await axios.post(`${API}/seed`);
      notify(r.data.message);
      await fetchAll();
    } catch { notify('Seed failed.', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleGenerateCTAs = async () => {
    setActionLoading(true);
    try {
      const r = await axios.post(`${API}/api/generate-actions`);
      notify(`Generated ${r.data.generated_count} new actions.`);
      await fetchAll();
    } catch { notify('Generate failed.', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleUpdateStatus = async (ctaId, newStatus) => {
    try {
      await axios.patch(`${API}/api/actions/${ctaId}`, { status: newStatus });
      notify(`Status updated to "${newStatus}"`);
      setCtas(prev => prev.map(c => c.id === ctaId ? { ...c, status: newStatus } : c));
    } catch { notify('Status update failed.', 'error'); }
  };

  // Shared stats
  const stats = {
    total: customers.length,
    healthy: customers.filter(c => c.health_status === 'Healthy').length,
    atRisk: customers.filter(c => c.health_status === 'At Risk').length,
    critical: customers.filter(c => c.health_status === 'Critical').length,
    pending: ctas.filter(c => c.status === 'Pending').length,
  };

  const sharedProps = {
    customers, ctas, stats, loading, actionLoading,
    onRefresh: fetchAll, onSeed: handleSeed,
    onGenerateCTAs: handleGenerateCTAs, onUpdateStatus: handleUpdateStatus,
    notify,
  };

  return (
    <div className="flex min-h-screen text-slate-100">
      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-xl text-sm font-medium transition-all animate-fade-in ${
          toast.type === 'error'
            ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
        }`}>
          <span className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
          {toast.message}
        </div>
      )}

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className={`flex flex-col glass-panel border-r border-slate-800/60 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'} shrink-0`}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800/60">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white whitespace-nowrap">Mini Gainsight</p>
              <p className="text-[10px] text-slate-500 whitespace-nowrap">Customer Success</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="ml-auto text-slate-600 hover:text-slate-300 transition"
          >
            <svg className={`w-4 h-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                page === item.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.id === 'actions' && stats.pending > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{stats.pending}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom action buttons */}
        {sidebarOpen && (
          <div className="px-3 pb-5 space-y-2">
            <button
              onClick={handleSeed}
              disabled={actionLoading}
              className="w-full py-2 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
            >
              Seed Sample Data
            </button>
            <button
              onClick={handleGenerateCTAs}
              disabled={actionLoading}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/30 transition disabled:opacity-50"
            >
              {actionLoading ? 'Working…' : '⚡ Generate Actions'}
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60 glass-panel shrink-0">
          <div>
            <h1 className="text-base font-bold text-white">
              {NAV.find(n => n.id === page)?.label}
            </h1>
            <p className="text-xs text-slate-500">
              {stats.total} accounts · {stats.critical} critical · {stats.atRisk} at risk
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live status indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Backend connected
            </div>
            <button onClick={fetchAll} disabled={loading} className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page body */}
        <div className="flex-1 overflow-y-auto p-6">
          {page === 'dashboard' && <Dashboard {...sharedProps} />}
          {page === 'customers' && <Customers {...sharedProps} />}
          {page === 'actions' && <ActionQueue {...sharedProps} />}
        </div>
      </main>
    </div>
  );
}
