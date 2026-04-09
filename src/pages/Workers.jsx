import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Users, Plus, Search, ChevronRight, UserCheck, UserX,
  Phone, MapPin, Trash2, RefreshCw, X, Download, Filter
} from 'lucide-react';
import WorkerModal from '../components/WorkerModal';

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'hq_staff', label: 'HQ Staff' },
  { value: 'fulfillment_manager', label: 'Manager' },
  { value: 'fulfillment_staff', label: 'Fulfillment Staff' },
  { value: 'pickup_agent', label: 'Pickup Agent' },
  { value: 'rider', label: 'Rider' },
];

const ROLE_META = {
  admin:               { label: 'Admin',    cls: 'bg-slate-900 text-white' },
  super_admin:         { label: 'Super Admin', cls: 'bg-slate-800 text-white' },
  hq_staff:            { label: 'HQ Staff', cls: 'bg-indigo-600 text-white' },
  fulfillment_manager: { label: 'Manager',  cls: 'bg-blue-600 text-white' },
  fulfillment_staff:   { label: 'Staff',    cls: 'bg-cyan-600 text-white' },
  pickup_agent:        { label: 'Agent',    cls: 'bg-amber-500 text-white' },
  rider:               { label: 'Rider',    cls: 'bg-emerald-600 text-white' },
};

const getRoleMeta = (role) => {
  const r = Array.isArray(role) ? role[0] : role;
  return ROLE_META[r] || { label: r || 'Worker', cls: 'bg-slate-500 text-white' };
};

const exportCSV = (workers) => {
  const rows = [
    ['Name', 'Phone', 'Email', 'Role', 'Hub', 'Tasks Done', 'Wallet Balance', 'Status'],
    ...workers.map(w => [
      `${w.firstName} ${w.lastName}`,
      w.phone, w.email || '',
      w.role?.[0] || '',
      w.hubName || '',
      w.tasksCompleted || 0,
      w.walletBalance || 0,
      w.isActive ? 'Active' : 'Inactive',
    ]),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'workers.csv'; a.click();
};

const Workers = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.isActive = statusFilter === 'active';
      if (search) params.search = search;
      const { data } = await axiosInstance.get('/workforce/workers', { params });
      setWorkers(data.workers || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search, page]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const toggleActive = async (worker, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.patch(`/workforce/workers/${worker.id}/status`, { isActive: !worker.isActive });
      setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, isActive: !w.isActive } : w));
      toast.success(`Worker ${worker.isActive ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteWorker = async (worker, e) => {
    e.stopPropagation();
    if (!confirm(`Permanently remove ${worker.firstName} ${worker.lastName}? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/workforce/workers/${worker.id}`);
      setWorkers(prev => prev.filter(w => w.id !== worker.id));
      toast.success('Worker removed from system');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete worker');
    }
  };

  const handleSaved = (savedWorker) => {
    if (editWorker) {
      setWorkers(prev => prev.map(w => w.id === savedWorker.id ? { ...savedWorker, hubName: w.hubName } : w));
    } else {
      setWorkers(prev => [savedWorker, ...prev]);
      setTotal(t => t + 1);
    }
    setShowModal(false);
    setEditWorker(null);
  };

  const filtered = workers; // server already filters; client search is instant
  const canManage = isAdmin || isManager;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Workers</h1>
          <p className="page-subtitle">{total} total · Manage all staff, riders, and agents</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button onClick={() => exportCSV(workers)} className="btn-secondary flex items-center gap-2 text-xs">
              <Download size={13} /> Export CSV
            </button>
          )}
          {canManage && (
            <button
              id="add-worker-btn"
              onClick={() => { setEditWorker(null); setShowModal(true); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={15} /> Add Worker
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or phone..."
            className="form-input pl-9"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="form-select w-auto min-w-[140px]">
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="form-select w-auto">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={fetchWorkers} className="btn-secondary flex items-center gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="text-xs font-bold text-slate-400 ml-auto">{workers.length} of {total}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw className="animate-spin w-6 h-6 mr-3" /> Loading workers...
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">No workers found</p>
            {canManage && (
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
                <Plus size={13} className="inline mr-1" /> Add First Worker
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Role</th>
                  <th>Location / Center</th>
                  <th>Tasks Done</th>
                  <th>Wallet</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {workers.map(worker => {
                  const roleMeta = getRoleMeta(worker.role);
                  return (
                    <tr
                      key={worker.id}
                      className="clickable-row"
                      onClick={() => navigate(`/workers/${worker.id}`)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600">
                            {worker.firstName?.[0]}{worker.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{worker.firstName} {worker.lastName}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {worker.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${roleMeta.cls}`}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin size={12} className="text-slate-300" />
                          <span className="text-xs font-medium">{worker.hubName || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-bold text-slate-900">{worker.tasksCompleted ?? '—'}</span>
                      </td>
                      <td>
                        <span className="text-sm font-bold text-slate-900">
                          {worker.walletBalance > 0 ? `KES ${worker.walletBalance.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleActive(worker, e)}
                          className={`badge cursor-pointer hover:opacity-80 transition-opacity ${worker.isActive ? 'badge-active' : 'badge-inactive'}`}
                        >
                          {worker.isActive ? <><UserCheck size={10} className="mr-1" />Active</> : <><UserX size={10} className="mr-1" />Inactive</>}
                        </button>
                      </td>
                      {canManage && (
                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditWorker(worker); setShowModal(true); }}
                              className="btn-secondary btn-sm text-[10px]"
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                onClick={(e) => deleteWorker(worker, e)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove worker"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-end gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm disabled:opacity-40">← Prev</button>
          <span className="text-xs font-bold text-slate-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <WorkerModal
          worker={editWorker}
          onClose={() => { setShowModal(false); setEditWorker(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default Workers;
