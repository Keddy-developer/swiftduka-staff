import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { 
    User, Lock, Shield, Smartphone, ChevronRight, 
    CheckCircle2, AlertCircle, Loader2, Save 
} from 'lucide-react';
import { toast } from 'react-toastify';

const Settings = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Profile state
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    // Update form when user context changes (after refresh)
    React.useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.patch(`/user/profile`, profileData);
            await refreshUser();
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setLoading(true);
        try {
            await axiosInstance.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle2FA = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.post('/auth/toggle-2fa');
            toast.success(data.message);
            // Ideally re-fetch user or update local state
        } catch (err) {
            toast.error('Failed to update 2FA settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Account Settings</h1>
                    <p className="page-subtitle">Manage your personal details and security preferences</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full lg:w-64 shrink-0 space-y-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        <User size={18} />
                        Personal Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Lock size={18} />
                        Password & Security
                    </button>
                    <button
                        onClick={() => setActiveTab('2fa')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === '2fa' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Shield size={18} />
                        Two-Step Verification
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    {activeTab === 'profile' && (
                        <div className="p-8">
                            <h3 className="text-xl font-black text-slate-900 mb-6">Personal Profile</h3>
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">First Name</label>
                                        <input
                                            type="text"
                                            value={profileData.firstName}
                                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={profileData.lastName}
                                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            disabled
                                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="p-8">
                            <h3 className="text-xl font-black text-slate-900 mb-6">Update Password</h3>
                            <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                        Change Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === '2fa' && (
                        <div className="p-8">
                            <div className="max-w-xl space-y-6">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                                    <Smartphone size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">Two-Step Verification (2FA)</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Add an extra layer of security to your account. When enabled, you'll need to provide a verification code sent to your phone or email every time you log in.
                                </p>

                                <div className={`p-6 rounded-2xl border ${user?.twoFactorEnabled ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {user?.twoFactorEnabled ? (
                                                <CheckCircle2 className="text-emerald-500" size={24} />
                                            ) : (
                                                <AlertCircle className="text-slate-400" size={24} />
                                            )}
                                            <div>
                                                <p className="text-sm font-black text-slate-900">
                                                    Status: {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                                </p>
                                                <p className="text-xs text-slate-500 font-bold mt-0.5">
                                                    {user?.twoFactorEnabled ? 'Your account is protected with 2FA' : 'Protect your account by enabling 2FA'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleToggle2FA}
                                            disabled={loading}
                                            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${user?.twoFactorEnabled ? 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50' : 'bg-primary text-white shadow-lg'}`}
                                        >
                                            {loading ? <Loader2 size={14} className="animate-spin" /> : user?.twoFactorEnabled ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
