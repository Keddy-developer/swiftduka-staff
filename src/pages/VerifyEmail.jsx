import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const emailParam = searchParams.get('email');
        if (emailParam) setEmail(emailParam);
    }, [location]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) return toast.error('Please enter the full 6-digit code');

        setLoading(true);
        try {
            await axiosInstance.post('/auth/verify-email', { identifier: email, otp: code });
            toast.success('Email verified successfully! You can now log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Verification failed. Please check the code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return toast.error('Email address is missing');
        setResending(true);
        try {
            await axiosInstance.post('/auth/resend-verification', { identifier: email });
            toast.success('Verification code resent to your email');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
            <div className="relative w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="bg-primary p-10 text-white text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30 rotate-3">
                            <Mail className="w-10 h-10 text-white -rotate-3" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Verify Email</h1>
                        <p className="text-white/70 text-sm mt-2 font-medium">Enter the 6-digit code sent to your email</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all"
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
                            </button>

                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending}
                                className="w-full py-4 text-slate-500 font-semibold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend Code'}
                            </button>
                        </div>

                        <div className="pt-4 text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-sm text-primary font-bold hover:underline inline-flex items-center gap-1"
                            >
                                Back to login <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
                <p className="text-center text-xs text-slate-400 mt-8 font-medium">
                    © 2026 ikoSoko Workforce Management System
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
