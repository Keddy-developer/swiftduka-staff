import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import {
  Users, DollarSign, CheckCircle2, ClipboardList,
  TrendingUp, RefreshCw, Wallet,
  ArrowUpRight, Package, Truck, UserCheck, Activity, AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const StatCard = ({ label, value, icon: Icon, color, sub, trend }) => {
  const colors = {
    green:  'border-l-emerald-500 text-emerald-600',
    blue:   'border-l-blue-500 text-blue-600',
    amber:  'border-l-amber-500 text-amber-600',
    violet: 'border-l-violet-500 text-violet-600',
    slate:  'border-l-slate-500 text-slate-600',
    rose:   'border-l-rose-500 text-rose-600',
  };
  return (
    <div className={`stat-card border-l-4 ${colors[color] || colors.slate}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-100 shadow-sm`}>
          <Icon size={20} className="opacity-80" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
            <ArrowUpRight size={10} /> {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 mt-2 italic">{sub}</p>}
    </div>
  );
};

const Dashboard = () => {
  const { user, isAdmin, isManager, isHQ, canManagePayroll } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/workforce/dashboard/stats');
      setStats(data.stats);
    } catch {
      // In production, we might want to handle this differently, 
      // but for now we set null and show an error state if needed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const formatKes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <RefreshCw className="animate-spin w-6 h-6 mr-3" /> Loading dashboard stats...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-32 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-black text-slate-900">Failed to load statistics</h3>
        <p className="text-sm text-slate-500 mb-6">There was an error connecting to the workforce engine.</p>
        <button onClick={fetchStats} className="btn-primary">Retry</button>
      </div>
    );
  }

  const topCards = [
    (isAdmin || isManager || isHQ) && { label: 'Total Workers', value: stats.totalWorkers, icon: Users, color: 'slate', sub: `${stats.activeWorkers} active`, trend: stats.workerGrowth || '+0' },
    { label: 'Tasks Complete', value: stats.tasksCompleted, icon: CheckCircle2, color: 'blue', sub: `${stats.tasksPending} pending`, trend: stats.taskGrowth || '+0' },
    { label: 'Total Earnings', value: formatKes(stats.totalEarnings), icon: DollarSign, color: 'green', sub: 'Current Period', trend: stats.earningGrowth || '+0%' },
    { label: 'Pending Payouts', value: formatKes(stats.pendingPayouts), icon: Wallet, color: 'amber', sub: 'Awaiting approval' },
  ].filter(Boolean);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Workforce Overview</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Platform-wide · All Centers' : isManager ? 'Your Center' : 'Your Dashboard'} · Live Stats
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {topCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Earnings trend */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Earnings Trend</h3>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">Monthly payroll totals (KES)</p>
            </div>
            <TrendingUp size={18} className="text-slate-300" />
          </div>
          <div className="p-6 h-64">
            {stats.earningsChart?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.earningsChart}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#062821" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#062821" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v) => [`KES ${v.toLocaleString()}`, 'Earnings']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="amount" stroke="#062821" strokeWidth={2.5}
                    fill="url(#earningsGrad)" animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Workers by role */}
        {(isAdmin || isManager || isHQ) && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Workers by Role</h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">Distribution</p>
              </div>
              <UserCheck size={18} className="text-slate-300" />
            </div>
            <div className="p-6 h-64">
              {stats.byRole?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byRole} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" />
                    <YAxis type="category" dataKey="role" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" width={70} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#062821" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">
                  No role data available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity + Quick Links */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Recent Activity</h3>
            <Activity size={18} className="text-slate-300" />
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentActivity?.length > 0 ? (
              stats.recentActivity.map(item => {
                const dot = { success: 'bg-emerald-500', warning: 'bg-amber-500', info: 'bg-blue-500', danger: 'bg-rose-500' }[item.type] || 'bg-slate-400';
                return (
                  <div key={item.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors">
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.user}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.action}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{item.time}</span>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm font-bold">
                No recent activity logged
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden text-white">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-base font-black tracking-tight">Quick Actions</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">Common tasks</p>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: 'Add New Worker', icon: Users, href: '/workers/new', show: isAdmin || isManager },
              { label: 'Approve Payouts', icon: Wallet, href: '/payments', show: isAdmin || canManagePayroll },
              { label: 'View All Tasks', icon: ClipboardList, href: '/tasks' },
              { label: 'Manage Centers', icon: Package, href: '/centers', show: isAdmin || isManager },
              { label: 'View Earnings', icon: DollarSign, href: '/earnings' },
              { label: 'Fleet & Riders', icon: Truck, href: '/workers?role=rider' },
            ].filter(a => a.show !== false).map(action => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors border border-white/5 hover:border-white/20 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <action.icon size={16} className="text-slate-400 group-hover:text-secondary transition-colors" />
                </div>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
                <ArrowUpRight size={12} className="ml-auto text-slate-600 group-hover:text-slate-300 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
