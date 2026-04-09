import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { X, User, Phone, Mail, MapPin, CreditCard, Loader2, DollarSign, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'hq_staff', label: 'HQ Staff' },
  { value: 'fulfillment_manager', label: 'Fulfillment Manager' },
  { value: 'fulfillment_staff', label: 'Fulfillment Staff' },
  { value: 'pickup_agent', label: 'Pickup Agent' },
  { value: 'rider', label: 'Rider' },
];

const PAY_TYPES = [
  { value: 'TASK_BASED', label: 'Task Based (Pay per delivery)' },
  { value: 'MONTHLY', label: 'Monthly (Fixed Salary)' },
  { value: 'HYBRID', label: 'Hybrid (Salary + Tasks)' },
];

const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-Pesa B2C' },
  { value: 'bank', label: 'Bank Transfer' },
];

const WorkerModal = ({ worker, onClose, onSaved }) => {
  const isEdit = !!worker;
  const [saving, setSaving] = useState(false);
  const [hubs, setHubs] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [form, setForm] = useState({
    firstName: worker?.firstName || '',
    lastName: worker?.lastName || '',
    phone: worker?.phone || '',
    email: worker?.email || '',
    role: worker?.role?.[0] || 'rider',
    fulfillmentHubId: worker?.fulfillmentHubId || '',
    // Payroll & ID fields
    payType: worker?.payType || 'TASK_BASED',
    baseSalary: worker?.baseSalary || '',
    taskRate: worker?.taskRate || '',
    nationalId: worker?.nationalId || '',
    kraPin: worker?.kraPin || '',
    isEligibleForStatutory: worker?.isEligibleForStatutory !== undefined ? worker.isEligibleForStatutory : true,
    // Payment
    paymentType: worker?.paymentMethod?.type || 'mpesa',
    mpesaNumber: worker?.paymentMethod?.mpesaNumber || '',
    password: '',
  });

  useEffect(() => {
    axiosInstance.get('/delivery/hubs')
      .then(({ data }) => setHubs(data.hubs || []))
      .catch(() => {});
  }, []);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.phone || !form.role) return toast.error('Name, phone, and role are required');
    
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        role: [form.role],
        fulfillmentHubId: form.fulfillmentHubId || null,
        // Payroll
        payType: form.payType,
        baseSalary: form.baseSalary ? parseFloat(form.baseSalary) : 0,
        taskRate: form.taskRate ? parseFloat(form.taskRate) : 0,
        nationalId: form.nationalId,
        kraPin: form.kraPin,
        isEligibleForStatutory: form.isEligibleForStatutory,
        // Payment
        paymentMethod: { type: form.paymentType, mpesaNumber: form.mpesaNumber },
      };
      
      if (!isEdit) payload.password = form.password || '12345678';

      const url = isEdit ? `/workforce/workers/${worker.id}` : '/workforce/workers';
      const method = isEdit ? 'put' : 'post';
      const { data } = await axiosInstance[method](url, payload);
      
      toast.success(isEdit ? 'Worker record updated' : 'New worker registered');
      onSaved(data.worker);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save worker');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-2xl w-full mx-4 overflow-hidden rounded-[2rem]">
        {/* Header */}
        <div className="bg-primary p-8 text-white relative">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="font-black text-2xl tracking-tight">{isEdit ? 'Update Personnel' : 'Register New Personnel'}</h3>
              <p className="text-white/40 text-[10px] font-black tracking-[0.2em] uppercase mt-1">Workforce & Payroll Engine</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {[
            { id: 'profile', label: 'Basic Info', icon: User },
            { id: 'payroll', label: 'Payroll & ID', icon: DollarSign },
            { id: 'payment', label: 'Disbursement', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all border-b-2 ${
                activeTab === tab.id ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
          <div className="p-8 space-y-6">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name *</label>
                    <input value={form.firstName} onChange={set('firstName')} placeholder="e.g. James" className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input value={form.lastName} onChange={set('lastName')} placeholder="e.g. Mwangi" className="form-input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Phone Number *</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input value={form.phone} onChange={set('phone')} placeholder="07XXXXXXXX" className="form-input pl-11" required />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Work Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input type="email" value={form.email} onChange={set('email')} placeholder="worker@ikosoko.com" className="form-input pl-11" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Assigned Role *</label>
                    <select value={form.role} onChange={set('role')} className="form-select border-2">
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Operations Center</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select value={form.fulfillmentHubId} onChange={set('fulfillmentHubId')} className="form-select pl-11 border-2">
                        <option value="">— Field (Unassigned) —</option>
                        {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {!isEdit && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="form-label">System Access Password</label>
                    <input type="password" value={form.password} onChange={set('password')} placeholder="Default: 12345678" className="form-input" />
                    <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">Worker will be prompted to change this</p>
                  </div>
                )}
              </div>
            )}

            {/* PAYROLL TAB */}
            {activeTab === 'payroll' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <DollarSign className="text-blue-500 mt-1" size={20} />
                  <div>
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Compensation Logic</h4>
                    <p className="text-[10px] text-blue-700 font-bold leading-relaxed">Choose how this worker is paid. Task-based workers earn only per delivery/pickup, while monthly staff have a fixed base salary.</p>
                  </div>
                </div>

                <div>
                  <label className="form-label">Pay Structure</label>
                  <select value={form.payType} onChange={set('payType')} className="form-select border-2 font-black">
                    {PAY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Base Salary (KES/mo)</label>
                    <input 
                      type="number" 
                      value={form.baseSalary} 
                      onChange={set('baseSalary')} 
                      disabled={form.payType === 'TASK_BASED'}
                      placeholder="0.00" 
                      className="form-input disabled:bg-slate-50 disabled:text-slate-400 font-black" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Task Rate (KES/task)</label>
                    <input 
                      type="number" 
                      value={form.taskRate} 
                      onChange={set('taskRate')} 
                      disabled={form.payType === 'MONTHLY'}
                      placeholder="e.g. 150" 
                      className="form-input disabled:bg-slate-50 disabled:text-slate-400 font-black" 
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-4">Identification & Compliance</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">National ID Number</label>
                      <input value={form.nationalId} onChange={set('nationalId')} placeholder="ID Card No" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">KRA PIN Number</label>
                      <input value={form.kraPin} onChange={set('kraPin')} placeholder="A00XXXXXXXX" className="form-input uppercase" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <input 
                      type="checkbox" 
                      id="statutory"
                      checked={form.isEligibleForStatutory} 
                      onChange={set('isEligibleForStatutory')} 
                      className="w-5 h-5 rounded border-2 border-slate-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="statutory" className="text-xs font-black text-slate-900 cursor-pointer uppercase tracking-tight">Deduct PAYE, NSSF & SHIF</label>
                      <p className="text-[10px] font-bold text-slate-400">If unchecked, worker receives Gross Pay without local tax cuts</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT TAB */}
            {activeTab === 'payment' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="p-8 border-2 border-emerald-100 bg-emerald-50/30 rounded-3xl flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h4 className="text-base font-black text-emerald-900 tracking-tight mb-2 uppercase">Verified Settlement Channel</h4>
                  <p className="text-xs text-emerald-700 font-bold max-w-sm">Payments will be disbursed automatically to this channel when payroll is approved.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Primary Method</label>
                    <select value={form.paymentType} onChange={set('paymentType')} className="form-select border-2">
                      {PAYMENT_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  {form.paymentType === 'mpesa' && (
                    <div>
                      <label className="form-label">M-Pesa B2C Number</label>
                      <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={form.mpesaNumber} onChange={set('mpesaNumber')} placeholder="07XXXXXXXX" className="form-input pl-11 font-black" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button type="button" onClick={onClose} className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-slate-600">
              Discard Changes
            </button>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => {
                  const tabs = ['profile', 'payroll', 'payment'];
                  const cur = tabs.indexOf(activeTab);
                  setActiveTab(tabs[(cur + 1) % tabs.length]);
                }} 
                className="btn-secondary btn-sm px-6 font-black tracking-widest text-[10px]"
              >
                NEXT SECTION
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="bg-primary text-white px-8 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {isEdit ? 'Save PERSONNEL RECORD' : 'COMMIT REGISTRATION'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerModal;
