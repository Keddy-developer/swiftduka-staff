import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Building2, Plus, Users, Briefcase, MapPin,
  ChevronRight, RefreshCw, Edit3, Check, Loader2,
  Package, LayoutGrid
} from 'lucide-react';
import CenterModal from '../components/CenterModal';

const Centers = () => {
  const { isAdmin } = useAuth();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCenter, setEditCenter] = useState(null);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/delivery/hubs');
      setCenters(data.hubs || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to sync fulfillment centers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCenters(); }, []);

  const handleSaved = (saved) => {
    if (editCenter) {
      setCenters(prev => prev.map(c => c.id === saved.id ? saved : c));
    } else {
      setCenters(prev => [saved, ...prev]);
    }
    setShowModal(false);
    setEditCenter(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Network</h1>
          <p className="page-subtitle">Geography-based fulfillment hubs & staff distribution</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCenters} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <button
              id="add-center-btn"
              onClick={() => { setEditCenter(null); setShowModal(true); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={15} /> New Center
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Total Centers', value: centers.length },
          { label: 'Network Reach', value: Array.from(new Set(centers.map(c => c.county))).length + ' Counties' },
          { label: 'Total Staff', value: centers.reduce((s, c) => s + (c.staffCount || 0), 0) },
          { label: 'Active Delivery Ops', value: centers.filter(c => c.isActive).length },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-slate-900 leading-none mb-1">{s.value}</span>
              <span className="text-[10px] font-black text-slate-400 tracking-[0.1em] uppercase">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Center cards grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
          <Loader2 className="animate-spin w-10 h-10 opacity-30" />
          <span className="font-black tracking-widest text-xs uppercase opacity-50">Syncing Network Topography...</span>
        </div>
      ) : centers.length === 0 ? (
        <div className="text-center py-24 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
          <Building2 size={64} className="mx-auto text-slate-100 mb-4" />
          <h3 className="text-lg font-black text-slate-900">No centers registered</h3>
          <p className="text-sm text-slate-500 mb-6">Start building your fulfillment network by adding your first hub.</p>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={14} className="inline mr-2" /> CREATE FIRST HUB
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {centers.map(center => (
            <div
              key={center.id}
              className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group relative"
            >
              {/* Status accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-colors ${center.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />

              <div className="p-8 relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-sm transition-transform group-hover:scale-110">
                    <Building2 size={24} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border-2 ${
                      center.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {center.isActive ? 'Operational' : 'Offline'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => { setEditCenter(center); setShowModal(true); }}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-6 min-h-[4rem]">
                  <h3 className="font-black text-slate-900 text-xl tracking-tight mb-1 group-hover:text-primary transition-colors uppercase leading-none">{center.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={12} className="text-secondary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{center.town}, {center.county} County</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { label: 'Personnel', value: center.staffCount || 0, icon: Users, color: 'text-blue-600' },
                    { label: 'Current Load', value: center.activeOrders || 0, icon: Package, color: 'text-amber-600' },
                    { label: 'Capacity', value: `${center.capacity || 0}`, icon: LayoutGrid, color: 'text-slate-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center transition-all group-hover:bg-white group-hover:border-slate-200">
                      <p className={`text-lg font-black text-slate-900 ${s.color}`}>{s.value}</p>
                      <p className="text-[8px] font-black text-slate-400 tracking-widest mt-1 uppercase leading-none">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Manager */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm overflow-hidden">
                      {center.manager ? (
                        <span className="uppercase">{center.manager[0]}</span>
                      ) : (
                        <Users size={12} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-0.5 leading-none">HUB MANAGER</span>
                      <span className="text-[11px] font-black text-slate-800 uppercase leading-none">
                        {center.manager || <span className="text-rose-500 tracking-tight">VACANT POSITION</span>}
                      </span>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CenterModal
          center={editCenter}
          onClose={() => { setShowModal(false); setEditCenter(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default Centers;
