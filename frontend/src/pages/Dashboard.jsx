// Dashboard.jsx — Summary stats + health distribution + recent at-risk snapshot

const STAT_CARDS = [
  {
    key: 'total',
    label: 'Total Accounts',
    color: 'indigo',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'healthy',
    label: 'Healthy',
    color: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'atRisk',
    label: 'At Risk',
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    key: 'critical',
    label: 'Critical',
    color: 'rose',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const COLOR_MAP = {
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  text: 'text-indigo-400',  bar: 'bg-indigo-500' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   bar: 'bg-amber-500' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400',    bar: 'bg-rose-500' },
};

function HealthBadge({ status }) {
  const cls =
    status === 'Critical' ? 'bg-rose-950/60 border-rose-500/30 text-rose-400' :
    status === 'At Risk'  ? 'bg-amber-950/60 border-amber-500/30 text-amber-400' :
                            'bg-emerald-950/60 border-emerald-500/30 text-emerald-400';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'Critical' ? 'bg-rose-400 animate-pulse' :
        status === 'At Risk'  ? 'bg-amber-400' : 'bg-emerald-400'
      }`} />
      {status}
    </span>
  );
}

export default function Dashboard({ stats, customers, ctas, loading, onSeed }) {
  const atRiskList = customers.filter(c => c.health_status !== 'Healthy').slice(0, 5);
  const pendingCtas = ctas.filter(c => c.status === 'Pending').length;
  const completedCtas = ctas.filter(c => c.status === 'Completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading health data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => {
          const c = COLOR_MAP[card.color];
          const value = stats[card.key];
          const pct = stats.total ? Math.round((value / stats.total) * 100) : 0;
          return (
            <div key={card.key} className={`glass-card rounded-xl p-5 border ${c.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${c.bg}`}>
                  <span className={c.text}>{card.icon}</span>
                </div>
                {card.key !== 'total' && (
                  <span className={`text-xs font-semibold ${c.text} bg-slate-900/40 px-2 py-0.5 rounded-full`}>
                    {pct}%
                  </span>
                )}
              </div>
              <p className={`text-3xl font-extrabold ${c.text}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-1">{card.label}</p>
              {card.key !== 'total' && stats.total > 0 && (
                <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CTA summary */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Action Queue Overview</h3>
          <div className="space-y-3">
            {[
              { label: 'Pending', value: pendingCtas, color: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'In Progress', value: ctas.filter(c => c.status === 'In Progress').length, color: 'bg-indigo-500', text: 'text-indigo-400' },
              { label: 'Completed', value: completedCtas, color: 'bg-emerald-500', text: 'text-emerald-400' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${row.color}`} />
                <span className="text-xs text-slate-400 flex-1">{row.label}</span>
                <span className={`text-sm font-bold ${row.text}`}>{row.value}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total CTAs</span>
                <span className="text-sm font-bold text-white">{ctas.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health distribution bar */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">Portfolio Health Distribution</h3>
          {stats.total === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <p className="text-slate-500 text-xs text-center">No data yet.</p>
              <button onClick={onSeed} className="text-xs text-indigo-400 hover:text-indigo-300 underline">Seed sample data</button>
            </div>
          ) : (
            <>
              <div className="flex h-6 rounded-lg overflow-hidden gap-px">
                {stats.healthy  > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.healthy  / stats.total) * 100}%` }} title={`Healthy: ${stats.healthy}`}  />}
                {stats.atRisk   > 0 && <div className="bg-amber-500  transition-all" style={{ width: `${(stats.atRisk   / stats.total) * 100}%` }} title={`At Risk: ${stats.atRisk}`}   />}
                {stats.critical > 0 && <div className="bg-rose-500   transition-all" style={{ width: `${(stats.critical / stats.total) * 100}%` }} title={`Critical: ${stats.critical}`} />}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy ({stats.healthy})</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"  /> At Risk ({stats.atRisk})</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"   /> Critical ({stats.critical})</span>
              </div>
            </>
          )}
        </div>

        {/* High priority CTAs */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800/60">
          <h3 className="text-sm font-bold text-white mb-4">High Priority Actions</h3>
          {ctas.filter(c => c.priority === 'High' && c.status === 'Pending').length === 0 ? (
            <p className="text-slate-500 text-xs">No high-priority pending actions.</p>
          ) : (
            <ul className="space-y-2">
              {ctas.filter(c => c.priority === 'High' && c.status === 'Pending').slice(0, 4).map(cta => (
                <li key={cta.id} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                  <div>
                    <span className="text-white font-medium">{cta.customer_name}</span>
                    <span className="text-slate-500"> — {cta.action}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* At-risk quick view table */}
      {atRiskList.length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/60">
          <div className="px-5 py-4 border-b border-slate-800/60">
            <h3 className="text-sm font-bold text-white">⚠️ Accounts Needing Attention</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Health</th>
                  <th className="px-5 py-3 text-left">Backup</th>
                  <th className="px-5 py-3 text-left">Suggested Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {atRiskList.map(c => (
                  <tr key={c.id} className={`transition ${
                    c.health_status === 'Critical' ? 'bg-rose-500/[0.04]' : 'bg-amber-500/[0.03]'
                  }`}>
                    <td className="px-5 py-3 font-semibold text-white">{c.name}</td>
                    <td className="px-5 py-3"><HealthBadge status={c.health_status} /></td>
                    <td className="px-5 py-3">
                      <span className={c.backup_status === 'Failed' ? 'text-rose-400 font-medium' : 'text-slate-400'}>{c.backup_status}</span>
                    </td>
                    <td className="px-5 py-3 text-amber-300 text-xs font-medium">{c.suggested_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
