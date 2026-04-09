import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { X, ClipboardList, User, Loader2 } from 'lucide-react';

const TASK_TYPES = ['pickup', 'packing', 'dispatch', 'delivery'];

const TaskModal = ({ onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState({
    type: 'delivery',
    assignedToId: '',
    orderRef: '',
    amount: '',
    notes: '',
  });

  useEffect(() => {
    axiosInstance.get('/workforce/workers', { params: { isActive: true } })
      .then(({ data }) => setWorkers(data.workers || []))
      .catch(() => {});
  }, []);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assignedToId) return toast.error('Please assign to a worker');
    setSaving(true);
    try {
      const { data } = await axiosInstance.post('/workforce/tasks', form);
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
            <label className="form-label">Task Type *</label>
            <select value={form.type} onChange={set('type')} className="form-select">
              {TASK_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
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
            <label className="form-label">Payout Amount (KES)</label>
            <input type="number" value={form.amount} onChange={set('amount')} placeholder="e.g. 150" className="form-input" />
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
