'use client';

import React, { useEffect, useState } from 'react';
import { api, RecoveryScoreReport } from '@/lib/api';
import { useApp } from '@/lib/context';
import { TrendingUp, Award, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface RecoveryScoreCardProps {
  conceptId?: string;
}

export const RecoveryScoreCard: React.FC<RecoveryScoreCardProps> = ({
  conceptId = 'fraction_addition_unlike'
}) => {
  const { activeStudentId, t } = useApp();
  const [report, setReport] = useState<RecoveryScoreReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const fetchScore = async () => {
      try {
        setLoading(true);
        const data = await api.getRecoveryScore(activeStudentId, conceptId);
        if (mounted) setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchScore();
    return () => { mounted = false; };
  }, [activeStudentId, conceptId]);

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-8 bg-slate-800 rounded w-1/2" />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <span>{t('Learning Recovery Score (LRS)', 'लर्निंग रिकवरी स्कोर')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Target: <strong className="text-teal-300">{report.concept_name}</strong>
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
          {report.status}
        </span>
      </div>

      {/* Before / After Comparative Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">{t('Pre-Remediation Baseline', 'उपचार से पहले (बेसलाइन)')}</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-200">
              {Math.round(report.pre_score * 100)}%
            </span>
            <span className="text-xs text-slate-500">({report.baseline_attempts} attempts)</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">{t('Post-Remediation Assessment', 'उपचार के बाद (पुनर्मूल्यांकन)')}</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {Math.round(report.post_score * 100)}%
            </span>
            <span className="text-xs text-slate-500">({report.post_attempts} fresh test)</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-950/40 to-slate-950 p-4 rounded-xl border border-teal-500/30">
          <span className="text-xs text-teal-400 font-semibold block">{t('Normalized Recovery Rate', 'रिकवरी दर')}</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-teal-300">
              +{report.recovery_percentage}%
            </span>
            <span className="text-xs text-emerald-400 font-medium font-mono">
              (&Delta; +{Math.round(report.score_delta * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Concept Progress Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('Concepts Successfully Recovered:', 'सफलतापूर्वक सुधारे गए विषय:')}</span>
          </span>
          {report.concepts_improved.length > 0 ? (
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              {report.concepts_improved.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">{t('None in this session', 'इस सत्र में कोई नहीं')}</p>
          )}
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1.5 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>{t('Remaining Target Gaps:', 'शेष लक्ष्य गैप:')}</span>
          </span>
          {report.remaining_gaps.length > 0 ? (
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              {report.remaining_gaps.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-400 italic font-medium">{t('All targeted gaps closed!', 'सभी गैप बंद हो गए!')}</p>
          )}
        </div>
      </div>

      {/* Required Psychometric Disclaimer */}
      <div className="mt-4 flex items-start space-x-2 text-[11px] text-slate-500 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
        <span>{report.disclaimer}</span>
      </div>
    </div>
  );
};
