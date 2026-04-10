import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Phone, MapPin, Wallet, CheckCircle2, Clock, Edit3, Power,
  CreditCard, History, TrendingUp, RefreshCw, Key, Trash2, FileText,
  Loader2, Calendar
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-primary h-28 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #f59e0b 0%, transparent 60%)' }} />
        </div>
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-slate-700 shrink-0">
              {worker.firstName?.[0]}{worker.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{worker.firstName} {worker.lastName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded ${roleMeta.cls}`}>{roleMeta.label}</span>
                <span className={`badge ${worker.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {worker.isActive ? 'Active' : 'Inactive'}
                </span>
                {worker.email && <span className="text-xs text-slate-400">{worker.email}</span>}
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowEdit(true)} className="btn-secondary btn-sm flex items-center gap-1.5">
                  <Edit3 size={12} /> Edit
                </button>
                <button onClick={() => setShowReset(true)} className="btn-secondary btn-sm flex items-center gap-1.5">
                  <Key size={12} /> Reset Password
                </button>
                <button
                  onClick={toggleActive}
                  disabled={togglingActive}
                  className={`btn-sm flex items-center gap-1.5 ${worker.isActive ? 'btn-danger' : 'btn-success'} disabled:opacity-60`}
                >
                  {togglingActive ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
                  {worker.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Phone, label: 'Phone', value: worker.phone || '—' },
              { icon: MapPin, label: 'Center', value: worker.hubName || 'Unassigned' },
              { 
                icon: CreditCard, 
                label: 'Payment', 
                value: worker.workerProfile?.paymentMethod === 'BANK' 
                  ? `${worker.workerProfile.bankName} · ${worker.workerProfile.accountNumber || '—'}`
                  : `M-PESA · ${worker.workerProfile?.mpesaNumber || '—'}`
              },
            ].map(info => (
              <div key={info.label} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                  <info.icon size={15} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest">{info.label}</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Done', value: worker.tasksCompleted ?? 0, icon: CheckCircle2, color: 'text-blue-600' },
          { label: 'Pending Tasks', value: worker.tasksPending ?? 0, icon: Clock, color: 'text-amber-600' },
          { label: 'Wallet Balance', value: `KES ${(worker.walletBalance || 0).toLocaleString()}`, icon: Wallet, color: 'text-emerald-600' },
          { label: 'Total Earnings', value: `KES ${(worker.totalEarnings || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={15} className={s.color} />
              <span className="text-[10px] font-black text-slate-400 tracking-widest">{s.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{s.value}</p>
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
