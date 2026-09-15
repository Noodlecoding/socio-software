import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, AffiliateStats } from '../types';
import { ArrowRight, ArrowLeft, Copy, Check, Users, TrendingUp, DollarSign } from 'lucide-react';

interface AffiliatePageProps {
  user: UserProfile | null;
}

const generateReferralCode = () => crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();

async function ensureAffiliateRow(user: UserProfile): Promise<string | null> {
  const { data: existing } = await supabase
    .from('affiliates')
    .select('referral_code')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing.referral_code;

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateReferralCode();
    const { error } = await supabase.from('affiliates').insert({
      id: user.id,
      full_name: user.name,
      email: user.email,
      referral_code: code
    });
    if (!error) return code;
    if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
      console.error('Failed to create affiliate:', error.message);
      return null;
    }
  }
  return null;
}

const STEPS = [
  {
    title: 'Earn 23% commission',
    body: "Know a business that needs software built? Send them our way. When a deal you referred closes, you get 23% of what they pay — no cap, no catch."
  },
  {
    title: 'Get your own referral link',
    body: 'Once you sign up, you get a unique link. Share it anywhere — anyone who signs up through it is automatically tracked as your referral.'
  },
  {
    title: 'We handle the rest',
    body: "You don't need to sell anything. Once someone signs up through your link, our team takes the conversation from there — scoping, pricing, and building."
  },
  {
    title: 'Track it all in your dashboard',
    body: "See exactly how many leads you've sent, how many turned into paid deals, and how much commission you've earned — updated in real time."
  }
];

export const AffiliatePage: React.FC<AffiliatePageProps> = ({ user }) => {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const [isCheckingAffiliate, setIsCheckingAffiliate] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isBecoming, setIsBecoming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      setReferralCode(null);
      setStats(null);
      return;
    }

    let cancelled = false;
    setIsCheckingAffiliate(true);

    supabase
      .from('affiliates')
      .select('referral_code')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setReferralCode(data?.referral_code ?? null);
        setIsCheckingAffiliate(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !referralCode) return;

    let cancelled = false;
    supabase
      .from('affiliate_stats')
      .select('*')
      .eq('affiliate_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setStats({
          affiliateId: data.affiliate_id,
          referralCode: data.referral_code,
          leadsCount: data.leads_count,
          dealsClosed: data.deals_closed,
          totalDealValue: Number(data.total_deal_value),
          commissionOwed: Number(data.commission_owed)
        });
      });

    return () => {
      cancelled = true;
    };
  }, [user, referralCode]);

  const handleBecomeAffiliate = async () => {
    if (!user) return;
    setIsBecoming(true);
    const code = await ensureAffiliateRow(user);
    setIsBecoming(false);
    if (code) setReferralCode(code);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      setIsSubmitting(false);
      if (error) {
        setAuthError(error.message);
        return;
      }
      if (!data.session) {
        setNeedsEmailConfirmation(true);
        return;
      }
      if (data.user) {
        const code = await ensureAffiliateRow({
          id: data.user.id,
          name: fullName,
          email,
          organization: '',
          initials: '',
          selectedModel: 'core-workflow'
        });
        if (code) setReferralCode(code);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setIsSubmitting(false);
      if (error) {
        setAuthError(error.message);
        return;
      }
      if (data.user) {
        const code = await ensureAffiliateRow({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || fullName,
          email,
          organization: '',
          initials: '',
          selectedModel: 'core-workflow'
        });
        if (code) setReferralCode(code);
      }
    }
  };

  const referralLink = referralCode
    ? `${window.location.origin}${window.location.pathname}?ref=${referralCode}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing we can do
    }
  };

  // Dashboard: logged in and already an affiliate
  if (user && referralCode) {
    return (
      <main className="w-full pt-32 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd]">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Affiliate Dashboard</span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user.name}</h1>
          <p className="text-slate-600 mt-2">Share your link below. You earn 23% of the value of any deal that closes from it.</p>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-700 truncate">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <Users className="w-5 h-5 text-blue-600 mb-3" />
              <div className="text-2xl font-extrabold text-slate-900">{stats?.leadsCount ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">Leads referred</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <TrendingUp className="w-5 h-5 text-blue-600 mb-3" />
              <div className="text-2xl font-extrabold text-slate-900">{stats?.dealsClosed ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">Deals closed</div>
            </div>
            <div className="bg-white border-2 border-blue-600 rounded-2xl p-6">
              <DollarSign className="w-5 h-5 text-blue-600 mb-3" />
              <div className="text-2xl font-extrabold text-blue-600">
                ${(stats?.commissionOwed ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">Commission owed (23%)</div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-6">
            Stats update once our team records a closed deal. Questions about a payout? Reach us at{' '}
            <a href="mailto:direct@socio.com" className="text-blue-600 hover:underline">direct@socio.com</a>.
          </p>
        </div>
      </main>
    );
  }

  // Logged in, but not yet registered as an affiliate
  if (user && !isCheckingAffiliate) {
    return (
      <main className="w-full pt-32 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd] flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Affiliate Program</span>
          <h1 className="font-display text-xl font-bold text-slate-900">Become an affiliate as {user.name}?</h1>
          <p className="text-sm text-slate-600 mt-2">
            You're already signed in. Register this account as an affiliate to get your referral link and start earning 23% commission.
          </p>
          <button
            onClick={handleBecomeAffiliate}
            disabled={isBecoming}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isBecoming ? 'Setting up...' : 'Become an Affiliate'}
          </button>
        </div>
      </main>
    );
  }

  // Not logged in: 5-step onboarding, last step is the login/signup form
  const isLastStep = step === 4;

  return (
    <main className="w-full pt-32 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd] flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Step progress */}
        <div className="flex items-center gap-1.5 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {!isLastStep ? (
            <>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">
                Step {step + 1} of 5
              </span>
              <h1 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                {STEPS[step].title}
              </h1>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{STEPS[step].body}</p>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-0 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep((s) => Math.min(4, s + 1))}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : needsEmailConfirmation ? (
            <div className="text-center py-4">
              <Check className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h2 className="font-display text-lg font-bold text-slate-900">Check your inbox</h2>
              <p className="text-sm text-slate-600 mt-2">
                We sent a confirmation link to {email}. Confirm it, then sign in here to get your referral link.
              </p>
            </div>
          ) : (
            <>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Step 5 of 5</span>
              <h1 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'signup' ? 'Create your affiliate account' : 'Sign in'}
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                {mode === 'signup'
                  ? "Last step — create an account and we'll generate your referral link."
                  : 'Already an affiliate? Sign in to see your link and stats.'}
              </p>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3 mt-4">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3 mt-4">
                {mode === 'signup' && (
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    required
                    type="text"
                  />
                )}
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  type="email"
                />
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={8}
                  type="password"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer mt-1"
                >
                  {isSubmitting ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => {
                    setAuthError(null);
                    setMode(mode === 'signup' ? 'signin' : 'signup');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {mode === 'signup' ? 'Already an affiliate? Sign in' : 'Need an account? Sign up'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
