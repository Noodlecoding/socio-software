import React, { useState } from 'react';
import { SOCIO_LOGO_URL } from '../data/initialData';
import { UserProfile } from '../types';
import type { AppView } from '../App';
import { useLanguage } from '../lib/i18n';
import { ArrowRight, MessageSquare, LayoutTemplate, LogOut, Menu, X } from 'lucide-react';

const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage } = useLanguage();
  return (
    <div className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold ${className ?? ''}`}>
      {(['en', 'es'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            language === lang ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
          aria-pressed={language === lang}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  user: UserProfile | null;
  onSignOut: () => void;
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, user, onSignOut, isAdmin }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const handleSectionLink = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (currentView === 'landing') return;
    e.preventDefault();
    onNavigate('landing');
    // Wait for the landing page to mount before scrolling to its section.
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    });
  };

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
              {isAdmin ? t('nav.clientInbox') : t('nav.discussionDesk')}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isAdmin ? t('nav.live') : t('nav.liveChat')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <LanguageSwitcher />

          <button
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('nav.landingOverview')}</span>
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
            title={t('nav.signOut')}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('nav.signOut')}</span>
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
            onClick={(e) => handleSectionLink(e, 'how-it-works')}
          >
            {t('nav.howItWorks')}
          </a>
          <a
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            href="#models"
            onClick={(e) => handleSectionLink(e, 'models')}
          >
            {t('nav.ourWork')}
          </a>
          <button
            onClick={() => onNavigate('workspace')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{user ? (isAdmin ? t('nav.clientInbox') : t('nav.discussionDesk')) : t('nav.signIn')}</span>
          </button>
          <button
            onClick={() => onNavigate('affiliate')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              currentView === 'affiliate' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            {t('nav.growthPartner')}
          </button>
        </nav>

        {/* Header CTAs (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />

          {user ? (
            <button
              onClick={onSignOut}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.signOut')}</span>
            </button>
          ) : (
            <a
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
              href="#get-started"
            >
              <span>{t('nav.getStarted')}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 flex flex-col gap-3">
          <LanguageSwitcher className="self-start" />

          <a
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-1.5"
            href="#how-it-works"
            onClick={(e) => {
              setIsMobileMenuOpen(false);
              handleSectionLink(e, 'how-it-works');
            }}
          >
            {t('nav.howItWorks')}
          </a>
          <a
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-1.5"
            href="#models"
            onClick={(e) => {
              setIsMobileMenuOpen(false);
              handleSectionLink(e, 'models');
            }}
          >
            {t('nav.ourWork')}
          </a>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('workspace');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors cursor-pointer py-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{user ? (isAdmin ? t('nav.clientInbox') : t('nav.discussionDesk')) : t('nav.signIn')}</span>
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigate('affiliate');
            }}
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors cursor-pointer py-1.5 text-left"
          >
            {t('nav.growthPartner')}
          </button>

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.signOut')}</span>
              </button>
            ) : (
              <a
                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                href="#get-started"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>{t('nav.getStarted')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
