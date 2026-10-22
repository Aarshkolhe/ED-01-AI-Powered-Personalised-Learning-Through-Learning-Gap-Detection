'use client';

import React, { useEffect, useState } from 'react';
import { api, RevisionSchedule } from '@/lib/api';
import { Calendar, Clock, CheckCircle2, RotateCcw, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface SpacedRevisionPanelProps {
  studentId: string;
  onSelectConceptForPractice?: (conceptId: string) => void;
}

export const SpacedRevisionPanel: React.FC<SpacedRevisionPanelProps> = ({
  studentId,
  onSelectConceptForPractice
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dueRevisions, setDueRevisions] = useState<RevisionSchedule[]>([]);
  const [upcomingRevisions, setUpcomingRevisions] = useState<RevisionSchedule[]>([]);
  const [totalTracked, setTotalTracked] = useState<number>(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await api.getRevisionSchedule(studentId);
      setDueRevisions(data.due_revisions || []);
      setUpcomingRevisions(data.upcoming_revisions || []);
      setTotalTracked(data.total_tracked || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [studentId]);

  const handleCompleteRevision = async (conceptId: string, conceptTitle: string) => {
    try {
      const res = await api.completeRevision(conceptId, studentId, true);
      setActionMessage(`Completed review for ${conceptTitle}! Next session scheduled in ${res.next_interval_days} day(s).`);
      setTimeout(() => setActionMessage(null), 4000);
      loadSchedule();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl text-center space-y-3">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-white/50">Loading intelligent spaced revision schedule...</p>
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center space-x-2">
          <RotateCcw className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className="text-base font-bold text-white">Spaced Revision & Memory Retention</h3>
            <p className="text-xs text-white/60">
              Expanding intervals prevent forgetting: reinforced after 1, 2, 4, 7, 14, 30 days.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
            {dueRevisions.length} Due Today
          </span>
          <span className="px-2.5 py-1 rounded-full bg-black/40 text-white/70 border border-white/10 font-mono backdrop-blur-md">
            {totalTracked} Concepts Tracked
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2 backdrop-blur-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Due for Revision Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>High Priority — Due for Review ({dueRevisions.length})</span>
          </h4>
        </div>

        {dueRevisions.length === 0 ? (
          <div className="p-6 bg-black/30 rounded-2xl border border-white/10 text-center backdrop-blur-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-white">You are all caught up!</p>
            <p className="text-xs text-white/50 mt-1">No concepts are overdue for revision right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dueRevisions.map((rev) => (
              <div
                key={rev.id}
                className="p-4 bg-black/30 rounded-2xl border border-rose-500/30 hover:border-rose-500/50 backdrop-blur-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{rev.concept_title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Mastery: {Math.round(rev.mastery_probability * 100)}%
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-white/60 border border-white/10">
                      Reps: {rev.repetitions_count}
                    </span>
                  </div>

                  {/* Transparent Rationale */}
                  <p className="text-xs text-white/70 font-medium">
                    {rev.recommendation_rationale}
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] text-white/50">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-white/40" />
                      <span>Interval: {rev.interval_days} day(s)</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {onSelectConceptForPractice && (
                    <button
                      onClick={() => onSelectConceptForPractice(rev.concept_id)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-semibold text-xs border border-teal-500/40 transition-colors flex items-center space-x-1"
                    >
                      <span>Practice Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleCompleteRevision(rev.concept_id, rev.concept_title)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs transition-colors flex items-center space-x-1 backdrop-blur-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mark Done</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Schedule */}
      {upcomingRevisions.length > 0 && (
        <div className="pt-4 border-t border-white/10 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-white/40" />
            <span>Upcoming Scheduled Reviews ({upcomingRevisions.length})</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingRevisions.slice(0, 6).map((rev) => (
              <div key={rev.id} className="p-3 bg-black/30 rounded-2xl border border-white/10 text-xs space-y-1 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white truncate">{rev.concept_title}</span>
                  <span className="font-mono text-teal-400">{Math.round(rev.mastery_probability * 100)}%</span>
                </div>
                <p className="text-[11px] text-white/50 truncate">
                  Next due in {rev.interval_days}d ({new Date(rev.next_review_due_at).toLocaleDateString()})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
