import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import {
  Trophy, TrendingDown, Clock, Activity,
  Filter, AlertCircle, RefreshCw, ChevronRight,
  Target, Zap, SlidersHorizontal, BarChart3, Users, Package, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Performance = () => {
  const { user, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hubId, setHubId] = useState(isManager && !isAdmin ? user?.fulfillmentHubId || '' : '');
  const [hubs, setHubs] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: metrics } = await axiosInstance.get(`/workforce/performance/metrics?hubId=${hubId}`);
      setData(metrics);
      
      if (isAdmin && hubs.length === 0) {
        const { data: hubsData } = await axiosInstance.get('/workforce/hubs');
        setHubs(hubsData.hubs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [hubId]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <RefreshCw className="animate-spin w-5 h-5 mr-3" /> Analyzing performance data...
      </div>
    );
  }

  const COLORS = ['#062821', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2 text-2xl font-black">
            <Zap className="text-secondary fill-secondary" size={24} />
            Performance Intel
          </h1>
          <p className="page-subtitle font-bold text-slate-500">Real-time workforce efficiency and hub bottleneck detection</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="relative">
              <select 
                value={hubId}
                onChange={(e) => setHubId(e.target.value)}
                className="pl-9 pr-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black appearance-none focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer shadow-sm"
              >
                <option value="">All Fulfillment Hubs</option>
                {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          )}
          <button onClick={fetchData} className="px-5 py-2.5 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            REFRESH METRICS
          </button>
        </div>
      </div>

      {/* Main Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Avg Efficiency', value: `${Math.round(data?.overallAvg || 0)}%`, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Completion Rate', value: `${Math.round(data?.completionRate || 0)}%`, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Peak Capacity', value: `${data?.staffing?.optimalStaff || 0}`, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Total Tasks', value: data?.totalTasks || 0, icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
              <s.icon size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overview Rankings & Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bottleneck Analysis */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock size={18} className="text-rose-500" />
                Bottleneck Detection
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Task completion time (Minutes)</p>
            </div>
          </div>
          <div className="p-6 flex-1" style={{ height: '350px', minHeight: '350px' }}>
            {data?.insights?.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.insights} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="type" axisLine={false} tickLine={false} fontSize={10} fontVariant="lining-nums" fontWeight={900} stroke="#64748b" tickFormatter={v => v.toUpperCase()} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', padding: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}} />
                  <Bar dataKey="avgMins" name="Avg Mins" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="p90Mins" name="P90 Mins" fill="#062821" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-black uppercase tracking-widest min-h-[320px]">
                No completion data recorded yet
              </div>
            )}
          </div>
        </div>

        {/* AI & Staffing Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Target size={120} />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2">Automation Paths</h3>
              <p className="text-[10px] text-slate-500 font-bold mb-6 italic leading-relaxed uppercase tracking-widest">
                Recommended optimizations
              </p>
              <div className="space-y-3 relative z-10">
                 {data?.automation?.slice(0, 3).map((opt, i) => (
                   <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                         <span className={`text-[9px] font-black uppercase tracking-widest ${
                            opt.type === 'emerald' ? 'text-emerald-400' : 
                            opt.type === 'blue' ? 'text-blue-400' : 'text-amber-400'
                         }`}>{opt.title}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-300 leading-tight">{opt.description}</p>
                   </div>
                 ))}
                 {!data?.automation?.length && <p className="text-xs text-slate-500 italic">No patterns detected.</p>}
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col flex-1 shadow-sm">
                 <h3 className="text-sm font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                    <AlertCircle className="text-amber-500" size={16} />
                    Anomalies
                 </h3>
                 <div className="flex-1 flex flex-col justify-center">
                    {data?.anomalies?.length > 0 ? (
                      <div className="space-y-4">
                         {data.anomalies.slice(0, 2).map((a, i) => (
                           <div key={i} className="flex gap-3 items-start p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
                              <AlertCircle size={14} className="text-rose-500 mt-1 flex-shrink-0" />
                              <div>
                                 <p className="text-xs font-black text-slate-900 leading-tight">{a.title}</p>
                                 <p className="text-[10px] font-bold text-slate-400 capitalize">{a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System'}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                         <Activity className="mx-auto text-slate-200 mb-2" size={24} />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Healthy Flow</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 shadow-sm">
                 <h3 className="text-sm font-black text-primary tracking-tight mb-4 flex items-center gap-2">
                    <SlidersHorizontal size={16} />
                    Staffing
                 </h3>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimal Capacity</span>
                       <span className="text-sm font-black text-primary">{data?.staffing?.optimalStaff || 0}</span>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-primary/10">
                       <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                         "{data?.staffing?.recommendation || 'Operating at baseline efficiency.'}"
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Staff Performance Registry */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Staff Performance Registry
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Detailed efficiency metrics by individual</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
              Sorted by Efficiency Score
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Rank</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Staff Member</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tasks</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Avg Quality</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Efficiency</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.rankings?.map((r, i) => (
                <tr 
                  key={r.id || i} 
                  onClick={() => navigate(`/workers/${r.userId || r.id}`)}
                  className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : 
                      i === 1 ? 'bg-slate-100 text-slate-600' : 
                      i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {i + 1}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-primary/5 flex items-center justify-center text-[11px] font-black text-primary border border-primary/5 shadow-inner">
                        {r.name?.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 group-hover:text-primary transition-colors">{r.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{r.hubName || 'Standard Hub'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-black text-slate-700">{r.total} <span className="text-slate-400 font-bold">Total</span></span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">98.2% Accurate</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs font-black text-slate-600">4.8 / 5.0</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col flex-nowrap items-end gap-1.5">
                      <span className={`text-sm font-black ${
                        r.avg >= 90 ? 'text-emerald-500' : 
                        r.avg >= 70 ? 'text-blue-500' : 
                        r.avg >= 50 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {Math.round(r.avg)}%
                      </span>
                      <div className="w-20 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            r.avg >= 90 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 
                            r.avg >= 70 ? 'bg-blue-500 shadow-sm shadow-blue-500/50' : 
                            r.avg >= 50 ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-rose-500 shadow-sm shadow-rose-500/50'
                          }`} 
                          style={{ width: `${r.avg}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <ChevronRight size={14} />
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.rankings?.length && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                    No staff records found for this criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing all active staff members in current hub filter</p>
        </div>
      </div>

      {/* Suggested Improvements / AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <Target size={120} />
            </div>
            <h3 className="text-lg font-black tracking-tight mb-2">Automation Opportunities</h3>
            <p className="text-xs text-slate-400 font-bold mb-6 italic leading-relaxed">
              Based on task repetition and standardized flows, the following paths are recommended for automation.
            </p>
            <div className="space-y-4 relative z-10">
               {data?.automation?.length > 0 ? (
                 data.automation.map((opt, i) => (
                   <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-default">
                      <div className="flex items-center justify-between mb-1">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${
                            opt.type === 'emerald' ? 'text-emerald-400' : 
                            opt.type === 'blue' ? 'text-blue-400' : 'text-amber-400'
                         }`}>{opt.title}</span>
                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                            opt.type === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 
                            opt.type === 'blue' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                         }`}>{opt.benefit}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200">{opt.description}</p>
                   </div>
                 ))
               ) : (
                 <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 italic">No specific automation paths identified yet.</p>
                 </div>
               )}
            </div>
         </div>

         <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
            <h3 className="text-sm font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
               <AlertCircle className="text-amber-500" size={16} />
               Anomaly Detection
            </h3>
            <div className="flex-1 flex flex-col justify-center text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
               {data?.anomalies?.length > 0 ? (
                 <div className="space-y-3 px-4 text-left">
                    {data.anomalies.slice(0, 3).map((a, i) => (
                      <div key={i} className="flex gap-2 items-start">
                         <AlertCircle size={14} className="text-rose-500 mt-1 flex-shrink-0" />
                         <div>
                            <p className="text-[10px] font-black text-slate-900 leading-tight">{a.title}</p>
                            <p className="text-[9px] font-bold text-slate-400 capitalize">{a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System'}</p>
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <>
                    <Activity className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Scanning Patterns Neutral</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tight">No suspicious activity detected in the last 24h.</p>
                 </>
               )}
            </div>
            <button className="mt-4 text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
               View Full Security Log <ChevronRight size={10} />
            </button>
         </div>

         <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
            <h3 className="text-sm font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
               <SlidersHorizontal className="text-primary" size={16} />
               Staffing Recommendation
            </h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3">
                     <Users size={16} className="text-primary" />
                     <span className="text-xs font-black text-slate-600 uppercase">Optimal Peak</span>
                  </div>
                  <span className="text-xs font-black text-primary tracking-tight">
                    {data?.staffing?.optimalStaff || 0} Workers
                  </span>
               </div>
               <div className="p-4 bg-slate-900 rounded-xl text-white">
                  <div className="flex items-center gap-2 mb-2">
                     <BarChart3 className="text-secondary" size={14} />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       {data?.staffing?.currentTrend || 'Stable'} Trend
                     </span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    {data?.staffing?.recommendation || 'Operational levels are currently within normal range.'}
                  </p>
                  {data?.staffing?.bottleneckType && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Bottleneck</span>
                      <span className="text-[8px] font-black text-secondary tracking-widest uppercase">{data.staffing.bottleneckType}</span>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Performance;
