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
    <div className="min-h-screen bg-[#2D2D2D] text-[#EAE0D2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-[#25DCC6]/10 to-[#A68763]/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#25DCC6] to-[#A68763] flex items-center justify-center text-[#2D2D2D] font-bold mx-auto shadow-xl shadow-[#25DCC6]/20">
          <Sparkles className="w-6 h-6 text-[#2D2D2D]" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#EAE0D2]">
          {t('Sign in to Thinkflow', 'Thinkflow में साइन इन करें')}
        </h2>
        <p className="mt-1 text-xs text-[#D7C9AE]/80 font-medium">
          {t('Precision AI-driven learning gap detection & recovery', 'सटीक एआई लर्निंग गैप पहचान और सुधार')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-[#2D2D2D]/85 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-[#D7C9AE]/25 sm:px-10">
          {/* Role selector tab */}
          <div className="flex bg-[#2D2D2D] p-1 rounded-xl border border-[#D7C9AE]/20 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                role === 'student'
                  ? 'bg-[#25DCC6] text-[#2D2D2D] shadow-md shadow-[#25DCC6]/20'
                  : 'text-[#D7C9AE]/70 hover:text-white'
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
                  ? 'bg-[#25DCC6] text-[#2D2D2D] shadow-md shadow-[#25DCC6]/20'
                  : 'text-[#D7C9AE]/70 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{t('Teacher / Educator', 'शिक्षक')}</span>
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {role === 'student' ? (
              <div>
                <label className="block text-xs font-medium text-[#EAE0D2]/90 mb-1">
                  {t('Select Demo Student Persona:', 'डेमो छात्र चुनें:')}
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full bg-[#2D2D2D] border border-[#D7C9AE]/30 rounded-xl px-3 py-2.5 text-xs text-[#EAE0D2] focus:outline-none focus:border-[#25DCC6]"
                >
                  <option value="student_alex">Alex Chen (Focus: Fractions Gap)</option>
                  <option value="student_priya">Priya Sharma (High Algebra Mastery)</option>
                  <option value="student_marcus">Marcus Vance (At-Risk Multiple Topics)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#EAE0D2]/90 mb-1">
                  {t('Educator Account:', 'शिक्षक खाता:')}
                </label>
                <input
                  type="text"
                  disabled
                  value="sarah.jenkins@district.edu (Ms. Sarah Jenkins)"
                  className="w-full bg-[#2D2D2D] border border-[#D7C9AE]/20 rounded-xl px-3 py-2.5 text-xs text-[#D7C9AE]/60 cursor-not-allowed"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#EAE0D2]/90 mb-1">
                {t('Access Token / Password:', 'पासवर्ड / एक्सेस टोकन:')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  disabled
                  value="••••••••••••"
                  className="w-full bg-[#2D2D2D] border border-[#D7C9AE]/20 rounded-xl px-3 py-2.5 text-xs text-[#D7C9AE]/60 cursor-not-allowed"
                />
                <Lock className="w-4 h-4 text-[#D7C9AE]/40 absolute right-3 top-2.5" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#25DCC6] hover:bg-[#1ec4b1] text-[#2D2D2D] font-bold text-xs transition-all shadow-lg shadow-[#25DCC6]/20 flex items-center justify-center space-x-2"
              >
                <span>{t('Launch Session (Demo Authentication)', 'सत्र शुरू करें (डेमो एक्सेस)')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-[#D7C9AE]/15 text-[11px] text-[#D7C9AE]/70 text-center">
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
