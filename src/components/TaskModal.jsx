import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { X, ClipboardList, User, Loader2, Info, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TASK_TYPES = ['pickup', 'packing', 'dispatch', 'delivery'];

const TaskModal = ({ onClose, onSaved }) => {
  const { user, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [templates, setTemplates] = useState([]);
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
            <select value={form.assignedToId} onChange={set('assignedToId')} className="form-select" required>
              <option value="">— Select worker —</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.firstName} {w.lastName} ({w.role?.[0]?.replace('_', ' ')})</option>
              ))}
            </select>
          </div>

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
