import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Phone, MapPin, Wallet, CheckCircle2, Clock, Edit3, Power,
  CreditCard, History, TrendingUp, RefreshCw, Key, Trash2, FileText,
  Loader2, Calendar, ChevronRight
} from 'lucide-react';
import WorkerModal from '../components/WorkerModal';
import ResetPasswordModal from '../components/ResetPasswordModal';

const ROLE_META = {
  admin:               { label: 'Admin',    cls: 'bg-slate-900 text-white' },
  hq_staff:            { label: 'HQ Staff', cls: 'bg-indigo-600 text-white' },
  fulfillment_manager: { label: 'Manager',  cls: 'bg-blue-600 text-white' },
  fulfillment_staff:   { label: 'Staff',    cls: 'bg-cyan-600 text-white' },
  pickup_agent:        { label: 'Agent',    cls: 'bg-amber-500 text-white' },
  rider:               { label: 'Rider',    cls: 'bg-emerald-600 text-white' },
};

const statusBadge = (s) => ({
  completed: 'badge-completed', in_progress: 'badge-in-progress', pending: 'badge-pending',
})[s] || 'badge-pending';

const WorkerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, canManagePayroll } = useAuth();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showEdit, setShowEdit] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [runningPayroll, setRunningPayroll] = useState(false);
  const [payrollPeriod, setPayrollPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payrollResult, setPayrollResult] = useState(null);

  const fetchWorker = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/workforce/workers/${id}`);
      setWorker(data.worker);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load worker');
      navigate('/workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorker(); }, [id]);

  const toggleActive = async () => {
    setTogglingActive(true);
    try {
      await axiosInstance.patch(`/workforce/workers/${worker.id}/status`, { isActive: !worker.isActive });
      setWorker(prev => ({ ...prev, isActive: !prev.isActive }));
      toast.success(`Worker ${worker.isActive ? 'deactivated' : 'activated'}`);
    } catch { toast.error('Failed to update status'); }
    setTogglingActive(false);
  };

  const runPayroll = async () => {
    if (!confirm(`Run payroll for ${worker.firstName} for period ${payrollPeriod}?`)) return;
    setRunningPayroll(true);
    try {
      const { data } = await axiosInstance.post('/workforce/payroll/run', { userId: worker.id, period: payrollPeriod });
      setPayrollResult(data.calculation);
      toast.success('Payroll calculated and saved!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payroll failed');
    } finally {
      setRunningPayroll(false);
    }
  };

  const handleWorkerSaved = (updated) => {
    setWorker(prev => ({ ...prev, ...updated }));
    setShowEdit(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <RefreshCw className="animate-spin w-6 h-6 mr-3" /> Loading worker...
      </div>
    );
  }

  if (!worker) return null;

  const roleMeta = ROLE_META[worker.role?.[0]] || { label: 'Worker', cls: 'bg-slate-500 text-white' };
  const TABS = ['tasks', 'earnings', 'payroll', 'payments'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back */}
      <button onClick={() => navigate('/workers')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold">
        <ArrowLeft size={16} /> Back to Workers
      </button>

      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Cover with Mesh Gradient */}
        <div className="h-32 relative overflow-hidden bg-[#062821]">
          <div className="absolute inset-0 opacity-40" style={{ 
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(20, 184, 166, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)
            `
          }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
        </div>

        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-10 mb-8">
            {/* Avatar Container */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl bg-white p-1 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                <div className="w-full h-full rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl font-black text-slate-800 tracking-tighter shadow-inner">
                  {worker.firstName?.[0]}{worker.lastName?.[0]}
                </div>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${worker.isActive ? 'bg-emerald-500' : 'bg-slate-300'} shadow-lg`} />
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none truncate">
                  {worker.firstName} {worker.lastName}
                </h2>
                <span className={`text-[10px] font-black px-2 mt-1 py-0.5 rounded-full border ${worker.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  {worker.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-[10px] font-black px-3 py-1 rounded-lg shadow-sm ${roleMeta.cls}`}>
                  {roleMeta.label.toUpperCase()}
                </span>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                  <Calendar size={13} className="text-slate-300" />
                  Joined {new Date(worker.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </div>
                {worker.email && (
                   <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                     <div className="w-1 h-1 rounded-full bg-slate-300" />
                     {worker.email}
                   </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {isAdmin && (
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <button onClick={() => setShowEdit(true)} className="btn-secondary px-4 py-2 border-slate-200 hover:border-slate-300 text-slate-700 flex items-center gap-2 rounded-xl text-xs font-black shadow-sm transition-all hover:bg-slate-50">
                  <Edit3 size={14} className="text-slate-400" /> EDIT
                </button>
                <div className="w-px h-8 bg-slate-100 hidden sm:block" />
                <button onClick={() => setShowReset(true)} className="btn-secondary px-4 py-2 border-slate-200 hover:border-slate-300 text-slate-700 flex items-center gap-2 rounded-xl text-xs font-black shadow-sm transition-all hover:bg-slate-50">
                  <Key size={14} className="text-slate-400" /> RESET
                </button>
                <button
                  onClick={toggleActive}
                  disabled={togglingActive}
                  className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-md ${
                    worker.isActive 
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                  } disabled:opacity-50`}
                >
                  {togglingActive ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                  {worker.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                </button>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Phone, label: 'Phone', value: worker.phone || '—', color: 'text-blue-500' },
              { icon: MapPin, label: 'Fulfillment Hub', value: worker.hubName || 'Unassigned', color: 'text-rose-500' },
              { 
                icon: CreditCard, 
                label: 'Payment Channel', 
                color: 'text-emerald-500',
                value: worker.workerProfile?.paymentMethod === 'BANK' 
                  ? `${worker.workerProfile.bankName} · ${worker.workerProfile.accountNumber || '—'}`
                  : `M-PESA · ${worker.workerProfile?.mpesaNumber || '—'}`
              },
            ].map(info => (
              <div key={info.label} className="group flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/80 transition-all hover:bg-white hover:shadow-md hover:border-white">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                  <info.icon size={16} className={info.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{info.label}</p>
                  <p className="text-sm font-black text-slate-900 truncate tracking-tight">{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Tasks Completed', value: worker.tasksCompleted ?? 0, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Pipeline', value: worker.tasksPending ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Wallet Balance', value: `KES ${(worker.walletBalance || 0).toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Life Earnings', value: `KES ${(worker.totalEarnings || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${s.bg} ${s.color} transition-transform group-hover:rotate-6`}>
                <s.icon size={20} />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 flex overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-xs font-black tracking-widest capitalize whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab === 'payroll' ? 'Run Payroll' : tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            worker.recentTasks?.length > 0 ? (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Order Ref</th>
                      <th>Date</th>
                      <th>Payout</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worker.recentTasks.map(task => (
                      <tr key={task.id}>
                        <td><span className="font-bold text-slate-900 capitalize">{task.type}</span></td>
                        <td><span className="text-xs text-slate-500 font-mono">{task.orderRef || '—'}</span></td>
                        <td><span className="text-xs text-slate-500">{task.completedAt ? new Date(task.completedAt).toLocaleDateString() : new Date(task.createdAt).toLocaleDateString()}</span></td>
                        <td><span className="font-bold text-slate-900">KES {(task.payoutAmount || 0).toLocaleString()}</span></td>
                        <td>
                          <span className={`badge ${statusBadge(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No tasks recorded yet</p>
              </div>
            )
          )}

          {/* EARNINGS TAB */}
          {activeTab === 'earnings' && (
            worker.earningsSummary?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {worker.earningsSummary.map(e => (
                  <div key={e.period} className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 tracking-widest mb-2">{e.period.toUpperCase()}</p>
                    <p className="text-2xl font-black text-slate-900">KES {(e.amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 font-bold mt-1">{e.tasks} tasks</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <TrendingUp size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No earnings data yet</p>
              </div>
            )
          )}

          {/* RUN PAYROLL TAB */}
          {activeTab === 'payroll' && canManagePayroll && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="form-label">Pay Period (YYYY-MM)</label>
                  <input
                    type="month"
                    value={payrollPeriod}
                    onChange={e => { setPayrollPeriod(e.target.value); setPayrollResult(null); }}
                    className="form-input w-auto"
                  />
                </div>
                <button
                  onClick={runPayroll}
                  disabled={runningPayroll}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60"
                >
                  {runningPayroll ? <><Loader2 size={14} className="animate-spin" /> Calculating...</> : <><FileText size={14} /> Run Payroll</>}
                </button>
              </div>

              {payrollResult && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <p className="text-xs font-black text-slate-500 tracking-widest">PAYSLIP — {payrollPeriod}</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: 'Base Pay', amount: payrollResult.baseEarnings, type: 'base' },
                      ...( payrollResult.allowances || []).map(a => ({ label: a.label, amount: a.amount, type: 'allowance' })),
                      ...( payrollResult.bonuses || []).map(b => ({ label: b.label, amount: b.amount, type: 'bonus' })),
                      ...( payrollResult.deductions || []).map(d => ({ label: d.label, amount: -d.amount, type: 'deduction' })),
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                        <span className={`text-sm ${item.type === 'deduction' ? 'text-rose-600' : item.type === 'base' ? 'font-black text-slate-900' : 'text-emerald-700'}`}>
                          {item.label}
                        </span>
                        <span className={`font-black ${item.amount < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {item.amount < 0 ? '−' : '+'}KES {Math.abs(item.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="mt-4 p-4 bg-primary rounded-xl text-white flex justify-between items-center">
                      <span className="font-black tracking-widest text-xs text-white/60">NET PAY</span>
                      <span className="text-2xl font-black">KES {(payrollResult.netPay || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            worker.paymentHistory?.length > 0 ? (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Period</th>
                      <th>Receipt</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worker.paymentHistory.map((p, i) => (
                      <tr key={i}>
                        <td><span className="font-black text-slate-900">KES {(p.amount || 0).toLocaleString()}</span></td>
                        <td><span className="text-xs font-bold uppercase">{p.method || 'mpesa'}</span></td>
                        <td><span className="text-xs text-slate-400">{p.period || '—'}</span></td>
                        <td><span className="font-mono text-xs text-emerald-700">{p.receipt || '—'}</span></td>
                        <td><span className="text-xs text-slate-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</span></td>
                        <td><span className={`badge ${p.status === 'completed' ? 'badge-paid' : p.status === 'failed' ? 'badge-rejected' : 'badge-pending'}`}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <History size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No payment history</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <WorkerModal
          worker={worker}
          onClose={() => setShowEdit(false)}
          onSaved={handleWorkerSaved}
        />
      )}

      {/* Reset password modal */}
      {showReset && (
        <ResetPasswordModal
          worker={worker}
          onClose={() => setShowReset(false)}
        />
      )}
    </div>
  );
};

export default WorkerDetail;
