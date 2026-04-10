import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, Check, Trash2, Clock, AlertTriangle, 
  Info, ShieldAlert, ChevronRight, CheckCircle2,
  BellRing, Fullscreen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchRecent = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/workforce/notifications`);
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecent();
    const interval = setInterval(fetchRecent, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [fetchRecent]);

  useEffect(() => {
    if (open) fetchRecent();
  }, [open, fetchRecent]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (id, isHub) => {
    try {
      await axiosInstance.patch(`/workforce/notifications/${id}/read`, { isHub });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.patch(`/workforce/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'URGENT':
      case 'DANGER': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'SUCCESS': return <Check className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg transition-all ${open ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 && open ? 'animate-none' : unreadCount > 0 ? 'animate-bounce-short' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-rose-500 text-white flex items-center justify-center rounded-full text-[8px] font-black border-2 border-white animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-[380px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-top-2 duration-200 origin-top-right">
          <div className="p-4 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
               <BellRing className="w-4 h-4 text-secondary" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notifications</span>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-[9px] font-black text-secondary hover:text-secondary-400 uppercase tracking-tight flex items-center gap-1 transition-colors"
              >
                Clear All <CheckCircle2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto no-scrollbar bg-slate-50/50">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 animate-pulse flex gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-2 bg-slate-200 rounded w-3/4" />
                  </div>
                </div>
              ))
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => !n.isRead && markRead(n.id, n.isHub)}
                    className={`p-4 flex gap-3 hover:bg-white transition-all cursor-default ${!n.isRead ? 'bg-secondary/5 ring-1 ring-inset ring-secondary/10' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      n.type === 'URGENT' || n.type === 'DANGER' ? 'bg-rose-100 text-rose-500' : 
                      n.type === 'WARNING' ? 'bg-amber-100 text-amber-500' : 
                      n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-500' : 
                      'bg-blue-100 text-blue-500'
                    }`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {n.isHub && (
                            <span className="px-1 py-0.5 bg-slate-200 text-slate-600 rounded text-[7px] font-black uppercase tracking-tighter shrink-0">HUB</span>
                          )}
                          <span className={`text-[11px] font-black uppercase tracking-tight truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                             {n.title}
                          </span>
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap italic shrink-0">
                           {formatDistanceToNow(new Date(n.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed italic">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight px-8">No notifications yet</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-center">
            <button
              onClick={() => setOpen(false)}
              className="text-[10px] font-black text-slate-900 hover:text-secondary transition-all uppercase tracking-widest flex items-center gap-1.5"
            >
              Close Panel <Clock className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
