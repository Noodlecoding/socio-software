import React from 'react';
import { SOCIO_LOGO_URL } from '../data/initialData';
import { UserProfile } from '../types';
import type { AppView } from '../App';
import { ArrowRight, MessageSquare, LayoutTemplate, LogOut } from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  user: UserProfile | null;
  onSignOut: () => void;
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, user, onSignOut, isAdmin }) => {
  if (currentView === 'workspace' && user) {
    return (
      <header className="h-16 border-b border-[#e5e9f5] bg-white sticky top-0 z-50 flex items-center px-4 sm:px-6 lg:px-10 justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            title="Return to Socio Home"
          >
            <img src={SOCIO_LOGO_URL} alt="Socio" className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="text-[20px] font-extrabold text-[#0f172a] tracking-tight font-display">Socio</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              {isAdmin ? 'Client Inbox' : 'Discussion Desk'}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isAdmin ? 'Live' : 'Live Chat'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing Overview</span>
          </button>

          <a
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors hidden md:inline"
            href="mailto:direct@socio.com"
          >
            direct@socio.com
          </a>

          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-xs font-bold text-blue-600 shadow-2xs">
              {user.initials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-none">{user.name}</span>
              <span className="text-[11px] text-slate-400 leading-tight mt-0.5">{user.organization}</span>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 py-1.5 px-3 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Logo Branding */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 focus:outline-none cursor-pointer"
        >
          <img
            alt="Socio"
            className="h-9 w-auto object-contain"
            src={SOCIO_LOGO_URL}
          />
          <span className="text-lg font-extrabold text-[#0f172a] tracking-tight font-display">Socio</span>
        </button>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            href="#how-it-works"
          >
            How It Works
          </a>
          <a
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            href="#models"
          >
            Engagement Models
          </a>
          <button
            onClick={() => onNavigate('affiliate')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentView === 'affiliate' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            Affiliates
          </button>
        </nav>

        {/* Header CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('workspace')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>{user ? (isAdmin ? 'Client Inbox' : 'Discussion Desk') : 'Sign in'}</span>
          </button>

          {user ? (
            <button
              onClick={onSignOut}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          ) : (
            <a
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
              href="#get-started"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
