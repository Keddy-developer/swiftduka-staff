import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Calculator, Play, Users, CheckCircle2, RefreshCw,
  DollarSign, TrendingDown, ArrowRight, FileText, AlertTriangle,
  Zap, Loader2, ArrowRightCircle, History, Trash2, Eye, Archive, ChevronDown, ChevronUp
} from 'lucide-react';

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

const PayrollRun = () => {
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState(PERIODS[0].value);
  const [userId, setUserId] = useState('');
  const [workers, setWorkers] = useState([]);
  const [running, setRunning] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [lastBulkResult, setLastBulkResult] = useState(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  
  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedPeriod, setExpandedPeriod] = useState(null);
  const [periodRecords, setPeriodRecords] = useState({}); // { period: [records] }
  const [loadingPeriodDetails, setLoadingPeriodDetails] = useState(null);

  useEffect(() => {
    setLoadingWorkers(true);
    axiosInstance.get('/workforce/workers', { params: { isActive: true, limit: 1000 } })
      .then(({ data }) => setWorkers(data.workers || []))
      .catch(() => toast.error('Failed to load personnel list'))
      .finally(() => setLoadingWorkers(false));

    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await axiosInstance.get('/workforce/payroll/history');
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadPeriodDetails = async (periodId) => {
    if (periodRecords[periodId]) {
      setExpandedPeriod(expandedPeriod === periodId ? null : periodId);
      return;
    }
    
    setLoadingPeriodDetails(periodId);
    try {
      const { data } = await axiosInstance.get(`/workforce/payroll/history/${periodId}`);
      setPeriodRecords(prev => ({ ...prev, [periodId]: data.records }));
      setExpandedPeriod(periodId);
    } catch (err) {
      toast.error('Failed to load period details');
    } finally {
      setLoadingPeriodDetails(null);
    }
  };

  const revertPeriod = async (periodId) => {
    if (!confirm(`Are you absolutely sure you want to REVERT payroll for ${periodId}? This will delete all generated records (except for those already paid) and allow you to re-run the calculation. This action cannot be undone.`)) return;
    
    try {
      await axiosInstance.delete(`/workforce/payroll/history/${periodId}`);
      toast.success(`Payroll for ${periodId} successfully reverted.`);
      setHistory(prev => prev.filter(h => h.period !== periodId));
      setPeriodRecords(prev => {
        const next = { ...prev };
        delete next[periodId];
        return next;
      });
      if (expandedPeriod === periodId) setExpandedPeriod(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reversion failed');
    }
  };

  const loadPreview = async () => {
    if (!userId) return toast.error('Please select a worker first');
    setPreviewLoading(true);
    setPreview(null);
    try {
      const { data } = await axiosInstance.get('/workforce/payroll/preview', { params: { userId, period } });
      setPreview(data.result);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Calculation preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const runSingle = async () => {
    if (!userId) return toast.error('Please select a worker first');
    setRunning(true);
    try {
      const { data } = await axiosInstance.post('/workforce/payroll/run', { userId, period });
      toast.success(`Payroll record committed for ${period}`);
      setPreview(data.calculation);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payroll commitment failed');
    } finally {
      setRunning(false);
    }
  };

  const runBulk = async () => {
    const periodLabel = PERIODS.find(p => p.value === period)?.label;
    if (!confirm(`CRITICAL ACTION: Run payroll for ALL active personnel for ${periodLabel}? This will generate individual payslip records and update user wallets on approval.`)) return;
    
    setBulkRunning(true);
    try {
      const { data } = await axiosInstance.post('/workforce/payroll/run-bulk', { period });
      setLastBulkResult(data);
      toast.success(`Bulk operation finished: ${data.processed} records generated.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Bulk payroll execution failed');
    } finally {
      setBulkRunning(false);
    }
  };

  const formatKes = (n) => `KES ${(n || 0).toLocaleString()}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-3xl">Payroll Engine</h1>
          <p className="page-subtitle text-slate-400">Computational core for tax compliance and disbursements</p>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Bulk Controller */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Calculator size={160} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Bulk Execution</h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Process Complete Workforce</p>
              </div>
            </div>

            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <div className="flex items-start gap-3 mb-2">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-200">Regulatory Warning</p>
              </div>
              <p className="text-[10px] text-amber-100/60 leading-relaxed font-medium">
                Running bulk payroll triggers the Kenya Revenue Authority (KRA) tax logic, calculating PAYE, NSSF, and SHIF for all eligible staff. Ensure all task rates and base salaries are current before execution.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 block">SELECT SETTLEMENT PERIOD</label>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-slate-800 border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/50">
                  {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <button
                onClick={runBulk}
                disabled={bulkRunning}
                className="w-full py-4 bg-secondary text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/10 disabled:opacity-50 uppercase text-xs tracking-widest active:scale-95"
              >
                {bulkRunning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                {bulkRunning ? 'Processing Workforce...' : 'Launch Bulk Run'}
              </button>
            </div>

            {lastBulkResult && (
              <div className="pt-6 mt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-2xl font-black text-emerald-400 leading-none mb-1">{lastBulkResult.processed}</p>
                  <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase">RECORDS SAVED</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-2xl font-black text-rose-400 leading-none mb-1">{lastBulkResult.errors}</p>
                  <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase">DISCREPANCIES</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Individual Preview Controller */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col">
          <div className="p-8 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Individual Verification</h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Audit Single Personnel Account</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 block">TARGET PERIOD</label>
                <select value={period} onChange={e => { setPeriod(e.target.value); setPreview(null); }} className="form-select border-2 h-14 bg-slate-50 font-black">
                  {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 block">SELECT PERSONNEL</label>
                <select value={userId} onChange={e => { setUserId(e.target.value); setPreview(null); }} className="form-select border-2 h-14 bg-slate-50 font-black">
                  <option value="">— PERSONNEL LIST —</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.firstName} {w.lastName} [{w.role?.[0]?.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={loadPreview}
                disabled={previewLoading || !userId}
                className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest disabled:opacity-30 active:scale-95"
              >
                {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Generate Preview
              </button>
              <button
                onClick={runSingle}
                disabled={running || !userId}
                className="flex-1 py-4 px-6 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 uppercase text-[10px] tracking-widest disabled:opacity-30 active:scale-95"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightCircle size={14} />}
                Commit Record
              </button>
            </div>

            {/* In-Panel Preview Area */}
            {preview && (
              <div className="mt-8 border-2 border-slate-50 rounded-3xl p-6 bg-slate-50/30 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">AUDIT BREAKDOWN</p>
                  <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">{period}</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100/50">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">BASE EARNINGS</span>
                    <span className="font-black text-slate-900">{formatKes(preview.baseEarnings)}</span>
                  </div>
                  
                  {preview.allowances?.length > 0 && preview.allowances.map((a, i) => (
                    <div key={`a-${i}`} className="flex justify-between items-center py-1.5 border-b border-white text-emerald-600">
                      <span className="text-[10px] font-black uppercase tracking-tight flex items-center gap-2"><CheckCircle2 size={12} /> {a.label}</span>
                      <span className="text-xs font-black">+{formatKes(a.amount)}</span>
                    </div>
                  ))}

                  {preview.bonuses?.length > 0 && preview.bonuses.map((b, i) => (
                    <div key={`b-${i}`} className="flex justify-between items-center py-1.5 border-b border-white text-blue-600">
                      <span className="text-[10px] font-black uppercase tracking-tight flex items-center gap-2"><TrendingDown size={12} className="rotate-180" /> {b.label}</span>
                      <span className="text-xs font-black">+{formatKes(b.amount)}</span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center py-4 px-4 bg-white/50 rounded-xl my-4">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">GROSS SALARY</span>
                    <span className="text-xl font-black text-slate-900 tracking-tighter">{formatKes(preview.grossPay)}</span>
                  </div>

                  {preview.deductions?.length > 0 && preview.deductions.map((d, i) => (
                    <div key={`d-${i}`} className="flex justify-between items-center py-1.5 border-b border-white text-rose-600">
                      <span className="text-[10px] font-black uppercase tracking-tight flex items-center gap-2"><TrendingDown size={12} /> {d.label}</span>
                      <span className="text-xs font-black">−{formatKes(d.amount)}</span>
                    </div>
                  ))}

                  <div className="mt-6 p-6 bg-primary rounded-[1.5rem] text-white flex justify-between items-center shadow-2xl">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase mb-1">TOTAL NET PAYABLE</span>
                      <span className="text-3xl font-black tracking-tighter">{formatKes(preview.netPay)}</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                      <CheckCircle2 size={24} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden mb-12">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Generation History</h3>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Audit trail of committed payroll cycles</p>
            </div>
          </div>
          <button 
            onClick={fetchHistory}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
          >
            <RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="p-20 text-center opacity-40">
              <Archive size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-xs font-black tracking-widest uppercase">No payroll records found for any period</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((h) => (
                <div key={h.period} className="group">
                  <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => loadPeriodDetails(h.period)}>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-400 tracking-widest uppercase mb-1">SETTLEMENT</span>
                        <span className="text-lg font-black text-slate-900">{h.period}</span>
                      </div>
                      
                      <div className="h-10 w-px bg-slate-100 hidden sm:block" />
                      
                      <div className="hidden sm:flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">PERSONNEL COUNT</span>
                        <span className="text-sm font-bold text-slate-700">{h.count} Workers</span>
                      </div>

                      <div className="h-10 w-px bg-slate-100 hidden md:block" />

                      <div className="hidden md:flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase text-emerald-500">TOTAL DISBURSABLE (EST)</span>
                        <span className="text-sm font-black text-emerald-600">{formatKes(h.totalNet)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {h.statusCounts.map(sc => (
                          <span 
                            key={sc.status} 
                            className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                              sc.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                              sc.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {sc.status}: {sc.count}
                          </span>
                        ))}
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); loadPeriodDetails(h.period); }}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-slate-400 transition-all shadow-sm"
                      >
                        {loadingPeriodDetails === h.period ? <Loader2 size={16} className="animate-spin" /> : 
                         expandedPeriod === h.period ? <ChevronUp size={16} /> : <Eye size={16} />}
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); revertPeriod(h.period); }}
                        className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        title="Revert Period"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {expandedPeriod === h.period && periodRecords[h.period] && (
                    <div className="bg-slate-50/50 p-6 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Worker</th>
                              <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                              <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross</th>
                              <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Deductions</th>
                              <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest text-primary">Net Pay</th>
                              <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {periodRecords[h.period].map(record => (
                              <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900">{record.user?.firstName} {record.user?.lastName}</span>
                                    <span className="text-[10px] font-medium text-slate-400">{record.user?.phone}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-[10px] font-black uppercase text-slate-500">{record.payType}</td>
                                <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">{formatKes(record.grossPay)}</td>
                                <td className="px-4 py-3 text-right text-xs font-bold text-rose-500">-{formatKes(record.totalDeductions)}</td>
                                <td className="px-4 py-3 text-right text-xs font-black text-primary">{formatKes(record.netPay)}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                    record.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                    record.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollRun;
