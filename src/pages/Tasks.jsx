import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  ClipboardList, Plus, Search, Filter, RefreshCw,
  CheckCircle2, Clock, Loader2, ChevronRight, X, User,
  Calendar, AlertTriangle, ArrowRight
} from 'lucide-react';
import TaskModal from '../components/TaskModal';

const STATUS_OPTS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const TYPE_OPTS = [
  { value: '', label: 'All Types' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'packing', label: 'Packing' },
  { value: 'dispatch', label: 'Dispatch' },
  { value: 'delivery', label: 'Delivery' },
];

const statusBadgeClass = (s) => {
  if (s === 'completed') return 'badge-completed';
  if (s === 'in_progress') return 'badge-in-progress';
  return 'badge-pending';
};

const Tasks = () => {
  const { isAdmin, isManager, isHQ, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [verifyingTask, setVerifyingTask] = useState(null);
  const LIMIT = 50;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;
      
      const { data } = await axiosInstance.get('/workforce/tasks', { params });
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search, page]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateStatus = async (task, newStatus, verificationData = null) => {
    try {
      await axiosInstance.patch(`/workforce/tasks/${task.id}/status`, { 
        status: newStatus,
        verificationData
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
      if (verifyingTask) setVerifyingTask(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update task');
    }
  };

  const totals = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const canAssign = isAdmin || isManager || isHQ;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{total} tasks tracked · Pickups, packing, dispatch &amp; deliveries</p>
        </div>
        {canAssign && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Assign Task
          </button>
        )}
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Pending', count: totals.pending, cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
          { label: 'In Progress', count: totals.in_progress, cls: 'bg-violet-50 text-violet-700 border-violet-200', icon: Loader2 },
          { label: 'Completed', count: totals.completed, cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
        ].map(item => (
          <div key={item.label} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm shadow-sm ${item.cls}`}>
            <item.icon size={14} className={item.label === 'In Progress' ? 'animate-spin-slow' : ''} />
            <span>{item.count} {item.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        {canAssign && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order ref or worker name..."
              className="form-input pl-9"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        )}
        {!canAssign && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order ref..."
              className="form-input pl-9"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        )}
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="form-select w-auto">
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="form-select w-auto">
          {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={fetchTasks} className="btn-secondary flex items-center gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <RefreshCw className="animate-spin w-8 h-8 mr-3 opacity-30" />
            <span className="font-bold tracking-widest text-xs">LOADING TASKS</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-black text-slate-900 text-base mb-1">No tasks found</p>
            <p className="text-xs font-bold text-slate-400">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="pl-6">Order Ref</th>
                  <th>Type</th>
                  {canAssign && <th>Assigned To</th>}
                  <th>Payout</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks.map(task => (
                  <tr key={task.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="pl-6">
                      <span className="font-mono text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {task.orderRef || 'MANUAL'}
                      </span>
                    </td>
                    <td>
                      <span className="capitalize text-[10px] font-black tracking-tight text-slate-700 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        {task.type}
                      </span>
                    </td>
                    {canAssign && (
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center font-black text-[10px] text-primary">
                            {task.assignedTo?.split(' ').map(n => n[0]).join('') || '?'}
                          </div>
                          <span className="font-black text-slate-900">{task.assignedTo || 'Unassigned'}</span>
                        </div>
                      </td>
                    )}
                    <td>
                      <span className="font-black text-slate-900">KES {(task.payoutAmount || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{new Date(task.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className={`badge ${statusBadgeClass(task.status)} group-hover:scale-105 transition-transform`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.status === 'completed' && task.efficiencyScore && (
                           <span className="text-[10px] font-black text-emerald-600 mt-1 uppercase tracking-tighter">
                              {Math.round(task.efficiencyScore)}% Efficiency
                           </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => {
                                if (task.status === 'in_progress' && (task.template?.requiresQR || task.template?.requiresSKU)) {
                                    setVerifyingTask(task);
                                } else {
                                    updateStatus(task, task.status === 'pending' ? 'in_progress' : 'completed');
                                }
                            }}
                            className={`btn-sm flex items-center gap-1.5 text-[10px] font-black border-2 transition-all ${
                              task.status === 'pending' 
                                ? 'border-primary text-primary hover:bg-primary hover:text-white' 
                                : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            {task.status === 'pending' ? 'START' : 'VERIFY & DONE'}
                            <ArrowRight size={10} />
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={16} />
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

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400">Showing {(page-1)*LIMIT + 1} to {Math.min(page*LIMIT, total)} of {total} tasks</p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)} 
              className="btn-secondary btn-sm flex items-center gap-2 disabled:opacity-40"
            >
              Previous
            </button>
            <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-700">
              {page}
            </div>
            <button 
              disabled={page >= Math.ceil(total / LIMIT)} 
              onClick={() => setPage(p => p + 1)} 
              className="btn-secondary btn-sm flex items-center gap-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <TaskModal 
          onClose={() => setShowModal(false)} 
          onSaved={(t) => { fetchTasks(); setShowModal(false); }} 
        />
      )}

      {/* Verification Flow Modal */}
      {verifyingTask && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setVerifyingTask(null)}>
           <div className="modal-box max-w-sm w-full shadow-2xl overflow-hidden ring-1 ring-slate-200">
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                 <div>
                    <h3 className="font-black text-sm tracking-tight">Security Verification</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Validate action before completion</p>
                 </div>
                 <button onClick={() => setVerifyingTask(null)} className="text-slate-400 hover:text-white transition-colors">
                    <X size={18} />
                 </button>
              </div>
              <div className="p-6 space-y-6">
                 <div className="flex justify-center flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 relative overflow-hidden group">
                       <Activity className="animate-pulse" size={32} />
                       <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[9px] font-black text-primary">SCANNIG...</span>
                       </div>
                    </div>
                    <p className="text-xs font-black text-slate-900 mt-4">
                        {verifyingTask.template?.requiresQR ? 'SCAN ORDER QR CODE' : 'SCAN PRODUCT SKU'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 mb-6">Position document or product in frame</p>

                    <div className="w-full space-y-2">
                       <input 
                          autoFocus
                          placeholder={verifyingTask.template?.requiresQR ? 'Enter scanned QR string...' : 'Enter scanned SKU...'} 
                          className="form-input text-center text-xs font-black border-2 border-primary/20 focus:border-primary"
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                                updateStatus(verifyingTask, 'completed', { 
                                   scannedValue: e.target.value, 
                                   timestamp: new Date().toISOString() 
                                });
                             }
                          }}
                       />
                       <p className="text-[8px] text-center font-bold text-slate-400 uppercase tracking-widest">Simulation: Type value & Press Enter</p>
                    </div>
                 </div>

                 <button 
                  onClick={() => setVerifyingTask(null)}
                  className="w-full btn-secondary py-3 text-[10px] font-black tracking-widest uppercase"
                 >
                    Cancel Verification
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
