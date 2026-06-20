// ActionQueue.jsx — Action queue with filtering, row highlighting, and status updates

import { useState, useMemo } from 'react';

export default function ActionQueue({ ctas, customers, onUpdateStatus, onGenerateCTAs, actionLoading }) {
  const [filterAtRiskOnly, setFilterAtRiskOnly] = useState(false);
  const [search, setSearch] = useState('');

  // Combine CTAs with customer health for filtering and highlighting
  const enrichedCtas = useMemo(() => {
    return ctas.map(cta => {
      const customer = customers.find(c => c.id === cta.customer_id);
      return {
        ...cta,
        health_status: customer ? customer.health_status : 'Healthy'
      };
    });
  }, [ctas, customers]);

  const filteredCtas = useMemo(() => {
    let list = enrichedCtas;
    
    if (search) {
      list = list.filter(cta => 
        (cta.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (cta.action || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (filterAtRiskOnly) {
      list = list.filter(cta => cta.health_status === 'At Risk' || cta.health_status === 'Critical');
    }
    
    return list;
  }, [enrichedCtas, search, filterAtRiskOnly]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search actions or customers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* At Risk Filter Toggle */}
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={filterAtRiskOnly}
              onChange={(e) => setFilterAtRiskOnly(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="relative w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
            <span className="ms-2 text-sm font-medium text-slate-300">At-Risk Only</span>
          </label>
        </div>

        {/* Generate Actions Button */}
        <button
          onClick={onGenerateCTAs}
          disabled={actionLoading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/30 transition disabled:opacity-50 whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate Actions
        </button>
      </div>

      {/* Result count */}
      <p className="text-xs text-slate-500">
        Showing <span className="text-slate-300 font-medium">{filteredCtas.length}</span> of {ctas.length} actions
      </p>

      {/* CTA Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/60">
        {filteredCtas.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-sm">No actions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 bg-slate-900/40">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Action Needed</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredCtas.map(cta => {
                  const rowBg =
                    cta.health_status === 'Critical' ? 'bg-rose-500/[0.04] hover:bg-rose-500/[0.07]' :
                    cta.health_status === 'At Risk'  ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06]' :
                    'hover:bg-slate-800/30';
                    
                  return (
                    <tr key={cta.id} className={`transition duration-150 ${rowBg}`}>
                      {/* Customer Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {cta.health_status === 'Critical' && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />}
                          {cta.health_status === 'At Risk'  && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />}
                          <span className={`font-semibold ${
                            cta.health_status === 'Critical' ? 'text-rose-300' :
                            cta.health_status === 'At Risk'  ? 'text-amber-300' : 'text-white'
                          }`}>{cta.customer_name}</span>
                        </div>
                      </td>
                      
                      {/* Action */}
                      <td className="px-5 py-4 text-slate-300 font-medium">
                        {cta.action}
                      </td>
                      
                      {/* Priority */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          cta.priority === 'High' ? 'bg-rose-950/60 border border-rose-500/20 text-rose-400' :
                          cta.priority === 'Medium' ? 'bg-amber-950/60 border border-amber-500/20 text-amber-400' :
                          'bg-slate-800 border border-slate-700 text-slate-300'
                        }`}>
                          {cta.priority}
                        </span>
                      </td>
                      
                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          cta.status === 'Completed' ? 'text-emerald-400' :
                          cta.status === 'In Progress' ? 'text-indigo-400' :
                          'text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            cta.status === 'Completed' ? 'bg-emerald-400' :
                            cta.status === 'In Progress' ? 'bg-indigo-400 animate-pulse' :
                            'bg-slate-500'
                          }`} />
                          {cta.status}
                        </span>
                      </td>
                      
                      {/* Update Action */}
                      <td className="px-5 py-4 text-right">
                        <select 
                          value={cta.status}
                          onChange={(e) => onUpdateStatus(cta.id, e.target.value)}
                          className={`text-xs border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer transition duration-150 ${
                            cta.status === 'Completed' 
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 focus:border-emerald-500' 
                              : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
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
