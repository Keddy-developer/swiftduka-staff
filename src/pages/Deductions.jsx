import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Settings, Plus, Edit3, Trash2, RefreshCw, ToggleLeft, ToggleRight,
  ShieldCheck, Percent, DollarSign, X, ChevronDown, Info
} from 'lucide-react';
import DeductionModal from '../components/DeductionModal';

const KENYA_DEFAULTS = [
  {
    name: 'PAYE',
    description: 'Pay As You Earn — progressive income tax (Kenya)',
    category: 'STATUTORY',
    valueType: 'PERCENTAGE',
    value: 0,
    frequency: 'monthly',
    note: 'Progressive tax: 10% up to KES 24,000 · 25% up to 32,333 · 30% up to 500,000 · 32.5% above',
    badge: 'bg-rose-100 text-rose-700',
    icon: '🇰🇪',
  },
  {
    name: 'NSSF',
    description: 'National Social Security Fund (Tier I + Tier II)',
    category: 'STATUTORY',
    valueType: 'FIXED',
    value: 200,
    frequency: 'monthly',
    note: 'Tier I: KES 200/mo · Tier II: 6% of pensionable pay (2024 rates)',
    badge: 'bg-blue-100 text-blue-700',
    icon: '🏦',
  },
  {
    name: 'SHIF',
    description: 'Social Health Insurance Fund (replaced NHIF)',
    category: 'STATUTORY',
    valueType: 'PERCENTAGE',
    value: 2.75,
    frequency: 'monthly',
    note: '2.75% of gross monthly salary',
    badge: 'bg-teal-100 text-teal-700',
    icon: '🏥',
  },
];

const Deductions = () => {
  const { isAdmin } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/workforce/deductions');
      setRules(data.rules || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const toggleRule = async (rule) => {
    try {
      await axiosInstance.put(`/workforce/deductions/${rule.id}`, { isActive: !rule.isActive });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
      toast.success(`${rule.name} ${rule.isActive ? 'disabled' : 'enabled'}`);
    } catch { toast.error('Failed to update'); }
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this deduction rule?')) return;
    try {
      await axiosInstance.delete(`/workforce/deductions/${id}`);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Deduction rule deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleSeed = async (preset) => {
    try {
      const { data } = await axiosInstance.post('/workforce/deductions', {
        name: preset.name,
        description: preset.description,
        category: preset.category,
        valueType: preset.valueType,
        value: preset.value,
        frequency: preset.frequency,
      });
      setRules(prev => [data.rule, ...prev]);
      toast.success(`${preset.name} deduction added`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add preset');
    }
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

  const catBadge = (cat) => cat === 'STATUTORY'
    ? 'bg-rose-50 text-rose-700 border-rose-100'
    : 'bg-violet-50 text-violet-700 border-violet-100';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Deductions</h1>
          <p className="page-subtitle">Statutory &amp; voluntary deductions · Kenya compliance</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditRule(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Deduction
          </button>
        )}
      </div>

      {/* Kenya statutory presets banner */}
      {isAdmin && KENYA_DEFAULTS.filter(p => !rules.some(r => r.name === p.name)).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-amber-600" />
            <h3 className="font-black text-amber-900 text-sm">Kenya Statutory Presets</h3>
          </div>
          <p className="text-xs text-amber-700 mb-4">{rules.length === 0 ? 'No deduction rules set up yet. Add these Kenya-specific presets to get started quickly:' : 'Add more Kenya-specific presets:'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {KENYA_DEFAULTS.filter(p => !rules.some(r => r.name === p.name)).map(p => (
              <div key={p.name} className="bg-white border border-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{p.icon}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${catBadge(p.category)}`}>{p.name}</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">{p.note}</p>
                <button onClick={() => handleSeed(p)} className="btn-primary btn-sm w-full text-xs">
                  + Add {p.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm tracking-tight">Deduction Rules ({rules.length})</h3>
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
            <Settings size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No deduction rules yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-xs font-black flex-shrink-0 ${catBadge(rule.category)}`}>
                  {rule.category === 'STATUTORY' ? '🇰🇪' : '%'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-slate-900 text-sm">{rule.name}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${catBadge(rule.category)}`}>{rule.category}</span>
                    {!rule.isActive && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-slate-100 text-slate-400 border-slate-200">DISABLED</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{rule.description ?? '—'}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      {rule.valueType === 'PERCENTAGE' ? `${rule.value}%` : `KES ${rule.value}`} · {rule.frequency}
                    </span>
                    {rule.minIncomeThreshold && (
                      <span className="text-[10px] font-bold text-amber-600">
                        Min income: KES {rule.minIncomeThreshold.toLocaleString()}
                      </span>
                    )}
                    {rule.appliesToRoles?.length > 0 && (
                      <span className="text-[10px] font-bold text-blue-600">
                        Roles: {rule.appliesToRoles.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleRule(rule)} className="text-slate-400 hover:text-slate-700 transition-colors">
                      {rule.isActive ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} />}
                    </button>
                    <button onClick={() => { setEditRule(rule); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAYE bands reference card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Info size={15} className="text-slate-400" />
          <h3 className="font-black text-slate-900 text-sm tracking-tight">Kenya PAYE Bands (Monthly, 2024/25)</h3>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Income Band (KES/month)</th>
                <th>Tax Rate</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { band: '0 – 24,000', rate: '10%', note: 'Lower bracket' },
                { band: '24,001 – 32,333', rate: '25%', note: 'Middle bracket' },
                { band: '32,334 – 500,000', rate: '30%', note: 'Standard rate' },
                { band: 'Above 500,000', rate: '35%', note: 'High earners' },
              ].map(row => (
                <tr key={row.band}>
                  <td className="font-mono text-xs">{row.band}</td>
                  <td><span className="font-black text-rose-600">{row.rate}</span></td>
                  <td className="text-xs text-slate-400">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-100">
          Personal relief: <strong>KES 2,400/month</strong> · Insurance relief: 15% of premium paid
        </div>
      </div>

      {showModal && (
        <DeductionModal
          rule={editRule}
          onClose={() => { setShowModal(false); setEditRule(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default Deductions;
