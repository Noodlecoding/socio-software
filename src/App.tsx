/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DiscussionWorkspace } from './components/DiscussionWorkspace';
import { AdminDashboard } from './components/AdminDashboard';
import { AffiliatePage } from './components/AffiliatePage';
import { LegalPage } from './components/LegalPage';
import { ClientOnboardingModal } from './components/ClientOnboardingModal';
import { UserProfile, EngagementModelId, AccountType } from './types';
import { ADMIN_EMAIL } from './lib/constants';

export type AppView = 'landing' | 'workspace' | 'affiliate' | 'legal';

const deriveInitials = (name: string) => {
  const nameParts = name.trim().split(' ').filter(Boolean);
  return nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (name.slice(0, 2) || '??').toUpperCase();
};

async function loadUserProfile(session: Session): Promise<UserProfile> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization, country, selected_model, account_type')
    .eq('id', session.user.id)
    .single();

  const name = profile?.full_name || session.user.user_metadata?.full_name || session.user.email || 'there';
  const organization = profile?.organization || session.user.user_metadata?.organization || '';
  const country = profile?.country || '';
  const selectedModel = (profile?.selected_model || session.user.user_metadata?.selected_model || 'core-workflow') as EngagementModelId;
  const accountType = (profile?.account_type || 'client') as AccountType;

  return {
    id: session.user.id,
    name,
    organization,
    country,
    email: session.user.email || '',
    initials: deriveInitials(name),
    selectedModel,
    accountType
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  // True whenever the last message in this user's chat wasn't sent by them
  // (i.e. the architect/admin replied and they haven't responded yet).
  // Drives the red-dot nav indicator — cleared only by the user actually
  // sending a message, never by just opening the chat.
  const [hasNewMessage, setHasNewMessage] = useState(false);
  // Bumped whenever the navbar's "Sign in" is clicked, so LandingPage's
  // effect can pop the existing login modal open in signin mode instead of
  // scrolling to the signup section.
  const [signInRequestId, setSignInRequestId] = useState(0);
  const currentViewRef = useRef<AppView>('landing');
  // One-shot: true only when this page load is a real OAuth redirect back
  // from the affiliate page's "Continue with Google" button — not from
  // ordinary in-app navigation to /affiliate. Used to gate the affiliate
  // account claim below to just that moment.
  const oauthAffiliateRedirectRef = useRef(false);

  // Capture ?ref=CODE from an affiliate link so signup can attribute it later,
  // and restore ?view=affiliate after a full-page Google OAuth redirect.
  // Must run (and read window.location.search) before the URL-sync effect
  // below ever touches the URL, or it'd wipe these params before they're read.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    if (ref) {
      try {
        localStorage.setItem('pendingReferralCode', ref);
      } catch {
        // localStorage unavailable — referral attribution just won't happen
      }
    }

    if (params.get('view') === 'affiliate') {
      setCurrentView('affiliate');
      oauthAffiliateRedirectRef.current = true;
    }
  }, []);

  useEffect(() => {
    currentViewRef.current = currentView;

    // Keep the address bar's ?view= in sync with the current page (the app
    // has no client-side router — currentView is just React state — so
    // without this, every page shows the same bare URL, and links people
    // copy while on e.g. the Growth Partner page point at the homepage
    // instead). Only touches the 'view' key, never the whole query string,
    // so it can't clobber ?ref= from the effect above. replaceState, not
    // pushState: there's no other history-based navigation here, so
    // pushing would just make the back button confusing.
    const url = new URL(window.location.href);
    if (currentView === 'landing') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', currentView);
    }
    window.history.replaceState(null, '', url.toString());
  }, [currentView]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        setUser(await loadUserProfile(session));
      }
      setIsAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session) {
        let profile = await loadUserProfile(session);

        if (event === 'SIGNED_IN' && oauthAffiliateRedirectRef.current && profile.accountType === 'client') {
          oauthAffiliateRedirectRef.current = false;
          const { data: claimed } = await supabase.rpc('claim_affiliate_account');
          if (claimed) {
            profile = { ...profile, accountType: 'affiliate' };
          }
        }

        setUser(profile);
        if (event === 'SIGNED_IN') {
          const isAffiliateAccount = profile.accountType === 'affiliate' && profile.email !== ADMIN_EMAIL;
          if (isAffiliateAccount) {
            setCurrentView('affiliate');
          } else if (currentViewRef.current !== 'affiliate') {
            setCurrentView('workspace');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setUser(null);
        // Only force the landing page on an explicit sign-out. The initial
        // listener fire (event: 'INITIAL_SESSION') also lands here for any
        // signed-out visitor and has no session by definition — resetting
        // the view here would stomp on ?view=affiliate links landed on
        // before this listener ever fires.
        if (event === 'SIGNED_OUT') {
          setCurrentView('landing');
        }
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Track whether the admin has the last word in this user's chat, for the
  // red-dot nav indicator. Not relevant for the admin's own account.
  useEffect(() => {
    if (!user || isAdmin) {
      setHasNewMessage(false);
      return;
    }

    let isMounted = true;

    supabase
      .from('messages')
      .select('sender')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (isMounted) {
          setHasNewMessage(!!data && data.sender === 'architect');
        }
      });

    const channel = supabase
      .channel(`unread-indicator-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setHasNewMessage(payload.new.sender === 'architect');
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAdmin]);

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      if (updated.name) {
        next.initials = deriveInitials(updated.name);
      }
      return next;
    });
  };

  const handleStartAudit = (modelId?: EngagementModelId) => {
    if (modelId) {
      setUser((prev) => (prev ? { ...prev, selectedModel: modelId } : prev));
    }
    if (user) {
      setCurrentView('workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById('get-started');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSignInClick = () => {
    setCurrentView('landing');
    setSignInRequestId((id) => id + 1);
  };

  const handleNavigate = (view: AppView) => {
    if (view === 'workspace' && !user) {
      handleStartAudit();
      return;
    }
    if (view === 'workspace' && user && user.accountType === 'affiliate' && user.email !== ADMIN_EMAIL) {
      setCurrentView('affiliate');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fd] flex items-center justify-center text-slate-400 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-900 font-sans">
      <Navbar
        currentView={currentView === 'affiliate' || currentView === 'legal' ? currentView : user ? currentView : 'landing'}
        onNavigate={handleNavigate}
        hasNewMessage={hasNewMessage}
        user={user}
        onSignOut={handleSignOut}
        onSignInClick={handleSignInClick}
        isAdmin={isAdmin}
      />

      <AnimatePresence mode="wait">
        {currentView === 'legal' ? (
          <motion.div
            key="legal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <LegalPage onNavigate={handleNavigate} />
          </motion.div>
        ) : currentView === 'affiliate' || (user && user.accountType === 'affiliate' && !isAdmin) ? (
          <motion.div
            key="affiliate"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <AffiliatePage user={user} onSignOut={handleSignOut} />
          </motion.div>
        ) : currentView === 'landing' || !user ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <LandingPage
              user={user}
              onUpdateUser={handleUpdateUser}
              onStartAudit={handleStartAudit}
              onNavigate={handleNavigate}
              signInRequestId={signInRequestId}
            />
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pt-2 pb-16 flex-1 flex flex-col"
          >
            {isAdmin ? (
              <AdminDashboard user={user} />
            ) : !user.country ? (
              <ClientOnboardingModal user={user} onComplete={handleUpdateUser} />
            ) : (
              <DiscussionWorkspace
                user={user}
                onNavigate={handleNavigate}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
