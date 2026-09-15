/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DiscussionWorkspace } from './components/DiscussionWorkspace';
import { UserProfile, EngagementModelId } from './types';
import { LayoutTemplate, MessageSquare, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [user, setUser] = useState<UserProfile>({
    name: 'Marcus Vance',
    organization: 'Northline Logistics',
    email: 'marcus@northline.com',
    initials: 'MV',
    selectedModel: 'core-workflow'
  });

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  const handleStartAudit = (modelId?: EngagementModelId) => {
    if (modelId) {
      setUser((prev) => ({ ...prev, selectedModel: modelId }));
    }
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Global Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
      />

      {/* Screen Switcher Floating Pill for instantaneous review of both requested screens */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-700/60 flex items-center gap-2 text-xs">
        <span className="text-[11px] text-slate-400 font-medium pl-1 hidden sm:inline">Screen Mode:</span>
        <button
          onClick={() => setCurrentView('landing')}
          className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentView === 'landing'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Landing Overview</span>
        </button>
        <button
          onClick={() => setCurrentView('workspace')}
          className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentView === 'workspace'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Discussion Desk</span>
        </button>
      </div>

      {/* Primary View */}
      {currentView === 'landing' ? (
        <LandingPage
          user={user}
          onUpdateUser={handleUpdateUser}
          onStartAudit={handleStartAudit}
        />
      ) : (
        <div className="pt-2 pb-16 flex-1 flex flex-col">
          <DiscussionWorkspace
            user={user}
            onNavigate={setCurrentView}
          />
        </div>
      )}
    </div>
  );
}
