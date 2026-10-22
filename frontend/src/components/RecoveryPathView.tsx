'use client';

import React, { useEffect, useState } from 'react';
import { api, RecoveryPlan } from '@/lib/api';
import { useApp } from '@/lib/context';
import { Route, CheckCircle, AlertCircle, ArrowRight, BookOpen, Sparkles, RefreshCw } from 'lucide-react';

interface RecoveryPathViewProps {
  conceptId?: string;
  onStartReassessment?: () => void;
}

export const RecoveryPathView: React.FC<RecoveryPathViewProps> = ({
  conceptId = 'fraction_addition_unlike',
  onStartReassessment
}) => {
  const { activeStudentId, t } = useApp();
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const data = await api.getRecoveryPlan(activeStudentId, conceptId);
        if (mounted) setPlan(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPlan();
    return () => { mounted = false; };
  }, [activeStudentId, conceptId]);

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-2">{t('Generating prerequisite recovery path...', 'रिकवरी पाथ तैयार किया जा रहा है...')}</p>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Route className="w-5 h-5 text-teal-400" />
            <span>{t('Personalised Remediation Learning Path', 'व्यक्तिगत सुधार सीखने का मार्ग')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Target Focus: <strong className="text-teal-300">{plan.focal_concept_name}</strong>
          </p>
        </div>
        <span className="text-xs px-3 py-1 bg-slate-800 text-teal-400 rounded-full font-mono">
          Est. Time: {plan.estimated_duration_minutes}m
        </span>
      </div>

      {/* Ordered Prerequisite Progression */}
      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          {t('Topological Remediation Order (Prerequisites First)', 'पूर्वापेक्षा सुधार क्रम')}
        </h4>
        <div className="space-y-3">
          {plan.prerequisite_remediation_order.map((step, idx) => {
            const isTarget = step.priority === 'TARGET';
            return (
              <div
                key={step.concept_id}
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isTarget
                    ? 'bg-teal-950/20 border-teal-500/40 shadow-md shadow-teal-500/5'
                    : 'bg-slate-950/50 border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isTarget
                        ? 'bg-teal-500 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-200">{step.concept_name}</h5>
                    <p className="text-xs text-slate-400">{step.reason}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{t('Current Mastery', 'वर्तमान दक्षता')}</span>
                  <span className="text-sm font-mono font-bold text-teal-300">
                    {Math.round(step.current_mastery * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curated Activities */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          {t('Recommended Targeted Remediation Activities', 'अनुशंसित उपचारात्मक गतिविधियाँ')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plan.recommended_activities.map((act) => (
            <div
              key={act.id}
              className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-mono text-teal-400">{act.estimated_minutes} min</span>
                <h5 className="text-sm font-semibold text-slate-200 mt-1">{act.title}</h5>
                <p className="text-xs text-slate-400 mt-1.5">{act.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to action: Fresh Reassessment */}
      {onStartReassessment && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onStartReassessment}
            className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('Launch Fresh Reassessment', 'ताज़ा पुनर्मूल्यांकन शुरू करें')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
