'use client';

import React, { useState, useEffect } from 'react';
import {
  apiClient,
  DynamicLesson,
  DynamicAssessmentSession,
  DynamicAssessmentResult,
  TopicCatalogItem,
  ConfidenceLevel,
  Question
} from '@/lib/api';
import { useApp } from '@/lib/context';
import { ConfidenceInsightCard } from '@/components/ConfidenceInsightCard';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  FileText,
  ListOrdered,
  Activity,
  ArrowRight
} from 'lucide-react';

export function DynamicLessonAndAssessmentView() {
  const { activeStudentId, t } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'lesson' | 'assessment'>('lesson');

  const [catalog, setCatalog] = useState<TopicCatalogItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [selectedTopic, setSelectedTopic] = useState<string>('Linear Equations');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const [isGeneratingLesson, setIsGeneratingLesson] = useState<boolean>(false);
  const [lessonData, setLessonData] = useState<DynamicLesson | null>(null);
  const [expandedExample, setExpandedExample] = useState<number | null>(0);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({});

  const [difficulty, setDifficulty] = useState<number>(0.5);
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState<boolean>(false);
  const [assessmentSession, setAssessmentSession] = useState<DynamicAssessmentSession | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [userConfidences, setUserConfidences] = useState<Record<string, ConfidenceLevel>>({});
  const [userReasonings, setUserReasonings] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<DynamicAssessmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiClient.getTopicCatalog().then((items) => {
      if (mounted) setCatalog(items);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const activeTopicName = customTopic.trim() || selectedTopic;

  const handleGenerateLesson = async () => {
    setIsGeneratingLesson(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.generateDynamicLesson({
        student_id: activeStudentId,
        subject: selectedSubject,
        topic: activeTopicName,
        level,
        learning_objective: `Master core principles and common traps in ${activeTopicName}`,
        style: 'concept_first'
      });
      setLessonData(res);
      setRevealedSolutions({});
      setExpandedExample(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate lesson. Please retry.');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleStartAssessment = async () => {
    setIsGeneratingAssessment(true);
    setErrorMsg(null);
    setAssessmentResult(null);
    setUserAnswers({});
    setUserConfidences({});
    setUserReasonings({});
    try {
      const res = await apiClient.generateDynamicAssessment({
        student_id: activeStudentId,
        subject: selectedSubject,
        topic: activeTopicName,
        difficulty,
        question_count: questionCount,
        question_type: 'multiple_choice'
      });
      setAssessmentSession(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate assessment. Please retry.');
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!assessmentSession) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const answersList = assessmentSession.questions.map((q) => ({
        question_id: q.id,
        student_answer: userAnswers[q.id] || '',
        confidence: userConfidences[q.id],
        reasoning: userReasonings[q.id] || ''
      }));

      const res = await apiClient.submitDynamicAssessment({
        assessment_id: assessmentSession.assessment_id,
        student_id: activeStudentId,
        answers: answersList
      });
      setAssessmentResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('lesson')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeSubTab === 'lesson'
                ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('Dynamic Lesson Studio', 'डायनामिक पाठ निर्माण')}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('assessment')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeSubTab === 'assessment'
                ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{t('Dynamic Assessment Engine', 'डायनामिक मूल्यांकन इंजन')}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 px-2 text-xs">
          <span className="text-slate-400">{t('Student Level:', 'स्तर:')}</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-white backdrop-blur-md focus:outline-none focus:border-white/30"
          >
            <option value="beginner" className="bg-[#18110c] text-white">Beginner</option>
            <option value="intermediate" className="bg-[#18110c] text-white">Intermediate</option>
            <option value="advanced" className="bg-[#18110c] text-white">Advanced</option>
          </select>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          {t('Select Target Subject & Topic', 'लक्षित विषय एवं अवधारणा चुनें')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                const matching = catalog.filter((c) => c.subject === e.target.value);
                if (matching.length > 0) setSelectedTopic(matching[0].name);
              }}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-3 py-2 text-sm text-white backdrop-blur-md focus:outline-none focus:border-teal-400"
            >
              <option value="Mathematics" className="bg-[#18110c] text-white">📐 Mathematics</option>
              <option value="Physics" className="bg-[#18110c] text-white">⚡ Physics</option>
              <option value="Chemistry" className="bg-[#18110c] text-white">🧪 Chemistry</option>
              <option value="Biology" className="bg-[#18110c] text-white">🧬 Biology</option>
              <option value="Computer Science" className="bg-[#18110c] text-white">💻 Computer Science</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Curated Catalog Topics</label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setCustomTopic('');
              }}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-3 py-2 text-sm text-white backdrop-blur-md focus:outline-none focus:border-teal-400"
            >
              {catalog
                .filter((c) => c.subject === selectedSubject)
                .map((c) => (
                  <option key={c.id} value={c.name} className="bg-[#18110c] text-white">
                    {c.name} {c.status === 'verified' ? '✓ (Verified in Graph)' : '(Community)'}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Or Enter Any Custom Topic</label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Quantum Superposition, Transformers..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-3 py-2 text-sm text-white placeholder-white/40 backdrop-blur-md focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center space-x-2 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeSubTab === 'lesson' && (
        <div className="space-y-6">
          {!lessonData && (
            <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">
                  Generate Structured Lesson for {activeTopicName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  xAI Grok will construct a full pedagogical breakdown with prerequisites, core principles, step-by-step examples, common misconceptions, and practice checks.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateLesson}
                disabled={isGeneratingLesson}
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20 inline-flex items-center space-x-2 disabled:opacity-50"
              >
                {isGeneratingLesson ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Pedagogical Lesson...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Structured Lesson</span>
                  </>
                )}
              </button>
            </div>
          )}

          {lessonData && (
            <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      {lessonData.subject} · {lessonData.level}
                    </span>
                    {lessonData.is_fallback ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                        Curated Engine
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Generated by xAI Grok
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{lessonData.topic}</h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGenerateLesson}
                    disabled={isGeneratingLesson}
                    className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition flex items-center space-x-1.5 backdrop-blur-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSubTab('assessment');
                      handleStartAssessment();
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5 shadow-md shadow-teal-500/20"
                  >
                    <span>Take Diagnostic Assessment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Learning Objectives</span>
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    {lessonData.learning_objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4" />
                    <span>Prerequisites</span>
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    {lessonData.prerequisites.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Core Theory & Invariants</span>
                </h3>
                <div className="bg-black/30 border border-white/10 rounded-2xl p-5 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap backdrop-blur-xl">
                  {lessonData.core_explanation}
                </div>
              </div>

              {lessonData.step_by_step_examples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Step-by-Step Worked Examples</span>
                  </h3>
                  <div className="space-y-3">
                    {lessonData.step_by_step_examples.map((ex, idx) => (
                      <div key={idx} className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                        <button
                          type="button"
                          onClick={() => setExpandedExample(expandedExample === idx ? null : idx)}
                          className="w-full px-5 py-3 text-left font-semibold text-sm text-slate-200 hover:text-white flex items-center justify-between"
                        >
                          <span>{ex.title}</span>
                          {expandedExample === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedExample === idx && (
                          <div className="p-5 border-t border-white/10 bg-black/20 space-y-3 text-xs">
                            <div className="space-y-1.5">
                              {ex.steps.map((st: string, sIdx: number) => (
                                <div key={sIdx} className="text-slate-300 font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                                  {st}
                                </div>
                              ))}
                            </div>
                            {ex.takeaway && (
                              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 font-medium">
                                💡 Takeaway: {ex.takeaway}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lessonData.common_mistakes_and_misconceptions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Common Mistakes & Misconceptions</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessonData.common_mistakes_and_misconceptions.map((m, idx) => (
                      <div key={idx} className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xl">
                        <div className="text-xs font-bold text-rose-400">⚠️ {m.mistake}</div>
                        <div className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">Why it happens:</span> {m.why_it_happens}
                        </div>
                        <div className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-xl">
                          <span className="font-semibold">How to fix:</span> {m.how_to_fix}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lessonData.practice_questions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>Practice Checks</span>
                  </h3>
                  <div className="space-y-3">
                    {lessonData.practice_questions.map((pq, idx) => (
                      <div key={idx} className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl">
                        <div className="text-xs font-semibold text-slate-200">
                          Question {idx + 1}: {pq.prompt}
                        </div>
                        {pq.hint && (
                          <div className="text-xs text-amber-300/80 bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                            💡 Hint: {pq.hint}
                          </div>
                        )}
                        <div>
                          <button
                            type="button"
                            onClick={() => setRevealedSolutions((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                            className="text-xs font-medium text-teal-400 hover:text-teal-300 underline"
                          >
                            {revealedSolutions[idx] ? 'Hide Solution' : 'Reveal Solution'}
                          </button>
                          {revealedSolutions[idx] && (
                            <div className="mt-2 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 font-mono backdrop-blur-md">
                              {pq.solution}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-2 backdrop-blur-xl">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Lesson Summary</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{lessonData.short_summary}</p>
                {lessonData.suggested_next_steps.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Recommended Next Steps:</span>
                    <ul className="text-xs text-teal-400/90 space-y-1 list-disc list-inside">
                      {lessonData.suggested_next_steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'assessment' && (
        <div className="space-y-6">
          {!assessmentSession && (
            <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Diagnostic Assessment: {activeTopicName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generate dynamic multiple-choice and short-answer diagnostic questions for any arbitrary subject. Answer keys are strictly withheld until submission.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Number of Questions</span>
                    <span className="text-teal-400 font-bold">{questionCount} Items</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Difficulty Scale</span>
                    <span className="text-teal-400 font-bold">{Math.round(difficulty * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.9"
                    step="0.1"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartAssessment}
                disabled={isGeneratingAssessment}
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20 inline-flex items-center space-x-2 disabled:opacity-50"
              >
                {isGeneratingAssessment ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Authoring Dynamic Questions...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    <span>Start Diagnostic Assessment</span>
                  </>
                )}
              </button>
            </div>
          )}

          {assessmentSession && !assessmentResult && (
            <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                    {assessmentSession.subject} · {assessmentSession.topic}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">Diagnostic Assessment</h3>
                </div>
                <button
                  onClick={() => setAssessmentSession(null)}
                  className="px-3 py-1 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-xs text-white/80 backdrop-blur-md"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-6">
                {assessmentSession.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-black/30 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Question {qIdx + 1} of {assessmentSession.total_questions}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-100">{q.prompt}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {q.options.map((opt) => {
                        const isSelected = userAnswers[q.id] === opt.text;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setUserAnswers((prev) => ({ ...prev, [q.id]: opt.text }))}
                            className={`p-3.5 rounded-xl border text-left text-xs font-medium transition flex items-center space-x-2 backdrop-blur-md ${
                              isSelected
                                ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-bold shadow-sm'
                                : 'bg-black/40 border-white/10 text-white/80 hover:bg-white/10'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center flex-shrink-0 text-[10px]">
                              {isSelected ? '✓' : ''}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">How confident do you feel?</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['low', 'medium', 'high'] as const).map((conf) => (
                            <button
                              key={conf}
                              type="button"
                              onClick={() => setUserConfidences((prev) => ({ ...prev, [q.id]: conf }))}
                              className={`py-1.5 rounded-lg border capitalize text-center font-medium transition backdrop-blur-md ${
                                userConfidences[q.id] === conf
                                  ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                                  : 'bg-black/40 border-white/10 text-white/70 hover:text-white'
                              }`}
                            >
                              {conf}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Optional reasoning / step calculation</label>
                        <input
                          type="text"
                          value={userReasonings[q.id] || ''}
                          onChange={(e) => setUserReasonings((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Why did you choose this answer?"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-teal-400 backdrop-blur-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitAssessment}
                  disabled={isSubmitting || Object.keys(userAnswers).length === 0}
                  className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/20 inline-flex items-center space-x-2 disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Grading & Analyzing Diagnostic...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Answers for Evaluation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {assessmentResult && (
            <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                    Results & Step Breakdown
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    {assessmentResult.topic} Evaluation
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{assessmentResult.overall_feedback}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">
                      {Math.round(assessmentResult.score * 100)}%
                    </span>
                    <span className="text-xs text-slate-400 block">
                      {assessmentResult.correct_count} / {assessmentResult.total_questions} Correct
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAssessmentResult(null);
                      setAssessmentSession(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5 shadow"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Start Fresh Reassessment</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {assessmentResult.evaluations.map((evalItem, idx) => (
                  <div
                    key={idx}
                    className={`bg-black/30 border rounded-2xl p-6 space-y-4 backdrop-blur-xl ${
                      evalItem.is_correct ? 'border-emerald-500/30' : 'border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Question {idx + 1}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 ${
                          evalItem.is_correct
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {evalItem.is_correct ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Incorrect</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-slate-300">
                        <span className="font-semibold text-slate-400">Correct Answer:</span> {evalItem.correct_answer}
                      </div>
                    </div>

                    {evalItem.misconception_explanation && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                        <span className="font-bold">Cognitive Insight:</span> {evalItem.misconception_explanation}
                      </div>
                    )}

                    {evalItem.worked_solution && evalItem.worked_solution.length > 0 && (
                      <div className="space-y-1 bg-black/40 p-3.5 rounded-xl border border-white/10 backdrop-blur-md">
                        <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                          Full Step Solution:
                        </span>
                        {evalItem.worked_solution.map((st, sIdx) => (
                          <div key={sIdx} className="text-xs text-slate-300 font-mono">
                            {st}
                          </div>
                        ))}
                      </div>
                    )}

                    {evalItem.confidence_insight && (
                      <ConfidenceInsightCard insight={evalItem.confidence_insight} />
                    )}
                  </div>
                ))}
              </div>

              {assessmentResult.suggested_next_steps.length > 0 && (
                <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-2 backdrop-blur-xl">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recommended Pedagogical Next Steps
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    {assessmentResult.suggested_next_steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
