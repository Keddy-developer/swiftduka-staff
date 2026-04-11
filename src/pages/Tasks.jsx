import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  ClipboardList, Plus, Search, Filter, RefreshCw,
  CheckCircle2, Clock, Loader2, ChevronRight, X, User,
  Calendar, AlertTriangle, ArrowRight, Phone, MessageSquare, MapPin, 
  ExternalLink, ChevronDown, ChevronUp, Package, QrCode, ShieldAlert, Activity as ActivityIcon
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const [expandedTask, setExpandedTask] = useState(null);
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
      setExpandedTask(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search, page]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // QR Scanner Effect
  useEffect(() => {
    let qrScanner = null;
    if (verifyingTask) {
      const timer = setTimeout(async () => {
        try {
          qrScanner = new Html5Qrcode("task-scanner-reader");
          const config = { fps: 10, qrbox: { width: 250, height: 250 } };
          
          await qrScanner.start(
            { facingMode: "environment" }, 
            config,
            (result) => {
              updateStatus(verifyingTask, 'completed', { 
                scannedValue: result, 
                timestamp: new Date().toISOString(),
                method: 'camera'
              });
              qrScanner.stop();
            },
            (errorMessage) => {
              // Silent for per-frame errors
            }
          );
        } catch (err) {
          console.error("Scanner start error:", err);
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        if (qrScanner && qrScanner.isScanning) {
          qrScanner.stop().catch(e => console.error("Scanner stop failed", e));
        }
      };
    }
  }, [verifyingTask]);

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
                  <th>More</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks.map(task => (
                  <React.Fragment key={task.id}>
                  <tr className={`group transition-colors ${expandedTask === task.id ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
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
                        <button 
                            onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                        >
                            {expandedTask === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
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
                  
                  {/* Expanded Rider View */}
                  {expandedTask === task.id && (
                    <tr>
                        <td colSpan={canAssign ? 8 : 7} className="px-6 py-6 bg-slate-50/50 border-y border-slate-100">
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                                {/* Details Card */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        <Package size={14} className="text-primary" />
                                        Task Operations
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-bold">Payout</span>
                                            <span className="text-slate-900 font-black">KES {task.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs space-y-1">
                                            <span className="text-slate-500 font-bold">Items Manifest:</span>
                                            <p className="text-slate-900 font-bold leading-relaxed">{task.metadata?.items || "General Cargo / Manual Assignment"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Card */}
                                {(task.type === 'delivery' || task.metadata) && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {(task.type === 'pickup' && task.metadata?.station) ? <MapPin size={14} className="text-emerald-500" /> : <User size={14} className="text-blue-500" />}
                                            {(task.type === 'pickup' && task.metadata?.station) ? 'Pickup Location' : 'Customer Info'}
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{task.metadata?.station?.name || task.metadata?.customerName || "No Name Provided"}</p>
                                                    <p className="text-[10px] font-bold text-slate-500">{task.metadata?.station?.phone || task.metadata?.customerPhone || "No Phone Number"}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <a 
                                                    href={`tel:${task.metadata?.station?.phone || task.metadata?.customerPhone}`}
                                                    className="flex-1 btn-secondary py-2 flex items-center justify-center gap-2 text-[10px] font-black"
                                                >
                                                    <Phone size={14} /> Call
                                                </a>
                                                <a 
                                                    href={`https://wa.me/${(task.metadata?.station?.phone || task.metadata?.customerPhone)?.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 btn-secondary py-2 flex items-center justify-center gap-2 text-[10px] font-black"
                                                >
                                                    <MessageSquare size={14} /> WhatsApp
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Address Card */}
                                {task.metadata?.address && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                            <MapPin size={14} className="text-rose-500" />
                                            Navigation
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                                                    <MapPin size={16} />
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                                    {task.metadata?.station?.address || task.metadata?.address}
                                                </p>
                                            </div>
                                            
                                            <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.metadata?.station?.address || task.metadata?.address)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full btn-primary py-2 flex items-center justify-center gap-2 text-[10px] font-black shadow-lg shadow-primary/20"
                                            >
                                                <ExternalLink size={14} /> View on Maps
                                            </a>
                                        </div>
                                    </div>
                                )}
                             </div>
                        </td>
                    </tr>
                  )}
                  </React.Fragment>
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
    <div className="modal-overlay !bg-slate-900/90 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && setVerifyingTask(null)}>
       <div className="modal-box max-w-sm w-full shadow-2xl overflow-hidden ring-1 ring-white/10 bg-slate-950 border border-white/5">
          {/* High-Tech Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-white/5">
             <div>
                <h3 className="font-black text-sm tracking-tight flex items-center gap-2">
                   <ShieldAlert className="text-secondary animate-pulse" size={16} />
                   Security Verification
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Logistics Protocol v2.4</p>
             </div>
             <button onClick={() => setVerifyingTask(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <X size={18} />
             </button>
          </div>

          <div className="p-8 space-y-8">
             <div className="flex justify-center flex-col items-center">
                
                {/* 🤳 High-Tech Viewfinder */}
                <div className="relative w-full aspect-square max-w-[240px] bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-inner group">
                   {/* Scanning Beam */}
                   <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary shadow-[0_0_15px_rgba(245,158,11,0.8)] z-30 animate-scan" />
                   
                   {/* Viewfinder Corners */}
                   <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-secondary/50 rounded-tl-lg z-20" />
                   <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-secondary/50 rounded-tr-lg z-20" />
                   <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-secondary/50 rounded-bl-lg z-20" />
                   <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-secondary/50 rounded-br-lg z-20" />

                   {/* Real Scanner Container */}
                   <div id="task-scanner-reader" className="absolute inset-0 z-10 overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover">
                      {/* Html5Qrcode renders video here */}
                   </div>

                   {/* Fallback/Overlay Content */}
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent z-0">
                      <QrCode className="text-secondary/10" size={64} strokeWidth={1} />
                      <div className="flex flex-col items-center">
                         <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                            <span className="text-[10px] font-black text-secondary tracking-widest">CAMERA_ACTIVE</span>
                         </div>
                      </div>
                   </div>

                   {/* Overlay Text */}
                   <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Position QR in frame</span>
                   </div>
                </div>

                <div className="w-full mt-8 space-y-4">
                   <div className="text-center">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">
                          {verifyingTask.template?.requiresQR ? 'SCAN ORDER QR CODE' : 'SCAN PRODUCT SKU'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold italic">Verification required: {verifyingTask.orderRef || 'MANUAL_TASK'}</p>
                   </div>

                   <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-blue-600 rounded-xl blur opacity-10 group-focus-within:opacity-25 transition duration-1000 group-focus-within:duration-200" />
                      <input 
                         autoFocus
                         placeholder={verifyingTask.template?.requiresQR ? 'Enter scanned QR string...' : 'Enter scanned SKU...'} 
                         className="relative w-full bg-slate-900 border border-white/10 rounded-xl py-4 text-center text-sm font-black text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-secondary/50 transition-all uppercase tracking-widest"
                         onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                               if (!e.target.value) return toast.warning("Value required for verification");
                               updateStatus(verifyingTask, 'completed', { 
                                  scannedValue: e.target.value, 
                                  timestamp: new Date().toISOString() 
                               });
                            }
                         }}
                      />
                   </div>
                   <p className="text-[9px] text-center font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                       <span className="w-8 h-[1px] bg-slate-800" />
                       Simulation Mode
                       <span className="w-8 h-[1px] bg-slate-800" />
                   </p>
                </div>
             </div>

             <div className="flex gap-3">
                <button 
                  onClick={() => setVerifyingTask(null)}
                  className="flex-1 py-3 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                   Cancel Verification
                </button>
             </div>
          </div>
       </div>
    </div>
  )}

    </div>
  );
};

export default Tasks;
