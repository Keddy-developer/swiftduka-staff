import React, { useState } from 'react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { X, Loader2 } from 'lucide-react';

const AllowanceModal = ({ allowance, onClose, onSaved }) => {
  const isEdit = !!allowance;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: allowance?.name || '',
    description: allowance?.description || '',
    valueType: allowance?.valueType || 'FIXED',
    value: allowance?.value ?? '',
    frequency: allowance?.frequency || 'MONTHLY',
    appliesToRoles: (allowance?.appliesToRoles || []).join(', '),
    appliesToHubs: (allowance?.appliesToHubs || []).join(', '),
    isActive: allowance?.isActive ?? true,
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
        valueType: form.valueType,
        value: parseFloat(form.value),
        frequency: form.frequency,
        appliesToRoles: form.appliesToRoles ? form.appliesToRoles.split(',').map(r => r.trim()).filter(Boolean) : [],
        appliesToHubs: form.appliesToHubs ? form.appliesToHubs.split(',').map(h => h.trim()).filter(Boolean) : [],
        isActive: form.isActive,
      };
      const url = isEdit ? `/workforce/allowances/${allowance.id}` : '/workforce/allowances';
      const method = isEdit ? 'put' : 'post';
      const { data } = await axiosInstance[method](url, payload);
      toast.success(isEdit ? 'Allowance updated' : 'Allowance created');
      onSaved(data.allowance || { ...payload, id: Date.now().toString() });
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
            <h3 className="font-black text-slate-900 text-lg">{isEdit ? 'Edit Allowance' : 'New Allowance'}</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">Configure allowance details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Allowance Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Transport Allowance" className="form-input" required />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className="form-input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Type</label>
              <select value={form.valueType} onChange={set('valueType')} className="form-select">
                <option value="FIXED">Fixed (KES)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="form-label">{form.valueType === 'PERCENTAGE' ? 'Rate (%)' : 'Amount (KES)'} *</label>
              <input type="number" step="0.01" value={form.value} onChange={set('value')} className="form-input" required />
            </div>
          </div>
          <div>
            <label className="form-label">Frequency</label>
            <select value={form.frequency} onChange={set('frequency')} className="form-select">
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="ONCE">One-Time</option>
            </select>
          </div>
          <div>
            <label className="form-label">Applies to Roles (comma-separated, empty = all)</label>
            <input value={form.appliesToRoles} onChange={set('appliesToRoles')} placeholder="rider, pickup_agent" className="form-input" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-bold text-slate-700">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Allowance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllowanceModal;
