import React, { useState } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, Link, useLocation
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  LayoutDashboard, Users, ClipboardList, DollarSign, CreditCard,
  Wallet, Building2, Settings, LogOut, Menu, X, Bell, ChevronRight,
  Package, Briefcase, Activity
} from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import WorkerDetail from './pages/WorkerDetail';
import Tasks from './pages/Tasks';
import Earnings from './pages/Earnings';
import Payments from './pages/Payments';
import WalletPage from './pages/Wallet';
import Centers from './pages/Centers';
import Deductions from './pages/Deductions';
import Allowances from './pages/Allowances';
import BonusRules from './pages/BonusRules';
import PayrollRun from './pages/PayrollRun';
import Performance from './pages/Performance';
import TaskTemplates from './pages/TaskTemplates';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotificationDropdown from './components/NotificationDropdown';

/* ─── helpers ─── */
const ROLE_DISPLAY = {
  admin: { label: 'Admin', cls: 'bg-slate-900 text-white' },
  hq_staff: { label: 'HQ Staff', cls: 'bg-indigo-600 text-white' },
  fulfillment_manager: { label: 'Manager', cls: 'bg-blue-600 text-white' },
  fulfillment_staff: { label: 'Staff', cls: 'bg-cyan-600 text-white' },
  pickup_agent: { label: 'Agent', cls: 'bg-amber-500 text-white' },
  rider: { label: 'Rider', cls: 'bg-emerald-600 text-white' },
};

const getRoleMeta = (role) => {
  const r = Array.isArray(role) ? role[0] : role;
  return ROLE_DISPLAY[r] || { label: r || 'Worker', cls: 'bg-slate-500 text-white' };
};

/* ─── Sidebar links by role ─── */
const ALL_LINKS = [
  { name: 'Overview', icon: LayoutDashboard, path: '/', roles: ['admin', 'hq_staff', 'fulfillment_manager', 'fulfillment_staff', 'rider', 'pickup_agent'] },
  { name: 'Workers', icon: Users, path: '/workers', roles: ['admin', 'hq_staff', 'fulfillment_manager'] },
  { name: 'Tasks', icon: ClipboardList, path: '/tasks', roles: ['admin', 'hq_staff', 'fulfillment_manager', 'fulfillment_staff', 'rider', 'pickup_agent'] },
  { name: 'Centers', icon: Building2, path: '/centers', roles: ['admin', 'hq_staff', 'fulfillment_manager'] },
  { name: 'Earnings', icon: DollarSign, path: '/earnings', roles: ['admin', 'hq_staff', 'fulfillment_manager', 'fulfillment_staff', 'rider', 'pickup_agent'] },
  { name: 'Payroll Engine', icon: Package, path: '/payroll', roles: ['admin'] },
  { name: 'Deductions', icon: CreditCard, path: '/deductions', roles: ['admin', 'hq_staff'] },
  { name: 'Allowances', icon: Wallet, path: '/allowances', roles: ['admin', 'hq_staff', 'fulfillment_manager'] },
  { name: 'Bonuses', icon: Briefcase, path: '/bonuses', roles: ['admin', 'hq_staff', 'fulfillment_manager'] },
  { name: 'Payments', icon: CreditCard, path: '/payments', roles: ['admin', 'hq_staff'] },
  { name: 'Performance', icon: Activity, path: '/performance', roles: ['admin', 'hq_staff', 'fulfillment_manager'] },
  { name: 'Task Config', icon: Settings, path: '/templates', roles: ['admin', 'hq_staff'] },
  { name: 'My Wallet', icon: Wallet, path: '/wallet', roles: ['fulfillment_staff', 'rider', 'pickup_agent'] },
];

/* ─── Main Layout ─── */
const MainLayout = ({ children }) => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const userRoles = user?.role || [];
  const links = ALL_LINKS.filter(l =>
    isAdmin || l.roles.some(r => userRoles.includes(r))
  );

  const userRoleMeta = getRoleMeta(userRoles);

  return (
    <div className="flex min-h-screen bg-[#F0F2F5] font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-[13px] text-slate-900 tracking-tight leading-none">ikoSoko</span>
              <p className="text-[9px] font-black text-slate-400 tracking-widest leading-none mt-0.5">STAFF PORTAL</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map(link => {
            const isActive = location.pathname === link.path ||
              (link.path !== '/' && location.pathname.startsWith(link.path + '/'));
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <link.icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-xs text-slate-900 truncate tracking-tight">{user?.firstName} {user?.lastName}</p>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${userRoleMeta.cls}`}>
                {userRoleMeta.label}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black border border-slate-200 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={12} /> SIGN OUT
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm shadow-slate-50 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
            >
              <Menu size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 tracking-widest">LIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-700">
              <span className="text-slate-400 font-medium">Hello,</span>
              {user?.firstName}
            </div>
            <div className={`hidden md:flex text-[9px] font-black px-2 py-1 rounded ${userRoleMeta.cls}`}>
              {userRoleMeta.label}
            </div>
            <NotificationDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

/* ─── Private route guard ─── */
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
      <div className="flex flex-col items-center gap-3 opacity-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-black text-slate-400 tracking-widest">Loading...</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const userRoles = user.role || [];
    const allowed = userRoles.includes('admin') || allowedRoles.some(r => userRoles.includes(r));
    if (!allowed) return <Navigate to="/" replace />;
  }
  return <MainLayout>{children}</MainLayout>;
};

/* ─── App ─── */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/workers" element={
            <PrivateRoute allowedRoles={['hq_staff', 'fulfillment_manager']}>
              <Workers />
            </PrivateRoute>
          } />
          <Route path="/workers/new" element={
            <PrivateRoute allowedRoles={['hq_staff', 'fulfillment_manager']}>
              <Workers />
            </PrivateRoute>
          } />
          <Route path="/workers/:id" element={
            <PrivateRoute allowedRoles={['hq_staff', 'fulfillment_manager', 'fulfillment_staff', 'rider', 'pickup_agent']}>
              <WorkerDetail />
            </PrivateRoute>
          } />
          <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
          <Route path="/centers" element={
            <PrivateRoute allowedRoles={['hq_staff', 'fulfillment_manager']}>
              <Centers />
            </PrivateRoute>
          } />
          <Route path="/earnings" element={<PrivateRoute><Earnings /></PrivateRoute>} />
          <Route path="/payroll" element={
            <PrivateRoute>
              <PayrollRun />
            </PrivateRoute>
          } />
          <Route path="/deductions" element={
            <PrivateRoute allowedRoles={['hq_staff']}>
              <Deductions />
            </PrivateRoute>
          } />
          <Route path="/allowances" element={
            <PrivateRoute allowedRoles={['hq_staff', 'fulfillment_manager']}>
              <Allowances />
            </PrivateRoute>
          } />
          <Route path="/bonuses" element={
            <PrivateRoute allowedRoles={['hq_staff', 'fulfillment_manager']}>
              <BonusRules />
            </PrivateRoute>
          } />
          <Route path="/payments" element={
            <PrivateRoute allowedRoles={['hq_staff']}>
              <Payments />
            </PrivateRoute>
          } />
          <Route path="/performance" element={
            <PrivateRoute allowedRoles={['hq_staff', 'fulfillment_manager']}>
              <Performance />
            </PrivateRoute>
          } />
          <Route path="/templates" element={
            <PrivateRoute allowedRoles={['hq_staff']}>
              <TaskTemplates />
            </PrivateRoute>
          } />
          <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        theme="colored"
        autoClose={3000}
        hideProgressBar
        className="text-sm"
      />
    </AuthProvider>
  );
}

export default App;
