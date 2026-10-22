'use client';

import React, { useState, useEffect } from 'react';
import { api, ContentReport } from '@/lib/api';
import { Flag, CheckCircle2, ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';

export const TeacherReportedIssues: React.FC = () => {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.getTeacherReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (reportId: string, action: 'quarantine' | 'dismiss' | 'edit') => {
    try {
      setResolvingId(reportId);
      await api.resolveTeacherReport(reportId, {
        action,
        reviewer_id: 'teacher_sarah',
        notes: `Processed with action: ${action}`
      });
      await loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'incorrect_answer_key':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 backdrop-blur-md">Wrong Answer Key</span>;
      case 'ambiguous_wording':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 backdrop-blur-md">Ambiguous Prompt</span>;
      case 'typo_or_formatting':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 backdrop-blur-md">Typo / Formatting</span>;
      case 'pedagogically_unclear':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 backdrop-blur-md">Pedagogically Unclear</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white/70 border border-white/15 backdrop-blur-md">Technical Issue</span>;
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center flex-shrink-0 shadow-md backdrop-blur-md">
            <Flag className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Student Content Feedback & Reported Issues</span>
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              Student reports on confusing wording, wrong answer keys, or formatting errors. Student privacy is preserved with masked identifiers.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadReports}
          title="Refresh reports"
          className="p-2 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all backdrop-blur-md self-start sm:self-center shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-white/60">Loading student reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-10 text-center bg-black/20 rounded-2xl border border-white/10 backdrop-blur-xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">No open student reports.</p>
          <p className="text-xs text-white/60 mt-1">All student feedback items have been reconciled!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`p-6 rounded-2xl border transition-all space-y-4 backdrop-blur-xl ${
                report.resolved
                  ? 'bg-black/20 border-white/10 opacity-70'
                  : 'bg-black/30 border-rose-500/30 shadow-lg shadow-rose-500/5'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/10 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getCategoryBadge(report.category)}
                  <span className="text-xs font-mono text-white/50">
                    Question: <strong className="text-white">{report.question_id}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs text-white/50">
                  <span>Reported by: <strong className="font-mono text-white/70">{report.student_id}</strong></span>
                  <span>•</span>
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-white/90 font-medium leading-relaxed bg-black/30 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                  &ldquo;{report.description}&rdquo;
                </p>
              </div>

              {/* Status / Resolution Action */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  {report.resolved ? (
                    <span className="text-emerald-300 font-semibold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolved ({report.resolution_action})</span>
                    </span>
                  ) : (
                    <span className="text-amber-300 font-semibold flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Pending Teacher Action</span>
                    </span>
                  )}
                </div>

                {!report.resolved && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleResolve(report.id, 'quarantine')}
                      disabled={resolvingId === report.id}
                      className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 active:scale-95"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Quarantine Question</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(report.id, 'dismiss')}
                      disabled={resolvingId === report.id}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold transition-all active:scale-95"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
