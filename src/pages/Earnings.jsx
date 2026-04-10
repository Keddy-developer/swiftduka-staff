import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  DollarSign, Search, RefreshCw, Download,
  TrendingUp, Users, Calendar, Filter, CheckCircle2,
  FileText, ArrowDownToLine, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PERIODS = (() => {
  const list = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    list.push({ 
      value, 
      label: d.toLocaleString('en-KE', { month: 'long', year: 'numeric' }) 
    });
  }
  return list;
})();

const Earnings = () => {
  const { isAdmin, isHQ, canManagePayroll, user } = useAuth();
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState(PERIODS[0].value);
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState(null);
  const [approving, setApproving] = useState(null);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/workforce/earnings', { 
        params: { 
          period: (isAdmin || isHQ) ? period : undefined, 
          status: statusFilter, 
          search 
        } 
      });
      setEarnings(data.earnings || []);
      setSummary(data.summary || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, [period, statusFilter, search]);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const approveEarning = async (id) => {
    setApproving(id);
    try {
      await axiosInstance.patch(`/workforce/earnings/${id}/approve`);
      setEarnings(prev => prev.map(e => e.id === id ? { ...e, status: 'APPROVED' } : e));
      toast.success('Earnings approved for disbursement');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve');
    } finally {
      setApproving(null);
    }
  };

  const handleExport = () => {
    const rows = [
      ['Worker', 'Role', 'Period', 'Base Pay', 'Allowances', 'Bonuses', 'Deductions', 'Total Net', 'Status'],
      ...earnings.map(e => [
        e.worker,
        e.role,
        e.period,
        e.baseEarnings || 0,
        e.totalAllowances || 0,
        e.totalBonuses || 0,
        e.totalDeductions || 0,
        e.netPay || 0,
        e.status
      ])
    ];
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `earnings-${period}.csv`; a.click();
  };

  const roleChartData = summary?.byRole || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Earnings</h1>
          <p className="page-subtitle">
            {canManagePayroll 
              ? `Track and approve payroll records for ${PERIODS.find(p => p.value === period)?.label}`
              : `View your full earnings history and payout status across all periods`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-xs font-black">
            <Download size={13} /> {canManagePayroll ? 'EXPORT CSV' : 'EXPORT HISTORY'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {(isAdmin || isHQ) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Net Payout', value: `KES ${(summary?.totalNet || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 border-l-emerald-500' },
            { label: 'Pending Approval', value: `KES ${(summary?.pendingTotal || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-amber-600 border-l-amber-500' },
            { label: 'Total Workers', value: summary?.workerCount || earnings.length, icon: Users, color: 'text-blue-600 border-l-blue-500' },
          ].map(c => (
            <div key={c.label} className={`bg-white border border-slate-200 border-l-4 rounded-2xl p-6 shadow-sm ${c.color} transition-all hover:shadow-md`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <c.icon size={15} />
                </div>
                <span className="text-[10px] font-black text-slate-400 tracking-widest">{c.label.toUpperCase()}</span>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Role Chart & Filters */}
      {(isAdmin || isHQ) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Earnings Distribution</h3>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                <div className="w-2 h-2 rounded-full bg-primary" /> Net Pay By Role
              </div>
            </div>
            <div className="p-6 h-64">
              {roleChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="role" axisLine={false} tickLine={false} fontSize={10} fontWeight={900} stroke="#64748B" />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={900} stroke="#64748B" tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.02)'}}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Bar dataKey="earnings" fill="#062821" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs opacity-50">
                  No enough data for chart
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 text-white space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Filter size={16} className="text-secondary" />
              <h3 className="text-sm font-black tracking-tight uppercase">Filters</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-widest block mb-2 uppercase">Period</label>
                <select 
                  value={period} 
                  onChange={e => setPeriod(e.target.value)} 
                  className="w-full bg-slate-800 border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/50"
                >
                  {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-widest block mb-1.5 uppercase">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['', 'PENDING', 'APPROVED', 'DISBURSED'].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                        statusFilter === s ? 'bg-secondary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s || 'ALL'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-widest block mb-2 uppercase">Search Worker</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    placeholder="Enter name..." 
                    className="w-full bg-slate-800 border-slate-700 text-white rounded-xl px-10 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/50"
                  />
                </div>
              </div>

              <button
                onClick={fetchEarnings}
                className="w-full py-3 bg-white text-slate-900 font-black text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                APPLY FILTERS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-sm">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <RefreshCw className="animate-spin w-8 h-8 mr-3 opacity-30" />
            <span className="font-bold tracking-widest text-xs">LOADING EARNINGS</span>
          </div>
        ) : earnings.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-black text-slate-900 text-base mb-1">No earnings records</p>
            <p className="text-xs font-bold text-slate-400">Records are generated when payroll is run</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="pl-6">Worker</th>
                  <th>Role</th>
                  <th>Base</th>
                  <th>Allowances</th>
                  <th>Bonuses</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {earnings.map(e => (
                  <tr key={e.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="pl-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                          {e.worker?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-black text-slate-900 uppercase tracking-tight">{e.worker}</span>
                      </div>
                    </td>
                    <td><span className="text-[10px] font-black text-slate-500 uppercase">{e.role}</span></td>
                    <td><span className="font-bold text-slate-700">{(e.baseEarnings || 0).toLocaleString()}</span></td>
                    <td><span className="font-bold text-emerald-600">+{(e.totalAllowances || 0).toLocaleString()}</span></td>
                    <td><span className="font-bold text-blue-600">+{(e.totalBonuses || 0).toLocaleString()}</span></td>
                    <td><span className="font-bold text-rose-600">−{(e.totalDeductions || 0).toLocaleString()}</span></td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900">KES {(e.netPay || 0).toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gross: {(e.grossPay || 0).toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        e.status === 'APPROVED' ? 'badge-approved' : 
                        e.status === 'DISBURSED' ? 'badge-paid' : 
                        'badge-pending'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {canManagePayroll && e.status === 'PENDING_APPROVAL' && (
                          <button 
                            onClick={() => approveEarning(e.id)} 
                            disabled={approving === e.id}
                            className="btn-primary btn-sm px-4 py-1.5 flex items-center gap-2 group-hover:scale-105 transition-transform"
                          >
                            {approving === e.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            APPROVE
                          </button>
                        )}
                        {(e.status === 'APPROVED' || e.status === 'DISBURSED') && (
                          <button 
                            onClick={() => {
                              // Simulate download or call API for receipt
                              toast.info("Generating your earnings receipt...");
                              setTimeout(() => handleExport(), 1000); 
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all"
                            title="Download Receipt"
                          >
                            <ArrowDownToLine size={16} />
                          </button>
                        )}
                        {canManagePayroll && e.status === 'APPROVED' && (
                          <div className="text-emerald-500 px-2 flex items-center gap-1.5 font-black text-[10px] tracking-widest">
                            <CheckCircle2 size={12} /> READY
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
