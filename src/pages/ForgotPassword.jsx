import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import { Lock, Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return toast.error('Please enter your email address');

        setLoading(true);
        try {
            await axiosInstance.post('/auth/forgot-password', { identifier: email, portal: 'staff' });
            setSent(true);
            toast.success('Password reset link sent to your email');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-green-600">
                        <Send className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4">Check Your Email</h1>
                    <p className="text-slate-500 mb-8 font-medium">
                        We've sent a password reset link to <span className="text-slate-900 font-bold">{email}</span>. 
                        Please check your inbox and follow the instructions.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-xl"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="bg-primary p-10 text-white text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30 -rotate-3">
                            <Lock className="w-10 h-10 text-white rotate-3" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Forgot Password</h1>
                        <p className="text-white/70 text-sm mt-2 font-medium">No worries, we'll help you reset it</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="yourname@ikosoko.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full py-4 text-slate-500 font-semibold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
