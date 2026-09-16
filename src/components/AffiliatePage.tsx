import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { checkAuthRateLimit, RATE_LIMIT_MESSAGE } from '../lib/rateLimit';
import { rowToChatMessage } from '../lib/chat';
import { UserProfile, AffiliateStats, AffiliateReferredClient, ClientStatus, ChatMessage } from '../types';
import { ArrowRight, ArrowLeft, Copy, Check, Users, TrendingUp, DollarSign, LogOut, Target, ChevronRight, Send, MessageCircle } from 'lucide-react';
import { AffiliateLeadGuide } from './AffiliateLeadGuide';

interface AffiliatePageProps {
  user: UserProfile | null;
  onSignOut: () => void;
}

const generateReferralCode = () => crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();

interface AffiliateDetails {
  age: number;
  country: string;
}

async function ensureAffiliateRow(user: UserProfile, details?: AffiliateDetails): Promise<string | null> {
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
      referral_code: code,
      age: details?.age ?? null,
      country: details?.country ?? null
    });
    if (!error) return code;
    if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
      console.error('Failed to create affiliate:', error.message);
      return null;
    }
  }
  return null;
}

// Skips the "check your inbox" confirmation link for affiliate signups by
// having a service-role edge function mark the email confirmed, then signs
// them in immediately. No-op (and harmless) if confirmation is already off
// at the project level. Client signups are untouched.
async function confirmAffiliateEmail(userId: string, email: string): Promise<boolean> {
  const { error } = await supabase.functions.invoke('confirm-affiliate-email', { body: { userId, email } });
  if (error) {
    console.error('Failed to auto-confirm affiliate email:', error);
    return false;
  }
  return true;
}

const MIN_AFFILIATE_AGE = 18;

const STEPS = [
  {
    title: 'Earn money remotely',
    body: "This is fully remote — no office, no set hours. If you know business owners who might need custom software, send us their name or connect us. That's it. You don't need any sales or tech experience."
  },
  {
    title: 'Earn 23% commission',
    body: "Know a business that needs software built? Send them our way. When a deal you referred closes, you get 23% of what they pay in USD. No cap, no catch."
  },
  {
    title: 'Get your own referral link',
    body: 'Once you sign up, you get a unique link. Share it anywhere — anyone who signs up through it is automatically tracked as your referral.'
  },
  {
    title: 'We handle the rest',
    body: "You don't need to sell anything. Once someone signs up through your link, our team takes the conversation from there — scoping, pricing and building."
  },
  {
    title: 'Track it all in your dashboard',
    body: "See exactly how many leads you've sent, how many turned into paid deals and how much commission you've earned — updated in real time."
  }
];

export const AffiliatePage: React.FC<AffiliatePageProps> = ({ user, onSignOut }) => {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isCheckingAffiliate, setIsCheckingAffiliate] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isBecoming, setIsBecoming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leadsSlider, setLeadsSlider] = useState(3);
  const [showLeadGuide, setShowLeadGuide] = useState(false);

  const [ageInput, setAgeInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [becomeAffiliateError, setBecomeAffiliateError] = useState<string | null>(null);

  const AVG_DEAL_VALUE = 2500;
  const COMMISSION_RATE = 0.23;
  const projectedEarnings = leadsSlider * AVG_DEAL_VALUE * COMMISSION_RATE;

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

  const [referredClients, setReferredClients] = useState<AffiliateReferredClient[]>([]);

  useEffect(() => {
    if (!user || !referralCode) return;

    let cancelled = false;

    const loadStats = () => {
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
            totalCommissionEarned: Number(data.total_commission_earned),
            paidOut: Number(data.paid_out),
            commissionOwed: Number(data.commission_owed)
          });
        });
    };

    const loadReferredClients = () => {
      supabase
        .from('affiliate_referred_clients')
        .select('*')
        .eq('affiliate_id', user.id)
        .order('client_since', { ascending: false })
        .then(({ data, error }) => {
          if (cancelled || error || !data) return;
          setReferredClients(
            data.map((row: any) => ({
              userId: row.user_id,
              affiliateId: row.affiliate_id,
              fullName: row.full_name || 'Unnamed client',
              organization: row.organization || '',
              status: row.status as ClientStatus,
              dealValue: row.deal_value != null ? Number(row.deal_value) : null,
              clientSince: row.client_since,
              commissionContribution: Number(row.commission_contribution)
            }))
          );
        });
    };

    loadStats();
    loadReferredClients();

    // Live-refresh whenever the admin marks a referred client's status or
    // deal value — both feed directly into deals closed / commission owed.
    const channel = supabase
      .channel(`affiliate-stats:${referralCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `referred_by=eq.${referralCode}` },
        () => {
          loadStats();
          loadReferredClients();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, referralCode]);

  // Contact Alexis chat: same public.messages table/mechanics the client
  // Discussion Desk uses, scoped to this affiliate's own user_id.
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatStreamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !referralCode) return;

    let cancelled = false;
    setIsLoadingChat(true);

    supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setChatMessages(data.map(rowToChatMessage));
        setIsLoadingChat(false);
      });

    const channel = supabase
      .channel(`affiliate-chat:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const incoming = rowToChatMessage(payload.new as any);
          setChatMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, referralCode]);

  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTo({ top: chatStreamRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChatMessage = async () => {
    const content = chatInput.trim();
    if (!content || !user) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      senderName: user.name,
      senderInitials: user.initials,
      text: content,
      timestamp: 'Just now'
    };
    setChatMessages((prev) => [...prev, message]);
    setChatInput('');

    const { error } = await supabase.from('messages').insert({
      id: message.id,
      user_id: user.id,
      sender: 'user',
      sender_name: user.name,
      sender_initials: user.initials,
      text: content
    });
    if (error) console.error('Failed to send message:', error.message);
  };

  const handleBecomeAffiliate = async () => {
    if (!user) return;
    setBecomeAffiliateError(null);

    const age = Number(ageInput);
    if (!ageInput.trim() || !Number.isInteger(age) || age <= 0) {
      setBecomeAffiliateError('Enter your age.');
      return;
    }
    if (age < MIN_AFFILIATE_AGE) {
      setBecomeAffiliateError('You must be at least 18 years old to join the affiliate program.');
      return;
    }
    if (!countryInput.trim()) {
      setBecomeAffiliateError('Enter your country.');
      return;
    }

    setIsBecoming(true);
    const code = await ensureAffiliateRow(user, { age, country: countryInput.trim() });
    setIsBecoming(false);
    if (code) setReferralCode(code);
    else setBecomeAffiliateError('Something went wrong. Please try again.');
  };

  // Google can't be tagged account_type='affiliate' at signup like the
  // email/password form (no custom metadata support for OAuth), so a
  // server-verified claim runs after the redirect back — see
  // claim_affiliate_account() and App.tsx's SIGNED_IN handler.
  const handleGoogleAuth = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${window.location.pathname}?view=affiliate` }
    });
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, account_type: 'affiliate' } }
      });

      if (error) {
        setIsSubmitting(false);
        setAuthError(error.message);
        return;
      }

      // No confirmation email for affiliates: if the project requires email
      // confirmation (so signUp didn't return a session), have the edge
      // function confirm it immediately, then sign in right away.
      if (!data.session && data.user) {
        const confirmed = await confirmAffiliateEmail(data.user.id, email);
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
        return;
      }

      setIsSubmitting(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setIsSubmitting(false);
      if (error) {
        setAuthError(error.message);
        return;
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
    if (showLeadGuide) {
      return <AffiliateLeadGuide referralLink={referralLink} onBack={() => setShowLeadGuide(false)} />;
    }
    return (
      <main className="w-full pt-32 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Affiliate Dashboard</span>
              <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user.name}</h1>
            </div>
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 py-1.5 px-3 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
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
              <div className="text-xs text-slate-500 mt-1">Commission owed (23%, USD)</div>
            </div>
          </div>

          {/* Per-client breakdown — each referred client contributes separately, not one combined total */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-display text-sm font-bold text-slate-900">Your Referred Clients</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {referredClients.length === 0
                  ? 'No referrals yet'
                  : `${referredClients.length} client${referredClients.length === 1 ? '' : 's'} referred`}
              </p>
            </div>
            {referredClients.length === 0 ? (
              <div className="p-4 text-xs text-slate-400">Share your link to start referring clients.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-4 py-2.5">Client</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Deal Value</th>
                      <th className="px-4 py-2.5 text-right">Your Commission</th>
                      <th className="px-4 py-2.5 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Payouts are only tracked as one running total per
                      // affiliate (paid_out), not itemized per client, so
                      // this allocates it across clients oldest-referral-first
                      // for display — a reasonable "paid off in order"
                      // assumption, not a separate source of truth.
                      let remainingPaidOut = stats?.paidOut ?? 0;
                      const rows = [...referredClients].sort(
                        (a, b) => new Date(a.clientSince).getTime() - new Date(b.clientSince).getTime()
                      );
                      const amountPaidByClient = new Map<string, number>();
                      for (const c of rows) {
                        const paid = Math.min(remainingPaidOut, c.commissionContribution);
                        amountPaidByClient.set(c.userId, paid);
                        remainingPaidOut -= paid;
                      }
                      return referredClients.map((c) => {
                        const amountPaid = amountPaidByClient.get(c.userId) ?? 0;
                        return (
                          <tr key={c.userId} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-2.5">
                              <div className="font-semibold text-slate-900">{c.fullName}</div>
                              {c.organization && <div className="text-[11px] text-slate-400">{c.organization}</div>}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                  c.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : c.status === 'interested'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {c.status === 'paid' ? 'Paid' : c.status === 'interested' ? 'Interested' : 'New Client'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-slate-700">
                              {c.dealValue != null ? `$${c.dealValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-blue-600">
                              {c.commissionContribution > 0
                                ? `$${c.commissionContribution.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">
                              {amountPaid > 0
                                ? `$${amountPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                : '—'}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Contact Alexis */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">Contact Alexis</h3>
                <p className="text-[11px] text-slate-500">Questions about a referral, payout, or anything else</p>
              </div>
            </div>

            <div ref={chatStreamRef} className="max-h-80 overflow-y-auto custom-scroll flex flex-col gap-3 p-4 bg-[#fbfcfe]">
              {isLoadingChat ? (
                <div className="text-xs text-slate-400">Loading conversation...</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-xs text-slate-400">No messages yet — say hello.</div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender === 'user';
                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start'}`}>
                      <div
                        className={`text-sm rounded-2xl p-3 leading-relaxed whitespace-pre-wrap break-words ${
                          isMe ? 'bg-blue-600 text-white rounded-tr-xs' : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isMe ? 'You' : 'Alexis Cervantes'} · {msg.timestamp}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void handleSendChatMessage();
                  }
                }}
                placeholder="Message Alexis..."
                rows={2}
                className="flex-1 text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-600 resize-none"
              />
              <button
                onClick={() => void handleSendChatMessage()}
                disabled={!chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>

          {/* Higher-ticket clients = higher commission */}
          <button
            type="button"
            onClick={() => setShowLeadGuide(true)}
            className="w-full bg-white border border-slate-200 rounded-2xl p-6 mt-6 flex items-center justify-between gap-4 text-left cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">Proven ways to find high-quality leads</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bigger clients pay you more — here's how to find them</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <p className="text-xs text-slate-400 mt-6">
            Stats update once our team records a closed deal. Questions about a payout? Reach us at{' '}
            <a href="mailto:direct@socio.com" className="text-blue-600 hover:underline">direct@socio.com</a>.
          </p>
        </div>
      </main>
    );
  }

  // Logged in with a client account: client and affiliate accounts must stay
  // separate, so this account can never register as an affiliate too.
  if (user && !isCheckingAffiliate && user.accountType === 'client') {
    return (
      <main className="w-full pt-32 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd] flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Affiliate Program</span>
          <h1 className="font-display text-xl font-bold text-slate-900">This account is already a client account</h1>
          <p className="text-sm text-slate-600 mt-2">
            {user.name} is signed in with a client account, so it can't also register as an affiliate. Sign up for the affiliate program with a different email instead.
          </p>
          <button
            onClick={onSignOut}
            className="w-full mt-5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 py-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
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
            You're already signed in. Just confirm a couple details to register this account as an affiliate and get your referral link.
          </p>

          {becomeAffiliateError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3 mt-4 text-left">
              {becomeAffiliateError}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-5 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Age <span className="normal-case text-slate-400 font-medium">(must be 18+)</span>
              </label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                placeholder="18"
                inputMode="numeric"
                type="number"
                min={0}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">Country</label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                placeholder="United States"
                type="text"
              />
            </div>
          </div>

          <button
            onClick={handleBecomeAffiliate}
            disabled={isBecoming}
            className="w-full mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isBecoming ? 'Setting up...' : 'Become an Affiliate'}
          </button>
          <button
            onClick={onSignOut}
            className="w-full mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 py-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </main>
    );
  }

  // Not logged in: 5-step onboarding, last step is the login/signup form
  const isLastStep = step === 5;

  return (
    <main className="w-full pt-32 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd] flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Step progress */}
        <div className="flex items-center gap-1.5 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          {!isLastStep ? (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">
                Step {step + 1} of 6
              </span>
              <h1 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                {STEPS[step].title}
              </h1>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{STEPS[step].body}</p>

              {step === 1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-500">If you send us</span>
                    <span className="text-xs font-semibold text-slate-500">avg. $2,500 USD per client</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="font-display text-3xl font-extrabold text-slate-900">
                      {leadsSlider}{leadsSlider === 5 ? '+' : ''}
                    </span>
                    <span className="text-sm text-slate-500"> confirmed {leadsSlider === 1 ? 'lead' : 'leads'}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={leadsSlider}
                    onChange={(e) => setLeadsSlider(Number(e.target.value))}
                    className="w-full mt-3 accent-blue-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-0.5">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5+</span>
                  </div>
                  <div className="text-center mt-4 pt-4 border-t border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">You could earn</span>
                    <span className="font-display text-3xl font-extrabold text-blue-600">
                      ${projectedEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      {leadsSlider === 5 ? '+' : ''} USD
                    </span>
                  </div>
                </div>
              )}

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
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Step 6 of 6</span>
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

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer mt-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"></path>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"></path>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
                  or with email
                </span>
              </div>

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
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
                  onClick={() => setStep(4)}
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
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </main>
  );
};
