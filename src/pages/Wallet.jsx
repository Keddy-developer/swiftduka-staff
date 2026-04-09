import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Wallet, TrendingUp, ArrowDownToLine, Clock, CheckCircle2,
  RefreshCw, Send, History, DollarSign, Loader2, AlertCircle,
  XCircle, Zap
} from 'lucide-react';

const WalletPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    wallet: {
      balance: 0,
      pendingWithdrawal: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
    },
    withdrawals: []
  });
  const [loading, setLoading] = useState(true);
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/workforce/wallet/me');
      setData(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to sync wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const requestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmt);
    if (!amount || amount < 100) return toast.error('Minimum withdrawal is KES 100');
    if (amount > data.wallet.balance) return toast.error('Insufficient funds');
    
    setRequesting(true);
    try {
      await axiosInstance.post('/workforce/wallet/withdraw', { amount });
      toast.success('Withdrawal request submitted for processing!');
      setWithdrawAmt('');
      setShowForm(false);
      fetchWallet(); // Refresh data
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Withdrawal request failed');
    } finally {
      setRequesting(false);
    }
  };

  if (loading && !data.wallet.balance) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 space-y-4">
        <Loader2 className="animate-spin w-10 h-10 opacity-30" />
        <span className="font-black tracking-widest text-xs">ENCRYPTED WALLET SYNCING...</span>
      </div>
    );
  }

  const { wallet, withdrawals } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Wallet</h1>
          <p className="page-subtitle">Personal earnings and instant payout history</p>
        </div>
        <button onClick={fetchWallet} disabled={loading} className="btn-secondary flex items-center gap-2 font-black text-[10px] tracking-widest">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> REFRESH BALANCE
        </button>
      </div>

      {/* Main balance card - High Contrast Design */}
      <div className="bg-[#062821] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
        {/* Modern Glassmorphic background elements */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20px] left-[10%] w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                <Zap size={20} className="text-secondary" />
              </div>
              <span className="text-xs font-black text-white/40 tracking-[0.2em] uppercase">Universal Payout Wallet</span>
            </div>
            
            <p className="text-[10px] font-black text-white/30 tracking-widest mb-2 uppercase">AVAILABLE FOR WITHDRAWAL</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white/40">KES</span>
              <p className="text-6xl font-black tracking-tighter leading-none">{(wallet.balance || 0).toLocaleString()}</p>
            </div>
            
            <div className="mt-8 flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/30 tracking-widest uppercase mb-1">Pending</span>
                <span className="text-sm font-black text-amber-500">KES {(wallet.pendingWithdrawal || 0).toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/30 tracking-widest uppercase mb-1">M-Pesa Verified</span>
                <span className="text-sm font-black text-emerald-500">ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-4 bg-secondary text-white font-black rounded-2xl text-xs tracking-widest hover:bg-secondary/90 transition-all shadow-[0_15px_30px_-5px_rgba(245,158,11,0.3)] flex items-center justify-center gap-3 uppercase active:scale-95"
            >
              <ArrowDownToLine size={16} /> Request Withdrawal
            </button>
            <p className="text-[9px] text-center text-white/20 font-bold uppercase tracking-widest">Instant processing up to 30K/day</p>
          </div>
        </div>
      </div>

      {/* Withdrawal request form - Contextual */}
      {showForm && (
        <div className="bg-white border-2 border-primary/5 rounded-[2rem] p-8 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <h3 className="font-black text-slate-900 text-lg mb-2">Initialize Withdrawal</h3>
          <p className="text-xs font-bold text-slate-400 mb-6">Funds will be sent instantly to your registered M-Pesa line.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">KES</div>
                <input
                  type="number"
                  min="100"
                  max={wallet.balance}
                  value={withdrawAmt}
                  onChange={e => setWithdrawAmt(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-5 py-4 text-xl font-black text-slate-900 outline-none focus:border-secondary transition-all"
                />
              </div>
              <div className="mt-3 flex justify-between items-center px-2">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">MIN: KES 100</p>
                <button 
                  onClick={() => setWithdrawAmt(wallet.balance.toString())}
                  className="text-[10px] text-secondary font-black uppercase tracking-widest hover:underline"
                >
                  USE FULL BALANCE
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={requestWithdrawal}
                disabled={requesting || !withdrawAmt}
                className="flex-1 sm:flex-none btn-primary px-8 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg"
              >
                {requesting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                Send Request
              </button>
              <button 
                onClick={() => setShowForm(false)} 
                className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all font-black"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Cumulative Earnings', value: `KES ${(wallet.totalEarned || 0).toLocaleString()}`, icon: TrendingUp, color: 'emerald', sub: 'Lifetime Gross' },
          { label: 'Settled to Wallet', value: `KES ${(wallet.totalWithdrawn || 0).toLocaleString()}`, icon: DollarSign, color: 'blue', sub: 'Processed Payouts' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm flex items-center gap-5 group hover:border-slate-300 transition-colors">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-${s.color}-50 text-${s.color}-600 group-hover:scale-110`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* History Ledger */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <History size={16} className="text-slate-500" />
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Financial Ledger</h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase bg-slate-50 px-3 py-1 rounded-full">{withdrawals.length} TRANSACTIONS</span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <div className="mb-6 relative mx-auto w-24 h-24 flex items-center justify-center opacity-10">
              <Wallet size={80} />
              <Clock className="absolute top-0 right-0" size={32} />
            </div>
            <p className="font-black text-slate-900 text-base mb-1">Ledger is empty</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No payout history recorded on this account</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {withdrawals.map(w => (
              <div key={w.id} className="flex items-center gap-6 p-6 hover:bg-slate-50/50 transition-colors group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${w.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : w.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                  {w.status === 'completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-base tracking-tight mb-0.5">KES {(w.amount || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    Request ID: {w.id.slice(-8).toUpperCase()} • {new Date(w.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase shadow-sm border ${
                    w.status === 'completed' ? 'bg-emerald-600 text-white border-emerald-500' : 
                    w.status === 'pending' ? 'bg-amber-500 text-white border-amber-400' : 
                    'bg-rose-600 text-white border-rose-500'
                  }`}>
                    {w.status}
                  </span>
                  {w.receipt && (
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <Zap size={10} className="text-emerald-500" />
                      <p className="text-[11px] font-black font-mono text-emerald-600 uppercase">{w.receipt}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-300 flex items-start gap-4">
        <AlertCircle size={20} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
          Security Protocol: Instant payouts are limited to KES 30,000 per 24-hour cycle. Larger withdrawal requests may undergo manual administrative review (12-24 hours). Ensure your M-Pesa account limit can accommodate the incoming transfer.
        </p>
      </div>
    </div>
  );
};

export default WalletPage;
