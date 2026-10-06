import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Mail, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [authType, setAuthType] = useState<'phone' | 'email'>('phone');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const inputVal = phoneOrEmail.trim();
    if (!inputVal) {
      setError(authType === 'phone' ? 'Please enter a valid mobile number' : 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: authType, identifier: inputVal, name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to send OTP');
      setStep('otp');
      setResendTimer(45);
    } catch (err: any) {
      setError(err.message || 'Unable to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    setError(null);
    const codeToVerify = otpValue || otp.join('');

    if (codeToVerify.length !== 6) {
      setError('Please enter the full 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: authType, identifier: phoneOrEmail.trim(), token: codeToVerify }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.user || !data.session?.access_token || !data.session?.refresh_token) {
        throw new Error(data.error || 'Invalid or expired OTP');
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) throw new Error(sessionError.message);

      const user = data.user;
      const appUser: UserProfile = {
        id: user.id,
        phoneNumber: user.phone ?? '',
        email: user.email ?? undefined,
        name: (user.user_metadata?.full_name as string | undefined)
          || name.trim()
          || user.email?.split('@')[0]
          || 'AutoEarn User',
        createdAt: new Date(user.created_at).getTime(),
        isVerified: true,
        kycStatus: 'unverified',
      };

      onLoginSuccess(appUser, data.session.access_token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto move to next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }

    // Auto verify if completed
    const fullCode = newOtp.join('');
    if (fullCode.length === 6 && !newOtp.includes('')) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {step === 'input' ? 'Secure OTP Authentication' : 'Verify One-Time Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'input' 
              ? 'Sign in to the AutoEarnAI content and strategy workspace'
              : `6-digit security code sent to ${phoneOrEmail}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Phone / Email Input */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Phone vs Email Toggle */}
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthType('phone'); setPhoneOrEmail(''); }}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authType === 'phone'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => { setAuthType('email'); setPhoneOrEmail(''); }}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authType === 'email'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Email OTP
              </button>
            </div>

            {/* Name (Optional) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Primary Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {authType === 'phone' ? 'Mobile Number' : 'Email Address'}
              </label>
              <div className="relative">
                {authType === 'phone' && (
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                    +91
                  </span>
                )}
                <input
                  type={authType === 'phone' ? 'tel' : 'email'}
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  placeholder={authType === 'phone' ? '98765 43210' : 'trader@example.com'}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                    authType === 'phone' ? 'pl-12 pr-3.5' : 'px-3.5'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">A verification code is sent by the configured Supabase Auth email/SMS provider. AutoEarnAI never displays or returns the code.</p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-5">
            {/* Real OTP delivery status */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Verification code sent
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Enter the 6-digit code delivered by Supabase Auth. AutoEarnAI never receives or displays the OTP.
              </div>
            </div>

            {/* 6 Digit Inputs */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 text-center">
                Enter 6-Digit Verification Code
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            {/* Resend & Change Number */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="hover:text-slate-200 underline"
              >
                Change Number
              </button>
              <div>
                {resendTimer > 0 ? (
                  <span>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Login to Portal</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
