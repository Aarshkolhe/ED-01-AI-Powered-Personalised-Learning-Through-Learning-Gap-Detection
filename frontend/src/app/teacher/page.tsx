'use client';

import React, { useEffect, useState } from 'react';
import { api, ClassroomAnalytics, StudentSummary, SupportSignal } from '@/lib/api';
import { useApp } from '@/lib/context';
import { TeacherReviewQueue } from '@/components/TeacherReviewQueue';
import { TeacherReportedIssues } from '@/components/TeacherReportedIssues';
import { ThinkFlowLogo } from '@/components/ThinkFlowLogo';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Brain,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  Sparkles,
  BarChart,
  Search,
  ShieldAlert,
  Flag
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

export default function TeacherDashboardPage() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<'analytics' | 'content_review' | 'reported_issues'>('analytics');
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
    (s.support_signal || s.risk_level || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.evidence_summary || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center space-x-4">
            <ThinkFlowLogo size="sm" variant="badge" withLink priority />
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
          </div>

          {/* Teacher Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/30 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart className="w-3.5 h-3.5" />
              <span>{t('Classroom Analytics', 'कक्षा विश्लेषिकी')}</span>
            </button>

            {/* Feature D: AI Content Quality Gate Tab */}
            <button
              onClick={() => setActiveTab('content_review')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'content_review'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('AI Content Quality Gate', 'AI प्रश्न समीक्षा')}</span>
            </button>

            {/* Feature F: Student Reports Tab */}
            <button
              onClick={() => setActiveTab('reported_issues')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'reported_issues'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{t('Reported Issues', 'छात्र रिपोर्ट')}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Classroom Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{t('Total Enrolled Students', 'कुल छात्र')}</span>
                  <Users className="w-5 h-5 text-teal-400" />
                </div>
                <p className="text-3xl font-bold font-mono text-white mt-3">{analytics.total_students}</p>
                <span className="text-xs text-emerald-400 mt-1 block">100% Diagnostic Participation</span>
              </div>

              <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{t('Cohort Average Mastery', 'कक्षा औसत दक्षता')}</span>
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                </div>
                <p className="text-3xl font-bold font-mono text-teal-300 mt-3">
                  {Math.round(analytics.average_mastery * 100)}%
                </p>
                <span className="text-xs text-slate-400 mt-1 block">BKT Bayesian Weighted Mean</span>
              </div>

              <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{t('Learners Needing Support', 'सहयोग की आवश्यकता वाले छात्र')}</span>
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <p className="text-3xl font-bold font-mono text-rose-400 mt-3">{analytics.at_risk_students_count}</p>
                <span className="text-xs text-rose-400/80 mt-1 block">Evidence-based multi-factor signal</span>
              </div>
            </div>

            {/* Concept Mastery Heatmap Chart */}
            <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
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
              <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 pb-4 border-b border-white/10">
                  <Brain className="w-5 h-5 text-teal-400" />
                  <span>{t('Most Frequent Shared Misconceptions', 'सामान्य साझा भ्रांतियां')}</span>
                </h3>

                <div className="mt-4 space-y-4">
                  {analytics.top_misconceptions.map((m) => (
                    <div key={m.misconception_id} className="p-5 bg-black/20 hover:bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 transition-all shadow-md">
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
              <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 pb-4 border-b border-white/10">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                  <span>{t('Pedagogical Intervention Recommendations', 'शिक्षण हस्तक्षेप सिफारिशें')}</span>
                </h3>

                <div className="mt-4 space-y-4">
                  {analytics.intervention_recommendations.map((rec, i) => (
                    <div key={i} className="p-5 bg-black/20 hover:bg-black/30 backdrop-blur-xl rounded-2xl border border-teal-500/20 transition-all shadow-md">
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
            <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{t('Student Roster & Support Signals', 'छात्र सूची और सहयोग संकेत')}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{t('Evidence-based support triage from live learning data (Spec §18.6)', 'लाइव डेटा के आधार पर पारदर्शी सहयोग संकेत')}</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={t('Search student or signal...', 'छात्र या संकेत खोजें...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30 backdrop-blur-md w-64"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/40 text-white/60 border-b border-white/10">
                    <tr>
                      <th className="p-3">{t('Student Name', 'छात्र का नाम')}</th>
                      <th className="p-3">{t('Grade', 'कक्षा')}</th>
                      <th className="p-3">{t('Attempts', 'प्रयास')}</th>
                      <th className="p-3">{t('Avg Mastery', 'औसत दक्षता')}</th>
                      <th className="p-3">{t('Support Signal', 'सहयोग संकेत')}</th>
                      <th className="p-3">{t('Evidence Behind Signal', 'संकेत के पीछे साक्ष्य')}</th>
                      <th className="p-3">{t('Active Gaps', 'सक्रिय गैप')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredStudents.map((s) => {
                      const signal: SupportSignal = s.support_signal || (
                        s.risk_level === 'High Risk'
                          ? 'Needs Support'
                          : s.risk_level === 'Moderate Risk'
                          ? 'Monitoring'
                          : 'On Track'
                      );
                      return (
                        <tr key={s.student_id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-semibold text-slate-200">{s.name}</td>
                          <td className="p-3 text-slate-400">{s.grade}</td>
                          <td className="p-3 font-mono text-slate-300">{s.attempt_count ?? '—'}</td>
                          <td className="p-3 font-mono font-bold text-teal-400">{Math.round(s.average_mastery * 100)}%</td>
                          <td className="p-3">
                            {signal === 'Needs Support' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Needs Support
                              </span>
                            )}
                            {signal === 'Monitoring' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3 mr-1" />
                                Monitoring
                              </span>
                            )}
                            {signal === 'On Track' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                On Track
                              </span>
                            )}
                            {signal === 'Insufficient Data' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                <HelpCircle className="w-3 h-3 mr-1" />
                                Insufficient Data
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300 max-w-xs truncate" title={s.evidence_summary}>
                            {s.evidence_summary || 'Sparse attempt history'}
                          </td>
                          <td className="p-3 text-slate-400">
                            {s.active_gaps_count > 0 ? (
                              <span className="text-rose-400 font-medium">{s.active_gaps_count} concepts flagged</span>
                            ) : (
                              <span className="text-emerald-400 font-medium">None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Feature D - AI Content Quality Gate */}
        {activeTab === 'content_review' && (
          <TeacherReviewQueue />
        )}

        {/* Tab 3: Feature F - Reported Issues */}
        {activeTab === 'reported_issues' && (
          <TeacherReportedIssues />
        )}
      </div>
    </div>
  );
}
