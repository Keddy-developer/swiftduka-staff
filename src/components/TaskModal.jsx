import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { X, ClipboardList, User, Loader2, Info, ArrowUpRight, Search, Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TASK_TYPES = ['pickup', 'packing', 'dispatch', 'delivery'];

const TaskModal = ({ onClose, onSaved }) => {
  const { user, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [form, setForm] = useState({
    type: 'delivery',
    assignedToId: '',
    orderRef: '',
    amount: '',
    notes: '',
    templateId: '',
    hubId: (user?.fulfillmentHubId && user?.fulfillmentHubId !== "") ? user.fulfillmentHubId : null,
  });

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/workforce/workers', { params: { isActive: true } }),
      axiosInstance.get('/workforce/templates')
    ]).then(([resWorkers, resTemplates]) => {
      setWorkers(resWorkers.data.workers || []);
      setTemplates(resTemplates.data.templates || []);
    }).catch(() => {});
  }, []);

  const handleTemplateChange = (e) => {
    const tid = e.target.value;
    const template = templates.find(t => t.id === tid);
    if (template) {
      setForm(prev => ({ 
        ...prev, 
        templateId: tid,
        type: template.type.toLowerCase(),
        notes: template.description || '',
      }));
    } else {
        setForm(prev => ({ ...prev, templateId: tid }));
    }
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assignedToId) return toast.error('Please assign to a worker');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!isAdmin && user?.fulfillmentHubId) {
        payload.hubId = user.fulfillmentHubId;
      }
      
      const { data } = await axiosInstance.post('/workforce/tasks', payload);
      toast.success('Task assigned');
      onSaved(data.task || { ...form, id: Date.now().toString(), status: 'pending', createdAt: new Date().toISOString() });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-lg tracking-tight">Assign Task</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">Create a new task for a worker</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
               <label className="form-label mb-0">Task Template (Apply preset)</label>
               {templates.length === 0 && !isAdmin && (
                  <Link to="/templates" className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-0.5">
                     CREATE TEMPLATES <ArrowUpRight size={10} />
                  </Link>
               )}
            </div>
            <select value={form.templateId} onChange={handleTemplateChange} className={`form-select ${templates.length === 0 ? 'bg-slate-50 border-dashed border-slate-300' : 'bg-slate-50 border-slate-200'}`}>
              <option value="">— No Template (Manual) —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.title} ({t.priority})</option>)}
            </select>
            {templates.length === 0 && (
               <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter flex items-center gap-1">
                  <Info size={10} /> No hub-specific templates found. You can set up presets in Task Config.
               </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="form-label">Task Type *</label>
                <select value={form.type} onChange={set('type')} className="form-select">
                {TASK_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
            </div>
            <div>
                <label className="form-label">Payout (KES)</label>
                <input type="number" value={form.amount} onChange={set('amount')} placeholder="e.g. 150" className="form-input" />
            </div>
          </div>

          <div>
            <label className="form-label">Assign To *</label>
            <button 
              type="button"
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-primary transition-all group"
            >
              {form.assignedToId ? (
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[10px] text-primary">
                      {workers.find(w => w.id === form.assignedToId)?.firstName?.[0]}
                   </div>
                   <span>{workers.find(w => w.id === form.assignedToId)?.firstName} {workers.find(w => w.id === form.assignedToId)?.lastName}</span>
                </div>
              ) : (
                <span className="text-slate-400 font-medium">Search for an employee...</span>
              )}
              <Search size={14} className="text-slate-400 group-hover:text-primary" />
            </button>
          </div>

          {/* Worker Picker Sub-Modal */}
          {showPicker && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                   <h4 className="font-black text-xs text-slate-900 tracking-widest uppercase">Select Employee</h4>
                   <button onClick={() => setShowPicker(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                      <X size={16} />
                   </button>
                </div>
                <div className="p-3 border-b border-slate-100">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                         autoFocus
                         value={workerSearch}
                         onChange={e => setWorkerSearch(e.target.value)}
                         placeholder="Search by name or role..."
                         className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                   {workers
                     .filter(w => 
                        `${w.firstName} ${w.lastName} ${w.role?.[0]}`.toLowerCase().includes(workerSearch.toLowerCase())
                     )
                     .map(w => (
                        <button 
                          key={w.id}
                          type="button"
                          onClick={() => {
                             setForm(prev => ({ ...prev, assignedToId: w.id }));
                             setShowPicker(false);
                             setWorkerSearch('');
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                             form.assignedToId === w.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                 form.assignedToId === w.id ? 'bg-white/20' : 'bg-slate-100'
                              }`}>
                                 {w.firstName?.[0]}{w.lastName?.[0]}
                              </div>
                              <div className="text-left">
                                 <p className="font-black text-sm leading-none">{w.firstName} {w.lastName}</p>
                                 <span className={`text-[9px] font-black uppercase tracking-tighter ${
                                    form.assignedToId === w.id ? 'text-white/60' : 'text-slate-400'
                                 }`}>
                                    {w.role?.[0]?.replace('_', ' ')}
                                 </span>
                              </div>
                           </div>
                           {form.assignedToId === w.id ? <Check size={14} /> : <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />}
                        </button>
                     ))
                   }
                </div>
                {workers.filter(w => `${w.firstName} ${w.lastName} ${w.role?.[0]}`.toLowerCase().includes(workerSearch.toLowerCase())).length === 0 && (
                   <div className="p-8 text-center text-slate-400">
                      <User size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No matching staff</p>
                   </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Order Reference (optional)</label>
            <input value={form.orderRef} onChange={set('orderRef')} placeholder="e.g. ORD-1234" className="form-input" />
          </div>

          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea value={form.notes} onChange={set('notes')} placeholder="Any specific instructions..." rows={3} className="form-input resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
