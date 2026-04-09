import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Calculator, Play, Users, CheckCircle2, RefreshCw,
  DollarSign, TrendingDown, ArrowRight, FileText, AlertTriangle,
  Zap, Loader2, ArrowRightCircle
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

  useEffect(() => {
    setLoadingWorkers(true);
    axiosInstance.get('/workforce/workers', { params: { isActive: true, limit: 1000 } })
      .then(({ data }) => setWorkers(data.workers || []))
      .catch(() => toast.error('Failed to load personnel list'))
      .finally(() => setLoadingWorkers(false));
  }, []);

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
    </div>
  );
};

export default PayrollRun;
