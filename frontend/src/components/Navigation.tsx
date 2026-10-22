'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { BookOpen, Network, BarChart3, Languages, Sparkles, GraduationCap } from 'lucide-react';

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage, activeStudentId, setActiveStudentId, t } = useApp();

  const isStudent = pathname?.startsWith('/student');
  const isTeacher = pathname?.startsWith('/teacher');

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  LearnLens AI
                </span>
                <span className="text-xs text-slate-400 font-medium">Precision Learning Platform</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
              <Link
                href="/student"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isStudent
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{t('Student Portal', 'छात्र पोर्टल')}</span>
              </Link>

              <Link
                href="/teacher"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isTeacher
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{t('Teacher Dashboard', 'शिक्षक डैशबोर्ड')}</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Student Switcher for Demo testing */}
            {isStudent && (
              <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">{t('Student:', 'छात्र:')}</span>
                <select
                  value={activeStudentId}
                  onChange={(e) => setActiveStudentId(e.target.value)}
                  className="bg-transparent text-teal-300 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="student_alex" className="bg-slate-900">Alex Chen (Focus: Fractions)</option>
                  <option value="student_priya" className="bg-slate-900">Priya Sharma (High Mastery)</option>
                  <option value="student_marcus" className="bg-slate-900">Marcus Vance (At-Risk)</option>
                </select>
              </div>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 transition-colors"
              title="Toggle Language"
            >
              <Languages className="w-3.5 h-3.5 text-teal-400" />
              <span>{language === 'en' ? 'हिन्दी (Hindi)' : 'English'}</span>
            </button>

            <Link
              href="/auth"
              className="text-xs px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition-all shadow-md shadow-teal-500/20"
            >
              {t('Sign In', 'साइन इन')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
