import React, { useState } from 'react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { X, Loader2 } from 'lucide-react';

const BonusModal = ({ rule, onClose, onSaved }) => {
  const isEdit = !!rule;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    bonusType: rule?.bonusType || 'FIXED',
    value: rule?.value ?? '',
    taskCountThreshold: rule?.taskCountThreshold ?? '',
    period: rule?.period || 'monthly',
    appliesToRoles: (rule?.appliesToRoles || []).join(', '),
    isActive: rule?.isActive ?? true,
  });

  const set = (field) => (e) => setForm(prev => ({
    ...prev,
    [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.value === '') return toast.error('Name and value are required');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        bonusType: form.bonusType,
        value: parseFloat(form.value),
        taskCountThreshold: form.taskCountThreshold ? parseInt(form.taskCountThreshold) : null,
        period: form.period,
        appliesToRoles: form.appliesToRoles ? form.appliesToRoles.split(',').map(r => r.trim()).filter(Boolean) : [],
        isActive: form.isActive,
      };
      const url = isEdit ? `/workforce/bonuses/${rule.id}` : '/workforce/bonuses';
      const method = isEdit ? 'put' : 'post';
      const { data } = await axiosInstance[method](url, payload);
      toast.success(isEdit ? 'Bonus rule updated' : 'Bonus rule created');
      onSaved(data.rule || { ...payload, id: Date.now().toString() });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-lg">{isEdit ? 'Edit Bonus Rule' : 'New Bonus Rule'}</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">Set bonus conditions and values</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Bonus Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. High-Volume Rider Bonus" className="form-input" required />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className="form-input resize-none" />
          </div>
          <div>
            <label className="form-label">Bonus Type</label>
            <select value={form.bonusType} onChange={set('bonusType')} className="form-select">
              <option value="FIXED">Fixed Amount (KES)</option>
              <option value="PERCENTAGE">Percentage of Earnings (%)</option>
              <option value="TASK_COUNT">Task Count Threshold</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              {form.bonusType === 'TASK_COUNT' && '→ Paid when task count reaches the threshold'}
              {form.bonusType === 'PERCENTAGE' && '→ % of total gross earnings'}
              {form.bonusType === 'FIXED' && '→ Flat amount added to payslip'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">{form.bonusType === 'PERCENTAGE' ? 'Rate (%)' : 'Amount (KES)'} *</label>
              <input type="number" step="0.01" value={form.value} onChange={set('value')} className="form-input" required />
            </div>
            {form.bonusType === 'TASK_COUNT' && (
              <div>
                <label className="form-label">Task Threshold</label>
                <input type="number" value={form.taskCountThreshold} onChange={set('taskCountThreshold')} placeholder="e.g. 50" className="form-input" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Period</label>
              <select value={form.period} onChange={set('period')} className="form-select">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="form-label">Applies to Roles (empty = all)</label>
              <input value={form.appliesToRoles} onChange={set('appliesToRoles')} placeholder="rider, pickup_agent" className="form-input" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-bold text-slate-700">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Bonus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BonusModal;
