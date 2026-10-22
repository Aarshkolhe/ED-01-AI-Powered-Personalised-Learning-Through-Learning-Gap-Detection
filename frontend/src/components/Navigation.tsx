'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { ThinkFlowLogo } from '@/components/ThinkFlowLogo';
import {
  Globe,
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  BarChart3,
  ArrowRight
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage, activeStudentId, setActiveStudentId, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = pathname === '/';
  const isStudent = pathname?.startsWith('/student');
  const isTeacher = pathname?.startsWith('/teacher');

  return (
    <header className="sticky top-0 z-50 w-full pt-3 px-3 sm:px-6 lg:px-8">
      <nav
        className="max-w-6xl mx-auto rounded-2xl sm:rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl shadow-black/60 transition-all duration-300"
        aria-label="Main Navigation"
      >
        <div className="px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* 1. Official Logo with deliberate rounded container and clean alignment */}
            <div className="flex items-center flex-shrink-0">
              <ThinkFlowLogo size="md" showText={true} withLink priority />
            </div>

            {/* 2. Middle Navigation Links */}
            <div className="hidden md:flex items-center space-x-1.5 lg:space-x-2 text-sm font-medium">
              <Link
                href="/"
                className={`px-3.5 py-1.5 rounded-full transition-all text-xs sm:text-sm font-medium ${
                  isHome
                    ? 'text-white bg-white/20 font-bold border border-white/20 shadow-sm backdrop-blur-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {t('Home', 'होम')}
              </Link>
              <Link
                href="/#features"
                className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {t('Features', 'विशेषताएं')}
              </Link>
              <Link
                href="/#how-it-works"
                className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {t('How It Works', 'यह कैसे काम करता है')}
              </Link>
              <Link
                href="/#about"
                className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {t('About', 'परिचय')}
              </Link>

              {/* Direct Portal Jumps */}
              <div className="flex items-center space-x-1 pl-2 border-l border-white/10">
                <Link
                  href="/student"
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    isStudent
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t('Student', 'छात्र')}
                </Link>
                <Link
                  href="/teacher"
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    isTeacher
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t('Teacher', 'शिक्षक')}
                </Link>
              </div>
            </div>

            {/* 3. Right Controls */}
            <div className="hidden sm:flex items-center space-x-2.5 flex-shrink-0">
              {/* Persona switcher if in student view */}
              {isStudent && (
                <div className="flex items-center space-x-1 bg-black/40 px-2.5 py-1.5 rounded-full border border-white/10 text-xs backdrop-blur-md">
                  <span className="text-slate-400 text-[10px]">{t('Persona:', 'छात्र:')}</span>
                  <select
                    value={activeStudentId}
                    onChange={(e) => setActiveStudentId(e.target.value)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer font-medium text-xs"
                  >
                    <option value="student_alex" className="bg-[#0B1120] text-slate-200">Alex Chen</option>
                    <option value="student_priya" className="bg-[#0B1120] text-slate-200">Priya Sharma</option>
                    <option value="student_marcus" className="bg-[#0B1120] text-slate-200">Marcus Vance</option>
                  </select>
                </div>
              )}

              {/* Language Selector */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                title="Toggle Language"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{language === 'en' ? 'English' : 'हिन्दी'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Sign In */}
              <Link
                href="/auth"
                className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                {t('Sign In', 'साइन इन')}
              </Link>

              {/* Get Started Button */}
              <Link
                href="/student"
                className="px-4.5 py-1.5 rounded-full text-xs font-bold text-slate-950 bg-white hover:bg-white/90 text-black shadow-lg shadow-white/10 transition-all hover:scale-[1.02] flex items-center space-x-1"
              >
                <span>{t('Get Started', 'आरंभ करें')}</span>
                <ArrowRight className="w-3 h-3 text-slate-950" />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="p-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-400"
                title="Language"
              >
                <Globe className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 px-5 py-4 space-y-3 bg-black/80 backdrop-blur-2xl rounded-b-2xl">
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-white hover:bg-white/5"
              >
                {t('Home', 'होम')}
              </Link>
              <Link
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                {t('Features', 'विशेषताएं')}
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                {t('How It Works', 'यह कैसे काम करता है')}
              </Link>
              <Link
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                {t('About', 'परिचय')}
              </Link>
              <div className="border-t border-slate-800 pt-2 flex flex-col space-y-2">
                <Link
                  href="/student"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-cyan-400 bg-cyan-500/10 flex items-center space-x-2 font-medium"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{t('Launch Student Portal', 'छात्र पोर्टल खोलें')}</span>
                </Link>
                <Link
                  href="/teacher"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-purple-300 hover:text-white flex items-center space-x-2 font-medium"
                >
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>{t('Teacher Analytics', 'शिक्षक विश्लेषिकी')}</span>
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-full border border-white/10 text-xs font-semibold text-slate-200"
              >
                {t('Sign In', 'साइन इन')}
              </Link>
              <Link
                href="/student"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20"
              >
                {t('Get Started', 'आरंभ करें')}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
