'use client';

import React, { useState, useEffect } from 'react';
import { api, ContentReviewItem, DynamicLesson } from '@/lib/api';
import { CheckCircle2, XCircle, ShieldAlert, Filter, Clock, Eye, AlertCircle, RefreshCw, BookOpen, Layers } from 'lucide-react';

export const TeacherReviewQueue: React.FC = () => {
  const [queueType, setQueueType] = useState<'questions' | 'lessons'>('questions');
  const [reviews, setReviews] = useState<ContentReviewItem[]>([]);
  const [dynamicLessons, setDynamicLessons] = useState<DynamicLesson[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectReasonPrompt, setRejectReasonPrompt] = useState<{ id: string; prompt: string } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [data, dyn] = await Promise.all([
        api.getContentReviews(statusFilter === 'all' ? undefined : statusFilter),
        api.getTeacherDynamicContent().catch(() => ({ lessons: [], questions: [] }))
      ]);
      setReviews(data);
      if (dyn && dyn.lessons) {
        setDynamicLessons(dyn.lessons);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleLessonAction = async (lessonId: string, action: 'approve' | 'reject' | 'disable', reason?: string) => {
    try {
      setActionInProgress(lessonId);
      await api.reviewTeacherDynamicContent(lessonId, action, reason, 'teacher_sarah');
      await loadReviews();
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAction = async (questionId: string, action: 'approve' | 'reject' | 'disable' | 'request_review', reason?: string) => {
    try {
      setActionInProgress(questionId);
      await api.processContentReview(questionId, {
        action,
        reviewer_id: 'teacher_sarah',
        reviewer_name: 'Sarah Connor',
        reason
      });
      await loadReviews();
      setRejectReasonPrompt(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Approved</span>;
      case 'pending_review':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Pending Review</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Rejected</span>;
      case 'disabled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">Quarantined / Disabled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">Draft</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-teal-400" />
            <span>AI Content Quality Gate & Teacher Review</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Only approved questions are served to students. Unapproved or flagged content is quarantined.
          </p>
        </div>

        {/* Content Type Toggle & Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setQueueType('questions')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                queueType === 'questions' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Questions ({reviews.length})
            </button>
            <button
              onClick={() => setQueueType('lessons')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                queueType === 'lessons' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lessons ({dynamicLessons.length})
            </button>
          </div>
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses ({reviews.length})</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disabled">Quarantined / Disabled</option>
            <option value="draft">Draft</option>
          </select>

          <button
            onClick={loadReviews}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading AI content review queue...</p>
        </div>
      ) : queueType === 'lessons' ? (
        dynamicLessons.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
            <BookOpen className="w-8 h-8 text-teal-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">No dynamic lessons generated yet.</p>
            <p className="text-xs text-slate-400 mt-1">Lessons generated by students in the portal will appear here for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dynamicLessons.map((les) => (
              <div
                key={les.id}
                className="p-5 rounded-xl border border-slate-800 bg-slate-950 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(les.review_status)}
                    <span className="text-xs font-mono text-slate-400">ID: {les.id}</span>
                    <span className="text-xs font-bold text-teal-400">[{les.subject}: {les.topic}]</span>
                  </div>
                  <span className="text-xs text-slate-400">{les.created_at}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{les.topic} ({les.level})</h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{les.core_explanation}</p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-900">
                  {les.review_status !== 'approved' && (
                    <button
                      onClick={() => handleLessonAction(les.id, 'approve')}
                      disabled={actionInProgress === les.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Lesson</span>
                    </button>
                  )}
                  {les.review_status !== 'rejected' && (
                    <button
                      onClick={() => handleLessonAction(les.id, 'reject', 'Needs pedagogical revision')}
                      disabled={actionInProgress === les.id}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                  {les.review_status !== 'disabled' && (
                    <button
                      onClick={() => handleLessonAction(les.id, 'disable', 'Disabled by teacher')}
                      disabled={actionInProgress === les.id}
                      className="px-3 py-1.5 rounded-xl bg-red-950/60 text-red-300 border border-red-800/60 text-xs font-semibold flex items-center space-x-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Disable</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : reviews.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-200">No questions in this filter view.</p>
          <p className="text-xs text-slate-400 mt-1">All AI generated items are reconciled.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((q) => (
            <div
              key={q.id}
              className={`p-5 rounded-xl border transition-all ${
                q.review_status === 'pending_review'
                  ? 'bg-slate-950 border-amber-500/40'
                  : q.review_status === 'approved'
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-950 border-rose-500/30'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                <div className="flex items-center space-x-2">
                  {getStatusBadge(q.review_status)}
                  <span className="text-xs font-mono text-slate-400">ID: {q.id}</span>
                  <span className="text-xs font-medium text-teal-400 font-mono">[{q.concept_id}]</span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Validation:</span>
                  <span className={`font-mono ${q.validation_status === 'valid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {q.validation_status}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Source: <strong className="text-slate-300 capitalize">{q.source}</strong></span>
                </div>
              </div>

              {/* Prompt */}
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-white">{q.prompt}</h4>
              </div>

              {/* Options */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-2.5 rounded-lg border font-mono ${
                      opt.text === q.correct_answer
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {opt.text === q.correct_answer && (
                      <span className="ml-2 text-[10px] text-emerald-400 font-sans font-bold">(Correct)</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Audit history info */}
              {q.reviewed_by && (
                <div className="mt-3 text-[11px] text-slate-500 flex items-center space-x-2">
                  <Clock className="w-3 h-3" />
                  <span>
                    Reviewed by <strong className="text-slate-400">{q.reviewed_by}</strong> at {new Date(q.reviewed_at || '').toLocaleString()}
                  </span>
                  {q.review_notes && (
                    <span className="text-rose-400 ml-2">Note: {q.review_notes}</span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-2">
                {q.review_status !== 'approved' && (
                  <button
                    onClick={() => handleAction(q.id, 'approve')}
                    disabled={actionInProgress === q.id}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve for Students</span>
                  </button>
                )}

                {q.review_status !== 'rejected' && (
                  <button
                    onClick={() => setRejectReasonPrompt({ id: q.id, prompt: q.prompt })}
                    disabled={actionInProgress === q.id}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                {q.active && (
                  <button
                    onClick={() => handleAction(q.id, 'disable', 'Quarantined by instructor')}
                    disabled={actionInProgress === q.id}
                    className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Quarantine (Disable)</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectReasonPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-white">Provide Rejection Reason</h4>
            <p className="text-xs text-slate-400">
              Explain why this question does not meet pedagogical quality standards:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Ambiguous wording in step 2; misleading distractor option."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectReasonPrompt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(rejectReasonPrompt.id, 'reject', rejectReason || 'Did not meet quality standards')}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
