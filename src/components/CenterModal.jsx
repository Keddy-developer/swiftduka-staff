import React, { useState } from 'react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { X, Loader2, MapPin } from 'lucide-react';

const CenterModal = ({ center, onClose, onSaved }) => {
  const isEdit = !!center;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: center?.name || '',
    town: center?.town || '',
    county: center?.county || '',
    address: center?.address || '',
    capacity: center?.capacity || 500,
    phone: center?.phone || '',
    email: center?.email || '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.town) return toast.error('Name and town are required');
    setSaving(true);
    try {
      const url = isEdit ? `/delivery/hubs/${center.id}` : '/delivery/hubs';
      const method = isEdit ? 'put' : 'post';
      const { data } = await axiosInstance[method](url, form);
      toast.success(isEdit ? 'Center updated' : 'Center created');
      onSaved(data.hub || { ...form, id: Date.now().toString(), isActive: true, staffCount: 0, activeOrders: 0 });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save center');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-lg tracking-tight">{isEdit ? 'Edit Center' : 'New Fulfillment Center'}</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">Hub location details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Center Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Nairobi Central Hub" className="form-input" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Town *</label>
              <input value={form.town} onChange={set('town')} placeholder="Nairobi" className="form-input" required />
            </div>
            <div>
              <label className="form-label">County</label>
              <input value={form.county} onChange={set('county')} placeholder="Nairobi" className="form-input" />
            </div>
          </div>

          <div>
            <label className="form-label">Address</label>
            <input value={form.address} onChange={set('address')} placeholder="Building, Street, Area" className="form-input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="07XXXXXXXX" className="form-input" />
            </div>
            <div>
              <label className="form-label">Capacity (orders)</label>
              <input type="number" value={form.capacity} onChange={set('capacity')} className="form-input" />
            </div>
          </div>

          <div>
            <label className="form-label">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="hub@ikosoko.com" className="form-input" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Center'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CenterModal;
