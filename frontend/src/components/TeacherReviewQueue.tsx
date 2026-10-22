'use client';

import React, { useState, useEffect } from 'react';
import { api, ContentReviewItem, DynamicLesson } from '@/lib/api';
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Filter,
  Clock,
  RefreshCw,
  BookOpen
} from 'lucide-react';

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
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
            Approved
          </span>
        );
      case 'pending_review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 backdrop-blur-md">
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 backdrop-blur-md">
            Rejected
          </span>
        );
      case 'disabled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/15 text-red-300 border border-red-500/30 backdrop-blur-md">
            Quarantined
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white/70 border border-white/15 backdrop-blur-md">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center flex-shrink-0 shadow-md backdrop-blur-md">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>AI Content Quality Gate & Teacher Review</span>
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              Only approved questions are served to students. Unapproved or flagged content is quarantined.
            </p>
          </div>
        </div>

        {/* Content Type Toggle & Filter controls with Glass styling */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10 text-xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => setQueueType('questions')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                queueType === 'questions'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Questions ({reviews.length})
            </button>
            <button
              type="button"
              onClick={() => setQueueType('lessons')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                queueType === 'lessons'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Lessons ({dynamicLessons.length})
            </button>
          </div>

          <div className="flex items-center space-x-1.5 bg-black/40 border border-white/10 rounded-2xl px-3 py-1.5 text-xs backdrop-blur-md">
            <Filter className="w-3.5 h-3.5 text-white/60" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-slate-900 text-white">All Statuses ({reviews.length})</option>
              <option value="pending_review" className="bg-slate-900 text-white">Pending Review</option>
              <option value="approved" className="bg-slate-900 text-white">Approved</option>
              <option value="rejected" className="bg-slate-900 text-white">Rejected</option>
              <option value="disabled" className="bg-slate-900 text-white">Quarantined / Disabled</option>
              <option value="draft" className="bg-slate-900 text-white">Draft</option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadReviews}
            title="Refresh review items"
            className="p-2 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all backdrop-blur-md shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-white/60">Loading AI content review queue...</p>
        </div>
      ) : queueType === 'lessons' ? (
        dynamicLessons.length === 0 ? (
          <div className="p-10 text-center bg-black/20 rounded-2xl border border-white/10 backdrop-blur-xl">
            <BookOpen className="w-8 h-8 text-white/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No dynamic lessons generated yet.</p>
            <p className="text-xs text-white/60 mt-1">Lessons generated by students in the portal will appear here for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dynamicLessons.map((les) => (
              <div
                key={les.id}
                className="p-6 rounded-2xl border border-white/10 bg-black/20 hover:bg-black/30 backdrop-blur-xl transition-all shadow-lg space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/10 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(les.review_status)}
                    <span className="text-xs font-mono text-white/50">ID: {les.id}</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-xs font-mono font-semibold text-white/90">
                      [{les.subject}: {les.topic}]
                    </span>
                  </div>
                  <span className="text-xs text-white/50">{les.created_at}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{les.topic} ({les.level})</h4>
                  <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">{les.core_explanation}</p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
                  {les.review_status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleLessonAction(les.id, 'approve')}
                      disabled={actionInProgress === les.id}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Lesson</span>
                    </button>
                  )}
                  {les.review_status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleLessonAction(les.id, 'reject', 'Needs pedagogical revision')}
                      disabled={actionInProgress === les.id}
                      className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                  {les.review_status !== 'disabled' && (
                    <button
                      type="button"
                      onClick={() => handleLessonAction(les.id, 'disable', 'Disabled by teacher')}
                      disabled={actionInProgress === les.id}
                      className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 active:scale-95"
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
        <div className="p-10 text-center bg-black/20 rounded-2xl border border-white/10 backdrop-blur-xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">No questions in this filter view.</p>
          <p className="text-xs text-white/60 mt-1">All AI generated items are reconciled.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((q) => (
            <div
              key={q.id}
              className={`p-6 rounded-2xl border transition-all space-y-4 backdrop-blur-xl ${
                q.review_status === 'pending_review'
                  ? 'bg-black/30 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : q.review_status === 'approved'
                  ? 'bg-black/20 hover:bg-black/30 border-white/10 shadow-lg'
                  : 'bg-black/30 border-rose-500/30 shadow-lg shadow-rose-500/5'
              }`}
            >
              {/* Question Card Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 border-b border-white/10 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(q.review_status)}
                  <span className="text-xs font-mono text-white/50">ID: {q.id}</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-xs font-mono font-semibold text-white/90">
                    [{q.concept_id}]
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-white/50">Validation:</span>
                  <span className={`font-mono font-semibold ${q.validation_status === 'valid' ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {q.validation_status}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/50">Source: <strong className="text-white capitalize">{q.source}</strong></span>
                </div>
              </div>

              {/* Prompt Text */}
              <div>
                <h4 className="text-base font-semibold text-white tracking-tight">{q.prompt}</h4>
              </div>

              {/* Answer Option Pills in Glass Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border font-mono transition-all flex items-center justify-between ${
                      opt.text === q.correct_answer
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 backdrop-blur-md shadow-sm'
                        : 'border-white/10 bg-black/30 text-white/70 backdrop-blur-md'
                    }`}
                  >
                    <span className="font-semibold">{opt.text}</span>
                    {opt.text === q.correct_answer && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans font-bold">
                        Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Audit history info */}
              {q.reviewed_by && (
                <div className="text-[11px] text-white/40 flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-white/40" />
                  <span>
                    Reviewed by <strong className="text-white/70">{q.reviewed_by}</strong> at {new Date(q.reviewed_at || '').toLocaleString()}
                  </span>
                  {q.review_notes && (
                    <span className="text-rose-300 ml-2">Note: {q.review_notes}</span>
                  )}
                </div>
              )}

              {/* Action Buttons in Glass Style */}
              <div className="pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-end gap-2.5">
                {q.review_status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleAction(q.id, 'approve')}
                    disabled={actionInProgress === q.id}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve for Students</span>
                  </button>
                )}

                {q.review_status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => setRejectReasonPrompt({ id: q.id, prompt: q.prompt })}
                    disabled={actionInProgress === q.id}
                    className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                {q.active && (
                  <button
                    type="button"
                    onClick={() => handleAction(q.id, 'disable', 'Quarantined by instructor')}
                    disabled={actionInProgress === q.id}
                    className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 active:scale-95"
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

      {/* Reject Reason Modal in Glass Style */}
      {rejectReasonPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-950/90 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-2xl">
            <h4 className="text-sm font-bold text-white">Provide Rejection Reason</h4>
            <p className="text-xs text-white/60">
              Explain why this question does not meet pedagogical quality standards:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Ambiguous wording in step 2; misleading distractor option."
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30 backdrop-blur-md"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectReasonPrompt(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(rejectReasonPrompt.id, 'reject', rejectReason || 'Did not meet quality standards')}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-md shadow-rose-500/20"
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
