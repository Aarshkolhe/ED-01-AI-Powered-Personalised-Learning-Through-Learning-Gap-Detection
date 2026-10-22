'use client';

import React, { useState, useEffect } from 'react';
import { api, Question, AnswerEvaluation } from '@/lib/api';
import { useApp } from '@/lib/context';
import { CheckCircle2, XCircle, ArrowRight, Clock, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

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
  const [freeTextReasoning, setFreeTextReasoning] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const data = isReassessment 
          ? await api.getReassessmentQuestions(conceptId)
          : await api.getDiagnosticQuestions(conceptId);
        if (mounted) {
          setQuestions(data);
          setCurrentIndex(0);
          setEvaluation(null);
          setSelectedOption('');
          setStartTime(Date.now());
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadQuestions();
    return () => { mounted = false; };
  }, [conceptId, isReassessment]);

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
        is_reassessment: isReassessment
      });
      setEvaluation(evalResult);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setEvaluation(null);
      setSelectedOption('');
      setFreeTextReasoning('');
      setStartTime(Date.now());
    } else {
      if (onQuizComplete) onQuizComplete();
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-3">{t('Loading assessment items...', 'मूल्यांकन प्रश्न लोड हो रहे हैं...')}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <p className="text-sm text-slate-300">{t('No diagnostic questions found for this topic.', 'इस विषय के लिए कोई प्रश्न नहीं मिला।')}</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const promptText = (language === 'hi' && currentQ.prompt_hi) ? currentQ.prompt_hi : currentQ.prompt;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
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
                <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">
                  {t('Detected Trap:', 'पहचानी गई भूल:')} {evaluation.detected_misconception}
                </span>
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

          <div className="flex justify-end">
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
    </div>
  );
};
