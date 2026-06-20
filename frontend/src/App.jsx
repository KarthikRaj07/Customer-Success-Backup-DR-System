import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [ctas, setCtas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterAtRiskOnly, setFilterAtRiskOnly] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [customersRes, ctasRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/customers`),
        axios.get(`${API_BASE_URL}/ctas`)
      ]);
      setCustomers(customersRes.data);
      setCtas(ctasRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      showNotification("Failed to connect to FastAPI backend. Check if the server is running.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to show temporary notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Seed sample database
  const handleSeedDatabase = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/seed`);
      showNotification(res.data.message, "success");
      await fetchData();
    } catch (err) {
      console.error(err);
      showNotification("Failed to seed database.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Generate CTAs automatically
  const handleGenerateCTAs = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/generate-cta`);
      showNotification(`Generation complete! Created ${res.data.generated_count} new actions.`, "success");
      await fetchData();
    } catch (err) {
      console.error(err);
      showNotification("Failed to generate actions.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Update CTA Status via PATCH
  const handleUpdateStatus = async (ctaId, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/cta/${ctaId}`, { status: newStatus });
      showNotification(`Action status updated to "${newStatus}"`, "success");
      
      // Update local state directly to prevent full table reload flicker
      setCtas(prevCtas => 
        prevCtas.map(cta => cta.id === ctaId ? { ...cta, status: newStatus } : cta)
      );
    } catch (err) {
      console.error(err);
      showNotification("Failed to update status.", "error");
    }
  };

  // Calculate quick stats from customer data
  const totalCount = customers.length;
  const criticalCount = customers.filter(c => c.health_status === 'Critical').length;
  const atRiskCount = customers.filter(c => c.health_status === 'At Risk').length;
  const healthyCount = customers.filter(c => c.health_status === 'Healthy').length;

  // Filter CTAs based on filter selection
  const filteredCtas = ctas.filter(cta => {
    if (!filterAtRiskOnly) return true;
    
    // Find corresponding customer and check if health status is 'At Risk' or 'Critical'
    const customer = customers.find(c => c.id === cta.customer_id);
    return customer && (customer.health_status === 'At Risk' || customer.health_status === 'Critical');
  });

  return (
    <div className="min-h-screen text-slate-100 flex flex-col antialiased">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-2xl transition-all duration-300 border backdrop-blur-md flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' :
          notification.type === 'error' ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' :
          'bg-indigo-950/80 border-indigo-500/30 text-indigo-300'
        }`}>
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-grow">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent m-0">
              Mini Gainsight
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Customer Success & Re-Engagement Automation System
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleSeedDatabase}
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 transition duration-150 disabled:opacity-50"
            >
              Seed Sample Data
            </button>
            <button 
              onClick={handleGenerateCTAs}
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-950/30 transition duration-150 disabled:opacity-50"
            >
              Generate Actions
            </button>
          </div>
        </header>

        {/* Tab Controls */}
        <div className="flex gap-2 mb-6 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80 max-w-sm">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition duration-150 ${
              activeTab === 'dashboard' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition duration-150 ${
              activeTab === 'actions' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Action Queue ({ctas.length})
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="h-96 flex flex-col justify-center items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-slate-400 text-sm">Loading health metrics...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Statistics Panels */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-5 rounded-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Accounts</span>
                <h3 className="text-3xl font-extrabold text-white mt-2">{totalCount}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Monitored active systems</p>
              </div>
              <div className="glass-card p-5 rounded-xl border-l-4 border-l-emerald-500">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Healthy</span>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">{healthyCount}</h3>
                <p className="text-[10px] text-slate-500 mt-1">No action required</p>
              </div>
              <div className="glass-card p-5 rounded-xl border-l-4 border-l-amber-500">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">At Risk</span>
                <h3 className="text-3xl font-extrabold text-amber-400 mt-2">{atRiskCount}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Intervention recommended</p>
              </div>
              <div className="glass-card p-5 rounded-xl border-l-4 border-l-rose-500">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Critical</span>
                <h3 className="text-3xl font-extrabold text-rose-500 mt-2">{criticalCount}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Immediate action required</p>
              </div>
            </section>

            {/* TAB CONTENT: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/40">
                  <h2 className="text-base font-bold text-white m-0">Customer Portfolio Health</h2>
                  <span className="text-xs text-slate-400">{totalCount} accounts listed</span>
                </div>
                
                {totalCount === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-slate-400 mb-4">No customer data found. Seed the database to get started.</p>
                    <button 
                      onClick={handleSeedDatabase}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-semibold transition"
                    >
                      Seed Sample Data
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                          <th className="py-4 px-6">Name</th>
                          <th className="py-4 px-6 text-center">Health Status</th>
                          <th className="py-4 px-6">System Usage</th>
                          <th className="py-4 px-6">Backup Status</th>
                          <th className="py-4 px-6 text-center">Open Tickets</th>
                          <th className="py-4 px-6">Last Login</th>
                          <th className="py-4 px-6">Suggested Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {customers.map((customer) => (
                          <tr key={customer.id} className="hover:bg-slate-900/30 transition duration-150">
                            <td className="py-4 px-6 font-semibold text-white">{customer.name}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                                customer.health_status === 'Critical' ? 'bg-rose-950/40 border-rose-500/30 text-rose-400' :
                                customer.health_status === 'At Risk' ? 'bg-amber-950/40 border-amber-500/30 text-amber-400' :
                                'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                              }`}>
                                {customer.health_status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3 min-w-[120px]">
                                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-1.5 rounded-full ${
                                      customer.usage < 40 ? 'bg-rose-500' : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${customer.usage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-mono text-slate-300 w-8">{customer.usage}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 text-xs ${
                                customer.backup_status === 'Failed' ? 'text-rose-400 font-semibold' : 'text-slate-300'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  customer.backup_status === 'Failed' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                                }`}></span>
                                {customer.backup_status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                customer.tickets > 3 ? 'bg-rose-950/60 border border-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {customer.tickets}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                              {customer.last_login}
                            </td>
                            <td className="py-4 px-6 text-xs">
                              <span className={customer.suggested_action !== 'No action required' ? 'text-amber-300 font-medium' : 'text-slate-500'}>
                                {customer.suggested_action}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ACTION QUEUE */}
            {activeTab === 'actions' && (
              <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40">
                  <div>
                    <h2 className="text-base font-bold text-white m-0">Recommended Actions (CTAs)</h2>
                    <p className="text-xs text-slate-400 mt-1">Actions triggered based on telemetry risk analysis</p>
                  </div>
                  
                  {/* At Risk Only Filter Toggle */}
                  <label className="inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={filterAtRiskOnly} 
                      onChange={(e) => setFilterAtRiskOnly(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ms-3 text-xs font-semibold text-slate-300">Show only at-risk accounts</span>
                  </label>
                </div>
                
                {filteredCtas.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-slate-400">No pending actions. Click "Generate Actions" above to parse telemetry and identify at-risk customers.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                          <th className="py-4 px-6">Customer Name</th>
                          <th className="py-4 px-6">Action Needed</th>
                          <th className="py-4 px-6">Priority</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredCtas.map((cta) => {
                          // Find customer health to apply highlight rules
                          const relatedCustomer = customers.find(c => c.id === cta.customer_id);
                          const customerHealth = relatedCustomer ? relatedCustomer.health_status : 'Healthy';
                          
                          // Determine row highlight styling: Critical (red highlight), At Risk (orange highlight)
                          let rowHighlightClass = "";
                          if (customerHealth === 'Critical') {
                            rowHighlightClass = "bg-rose-500/[0.04] hover:bg-rose-500/[0.06]";
                          } else if (customerHealth === 'At Risk') {
                            rowHighlightClass = "bg-amber-500/[0.03] hover:bg-amber-500/[0.05]";
                          } else {
                            rowHighlightClass = "hover:bg-slate-900/30";
                          }

                          return (
                            <tr key={cta.id} className={`transition duration-150 ${rowHighlightClass}`}>
                              {/* Customer Name with highlight indicators */}
                              <td className="py-4 px-6 font-semibold">
                                <div className="flex items-center gap-2">
                                  {customerHealth === 'Critical' && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-md shadow-rose-500/50"></span>
                                  )}
                                  {customerHealth === 'At Risk' && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-md shadow-amber-500/50"></span>
                                  )}
                                  <span className={
                                    customerHealth === 'Critical' ? 'text-rose-400 font-bold' :
                                    customerHealth === 'At Risk' ? 'text-amber-400 font-medium' :
                                    'text-slate-300'
                                  }>
                                    {cta.customer_name}
                                  </span>
                                </div>
                              </td>
                              
                              <td className="py-4 px-6 text-sm text-slate-300 font-medium">{cta.action}</td>
                              
                              <td className="py-4 px-6">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                                  cta.priority === 'High' ? 'bg-rose-950/60 border border-rose-500/20 text-rose-400' :
                                  'bg-amber-950/60 border border-amber-500/20 text-amber-400'
                                }`}>
                                  {cta.priority}
                                </span>
                              </td>
                              
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                  cta.status === 'Completed' ? 'text-emerald-400' :
                                  cta.status === 'In Progress' ? 'text-indigo-400 animate-pulse' :
                                  'text-slate-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    cta.status === 'Completed' ? 'bg-emerald-400' :
                                    cta.status === 'In Progress' ? 'bg-indigo-400' :
                                    'bg-slate-500'
                                  }`}></span>
                                  {cta.status}
                                </span>
                              </td>
                              
                              {/* Status update Dropdown */}
                              <td className="py-4 px-6 text-right">
                                <select 
                                  value={cta.status} 
                                  onChange={(e) => handleUpdateStatus(cta.id, e.target.value)}
                                  className="text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-indigo-500 cursor-pointer transition duration-150"
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
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
