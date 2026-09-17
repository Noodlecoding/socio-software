import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { checkAuthRateLimit, RATE_LIMIT_MESSAGE } from '../lib/rateLimit';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'email' | 'code' | 'password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const allowed = await checkAuthRateLimit(email, 'password_reset');
    if (!allowed) {
      setIsSubmitting(false);
      setError(RATE_LIMIT_MESSAGE);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    setIsSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setStep('code');
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    setIsSubmitting(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setStep('password');
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setIsSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setStep('success');
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'email' && (
          <>
            <h2 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">Reset your password</h2>
            <p className="text-sm text-slate-600 mt-2">Enter your email and we'll send you a verification code.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3 mt-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSendCode} className="flex flex-col gap-3 mt-4">
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                type="email"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer"
              >
                <span>{isSubmitting ? 'Sending...' : 'Send code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <h2 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">Enter verification code</h2>
            <p className="text-sm text-slate-600 mt-2">We sent a code to {email}. Enter it below.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3 mt-4">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="flex flex-col gap-3 mt-4">
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm font-mono tracking-widest text-center"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                inputMode="numeric"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer"
              >
                <span>{isSubmitting ? 'Verifying...' : 'Verify code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Use a different email
              </button>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            <h2 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">Set a new password</h2>
            <p className="text-sm text-slate-600 mt-2">Choose a new password for your account.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3 mt-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSetNewPassword} className="flex flex-col gap-3 mt-4">
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm font-mono"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                required
                minLength={8}
                type="password"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer"
              >
                <span>{isSubmitting ? 'Saving...' : 'Save new password'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-display text-lg font-bold text-slate-900">Password updated</h4>
            <p className="text-sm text-slate-600 mt-1">You're signed in with your new password.</p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
