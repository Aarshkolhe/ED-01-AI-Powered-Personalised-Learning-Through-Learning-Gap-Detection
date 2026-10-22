'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { Sparkles, Shield, User, GraduationCap, Lock, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { setActiveStudentId, t } = useApp();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [selectedStudent, setSelectedStudent] = useState<string>('student_alex');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'student') {
      setActiveStudentId(selectedStudent);
      router.push('/student');
    } else {
      router.push('/teacher');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-slate-950 font-bold mx-auto shadow-xl shadow-teal-500/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          {t('Sign in to LearnLens AI', 'LearnLens AI में साइन इन करें')}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {t('Precision AI-driven learning gap detection & recovery', 'सटीक एआई लर्निंग गैप पहचान और सुधार')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {/* Role selector tab */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                role === 'student'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t('Student', 'छात्र')}</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                role === 'teacher'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{t('Teacher / Educator', 'शिक्षक')}</span>
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {role === 'student' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Select Demo Student Persona:', 'डेमो छात्र चुनें:')}
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="student_alex">Alex Chen (Focus: Fractions Gap)</option>
                  <option value="student_priya">Priya Sharma (High Algebra Mastery)</option>
                  <option value="student_marcus">Marcus Vance (At-Risk Multiple Topics)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Educator Account:', 'शिक्षक खाता:')}
                </label>
                <input
                  type="text"
                  disabled
                  value="sarah.jenkins@district.edu (Ms. Sarah Jenkins)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('Access Token / Password:', 'पासवर्ड / एक्सेस टोकन:')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  disabled
                  value="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                />
                <Lock className="w-4 h-4 text-slate-600 absolute right-3 top-2.5" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2"
              >
                <span>{t('Launch Session (Demo Authentication)', 'सत्र शुरू करें (डेमो एक्सेस)')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            {t(
              'Demo mode uses seeded, authenticated role records. Supabase auth configured for cloud sync.',
              'डेमो मोड स्वचालित रूप से डेटाबेस से जुड़ा है।'
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
