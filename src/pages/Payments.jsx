import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  CreditCard, Search, RefreshCw, CheckCircle2, XCircle,
  AlertCircle, Phone, Send, Filter, Clock, Download,
  Wallet, ShieldCheck, Loader2, ArrowUpRight
} from 'lucide-react';

const statusIcon = {
  pending: <Clock size={14} className="text-amber-500" />,
  completed: <CheckCircle2 size={14} className="text-emerald-500" />,
  failed: <XCircle size={14} className="text-rose-500" />,
};

const Payments = () => {
  const { canManagePayroll, isAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    totalAmount: 0
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/workforce/payments', { 
        params: { status: statusFilter, search } 
      });
      setPayments(data.payments || []);
      setStats(data.stats || {
        pending: (data.payments || []).filter(p => p.status === 'pending').length,
        completed: (data.payments || []).filter(p => p.status === 'completed').length,
        totalAmount: (data.payments || []).reduce((acc, curr) => acc + curr.amount, 0)
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const triggerPayout = async (payment) => {
    if (!canManagePayroll) return toast.error('Insufficient permissions');
    
    // Safety check for large amounts
    if (payment.amount > 50000 && !confirm(`Confirm disbursement of KES ${payment.amount.toLocaleString()} to ${payment.worker}?`)) return;

    setProcessing(payment.id);
    try {
      const { data } = await axiosInstance.post('/workforce/payments/disburse', {
        paymentId: payment.id,
        workerId: payment.workerId,
        amount: payment.amount,
        phone: payment.phone,
      });
      
      setPayments(prev => prev.map(p =>
        p.id === payment.id ? { ...p, status: 'completed', receipt: data.receipt || 'OK' } : p
      ));
      toast.success(`Disbursement successful for ${payment.worker}`);
      fetchPayments(); // Refresh stats
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment failed. Check M-Pesa API logs.');
    } finally {
      setProcessing(null);
    }
  };

  const handleExport = () => {
    const rows = [
      ['Worker', 'Phone', 'Method', 'Amount', 'Period', 'Receipt', 'Status', 'Date'],
      ...payments.map(p => [
        p.worker, p.phone, p.method, p.amount, p.period, p.receipt || 'N/A', p.status, p.requestedAt
      ])
    ];
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `payments-report.csv`; a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Disbursements</h1>
          <p className="page-subtitle">Manage worker payouts and M-Pesa B2C transfers</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-xs font-black">
          <Download size={13} /> EXPORT HISTORY
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Payouts', value: stats.pending, icon: Clock, color: 'text-amber-500 border-l-amber-500', sub: 'Awaiting action' },
          { label: 'Total Paid Out', value: `KES ${stats.totalAmount.toLocaleString()}`, icon: ShieldCheck, color: 'text-emerald-500 border-l-emerald-500', sub: 'Successfully settled' },
          { label: 'Success Rate', value: stats.completed > 0 ? '100%' : '0%', icon: ArrowUpRight, color: 'text-blue-500 border-l-blue-500', sub: 'API Performance' },
        ].map(c => (
          <div key={c.label} className={`bg-white border border-slate-200 border-l-4 rounded-2xl p-6 shadow-sm ${c.color} transition-all hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <c.icon size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-400 tracking-widest">{c.sub.toUpperCase()}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 tracking-widest mb-1">{c.label.toUpperCase()}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Security Note */}
      {canManagePayroll && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck size={120} />
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Daraja B2C Connector Engaged</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md">Payments are securely processed via Safaricom for instant worker withdrawal. Ensure your B2C utility account has sufficient float balance.</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-white text-slate-900 font-black text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all whitespace-nowrap">
            VIEW API LOGS
          </button>
        </div>
      )}

      {/* Filters + Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by worker name, phone or receipt..." 
              className="w-full bg-white border border-slate-200 rounded-xl px-12 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <div className="flex items-center gap-2">
            {['', 'pending', 'completed', 'failed'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {s || 'ALL'}
              </button>
            ))}
          </div>
          <button onClick={fetchPayments} className="btn-secondary p-3">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 font-black text-xs tracking-widest uppercase opacity-40">
            <Loader2 className="animate-spin w-6 h-6 mr-3" /> Fetching payment ledger
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <CreditCard size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-black text-slate-900 text-base mb-1">Ledger is empty</p>
            <p className="text-xs font-bold text-slate-400">Approved earnings will appear here for disbursement</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="pl-8">Worker Details</th>
                  <th>Payout Channel</th>
                  <th>Settlement Amount</th>
                  <th>Reference</th>
                  <th>Status</th>
                  {canManagePayroll && <th>Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map(p => (
                  <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500">
                          {p.worker?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight">{p.worker}</p>
                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {p.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border-2 ${
                          p.method === 'mpesa' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {p.method === 'mpesa' ? '📱 M-PESA B2C' : '🏦 BANK SETTLEMENT'}
                        </span>
                      </div>
                    </td>
                    <td><span className="font-black text-slate-900 text-lg">KES {(p.amount || 0).toLocaleString()}</span></td>
                    <td>
                      {p.receipt ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded self-start">{p.receipt}</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-1">{p.period || 'GENERAL'}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic font-bold">Unconfirmed</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.status === 'completed' ? 'bg-emerald-500' : p.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-black tracking-widest uppercase text-slate-600">{p.status}</span>
                      </div>
                    </td>
                    {canManagePayroll && (
                      <td>
                        {p.status === 'pending' && (
                          <button
                            onClick={() => triggerPayout(p)}
                            disabled={processing === p.id}
                            className="bg-primary text-white font-black text-[10px] tracking-widest px-4 py-2 rounded-xl shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {processing === p.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            DISBURSE NOW
                          </button>
                        )}
                        {p.status === 'failed' && (
                          <button onClick={() => triggerPayout(p)} className="btn-secondary btn-sm px-4 text-[10px] font-black">
                            RETRY ATTEMPT
                          </button>
                        )}
                      </td>
                    )}
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

export default Payments;
