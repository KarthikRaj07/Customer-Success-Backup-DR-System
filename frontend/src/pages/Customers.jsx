// Customers.jsx — Full customer table with sorting, filtering, row highlights

import { useState, useMemo } from 'react';

function HealthBadge({ status }) {
  const cls =
    status === 'Critical' ? 'bg-rose-950/60 border-rose-500/30 text-rose-400' :
    status === 'At Risk'  ? 'bg-amber-950/60 border-amber-500/30 text-amber-400' :
                            'bg-emerald-950/60 border-emerald-500/30 text-emerald-400';
  const dot =
    status === 'Critical' ? 'bg-rose-400 animate-pulse' :
    status === 'At Risk'  ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

function UsageBar({ value }) {
  const color = value < 40 ? 'bg-rose-500' : value < 70 ? 'bg-amber-500' : 'bg-indigo-500';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-8 text-right">{value}%</span>
    </div>
  );
}

const SORT_KEYS = ['name', 'usage', 'last_login', 'tickets', 'backup_status', 'health_status'];

export default function Customers({ customers, loading, actionLoading, onGenerateCTAs, onSeed }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | at-risk | critical
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  const handleSort = key => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const SortIcon = ({ colKey }) => {
    if (sort.key !== colKey) return <span className="text-slate-700 ml-1">↕</span>;
    return <span className="text-indigo-400 ml-1">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const filtered = useMemo(() => {
    let list = customers;
    if (search)       list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'at-risk')  list = list.filter(c => c.health_status === 'At Risk');
    if (filter === 'critical') list = list.filter(c => c.health_status === 'Critical');
    return [...list].sort((a, b) => {
      const va = a[sort.key] ?? '';
      const vb = b[sort.key] ?? '';
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [customers, search, filter, sort]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search customers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'at-risk', label: 'At Risk' },
            { id: 'critical', label: 'Critical' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                filter === f.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Generate actions */}
        <button
          onClick={onGenerateCTAs}
          disabled={actionLoading}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/30 transition disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate Actions
        </button>
      </div>

      {/* Result count */}
      <p className="text-xs text-slate-500">
        Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of {customers.length} accounts
      </p>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/60">
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{customers.length === 0 ? 'No data yet.' : 'No customers match your filter.'}</p>
            {customers.length === 0 && (
              <button onClick={onSeed} className="text-xs text-indigo-400 hover:underline">Seed sample data</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/40">
                  {[
                    { key: 'name',          label: 'Customer' },
                    { key: 'usage',         label: 'Usage' },
                    { key: 'last_login',    label: 'Last Login' },
                    { key: 'tickets',       label: 'Tickets' },
                    { key: 'backup_status', label: 'Backup' },
                    { key: 'health_status', label: 'Health' },
                    { key: null,            label: 'Suggested Action' },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`px-5 py-3.5 ${col.key ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                      onClick={() => col.key && handleSort(col.key)}
                    >
                      {col.label}
                      {col.key && <SortIcon colKey={col.key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(c => {
                  const rowBg =
                    c.health_status === 'Critical' ? 'bg-rose-500/[0.04] hover:bg-rose-500/[0.07]' :
                    c.health_status === 'At Risk'  ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06]' :
                    'hover:bg-slate-800/30';
                  return (
                    <tr key={c.id} className={`transition duration-150 ${rowBg}`}>
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {c.health_status === 'Critical' && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />}
                          {c.health_status === 'At Risk'  && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                          <span className={`font-semibold ${
                            c.health_status === 'Critical' ? 'text-rose-300' :
                            c.health_status === 'At Risk'  ? 'text-amber-300' : 'text-white'
                          }`}>{c.name}</span>
                        </div>
                      </td>
                      {/* Usage */}
                      <td className="px-5 py-4"><UsageBar value={c.usage} /></td>
                      {/* Last login */}
                      <td className="px-5 py-4 text-xs text-slate-400 font-mono">{c.last_login}</td>
                      {/* Tickets */}
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          c.tickets > 3 ? 'bg-rose-950/60 border border-rose-500/20 text-rose-400' : 'text-slate-400'
                        }`}>{c.tickets}</span>
                      </td>
                      {/* Backup */}
                      <td className="px-5 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${
                          c.backup_status === 'Failed' ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            c.backup_status === 'Failed' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                          }`} />
                          {c.backup_status}
                        </span>
                      </td>
                      {/* Health */}
                      <td className="px-5 py-4"><HealthBadge status={c.health_status} /></td>
                      {/* Suggested action */}
                      <td className="px-5 py-4 text-xs">
                        <span className={c.suggested_action === 'No action required' ? 'text-slate-600' : 'text-amber-300 font-medium'}>
                          {c.suggested_action}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
