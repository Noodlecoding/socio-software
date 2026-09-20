import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabaseClient';
import { checkAuthRateLimit, RATE_LIMIT_MESSAGE } from '../lib/rateLimit';
import { rowToChatMessage } from '../lib/chat';
import { UserProfile, AffiliateStats, AffiliateReferredClient, ClientStatus, ChatMessage } from '../types';
import {
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Users,
  TrendingUp,
  DollarSign,
  LogOut,
  Target,
  ChevronRight,
  Send,
  MessageCircle,
  X,
  Share2,
  Laptop,
  Link2,
  CheckCircle2,
  BarChart3,
  Compass,
  UserPlus
} from 'lucide-react';
import { AffiliateLeadGuide } from './AffiliateLeadGuide';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { LanguageSwitcher } from './Navbar';
import { useLanguage } from '../lib/i18n';

interface AffiliatePageProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onOnboardingStepChange?: (step: number | null) => void;
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

const STEPS_EN = [
  {
    icon: Laptop,
    title: 'Turn client referrals into revenue for your agency',
    body: "**No exclusivity, no added workload for your team.**\nWhen a client of yours could use custom software, just connect us.\n**You don't need any sales or tech experience.**"
  },
  {
    icon: DollarSign,
    title: 'Earn 23% commission',
    body: "**Contact businesses that need software built. Send them our way.**\nWhen a deal you referred closes, you get **23% of what they pay in USD**.\n**No cap, no catch.**"
  },
  {
    icon: Link2,
    title: 'Get your own referral link',
    body: "Once you sign up, you get a **unique referral link**.\nShare it anywhere. Anyone who signs up through it is automatically tracked as your referral."
  },
  {
    icon: CheckCircle2,
    title: 'We handle the rest',
    body: "**You don't need to sell anything.**\nOnce someone signs up through your link, our team takes the conversation from there: scoping, pricing and building."
  },
  {
    icon: BarChart3,
    title: 'Track it all in your dashboard',
    body: "See exactly how many **leads you've sent**, how many turned into **paid deals** and how much **commission you've earned**, updated in real time."
  },
  {
    icon: Compass,
    title: 'Get help finding leads',
    body: "Your dashboard has a full playbook of proven ways to find high-quality leads.\nOn average, growth partners land between **0 and 3 confirmed clients per month**. The playbook is there to help you push toward the higher end of that."
  }
];

const STEPS_ES = [
  {
    icon: Laptop,
    title: 'Convierte tus referidos en ingresos para tu agencia',
    body: "**Sin exclusividad, sin carga extra para tu equipo.**\nCuando un cliente tuyo necesite software a medida, solo conéctanos con él.\n**No necesitas experiencia en ventas ni en tecnología.**"
  },
  {
    icon: DollarSign,
    title: 'Gana 23% de comisión',
    body: "**Contacta negocios que necesiten software a medida. Envíalos con nosotros.**\nCuando un acuerdo que referiste se cierra, obtienes el **23% de lo que paguen en USD**.\n**Sin tope, sin trampa.**"
  },
  {
    icon: Link2,
    title: 'Obtén tu propio enlace de referido',
    body: "Al registrarte, obtienes un **enlace de referido único**.\nCompártelo donde quieras. Cualquiera que se registre a través de él queda automáticamente registrado como tu referido."
  },
  {
    icon: CheckCircle2,
    title: 'Nosotros nos encargamos del resto',
    body: "**No necesitas vender nada.**\nUna vez que alguien se registra con tu enlace, nuestro equipo toma la conversación desde ahí: alcance, precio y construcción."
  },
  {
    icon: BarChart3,
    title: 'Rastrea todo en tu panel',
    body: "Mira exactamente cuántos **prospectos has enviado**, cuántos se convirtieron en **acuerdos pagados** y cuánta **comisión has ganado**, actualizado en tiempo real."
  },
  {
    icon: Compass,
    title: 'Obtén ayuda para encontrar prospectos',
    body: "Tu panel tiene un manual completo de formas comprobadas para encontrar prospectos de alta calidad.\nEn promedio, los socios de crecimiento consiguen entre **0 y 3 clientes confirmados al mes**. El manual está ahí para ayudarte a llegar al extremo más alto de ese rango."
  }
];

const renderStepBody = (text: string) =>
  text.split('\n').map((line, i) => (
    <p key={i} className={i === 0 ? '' : 'mt-2'}>
      {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </p>
  ));

export const AffiliatePage: React.FC<AffiliatePageProps> = ({ user, onSignOut, onOnboardingStepChange }) => {
  const { t, language } = useLanguage();
  const STEPS = language === 'es' ? STEPS_ES : STEPS_EN;
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    onOnboardingStepChange?.(user ? null : step);
    return () => onOnboardingStepChange?.(null);
  }, [user, step, onOnboardingStepChange]);

  const [isCheckingAffiliate, setIsCheckingAffiliate] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isBecoming, setIsBecoming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leadsSlider, setLeadsSlider] = useState(3);
  const [showLeadGuide, setShowLeadGuide] = useState(false);
  const [showRecruitPrompt, setShowRecruitPrompt] = useState(false);

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
            commissionOwed: Number(data.commission_owed),
            clickCount: data.click_count ?? 0
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
    // Also refresh on the affiliate's own row changing (link clicks, payouts).
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
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'affiliates', filter: `id=eq.${user.id}` },
        () => loadStats()
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
      setBecomeAffiliateError(t('affiliate.becomeAffiliate.errorEnterAge'));
      return;
    }
    if (age < MIN_AFFILIATE_AGE) {
      setBecomeAffiliateError(t('affiliate.becomeAffiliate.errorMinAge'));
      return;
    }
    if (!countryInput.trim()) {
      setBecomeAffiliateError(t('affiliate.becomeAffiliate.errorEnterCountry'));
      return;
    }

    setIsBecoming(true);
    const code = await ensureAffiliateRow(user, { age, country: countryInput.trim() });
    setIsBecoming(false);
    if (code) setReferralCode(code);
    else setBecomeAffiliateError(t('affiliate.becomeAffiliate.errorGeneric'));
  };

  // Google can't be tagged account_type='affiliate' at signup like the
  // email/password form (no custom metadata support for OAuth), so a
  // server-verified claim runs after the redirect back — see
  // claim_affiliate_account() and App.tsx's SIGNED_IN handler.
  const handleGoogleAuth = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}?view=growth-partner`,
        // Without this, Google silently reuses whatever Google account is
        // already cached in the browser (e.g. the one used to sign up as a
        // client) instead of letting the person pick which email to use —
        // that's what was showing "already a client account" for people who
        // never intended to reuse that email.
        queryParams: { prompt: 'select_account' }
      }
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

  const AFFILIATE_SIGNUP_LINK = 'https://www.softwaresocio.com/?view=growth-partner';
  const RECRUIT_PROMPT_SEEN_KEY = 'seenGrowthPartnerRecruitPrompt';

  const handleOpenLeadGuide = () => {
    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(RECRUIT_PROMPT_SEEN_KEY) === 'true';
    } catch {
      // localStorage unavailable — treat as not yet seen
    }
    if (alreadySeen) {
      setShowLeadGuide(true);
    } else {
      setShowRecruitPrompt(true);
    }
  };

  const handleContinueFromRecruitPrompt = () => {
    try {
      localStorage.setItem(RECRUIT_PROMPT_SEEN_KEY, 'true');
    } catch {
      // localStorage unavailable — prompt will just show again next time
    }
    setShowRecruitPrompt(false);
    setShowLeadGuide(true);
  };

  const [programShareCopied, setProgramShareCopied] = useState(false);
  const handleShareProgram = async () => {
    const shareData = {
      title: 'Socio Growth Partner',
      text: t('affiliate.dashboard.recruitPromptShareText'),
      url: AFFILIATE_SIGNUP_LINK
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(AFFILIATE_SIGNUP_LINK);
      setProgramShareCopied(true);
      setTimeout(() => setProgramShareCopied(false), 2000);
    } catch {
      // user cancelled the share sheet or clipboard unavailable — nothing to do
    }
  };

  const handleShareAndContinue = async () => {
    const shareData = {
      title: 'Socio Growth Partner',
      text: t('affiliate.dashboard.recruitPromptShareText'),
      url: AFFILIATE_SIGNUP_LINK
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(AFFILIATE_SIGNUP_LINK);
      }
    } catch {
      // user cancelled the share sheet or clipboard unavailable — continue regardless
    }
    handleContinueFromRecruitPrompt();
  };

  // Dashboard: logged in and already an affiliate
  if (user && referralCode) {
    if (showLeadGuide) {
      return <AffiliateLeadGuide referralLink={referralLink} onBack={() => setShowLeadGuide(false)} />;
    }
    return (
      <main className="w-full pt-32 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd]">
        {showRecruitPrompt && (
          <div
            className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowRecruitPrompt(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowRecruitPrompt(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-4">
                <Share2 className="w-5 h-5" />
              </div>
              <h2 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">
                {t('affiliate.dashboard.recruitPromptTitle')}
              </h2>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                {t('affiliate.dashboard.recruitPromptBody')}
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mt-4">
                <span className="font-mono text-xs text-slate-600 truncate block">{AFFILIATE_SIGNUP_LINK}</span>
              </div>

              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                {t('affiliate.dashboard.recruitPromptNote')}
              </p>

              <div className="flex flex-col gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={handleShareAndContinue}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm text-sm cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  {t('affiliate.dashboard.recruitPromptShare')}
                </button>
                <button
                  type="button"
                  onClick={handleContinueFromRecruitPrompt}
                  className="w-full text-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer py-1"
                >
                  {t('affiliate.dashboard.recruitPromptNoThanks')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">{t('affiliate.dashboard.eyebrow')}</span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">{t('affiliate.dashboard.welcomeBack')}, {user.name}</h1>
          <p className="text-slate-600 mt-2">{t('affiliate.dashboard.shareLinkDesc')}</p>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-700 truncate">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('affiliate.dashboard.copied') : t('affiliate.dashboard.copyLink')}
            </button>
          </div>

          {/* Higher-ticket clients = higher commission */}
          <button
            type="button"
            onClick={handleOpenLeadGuide}
            className="w-full bg-white border border-slate-200 rounded-2xl p-6 mt-6 flex items-center justify-between gap-4 text-left cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">{t('affiliate.dashboard.leadsTitle')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('affiliate.dashboard.leadsSubtitle')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 mt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">{t('affiliate.dashboard.shareCardTitle')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('affiliate.dashboard.shareCardBody')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleShareProgram}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer shrink-0"
            >
              <Share2 className="w-4 h-4" />
              {programShareCopied ? t('affiliate.dashboard.shareCardCopied') : t('affiliate.dashboard.shareCardButton')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <Users className="w-5 h-5 text-blue-600 mb-3" />
              <div className="text-2xl font-extrabold text-slate-900">{stats?.leadsCount ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">{t('affiliate.dashboard.statLeads')}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <TrendingUp className="w-5 h-5 text-blue-600 mb-3" />
              <div className="text-2xl font-extrabold text-slate-900">{stats?.dealsClosed ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">{t('affiliate.dashboard.statDeals')}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <DollarSign className="w-5 h-5 text-blue-600 mb-3" />
              <div className="text-2xl font-extrabold text-slate-900">
                ${(stats?.paidOut ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">{t('affiliate.dashboard.statPayouts')}</div>
            </div>
          </div>

          {/* Per-client breakdown — each referred client contributes separately, not one combined total */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-display text-sm font-bold text-slate-900">{t('affiliate.dashboard.referredClientsTitle')}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {referredClients.length === 0
                  ? t('affiliate.dashboard.noReferralsYet')
                  : referredClients.length === 1
                  ? t('affiliate.dashboard.clientsReferredOne')
                  : t('affiliate.dashboard.clientsReferredOther').replace('{n}', String(referredClients.length))}
              </p>
            </div>
            {referredClients.length === 0 ? (
              <div className="p-4 text-xs text-slate-400">{t('affiliate.dashboard.shareLinkPrompt')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-4 py-2.5">{t('affiliate.dashboard.tableClient')}</th>
                      <th className="px-4 py-2.5">{t('affiliate.dashboard.tableStatus')}</th>
                      <th className="px-4 py-2.5 text-right">{t('affiliate.dashboard.tableDealValue')}</th>
                      <th className="px-4 py-2.5 text-right">{t('affiliate.dashboard.tableCommission')}</th>
                      <th className="px-4 py-2.5 text-right">{t('affiliate.dashboard.tableAmountPaid')}</th>
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
                                {c.status === 'paid'
                                  ? t('affiliate.dashboard.statusPaid')
                                  : c.status === 'interested'
                                  ? t('affiliate.dashboard.statusInterested')
                                  : t('affiliate.dashboard.statusNew')}
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
                <h3 className="font-display text-sm font-bold text-slate-900">{t('affiliate.dashboard.contactTitle')}</h3>
                <p className="text-[11px] text-slate-500">{t('affiliate.dashboard.contactSubtitle')}</p>
              </div>
            </div>

            <div ref={chatStreamRef} className="max-h-80 overflow-y-auto custom-scroll flex flex-col gap-3 p-4 bg-[#fbfcfe]">
              {isLoadingChat ? (
                <div className="text-xs text-slate-400">{t('affiliate.dashboard.loadingConversation')}</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-xs text-slate-400">{t('affiliate.dashboard.noMessagesYet')}</div>
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
                        {isMe ? t('affiliate.dashboard.youLabel') : t('affiliate.dashboard.adminLabel')} · {msg.timestamp}
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
                placeholder={t('affiliate.dashboard.messagePlaceholder')}
                rows={2}
                className="flex-1 text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-600 resize-none"
              />
              <button
                onClick={() => void handleSendChatMessage()}
                disabled={!chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {t('affiliate.dashboard.send')}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-6">
            {t('affiliate.dashboard.statsFooterNote')}{' '}
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
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">{t('affiliate.clientAccountBlock.eyebrow')}</span>
          <h1 className="font-display text-xl font-bold text-slate-900">{t('affiliate.clientAccountBlock.title')}</h1>
          <p className="text-sm text-slate-600 mt-2">
            {user.name} {t('affiliate.clientAccountBlock.desc')}
          </p>
          <button
            onClick={onSignOut}
            className="w-full mt-5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 py-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('nav.signOut')}
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
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">{t('affiliate.becomeAffiliate.eyebrow')}</span>
          <h1 className="font-display text-xl font-bold text-slate-900">{t('affiliate.becomeAffiliate.titlePrefix')} {user.name}?</h1>
          <p className="text-sm text-slate-600 mt-2">
            {t('affiliate.becomeAffiliate.desc')}
          </p>

          {becomeAffiliateError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3 mt-4 text-left">
              {becomeAffiliateError}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-5 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                {t('affiliate.becomeAffiliate.ageLabel')} <span className="normal-case text-slate-400 font-medium">{t('affiliate.becomeAffiliate.ageHint')}</span>
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
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">{t('affiliate.becomeAffiliate.countryLabel')}</label>
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                placeholder={t('affiliate.becomeAffiliate.countryPlaceholder')}
                type="text"
              />
            </div>
          </div>

          <button
            onClick={handleBecomeAffiliate}
            disabled={isBecoming}
            className="w-full mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isBecoming ? t('affiliate.becomeAffiliate.settingUp') : t('affiliate.becomeAffiliate.becomeButton')}
          </button>
          <button
            onClick={onSignOut}
            className="w-full mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 py-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('nav.signOut')}
          </button>
        </div>
      </main>
    );
  }

  // Not logged in: 5-step onboarding, last step is the login/signup form
  const isLastStep = step === 6;

  return (
    <main className="w-full pt-32 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd] flex items-center justify-center">
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
      <div className="max-w-md w-full">
        {/* Step progress */}
        <div className="flex items-center gap-1.5 mb-8">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
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
              {step !== 1 && (
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    {React.createElement(STEPS[step].icon, { className: 'w-5 h-5' })}
                  </div>
                  {step === 0 && <LanguageSwitcher />}
                </div>
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">
                {t('affiliate.onboarding.stepOf7Prefix')} {step + 1} {t('affiliate.onboarding.stepOf7Suffix')}
              </span>
              <h1 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                {STEPS[step].title}
              </h1>
              <div className="text-sm text-slate-600 mt-3 leading-relaxed">{renderStepBody(STEPS[step].body)}</div>

              {step === 1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-500">{t('affiliate.onboarding.leadsPrompt')}</span>
                    <span className="text-xs font-semibold text-slate-500">{t('affiliate.onboarding.avgDealValue')}</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="font-display text-3xl font-extrabold text-slate-900">
                      {leadsSlider}{leadsSlider === 5 ? '+' : ''}
                    </span>
                    <span className="text-sm text-slate-500"> {leadsSlider === 1 ? t('affiliate.onboarding.confirmedLeadSingular') : t('affiliate.onboarding.confirmedLeadPlural')}</span>
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
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('affiliate.onboarding.youCouldEarn')}</span>
                    <span className="font-display text-3xl font-extrabold text-blue-600">
                      ${projectedEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      {leadsSlider === 5 ? '+' : ''} USD/month
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
                  {t('affiliate.onboarding.back')}
                </button>
                <button
                  onClick={() => setStep((s) => Math.min(6, s + 1))}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer"
                >
                  {t('affiliate.onboarding.continue')}
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
              <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-4">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">{t('affiliate.onboarding.stepOf7Prefix')} 7 {t('affiliate.onboarding.stepOf7Suffix')}</span>
              <h1 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'signup' ? t('affiliate.onboarding.createAccountTitle') : t('affiliate.onboarding.signInTitle')}
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                {mode === 'signup'
                  ? t('affiliate.onboarding.createAccountSubtitle')
                  : t('affiliate.onboarding.signInSubtitle')}
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
                <span>{t('signupCard.google')}</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
                  {t('signupCard.orEmail')}
                </span>
              </div>

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
                {mode === 'signup' && (
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('affiliate.onboarding.fullNamePlaceholder')}
                    required
                    type="text"
                  />
                )}
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('affiliate.onboarding.emailPlaceholder')}
                  required
                  type="email"
                />
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-sm font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('affiliate.onboarding.passwordPlaceholder')}
                  required
                  minLength={8}
                  type="password"
                />
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer -mt-2 self-start"
                  >
                    {t('signupCard.forgotPassword')}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer mt-1"
                >
                  {isSubmitting ? t('affiliate.onboarding.pleaseWait') : mode === 'signup' ? t('affiliate.onboarding.createAccountButton') : t('signupCard.signIn')}
                </button>
              </form>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setStep(5)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('affiliate.onboarding.back')}
                </button>
                <button
                  onClick={() => {
                    setAuthError(null);
                    setMode(mode === 'signup' ? 'signin' : 'signup');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {mode === 'signup' ? t('affiliate.onboarding.alreadyPartnerSignIn') : t('affiliate.onboarding.needAccountSignUp')}
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
