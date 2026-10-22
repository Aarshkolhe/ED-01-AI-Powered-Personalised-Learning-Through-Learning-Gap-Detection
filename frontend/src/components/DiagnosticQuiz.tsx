'use client';

import React, { useState, useEffect } from 'react';
import { api, Question, AnswerEvaluation, ConfidenceLevel, Recommendation } from '@/lib/api';
import { useApp } from '@/lib/context';
import { ConfidenceInsightCard } from '@/components/ConfidenceInsightCard';
import { ContentReportModal } from '@/components/ContentReportModal';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Sparkles,
  Flag,
  Lightbulb,
  Info
} from 'lucide-react';

interface DiagnosticQuizProps {
  conceptId?: string;
  isReassessment?: boolean;
  onQuizComplete?: () => void;
}

export const DiagnosticQuiz: React.FC<DiagnosticQuizProps> = ({
  conceptId,
  isReassessment = false,
  onQuizComplete
}) => {
  const { activeStudentId, language, t } = useApp();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceLevel | undefined>(undefined);
  const [freeTextReasoning, setFreeTextReasoning] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [followUpOption, setFollowUpOption] = useState<string>('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const loadQuizData = async () => {
      try {
        setLoading(true);
        const [qData, recData] = await Promise.all([
          isReassessment
            ? api.getReassessmentQuestions(conceptId)
            : api.getDiagnosticQuestions(conceptId),
          api.getExplainableRecommendation(activeStudentId, conceptId).catch(() => null)
        ]);

        if (mounted) {
          setQuestions(qData);
          setRecommendation(recData);
          setCurrentIndex(0);
          setEvaluation(null);
          setSelectedOption('');
          setSelectedConfidence(undefined);
          setFollowUpOption('');
          setSubmittingFollowUp(false);
          setStartTime(Date.now());
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadQuizData();
    return () => {
      mounted = false;
    };
  }, [conceptId, isReassessment, activeStudentId]);

  const handleSubmit = async () => {
    if (!selectedOption || submitting) return;
    setSubmitting(true);
    const duration = (Date.now() - startTime) / 1000;
    const currentQ = questions[currentIndex];

    try {
      const evalResult = await api.submitAnswer({
        student_id: activeStudentId,
        question_id: currentQ.id,
        student_answer: selectedOption,
        response_time_seconds: Math.round(duration * 10) / 10,
        free_text_reasoning: freeTextReasoning,
        confidence: selectedConfidence,
        is_reassessment: isReassessment
      });
      setEvaluation(evalResult);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!evaluation?.follow_up_question || !followUpOption || submittingFollowUp) return;
    setSubmittingFollowUp(true);
    try {
      const followUpEval = await api.submitAnswer({
        student_id: activeStudentId,
        question_id: evaluation.follow_up_question.id,
        student_answer: followUpOption,
        response_time_seconds: 5.0,
        is_reassessment: isReassessment
      });
      setEvaluation(followUpEval);
      setFollowUpOption('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setEvaluation(null);
      setSelectedOption('');
      setSelectedConfidence(undefined);
      setFreeTextReasoning('');
      setFollowUpOption('');
      setSubmittingFollowUp(false);
      setStartTime(Date.now());
    } else {
      if (onQuizComplete) onQuizComplete();
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-3">
          {t('Loading assessment items...', 'मूल्यांकन प्रश्न लोड हो रहे हैं...')}
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <p className="text-sm text-slate-300">
          {t('No diagnostic questions found for this topic.', 'इस विषय के लिए कोई प्रश्न नहीं मिला।')}
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const promptText = (language === 'hi' && currentQ.prompt_hi) ? currentQ.prompt_hi : currentQ.prompt;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
      {/* Feature C: Explainable Recommendation Badge */}
      {recommendation && (
        <div className="mb-4 p-3 bg-teal-950/30 border border-teal-500/30 rounded-xl text-xs flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-teal-300 uppercase tracking-wider text-[10px]">
                Why this activity was selected:
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-200">
                {recommendation.reason_code}
              </span>
            </div>
            <p className="text-slate-300 mt-1 text-xs">
              {recommendation.explanation}
            </p>
          </div>
        </div>
      )}

      {/* Quiz Progress Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold uppercase tracking-wider text-teal-400">
            {isReassessment ? t('Reassessment (Post-Test)', 'पुनर्मूल्यांकन (पोस्ट-टेस्ट)') : t('Diagnostic Assessment', 'निदानात्मक मूल्यांकन')}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{currentQ.concept_id}</span>
        </div>

        <div className="flex items-center space-x-3 text-slate-400 font-medium">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-400 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Feature F: Report Issue Button */}
          <button
            onClick={() => setReportModalOpen(true)}
            title="Report an issue with this question"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-slate-100 leading-snug">
          {promptText}
        </h3>
      </div>

      {/* Answer Options */}
      <div className="mt-5 space-y-3">
        {currentQ.options.map((opt) => {
          const isSelected = selectedOption === opt.text;
          const optText = (language === 'hi' && opt.text_hi) ? opt.text_hi : opt.text;

          return (
            <button
              key={opt.id}
              onClick={() => !evaluation && setSelectedOption(opt.text)}
              disabled={evaluation !== null}
              className={`w-full text-left p-4 rounded-xl border font-mono text-sm transition-all flex items-center justify-between ${
                isSelected
                  ? 'border-teal-500 bg-teal-500/10 text-teal-200 shadow-md shadow-teal-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <span>{optText}</span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-teal-400 bg-teal-400 text-slate-950' : 'border-slate-600'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature A: Optional Confidence Level Selector */}
      {!evaluation && (
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('How confident do you feel about this answer? (Optional)', 'इस उत्तर पर आपका विश्वास कितना है? (वैकल्पिक)')}</span>
            </label>
            {selectedConfidence && (
              <button
                type="button"
                onClick={() => setSelectedConfidence(undefined)}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { val: 'low' as ConfidenceLevel, label: 'Low', desc: 'Just guessing / unsure', color: 'hover:border-purple-500/50' },
              { val: 'medium' as ConfidenceLevel, label: 'Medium', desc: 'Somewhat confident', color: 'hover:border-blue-500/50' },
              { val: 'high' as ConfidenceLevel, label: 'High', desc: 'Very certain', color: 'hover:border-emerald-500/50' }
            ].map((lvl) => {
              const active = selectedConfidence === lvl.val;
              return (
                <button
                  key={lvl.val}
                  type="button"
                  onClick={() => setSelectedConfidence(active ? undefined : lvl.val)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    active
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10'
                      : `bg-slate-950/60 border-slate-800 text-slate-400 ${lvl.color}`
                  }`}
                >
                  <div className="text-xs font-bold">{lvl.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{lvl.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Free-text reasoning field */}
      {!evaluation && (
        <div className="mt-4">
          <label className="text-xs text-slate-400 font-medium block mb-1">
            {t('Explain your reasoning (optional AI misconception detection signal):', 'अपने तर्क की व्याख्या करें (वैकल्पिक):')}
          </label>
          <input
            type="text"
            value={freeTextReasoning}
            onChange={(e) => setFreeTextReasoning(e.target.value)}
            placeholder={t("e.g., 'I added 1+1 and 2+3 to get the new fraction'", "उदा. 'मैंने अंश और हर दोनों को जोड़ दिया'")}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
      )}

      {/* Submit Action */}
      {!evaluation && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedOption || submitting}
            className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/20 flex items-center space-x-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{t('Submit Answer', 'उत्तर जमा करें')}</span>
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Comprehensive Evaluation & AI Misconception Feedback */}
      {evaluation && (
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
          <div
            className={`p-4 rounded-xl border ${
              evaluation.is_correct
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-rose-950/30 border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {evaluation.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <span
                  className={`text-sm font-bold ${
                    evaluation.is_correct ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {evaluation.is_correct
                    ? t('Correct! Outstanding work.', 'सही उत्तर! बहुत बढ़िया।')
                    : t('Incorrect — Conceptual Gap Identified', 'गलत उत्तर — अवधारणात्मक गैप पाया गया')}
                </span>
              </div>
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{evaluation.response_time_seconds}s</span>
              </span>
            </div>

            {/* Misconception details */}
            {evaluation.detected_misconception && (
              <div className="mt-3 p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-amber-400 font-bold uppercase tracking-wider">
                    {t('Detected Trap:', 'पहचानी गई भूल:')} {evaluation.detected_misconception}
                  </span>
                  {evaluation.error_taxonomy && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                      {evaluation.error_taxonomy}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 font-medium">
                  {evaluation.misconception_explanation}
                </p>
              </div>
            )}

            {/* AI feedback */}
            {evaluation.ai_feedback && (
              <div className="mt-3 flex items-start space-x-2 text-xs text-teal-300 bg-teal-950/20 border border-teal-500/20 p-3 rounded-lg">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{t('Tutor Feedback:', 'शिक्षक सुझाव:')} </span>
                  <span>{evaluation.ai_feedback}</span>
                </div>
              </div>
            )}

            {/* Step-by-Step Worked Solution (Spec §7, §20) */}
            {evaluation.worked_solution && evaluation.worked_solution.length > 0 && (
              <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-teal-500/30 text-xs">
                <span className="text-teal-400 font-bold uppercase tracking-wider block mb-1">
                  {t('Step-by-Step Worked Solution:', 'चरण-दर-चरण हल:')}
                </span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-300 font-mono text-[11px]">
                  {evaluation.worked_solution.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feature A: Confidence-Based Learning Insight Card */}
            {evaluation.confidence_insight && (
              <div className="mt-3">
                <ConfidenceInsightCard insight={evaluation.confidence_insight} />
              </div>
            )}

            {/* Diagnostic Follow-Up Question Disambiguation (Spec §18.3) */}
            {evaluation.needs_follow_up && evaluation.follow_up_question && (
              <div className="mt-4 p-4 bg-purple-950/30 border border-purple-500/40 rounded-xl">
                <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>{t('Diagnostic Follow-Up Clarification', 'निदानात्मक अनुवर्ती स्पष्टीकरण')}</span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  {t(
                    "Let's check one quick follow-up to pinpoint your understanding and distinguish competing concepts:",
                    "आपकी समझ को सटीकता से जानने के लिए एक छोटा अनुवर्ती प्रश्न:"
                  )}
                </p>
                <div className="p-3 bg-slate-950/90 rounded-lg border border-purple-500/30 text-xs font-medium text-slate-200 mb-3">
                  {evaluation.follow_up_question.prompt}
                </div>
                <div className="space-y-2 mb-3">
                  {evaluation.follow_up_question.options.map((fOpt) => {
                    const isFSelected = followUpOption === fOpt.text;
                    return (
                      <button
                        key={fOpt.id}
                        type="button"
                        onClick={() => setFollowUpOption(fOpt.text)}
                        disabled={submittingFollowUp}
                        className={`w-full text-left p-3 rounded-lg border text-xs font-mono transition-all flex items-center justify-between ${
                          isFSelected
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-sm'
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{fOpt.text}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isFSelected ? 'border-purple-400 bg-purple-400 text-slate-950' : 'border-slate-600'
                          }`}
                        >
                          {isFSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleFollowUpSubmit}
                  disabled={!followUpOption || submittingFollowUp}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center space-x-2"
                >
                  {submittingFollowUp ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{t('Submit Clarification', 'स्पष्टीकरण सबमिट करें')}</span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* BKT Mastery Update Metrics */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span>BKT Prior: </span>
                <span className="font-mono text-slate-200">{(evaluation.previous_mastery * 100).toFixed(1)}%</span>
                <span className="mx-2">&rarr;</span>
                <span>Posterior: </span>
                <span className="font-mono font-bold text-teal-300">
                  {(evaluation.updated_mastery * 100).toFixed(1)}%
                </span>
                <span className={`ml-2 font-mono ${evaluation.mastery_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({evaluation.mastery_change >= 0 ? '+' : ''}{(evaluation.mastery_change * 100).toFixed(1)}%)
                </span>
              </div>
              <span className="text-slate-500">
                Pacing: <strong className="text-slate-400">{evaluation.time_signal}</strong>
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center space-x-1"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report an issue with this question</span>
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center space-x-2"
            >
              <span>
                {currentIndex + 1 < questions.length
                  ? t('Next Question', 'अगला प्रश्न')
                  : t('Complete Assessment', 'मूल्यांकन समाप्त करें')}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Feature F: Content Report Modal */}
      <ContentReportModal
        questionId={currentQ.id}
        studentId={activeStudentId}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
};
