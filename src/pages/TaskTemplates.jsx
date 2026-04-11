import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { 
  Plus, Search, RefreshCw, X, Edit2, Trash2, 
  Settings, CheckCircle2, QrCode, ClipboardCheck, 
  Clock, ShieldAlert, BarChart, HardDrive
} from 'lucide-react';

const TYPES = ['PICKUP', 'PACKING', 'DISPATCH', 'DELIVERY', 'CUSTOM'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const TaskTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'CUSTOM',
    roleId: '',
    requiresApproval: false,
    requiresQR: false,
    requiresSKU: false,
    priority: 'MEDIUM',
    deadlineHours: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, rRes] = await Promise.all([
        axiosInstance.get('/workforce/templates'),
        axiosInstance.get('/workforce/roles')
      ]);
      setTemplates(tRes.data.templates || []);
      setRoles(rRes.data.roles || []);
    } catch (err) {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (t = null) => {
    if (t) {
      setEditingTemplate(t);
      setForm({
        title: t.title,
        description: t.description || '',
        type: t.type,
        roleId: t.roleId,
        requiresApproval: t.requiresApproval,
        requiresQR: t.requiresQR,
        requiresSKU: t.requiresSKU,
        priority: t.priority,
        deadlineHours: t.deadlineHours || ''
      });
    } else {
      setEditingTemplate(null);
      setForm({
        title: '',
        description: '',
        type: 'CUSTOM',
        roleId: roles[0]?.id || '',
        requiresApproval: false,
        requiresQR: false,
        requiresSKU: false,
        priority: 'MEDIUM',
        deadlineHours: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTemplate) {
        await axiosInstance.put(`/workforce/templates/${editingTemplate.id}`, form);
        toast.success('Template updated');
      } else {
        await axiosInstance.post('/workforce/templates', form);
        toast.success('Template created');
      }
      fetchData();
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('Delete this template? Existing tasks won\'t be affected.')) return;
    try {
      await axiosInstance.delete(`/workforce/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template removed');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Settings className="text-primary" /> Task Templates
          </h1>
          <p className="page-subtitle">Define standardized workflows and security requirements for staff assignments</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="animate-spin mb-4" />
            <span className="text-xs font-black uppercase tracking-widest">Loading definitions...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <HardDrive size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="font-black text-slate-900">No Task Templates Found</p>
            <p className="text-xs font-bold text-slate-400 mt-1">Start by defining a standardized workflow for your staff.</p>
            <button onClick={() => openModal()} className="btn-primary mt-6 mx-auto flex items-center gap-2">
               <Plus size={14} /> Create First Template
            </button>
          </div>
        ) : templates.map(t => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 translate-x-12 -translate-y-12 rounded-full opacity-5 ${
                t.type === 'DELIVERY' ? 'bg-emerald-500' : 
                t.type === 'PICKUP' ? 'bg-blue-500' : 'bg-slate-500'
            }`} />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                t.priority === 'URGENT' ? 'bg-rose-100 text-rose-600' :
                t.priority === 'HIGH' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {t.priority} Priority
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded ml-2 uppercase tracking-widest ${
                !t.hubId ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {!t.hubId ? 'Global HQ' : 'Local Center'}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(t)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => deleteTemplate(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <h3 className="font-black text-slate-900 text-sm mb-1">{t.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 mb-4 line-clamp-2">{t.description || 'No additional instructions provided.'}</p>

            <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 
                    Role: <span className="font-black text-slate-900">{t.role?.name || 'Any'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> 
                    Category: <span className="font-black text-slate-900">{t.type}</span>
                </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-50">
                {t.requiresApproval && (
                   <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center" title="Requires Approval">
                     <ShieldAlert size={14} />
                   </div>
                )}
                {t.requiresQR && (
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center" title="Requires QR Scan">
                     <QrCode size={14} />
                   </div>
                )}
                {t.requiresSKU && (
                   <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center" title="Requires SKU Scan">
                     <BarChart size={14} />
                   </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Template Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 bg-primary text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm tracking-tight">{editingTemplate ? 'Update Workflow' : 'Define Workflow'}</h3>
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-0.5">Task Template Configuration</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white transition-colors">
                 <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-white">
              <div>
                <label className="form-label">Template Title *</label>
                <input 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Standard Doorstep Delivery" 
                  className="form-input" 
                  required 
                />
              </div>

              <div>
                <label className="form-label">Description (Staff Instructions)</label>
                <textarea 
                   value={form.description}
                   onChange={e => setForm({...form, description: e.target.value})}
                   className="form-input min-h-[80px]" 
                   placeholder="Describe what the staff member should do..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Target Role *</label>
                  <select 
                    value={form.roleId} 
                    onChange={e => setForm({...form, roleId: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Task Category *</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({...form, type: e.target.value})}
                    className="form-select"
                    required
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Default Priority</label>
                  <select 
                    value={form.priority} 
                    onChange={e => setForm({...form, priority: e.target.value})}
                    className="form-select"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Deadline (Hours)</label>
                  <input 
                    type="number"
                    value={form.deadlineHours} 
                    onChange={e => setForm({...form, deadlineHours: e.target.value})}
                    className="form-input"
                    placeholder="e.g. 24"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Verification & Security</p>
                 
                 <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input 
                       type="checkbox" 
                       checked={form.requiresApproval}
                       onChange={e => setForm({...form, requiresApproval: e.target.checked})}
                       className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <div>
                        <span className="text-xs font-black text-slate-900 leading-none">Manual Approval</span>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Manager must verify task before completion</p>
                    </div>
                 </label>

                 <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input 
                       type="checkbox" 
                       checked={form.requiresQR}
                       onChange={e => setForm({...form, requiresQR: e.target.checked})}
                       className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <div>
                        <span className="text-xs font-black text-slate-900 leading-none">QR Code Verification</span>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Staff must scan order/hub QR code to complete</p>
                    </div>
                 </label>

                 <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input 
                       type="checkbox" 
                       checked={form.requiresSKU}
                       onChange={e => setForm({...form, requiresSKU: e.target.checked})}
                       className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <div>
                        <span className="text-xs font-black text-slate-900 leading-none">Product SKU Scan</span>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Staff must scan product barcode to verify item</p>
                    </div>
                 </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
                  {editingTemplate ? 'Update Definition' : 'Save Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTemplates;
