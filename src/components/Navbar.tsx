import React from 'react';
import { SOCIO_LOGO_URL } from '../data/initialData';
import { UserProfile } from '../types';
import { ArrowRight, MessageSquare, LayoutTemplate, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'workspace';
  onNavigate: (view: 'landing' | 'workspace') => void;
  user: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, user }) => {
  if (currentView === 'workspace') {
    return (
      <header className="h-16 border-b border-[#e5e9f5] bg-white sticky top-0 z-50 flex items-center px-4 sm:px-6 lg:px-10 justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            title="Return to Socio Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#4361ee] flex items-center justify-center shadow-sm group-hover:bg-[#2346d5] transition-colors">
              <div className="w-3.5 h-3.5 rounded-[4px] bg-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-[2px] bg-[#4361ee]"></div>
              </div>
            </div>
            <span className="text-[20px] font-extrabold text-[#0f172a] tracking-tight font-display">Socio</span>
          </button>
          
          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-600">Discussion Desk</span>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Architecture Channel
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
              {user.initials || 'MV'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-none">{user.name || 'Marcus Vance'}</span>
              <span className="text-[11px] text-slate-400 leading-tight mt-0.5">{user.organization || 'Northline Logistics'}</span>
            </div>
          </div>
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
        </button>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            href="#approach"
          >
            Approach
          </a>
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
        </nav>

        {/* Header CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('workspace')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Discussion Desk</span>
          </button>

          <a
            className="hidden lg:inline-flex text-sm font-semibold text-slate-700 hover:text-blue-600 px-4 py-2 transition-colors"
            href="#get-started"
          >
            Tell us what you need
          </a>

          <a
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            href="#get-started"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
