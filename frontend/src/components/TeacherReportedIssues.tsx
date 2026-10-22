'use client';

import React, { useState, useEffect } from 'react';
import { api, ContentReport } from '@/lib/api';
import { Flag, CheckCircle2, XCircle, ShieldAlert, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Wrong Answer Key</span>;
      case 'ambiguous_wording':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Ambiguous Prompt</span>;
      case 'typo_or_formatting':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Typo / Formatting</span>;
      case 'pedagogically_unclear':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Pedagogically Unclear</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">Technical Issue</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Flag className="w-5 h-5 text-rose-400" />
            <span>Student Content Feedback & Reported Issues</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Student reports on confusing wording, wrong answer keys, or formatting errors. Student privacy is preserved with masked identifiers.
          </p>
        </div>

        <button
          onClick={loadReports}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading student reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-200">No open student reports.</p>
          <p className="text-xs text-slate-400 mt-1">All student feedback items have been reconciled!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`p-5 rounded-xl border transition-all ${
                report.resolved
                  ? 'bg-slate-950/50 border-slate-800 opacity-75'
                  : 'bg-slate-950 border-rose-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center space-x-2">
                  {getCategoryBadge(report.category)}
                  <span className="text-xs font-mono text-slate-400">Question: <strong className="text-slate-200">{report.question_id}</strong></span>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span>Reported by: <strong className="font-mono text-slate-400">{report.student_id}</strong></span>
                  <span>•</span>
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-3">
                <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  &ldquo;{report.description}&rdquo;
                </p>
              </div>

              {/* Status / Resolution Action */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <div>
                  {report.resolved ? (
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolved ({report.resolution_action})</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Pending Teacher Action</span>
                    </span>
                  )}
                </div>

                {!report.resolved && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleResolve(report.id, 'quarantine')}
                      disabled={resolvingId === report.id}
                      className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-semibold transition-colors flex items-center space-x-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Quarantine Question</span>
                    </button>
                    <button
                      onClick={() => handleResolve(report.id, 'dismiss')}
                      disabled={resolvingId === report.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
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
