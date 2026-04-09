import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Gift, Plus, Edit3, Trash2, RefreshCw, ToggleLeft, ToggleRight,
  Car, Home, Phone, Shield, Zap
} from 'lucide-react';
import AllowanceModal from '../components/AllowanceModal';

const PRESETS = [
  { name: 'Transport Allowance', description: 'Daily or monthly transport coverage', valueType: 'FIXED', value: 3000, frequency: 'MONTHLY', icon: Car, color: 'bg-blue-50 text-blue-600' },
  { name: 'Housing Allowance', description: 'Monthly housing support for full-time staff', valueType: 'FIXED', value: 5000, frequency: 'MONTHLY', icon: Home, color: 'bg-violet-50 text-violet-600' },
  { name: 'Airtime Allowance', description: 'Monthly airtime for riders and agents', valueType: 'FIXED', value: 500, frequency: 'MONTHLY', icon: Phone, color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Risk Allowance', description: 'Additional pay for riders doing long-distance routes', valueType: 'FIXED', value: 1500, frequency: 'MONTHLY', icon: Shield, color: 'bg-amber-50 text-amber-600' },
];

const freqBadge = (f) => ({
  ONCE: 'bg-slate-50 text-slate-500 border-slate-100',
  WEEKLY: 'bg-blue-50 text-blue-600 border-blue-100',
  MONTHLY: 'bg-emerald-50 text-emerald-600 border-emerald-100',
})[f] || 'bg-slate-50 text-slate-500 border-slate-100';

const Allowances = () => {
  const { isAdmin, isManager } = useAuth();
  const [allowances, setAllowances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editAllowance, setEditAllowance] = useState(null);

  const fetchAllowances = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/workforce/allowances');
      setAllowances(data.allowances || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAllowances(); }, [fetchAllowances]);

  const toggleAllowance = async (a) => {
    try {
      await axiosInstance.put(`/workforce/allowances/${a.id}`, { isActive: !a.isActive });
      setAllowances(prev => prev.map(item => item.id === a.id ? { ...item, isActive: !item.isActive } : item));
      toast.success(`${a.name} ${a.isActive ? 'disabled' : 'enabled'}`);
    } catch { toast.error('Failed to update'); }
  };

  const deleteAllowance = async (id) => {
    if (!confirm('Delete this allowance?')) return;
    try {
      await axiosInstance.delete(`/workforce/allowances/${id}`);
      setAllowances(prev => prev.filter(a => a.id !== id));
      toast.success('Allowance deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const addPreset = async (preset) => {
    try {
      const { data } = await axiosInstance.post('/workforce/allowances', {
        name: preset.name,
        description: preset.description,
        valueType: preset.valueType,
        value: preset.value,
        frequency: preset.frequency,
      });
      setAllowances(prev => [data.allowance, ...prev]);
      toast.success(`${preset.name} added`);
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  const handleSaved = (saved) => {
    if (editAllowance) {
      setAllowances(prev => prev.map(a => a.id === saved.id ? saved : a));
    } else {
      setAllowances(prev => [saved, ...prev]);
    }
    setShowModal(false);
    setEditAllowance(null);
  };

  const totalMonthly = allowances.filter(a => a.isActive && a.frequency === 'MONTHLY')
    .reduce((s, a) => s + (a.valueType === 'FIXED' ? a.value : 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Allowances</h1>
          <p className="page-subtitle">Transport, housing, airtime &amp; risk allowances</p>
        </div>
        {(isAdmin || isManager) && (
          <button onClick={() => { setEditAllowance(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Allowance
          </button>
        )}
      </div>

      {/* Summary pill */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Gift size={14} className="text-emerald-600" />
          <span className="text-xs font-black text-slate-700">{allowances.filter(a => a.isActive).length} active</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-black text-slate-400">Monthly obligation:</span>
          <span className="text-xs font-black text-emerald-700">KES {totalMonthly.toLocaleString()}/worker</span>
        </div>
      </div>

      {/* Preset suggestions (when list is empty) */}
      {(isAdmin || isManager) && allowances.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-black text-blue-900 text-sm mb-4">Start with common allowance presets:</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map(p => (
              <div key={p.name} className="bg-white border border-blue-100 rounded-xl p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${p.color}`}>
                  <p.icon size={16} />
                </div>
                <p className="text-xs font-black text-slate-900 mb-1">{p.name}</p>
                <p className="text-[10px] text-slate-500 mb-3">KES {p.value.toLocaleString()}/{p.frequency.toLowerCase()}</p>
                <button onClick={() => addPreset(p)} className="btn-primary btn-sm w-full text-[10px]">+ Add</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allowances list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm">Configured Allowances</h3>
          <button onClick={fetchAllowances} className="btn-secondary btn-sm flex items-center gap-1.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw className="animate-spin w-5 h-5 mr-2" /> Loading...
          </div>
        ) : allowances.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Gift size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No allowances configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Allowance</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Applies To</th>
                  <th>Status</th>
                  {(isAdmin || isManager) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {allowances.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{a.name}</p>
                        {a.description && <p className="text-xs text-slate-400">{a.description}</p>}
                      </div>
                    </td>
                    <td>
                      <span className="font-black text-slate-900">
                        {a.valueType === 'PERCENTAGE' ? `${a.value}%` : `KES ${a.value.toLocaleString()}`}
                      </span>
                    </td>
                    <td>
                      <span className={`badge border text-[10px] font-black ${freqBadge(a.frequency)}`}>
                        {a.frequency}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {a.appliesToRoles?.length > 0
                          ? a.appliesToRoles.map(r => <span key={r} className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{r}</span>)
                          : <span className="text-[9px] font-bold text-slate-400 italic">All roles</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${a.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {(isAdmin || isManager) && (
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleAllowance(a)} title="Toggle">
                            {a.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-slate-400" />}
                          </button>
                          <button onClick={() => { setEditAllowance(a); setShowModal(true); }} className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => deleteAllowance(a.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AllowanceModal
          allowance={editAllowance}
          onClose={() => { setShowModal(false); setEditAllowance(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default Allowances;
