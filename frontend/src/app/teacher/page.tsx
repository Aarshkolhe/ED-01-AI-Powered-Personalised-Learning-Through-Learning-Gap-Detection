'use client';

import React, { useEffect, useState } from 'react';
import { api, ClassroomAnalytics } from '@/lib/api';
import { useApp } from '@/lib/context';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Brain,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  BarChart,
  Search
} from 'lucide-react';
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface StudentSummary {
  student_id: string;
  name: string;
  grade: string;
  average_mastery: number;
  risk_level: string;
  active_gaps_count: number;
  active_gaps: string[];
}

export default function TeacherDashboardPage() {
  const { t } = useApp();
  const [analytics, setAnalytics] = useState<ClassroomAnalytics | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [anData, stuData] = await Promise.all([
          api.getClassroomAnalytics(),
          api.getStudentsSummary()
        ]);
        if (mounted) {
          setAnalytics(anData);
          setStudents(stuData as unknown as StudentSummary[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadDashboard();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">{t('Aggregating classroom diagnostic metrics...', 'कक्षा विश्लेषण लोड हो रहा है...')}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.risk_level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
              {t('Teacher Diagnostic Center', 'शिक्षक विश्लेषिकी केंद्र')}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
              {t('Grade 8 Mathematics — Classroom Analytics', 'कक्षा 8 गणित — विश्लेषिकी')}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {t('Live student mastery heatmaps, shared misconceptions & automated pedagogical interventions', 'सजीव दक्षता हीटमैप और भ्रांतियां')}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
              Active Cohort: <strong className="text-teal-400 font-mono">Section A (3 Students)</strong>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{t('Total Enrolled Students', 'कुल छात्र')}</span>
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <p className="text-3xl font-bold font-mono text-white mt-3">{analytics.total_students}</p>
            <span className="text-xs text-emerald-400 mt-1 block">100% Diagnostic Participation</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{t('Cohort Average Mastery', 'कक्षा औसत दक्षता')}</span>
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <p className="text-3xl font-bold font-mono text-teal-300 mt-3">
              {Math.round(analytics.average_mastery * 100)}%
            </p>
            <span className="text-xs text-slate-400 mt-1 block">BKT Bayesian Weighted Mean</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{t('Identified At-Risk Learners', 'सुधार की आवश्यकता वाले छात्र')}</span>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-3xl font-bold font-mono text-rose-400 mt-3">{analytics.at_risk_students_count}</p>
            <span className="text-xs text-rose-400/80 mt-1 block">&lt; 60% concept threshold</span>
          </div>
        </div>

        {/* Concept Mastery Heatmap Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <BarChart className="w-5 h-5 text-teal-400" />
                <span>{t('Curriculum Concept Mastery Heatmap', 'पाठ्यक्रम अवधारणा दक्षता हीटमैप')}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('Aggregated from individual student Bayesian posterior probabilities', 'छात्रों के बायेसियन पोस्टीरियर मानों पर आधारित')}
              </p>
            </div>
          </div>

          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBar data={analytics.concept_heatmaps}>
                <XAxis dataKey="concept_name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 shadow-xl text-xs">
                          <p className="font-bold text-white">{data.concept_name}</p>
                          <p className="text-teal-400 mt-1">Mastery: {Math.round(data.average_mastery * 100)}%</p>
                          <p className="text-slate-400 mt-0.5">Status: {data.status}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="average_mastery" radius={[6, 6, 0, 0]}>
                  {analytics.concept_heatmaps.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.average_mastery >= 0.8 ? '#10b981' : entry.average_mastery >= 0.6 ? '#f59e0b' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </RechartsBar>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shared Misconceptions & Pedagogical Interventions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shared Misconceptions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 pb-4 border-b border-slate-800">
              <Brain className="w-5 h-5 text-teal-400" />
              <span>{t('Most Frequent Shared Misconceptions', 'सामान्य साझा भ्रांतियां')}</span>
            </h3>

            <div className="mt-4 space-y-4">
              {analytics.top_misconceptions.map((m) => (
                <div key={m.misconception_id} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-rose-300">{m.name}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono">
                      {m.count} {t('Occurrences', 'बार')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    {m.recommended_intervention}
                  </p>

                  <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400">
                    <span>{t('Impacted Students:', 'प्रभावित छात्र:')}</span>
                    <span className="text-slate-200 font-semibold">{m.affected_students.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intervention Recommendations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 pb-4 border-b border-slate-800">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <span>{t('Pedagogical Intervention Recommendations', 'शिक्षण हस्तक्षेप सिफारिशें')}</span>
            </h3>

            <div className="mt-4 space-y-4">
              {analytics.intervention_recommendations.map((rec, i) => (
                <div key={i} className="p-4 bg-slate-950 rounded-xl border border-teal-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                      Priority: {rec.priority}
                    </span>
                    <span className="text-xs text-slate-400">{rec.concept}</span>
                  </div>

                  <h5 className="text-sm font-semibold text-slate-200 mt-2">
                    Focus: {rec.targeted_misconception}
                  </h5>

                  <p className="text-xs text-slate-300 mt-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {rec.action}
                  </p>

                  <p className="text-[11px] text-slate-500 mt-2">
                    Recommended For: {rec.impacted_students.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Individual Student Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">{t('Student Roster & Risk Diagnosis', 'छात्र सूची और जोखिम निदान')}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{t('Evidence-based risk scoring from live attempts', 'लाइव प्रयासों के आधार पर जोखिम मूल्यांकन')}</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('Search student...', 'छात्र खोजें...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-64"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">{t('Student Name', 'छात्र का नाम')}</th>
                  <th className="p-3">{t('Grade', 'कक्षा')}</th>
                  <th className="p-3">{t('Avg Mastery', 'औसत दक्षता')}</th>
                  <th className="p-3">{t('Risk Status', 'जोखिम स्थिति')}</th>
                  <th className="p-3">{t('Active Gaps', 'सक्रिय गैप')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-200">{s.name}</td>
                    <td className="p-3 text-slate-400">{s.grade}</td>
                    <td className="p-3 font-mono font-bold text-teal-400">{Math.round(s.average_mastery * 100)}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          s.risk_level === 'High Risk'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : s.risk_level === 'Moderate Risk'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {s.risk_level}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {s.active_gaps_count > 0 ? (
                        <span className="text-rose-400 font-medium">{s.active_gaps_count} concepts flagged</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
