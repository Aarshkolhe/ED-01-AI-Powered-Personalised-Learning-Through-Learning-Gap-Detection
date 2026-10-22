'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import {
  Sparkles,
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
    <header className="sticky top-0 z-50 w-full pt-4 sm:pt-6 px-3 sm:px-6 lg:px-8 transition-all">
      <nav
        className="max-w-6xl mx-auto rounded-full border border-white/10 bg-[#2D241E]/75 backdrop-blur-2xl shadow-2xl shadow-black/40 transition-all duration-300"
        aria-label="Main Navigation"
      >
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo and Tagline matching reference */}
            <div className="flex items-center space-x-5">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#25DCC6] flex items-center justify-center text-[#2D2D2D] font-bold shadow-md shadow-[#25DCC6]/30 group-hover:scale-105 transition-all duration-300">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D2D2D] fill-[#2D2D2D]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-[#25DCC6] transition-colors">
                      Thinkflow
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#D7C9AE]/70 font-normal tracking-tight -mt-0.5 hidden xs:block">
                    {t('Personalised Learning. Real Progress.', 'व्यक्तिगत शिक्षण। वास्तविक प्रगति।')}
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle Nav Links */}
            <div className="hidden md:flex items-center space-x-1 sm:space-x-2 text-sm font-medium">
              <Link
                href="/"
                className={`relative px-4 py-1.5 rounded-full transition-all text-xs sm:text-sm ${
                  isHome
                    ? 'text-white bg-[#1A1410]/70 font-semibold border-b-2 border-[#25DCC6]'
                    : 'text-[#EAE0D2]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {t('Home', 'होम')}
              </Link>
              <Link
                href="/#features"
                className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm text-[#EAE0D2]/80 hover:text-white hover:bg-white/5 transition-all"
              >
                {t('Features', 'विशेषताएं')}
              </Link>
              <Link
                href="/#how-it-works"
                className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm text-[#EAE0D2]/80 hover:text-white hover:bg-white/5 transition-all"
              >
                {t('How It Works', 'यह कैसे काम करता है')}
              </Link>
              <Link
                href="/#about"
                className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm text-[#EAE0D2]/80 hover:text-white hover:bg-white/5 transition-all"
              >
                {t('About', 'परिचय')}
              </Link>

              {/* Direct Portal Switchers if active */}
              {(isStudent || isTeacher) && (
                <div className="flex items-center space-x-1 pl-2 border-l border-white/10">
                  <Link
                    href="/student"
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isStudent ? 'bg-[#25DCC6]/20 text-[#25DCC6]' : 'text-[#EAE0D2]/70 hover:text-white'
                    }`}
                  >
                    {t('Student', 'छात्र')}
                  </Link>
                  <Link
                    href="/teacher"
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isTeacher ? 'bg-[#25DCC6]/20 text-[#25DCC6]' : 'text-[#EAE0D2]/70 hover:text-white'
                    }`}
                  >
                    {t('Teacher', 'शिक्षक')}
                  </Link>
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="hidden sm:flex items-center space-x-2.5">
              {/* Demo student switcher (only when on student view) */}
              {isStudent && (
                <div className="flex items-center space-x-1 bg-[#1A1410]/70 px-2.5 py-1.5 rounded-full border border-white/10 text-xs">
                  <span className="text-[#D7C9AE]/70 text-[10px]">{t('Student:', 'छात्र:')}</span>
                  <select
                    value={activeStudentId}
                    onChange={(e) => setActiveStudentId(e.target.value)}
                    className="bg-transparent text-[#25DCC6] focus:outline-none cursor-pointer font-medium text-xs"
                  >
                    <option value="student_alex" className="bg-[#2D241E] text-[#EAE0D2]">Alex Chen</option>
                    <option value="student_priya" className="bg-[#2D241E] text-[#EAE0D2]">Priya Sharma</option>
                    <option value="student_marcus" className="bg-[#2D241E] text-[#EAE0D2]">Marcus Vance</option>
                  </select>
                </div>
              )}

              {/* Language Selector matching reference (Globe icon + English v) */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#EAE0D2]/85 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                title="Toggle Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#D7C9AE]" />
                <span>{language === 'en' ? 'English' : 'हिन्दी'}</span>
                <ChevronDown className="w-3 h-3 text-[#D7C9AE]/70" />
              </button>

              {/* Sign In Button */}
              <Link
                href="/auth"
                className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-medium text-[#EAE0D2] bg-white/5 border border-white/15 hover:bg-white/10 transition-colors"
              >
                {t('Sign In', 'साइन इन')}
              </Link>

              {/* Get Started Button with Turquoise Glow */}
              <Link
                href="/student"
                className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold text-[#2D2D2D] bg-[#25DCC6] shadow-[0_0_20px_rgba(37,220,198,0.5)] hover:shadow-[0_0_28px_rgba(37,220,198,0.7)] transition-all hover:scale-[1.02]"
              >
                {t('Get Started', 'आरंभ करें')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="p-1.5 rounded-full bg-white/5 border border-white/10 text-[#25DCC6]"
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
          <div className="md:hidden border-t border-white/10 px-5 py-4 space-y-3 bg-[#2D241E]/95 rounded-b-3xl">
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
                className="px-3 py-2 rounded-lg text-[#EAE0D2]/80 hover:text-white hover:bg-white/5"
              >
                {t('Features', 'विशेषताएं')}
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[#EAE0D2]/80 hover:text-white hover:bg-white/5"
              >
                {t('How It Works', 'यह कैसे काम करता है')}
              </Link>
              <Link
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[#EAE0D2]/80 hover:text-white hover:bg-white/5"
              >
                {t('About', 'परिचय')}
              </Link>
              <div className="border-t border-white/10 pt-2 flex flex-col space-y-2">
                <Link
                  href="/student"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-[#25DCC6] bg-[#25DCC6]/10 flex items-center space-x-2 font-medium"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{t('Launch Student Portal', 'छात्र पोर्टल खोलें')}</span>
                </Link>
                <Link
                  href="/teacher"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-[#EAE0D2] hover:text-white flex items-center space-x-2 font-medium"
                >
                  <BarChart3 className="w-4 h-4 text-[#25DCC6]" />
                  <span>{t('Teacher Analytics', 'शिक्षक विश्लेषिकी')}</span>
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-full border border-white/15 text-xs font-semibold text-[#EAE0D2]"
              >
                {t('Sign In', 'साइन इन')}
              </Link>
              <Link
                href="/student"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-full bg-[#25DCC6] text-[#2D2D2D] text-xs font-bold shadow-lg shadow-[#25DCC6]/30"
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
