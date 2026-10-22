'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Flag, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface ContentReportModalProps {
  questionId: string;
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ContentReportModal: React.FC<ContentReportModalProps> = ({
  questionId,
  studentId,
  isOpen,
  onClose
}) => {
  const [category, setCategory] = useState<string>('incorrect_answer_key');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.submitReport({
        question_id: questionId,
        student_id: studentId,
        category,
        description: description.trim()
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 pb-3 border-b border-white/10">
          <Flag className="w-5 h-5 text-rose-400" />
          <h3 className="text-sm font-bold text-white">Report an Issue with Question</h3>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">Thank you for your feedback!</p>
            <p className="text-xs text-white/60">
              Our teaching staff has received this report and will review the question promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center space-x-2 backdrop-blur-xl">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white backdrop-blur-md focus:outline-none focus:border-teal-400"
              >
                <option value="incorrect_answer_key" className="bg-[#18110c] text-white">Incorrect Answer Key / Wrong Solution</option>
                <option value="ambiguous_wording" className="bg-[#18110c] text-white">Ambiguous or Confusing Question Wording</option>
                <option value="typo_or_formatting" className="bg-[#18110c] text-white">Typo, Sign Slip, or Math Formatting Issue</option>
                <option value="pedagogically_unclear" className="bg-[#18110c] text-white">Pedagogically Unclear / Unhelpful Explanation</option>
                <option value="technical_glitch" className="bg-[#18110c] text-white">Technical Glitch / Option Display Error</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Detailed Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Explain what was incorrect or unclear about this question..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-white/40 backdrop-blur-md focus:outline-none focus:border-teal-400"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white transition-colors backdrop-blur-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-rose-500/20"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
