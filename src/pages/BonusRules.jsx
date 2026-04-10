import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Star, Plus, Edit3, Trash2, RefreshCw, ToggleLeft, ToggleRight,
  Zap, Target, TrendingUp
} from 'lucide-react';
import BonusModal from '../components/BonusModal';

const BONUS_TYPE_META = {
  TASK_COUNT: { label: 'Task Count', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Target },
  FIXED: { label: 'Fixed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: Star },
  PERCENTAGE: { label: '% Bonus', color: 'bg-violet-50 text-violet-700 border-violet-100', icon: TrendingUp },
};

const PRESETS = [
  { name: 'High-Volume Rider Bonus', description: 'Bonus for riders completing >50 deliveries/week', bonusType: 'TASK_COUNT', value: 500, taskCountThreshold: 50, period: 'weekly', appliesToRoles: ['rider'] },
  { name: 'Monthly Performance Bonus', description: 'Monthly bonus for all staff', bonusType: 'FIXED', value: 2000, period: 'monthly', appliesToRoles: [] },
  { name: 'Agent Milestone Bonus', description: 'Bonus for pickup agents completing >100 pickups/month', bonusType: 'TASK_COUNT', value: 1000, taskCountThreshold: 100, period: 'monthly', appliesToRoles: ['pickup_agent'] },
  { name: 'End-of-Month % Bonus', description: '5% of monthly earnings for all active workers', bonusType: 'PERCENTAGE', value: 5, period: 'monthly', appliesToRoles: [] },
];

const BonusRules = () => {
  const { isAdmin, isManager } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/workforce/bonuses');
      setRules(data.rules || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const toggleRule = async (rule) => {
    try {
      await axiosInstance.put(`/workforce/bonuses/${rule.id}`, { isActive: !rule.isActive });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
      toast.success(`${rule.name} ${rule.isActive ? 'disabled' : 'enabled'}`);
    } catch { toast.error('Failed to update'); }
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this bonus rule?')) return;
    try {
      await axiosInstance.delete(`/workforce/bonuses/${id}`);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Bonus rule deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const addPreset = async (preset) => {
    try {
      const { data } = await axiosInstance.post('/workforce/bonuses', preset);
      setRules(prev => [data.rule, ...prev]);
      toast.success(`${preset.name} added`);
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  const handleSaved = (saved) => {
    if (editRule) {
      setRules(prev => prev.map(r => r.id === saved.id ? saved : r));
    } else {
      setRules(prev => [saved, ...prev]);
    }
    setShowModal(false);
    setEditRule(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Bonus Rules</h1>
          <p className="page-subtitle">Performance-based, fixed &amp; percentage bonuses</p>
        </div>
        {(isAdmin || isManager) && (
          <button onClick={() => { setEditRule(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Bonus
          </button>
        )}
      </div>

      {/* Preset suggestions */}
      {(isAdmin || isManager) && PRESETS.filter(p => !rules.some(r => r.name === p.name)).length > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
          <h3 className="font-black text-violet-900 text-sm mb-4">Bonus Presets — pick one to get started:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESETS.filter(p => !rules.some(r => r.name === p.name)).map(p => {
              const meta = BONUS_TYPE_META[p.bonusType];
              const Icon = meta.icon;
              return (
                <div key={p.name} className="bg-white border border-violet-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${meta.color}`}>
                      <Icon size={13} />
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 mb-1">{p.name}</p>
                  <p className="text-[10px] text-slate-500 mb-3">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-700">
                      {p.bonusType === 'PERCENTAGE' ? `${p.value}%` : `KES ${p.value}`}
                      {p.taskCountThreshold ? ` · >=${p.taskCountThreshold} tasks` : ''}
                    </span>
                    <button onClick={() => addPreset(p)} className="btn-primary btn-sm text-[10px]">+ Add</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm">Bonus Rules ({rules.length})</h3>
          <button onClick={fetchRules} className="btn-secondary btn-sm flex items-center gap-1.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw className="animate-spin w-5 h-5 mr-2" /> Loading...
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Star size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No bonus rules configured</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map(rule => {
              const meta = BONUS_TYPE_META[rule.bonusType] || BONUS_TYPE_META.FIXED;
              const Icon = meta.icon;
              return (
                <div key={rule.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${meta.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-slate-900 text-sm">{rule.name}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${meta.color}`}>{meta.label}</span>
                      {!rule.isActive && <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200">DISABLED</span>}
                    </div>
                    <p className="text-xs text-slate-500">{rule.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-[10px] font-bold text-slate-700">
                        {rule.bonusType === 'PERCENTAGE' ? `${rule.value}% of earnings` : `KES ${rule.value}`}
                      </span>
                      {rule.taskCountThreshold && (
                        <span className="text-[10px] font-bold text-blue-600">≥ {rule.taskCountThreshold} tasks</span>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 capitalize">{rule.period}</span>
                      {rule.appliesToRoles?.length > 0 && (
                        <span className="text-[10px] font-bold text-violet-600">Roles: {rule.appliesToRoles.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  {(isAdmin || isManager) && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleRule(rule)}>
                        {rule.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-slate-400" />}
                      </button>
                      <button onClick={() => { setEditRule(rule); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <BonusModal
          rule={editRule}
          onClose={() => { setShowModal(false); setEditRule(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default BonusRules;
