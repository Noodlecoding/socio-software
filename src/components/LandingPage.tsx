import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EngagementModelId, UserProfile } from '../types';
import type { AppView } from '../App';
import { SOCIO_LOGO_URL, PAST_PROJECTS } from '../data/initialData';
import { supabase } from '../lib/supabaseClient';
import { checkAuthRateLimit, RATE_LIMIT_MESSAGE } from '../lib/rateLimit';
import {
  Zap,
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowUpRight,
  X
} from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

// Skips the "check your inbox" confirmation link for client signups, same as
// affiliate signups — reuses the same edge function (its logic isn't
// affiliate-specific: it just verifies the caller's own email matches the
// account and confirms it), then signs them in immediately.
async function confirmClientEmail(userId: string, email: string): Promise<boolean> {
  const { error } = await supabase.functions.invoke('confirm-affiliate-email', { body: { userId, email } });
  if (error) {
    console.error('Failed to auto-confirm client email:', error);
    return false;
  }
  return true;
}

interface LandingPageProps {
  user: UserProfile | null;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onStartAudit: (modelId?: EngagementModelId) => void;
  onNavigate: (view: AppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  user,
  onUpdateUser,
  onStartAudit,
  onNavigate
}) => {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [selectedModel, setSelectedModel] = useState<EngagementModelId>(user?.selectedModel || 'core-workflow');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEmailFormOpen, setIsEmailFormOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    const allowed = await checkAuthRateLimit(email, mode === 'signup' ? 'signup' : 'signin');
    if (!allowed) {
      setIsSubmitting(false);
      setAuthError(RATE_LIMIT_MESSAGE);
      return;
    }

    if (mode === 'signup') {
      let referredBy: string | null = null;
      try {
        referredBy = localStorage.getItem('pendingReferralCode');
      } catch {
        // localStorage unavailable — no referral attribution
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            selected_model: selectedModel,
            referred_by: referredBy,
            account_type: 'client'
          }
        }
      });

      if (error) {
        setIsSubmitting(false);
        setAuthError(error.message);
        return;
      }

      // No confirmation email for clients: if the project requires email
      // confirmation (so signUp didn't return a session), have the edge
      // function confirm it immediately, then sign in right away.
      if (!data.session && data.user) {
        const confirmed = await confirmClientEmail(data.user.id, email);
        if (!confirmed) {
          setIsSubmitting(false);
          setAuthError('Could not finish setting up your account. Please try again in a moment.');
          return;
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        setIsSubmitting(false);
        if (signInError) {
          setAuthError(signInError.message);
          return;
        }
        setShowSuccess(true);
        return;
      }

      setIsSubmitting(false);
      setShowSuccess(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      setIsSubmitting(false);

      if (error) {
        setAuthError(error.message);
        return;
      }

      setShowSuccess(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      setAuthError(error.message);
    }
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setIsEmailFormOpen(false);
  };

  return (
    <div className="w-full">
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />

      {/* Login / Signup Popup */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={closeLoginModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 relative my-8"
            >
              <button
                type="button"
                onClick={closeLoginModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center max-w-lg mx-auto mb-8">
                <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                  Create your account
                </h2>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Start discussing your project in minutes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"></path>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"></path>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {!isEmailFormOpen ? (
                <button
                  type="button"
                  onClick={() => setIsEmailFormOpen(true)}
                  className="w-full text-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer py-2"
                >
                  Log in with email
                </button>
              ) : (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
              <div className="relative flex items-center justify-center mb-6">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider absolute">
                  or with email
                </span>
              </div>

              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                {!showSuccess ? (
                  <div className="flex flex-col gap-4">
                    {authError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3">
                        {authError}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5" htmlFor="modal-client-email">
                        Work Email
                      </label>
                      <input
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                        id="modal-client-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="marcus@northline.com"
                        required
                        type="email"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block" htmlFor="modal-client-password">
                          {mode === 'signup' ? 'Create Password' : 'Password'}
                        </label>
                        {mode === 'signup' && <span className="text-[11px] text-slate-400 font-medium">Min 8 characters</span>}
                      </div>
                      <input
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm font-mono"
                        id="modal-client-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        minLength={8}
                        type="password"
                      />
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPasswordOpen(true)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer mt-1.5"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md text-sm cursor-pointer disabled:opacity-75"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        <span>
                          {isSubmitting
                            ? 'Setting up your workspace...'
                            : mode === 'signup'
                            ? 'Create Account & Get Started'
                            : 'Sign In'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-center pt-3 border-t border-slate-200/80 mt-1">
                      <span className="text-xs text-slate-500">
                        {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setMode(mode === 'signup' ? 'signin' : 'signup');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        {mode === 'signup' ? 'Sign in to Discussion Desk' : 'Create an account'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 animate-bounce">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="font-display text-lg font-bold text-slate-900">
                      {mode === 'signup' ? 'Account Created' : 'Welcome Back'}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Setting up your workspace and connecting you with Alexis Cervantes...
                    </p>
                  </div>
                )}
              </form>
              </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="w-full pt-20">

        {/* Hero Section */}
        <section className="w-full py-10 lg:py-14 px-6 lg:px-12 bg-gradient-to-b from-white via-blue-50/20 to-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Hero Left Column */}
            <div className="lg:col-span-7 flex flex-col items-start lg:pr-6">
              {/* Headline with elegant balance */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-900 leading-[1.12] tracking-tight">
                Custom software. <br className="hidden sm:inline" />
                <span className="text-blue-600 font-bold">Built for your needs, budget and timeframe</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl font-medium text-slate-800 mt-6 leading-snug max-w-xl">
                We scope first. You pay for what matters. No bloat, no surprises.
              </p>

              {/* Refined CTA buttons */}
              <div className="flex flex-wrap items-center gap-4 mt-10">
                <button
                  type="button"
                  onClick={() => (user ? onStartAudit() : setIsLoginModalOpen(true))}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md text-sm cursor-pointer"
                >
                  <span>Contact us in minutes</span>
                  <Zap className="w-4 h-4" />
                </button>
              </div>

              {/* Clean understated stats */}
              <div className="grid grid-cols-3 gap-8 pt-10 mt-10 border-t border-slate-100 w-full max-w-lg">
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">1-3 Days</div>
                  <div className="text-xs text-slate-400 font-medium mt-1">Average diagnostic</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">100%</div>
                  <div className="text-xs text-slate-400 font-medium mt-1">Code &amp; IP retained</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 tracking-tight">Your Budget</div>
                  <div className="text-xs text-slate-400 font-medium mt-1">We scope around it</div>
                </div>
              </div>
            </div>

            {/* Hero Right: Diagnostic Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 sm:p-9 flex flex-col gap-7">
                {/* Header */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">How It Works</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    Simple 3-Step Process
                  </span>
                </div>

                {/* Steps list */}
                <div className="flex flex-col gap-6">
                  {/* Step 1 */}
                  <div className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Understand What You Need</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        We dig into your goals, workflow and pain points to figure out exactly what to build.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Get a Clear Plan &amp; Timeline</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        We map out the exact solution and adapt it to your budget, timeframe and project. No confusing tech jargon, no hidden fees.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">We Build &amp; Hand It Over</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Ready to use in weeks. You fully own 100% of your software.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Outcome highlight */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100 mt-1">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">The Result</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">
                      Software that saves your team real time and pays for itself.
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (4 Simple Clean Steps) */}
        <section className="w-full py-24 px-6 lg:px-12 bg-white" id="how-it-works">
          <div className="max-w-7xl mx-auto flex flex-col gap-16">
            {/* Section Heading */}
            <div className="text-center max-w-3xl mx-auto" id="approach">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Our Methodology</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                A simple, predictable path to operating software.
              </h2>
              <p className="text-base text-slate-600 mt-3">
                Four clear steps from problem identification to full production handover.
              </p>
            </div>

            {/* 4 Step Cards Horizontal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <span className="text-3xl font-extrabold text-blue-600">01</span>
                  <h3 className="font-display text-lg font-bold text-slate-900 mt-4">We map your workflow</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Understand your daily workflow and shape the right solution based on your budget, timeframe and needs.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Workflow &amp; gap review</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <span className="text-3xl font-extrabold text-blue-600">02</span>
                  <h3 className="font-display text-lg font-bold text-slate-900 mt-4">We propose a solution</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Tell you what we'd build, how it works and delivery timeline.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Solution roadmap &amp; spec</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <span className="text-3xl font-extrabold text-blue-600">03</span>
                  <h3 className="font-display text-lg font-bold text-slate-900 mt-4">We build it</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Custom software, built for you.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Shipped in 2–4 weeks</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-7 flex flex-col justify-between hover:border-blue-300 transition-colors">
                <div>
                  <span className="text-3xl font-extrabold text-blue-600">04</span>
                  <h3 className="font-display text-lg font-bold text-slate-900 mt-4">You own it</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Training, handoff, done.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Full code repository &amp; keys</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Common Projects Section */}
        <section className="w-full py-24 px-6 lg:px-12 bg-slate-50 overflow-hidden" id="models">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div className="text-center max-w-3xl mx-auto px-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Common Projects</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                A few examples of what we've built.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mt-3">
                Client names stay private, but here's the kind of work we do — and there's no fixed price list. Tell us what you're solving for and your budget and we'll shape a plan around it.
              </p>
            </div>
          </div>

          {/* Auto-scrolling marquee of anonymized past projects */}
          <div className="mt-12 w-full">
            <div className="flex w-max gap-6 animate-marquee">
              {[...PAST_PROJECTS, ...PAST_PROJECTS].map((project, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-[280px] shrink-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{project.tag}</span>
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        project.scale === 'Quick Fix'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {project.scale}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 mt-1.5">{project.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{project.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto flex flex-col gap-12 mt-12">
            <p className="text-center text-xs text-slate-400">
              Details anonymized to protect client privacy. Your project won't look exactly like these — every plan and cost comes out of a conversation with us.
            </p>

            {/* Ownership Banner */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-700 text-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                <span>
                  <strong>100% Code Ownership:</strong> No recurring user licenses or vendor lock-in. You own everything we build.
                </span>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shrink-0">
                Complete IP &amp; Code Handover
              </span>
            </div>
          </div>
        </section>

        {/* Clean Direct Intake / Contact Card */}
        <section className="w-full py-24 px-6 lg:px-12 bg-white" id="get-started">
          <div className="max-w-xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="text-center max-w-lg mx-auto mb-8">
              <h2 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">
                Create your account
              </h2>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Start discussing your project in minutes.
              </p>
            </div>

            {/* Quick SSO Options */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                disabled={isSubmitting}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"></path>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"></path>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-slate-50 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider absolute">
                or with email
              </span>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              {!showSuccess ? (
                <div className="flex flex-col gap-4">
                  {authError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3">
                      {authError}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5" htmlFor="client-email">
                      Work Email
                    </label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                      id="client-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="marcus@northline.com"
                      required
                      type="email"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block" htmlFor="client-password">
                        {mode === 'signup' ? 'Create Password' : 'Password'}
                      </label>
                      {mode === 'signup' && <span className="text-[11px] text-slate-400 font-medium">Min 8 characters</span>}
                    </div>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm font-mono"
                      id="client-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={8}
                      type="password"
                    />
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPasswordOpen(true)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer mt-1.5"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md text-sm cursor-pointer disabled:opacity-75"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      <span>
                        {isSubmitting
                          ? 'Setting up your workspace...'
                          : mode === 'signup'
                          ? 'Create Account & Get Started'
                          : 'Sign In'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-center pt-3 border-t border-slate-200/80 mt-1">
                    <span className="text-xs text-slate-500">
                      {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null);
                        setMode(mode === 'signup' ? 'signin' : 'signup');
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      {mode === 'signup' ? 'Sign in to Discussion Desk' : 'Create an account'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Success State */
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 animate-bounce">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-slate-900">
                    {mode === 'signup' ? 'Account Created' : 'Welcome Back'}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Setting up your workspace and connecting you with Alexis Cervantes...
                  </p>
                </div>
              )}
            </form>
          </div>
        </section>
      </main>

      {/* Clean Blue & Slate Minimalist Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-slate-800">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <img src={SOCIO_LOGO_URL} alt="Socio" className="w-7 h-7 rounded-lg shadow-sm" />
                <span className="font-display text-xl font-bold text-white tracking-tight">Socio</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">Custom software. No fluff. Just results.</p>
            </div>
            <div className="flex flex-wrap gap-8 text-sm font-medium text-slate-300">
              <a className="hover:text-white transition-colors" href="#how-it-works">
                How It Works
              </a>
              <a className="hover:text-white transition-colors" href="#models">
                Engagement Models
              </a>
              <button
                onClick={() => onNavigate('affiliate')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Affiliates
              </button>
              <button
                onClick={() => onStartAudit()}
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Get started
              </button>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2025 Socio Software Inc. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <span>Budget-First Scoping</span>
              <span>•</span>
              <span>100% Client Code Ownership</span>
              <span className="hidden sm:inline">•</span>
              <button
                onClick={() => onNavigate('legal')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => onNavigate('legal')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
