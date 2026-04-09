import React, { useState } from 'react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { X, Loader2 } from 'lucide-react';

const DeductionModal = ({ rule, onClose, onSaved }) => {
  const isEdit = !!rule;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    category: rule?.category || 'STATUTORY',
    valueType: rule?.valueType || 'PERCENTAGE',
    value: rule?.value ?? '',
    frequency: rule?.frequency || 'monthly',
    appliesToRoles: (rule?.appliesToRoles || []).join(', '),
    minIncomeThreshold: rule?.minIncomeThreshold ?? '',
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
        category: form.category,
        valueType: form.valueType,
        value: parseFloat(form.value),
        frequency: form.frequency,
        appliesToRoles: form.appliesToRoles ? form.appliesToRoles.split(',').map(r => r.trim()).filter(Boolean) : [],
        minIncomeThreshold: form.minIncomeThreshold ? parseFloat(form.minIncomeThreshold) : null,
        isActive: form.isActive,
      };
      const url = isEdit ? `/workforce/deductions/${rule.id}` : '/workforce/deductions';
      const method = isEdit ? 'put' : 'post';
      const { data } = await axiosInstance[method](url, payload);
      toast.success(isEdit ? 'Deduction rule updated' : 'Deduction rule created');
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
            <h3 className="font-black text-slate-900 text-lg tracking-tight">{isEdit ? 'Edit Deduction' : 'New Deduction Rule'}</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">Configure deduction parameters</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Deduction Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. PAYE, NSSF, SHIF" className="form-input" required />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className="form-input resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Category</label>
              <select value={form.category} onChange={set('category')} className="form-select">
                <option value="STATUTORY">Statutory (mandatory)</option>
                <option value="VOLUNTARY">Voluntary (custom)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Frequency</label>
              <select value={form.frequency} onChange={set('frequency')} className="form-select">
                <option value="monthly">Monthly</option>
                <option value="per_cycle">Per Payroll Cycle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Value Type</label>
              <select value={form.valueType} onChange={set('valueType')} className="form-select">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed (KES)</option>
              </select>
            </div>
            <div>
              <label className="form-label">{form.valueType === 'PERCENTAGE' ? 'Rate (%)' : 'Amount (KES)'} *</label>
              <input type="number" step="0.01" value={form.value} onChange={set('value')} placeholder="e.g. 2.75" className="form-input" required />
            </div>
          </div>

          <div>
            <label className="form-label">Minimum Income Threshold (KES)</label>
            <input type="number" value={form.minIncomeThreshold} onChange={set('minIncomeThreshold')} placeholder="Only apply if gross > this amount" className="form-input" />
          </div>

          <div>
            <label className="form-label">Applies to Roles (comma-separated, empty = all)</label>
            <input value={form.appliesToRoles} onChange={set('appliesToRoles')} placeholder="rider, pickup_agent, hq_staff" className="form-input" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-bold text-slate-700">Active</span>
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeductionModal;
