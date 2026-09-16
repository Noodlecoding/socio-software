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
  const currentViewRef = useRef<AppView>('landing');

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  // Capture ?ref=CODE from an affiliate link so signup can attribute it later,
  // and restore ?view=affiliate after a full-page Google OAuth redirect
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('pendingReferralCode', ref);
      }
      if (params.get('view') === 'affiliate') {
        setCurrentView('affiliate');
      }
    } catch {
      // localStorage unavailable — referral attribution just won't happen
    }
  }, []);

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
        const profile = await loadUserProfile(session);
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
        setCurrentView('landing');
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-900 font-sans">
      <Navbar
        currentView={currentView === 'affiliate' || currentView === 'legal' ? currentView : user ? currentView : 'landing'}
        onNavigate={handleNavigate}
        user={user}
        onSignOut={handleSignOut}
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
