'use client';

import React, { useState } from 'react';
import { DiagnosticQuiz } from '@/components/DiagnosticQuiz';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { RecoveryPathView } from '@/components/RecoveryPathView';
import { RecoveryScoreCard } from '@/components/RecoveryScoreCard';
import { StepMistakeDetector } from '@/components/StepMistakeDetector';
import { MisconceptionGenerator } from '@/components/MisconceptionGenerator';
import { SpacedRevisionPanel } from '@/components/SpacedRevisionPanel';
import { AITutorView } from '@/components/AITutorView';
import { DynamicLessonAndAssessmentView } from '@/components/DynamicLessonAndAssessmentView';
import { ThinkFlowLogo } from '@/components/ThinkFlowLogo';
import { useApp } from '@/lib/context';
import {
  Network,
  Activity,
  Route,
  TrendingUp,
  Sparkles,
  RotateCcw,
  Bot,
  BookOpen
} from 'lucide-react';

export default function StudentPortalPage() {
  const { activeStudentId, t } = useApp();
  const [activeTab, setActiveTab] = useState<'ask-ai' | 'lessons' | 'diagnostic' | 'revision' | 'graph' | 'recovery' | 'steps' | 'generator'>('ask-ai');
  const [focalConcept, setFocalConcept] = useState<string>('fraction_addition_unlike');
  const [isReassessment, setIsReassessment] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-transparent text-slate-100 p-4 sm:p-6 md:p-10 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8 min-w-0 w-full">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center space-x-4">
            <ThinkFlowLogo size="sm" withLink priority />
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
                {t('Interactive Student Portal', 'छात्र पोर्टल')}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
                {t('Precision Mastery & Gap Remediation', 'सटीक दक्षता एवं लर्निंग गैप सुधार')}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {t('Bayesian Knowledge Tracing (BKT) active for session', 'सत्र के लिए बायेसियन नॉलेज ट्रेसिंग सक्रिय')} ({activeStudentId})
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/30 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
            {/* Primary Tab: Ask ThinkFlow AI */}
            <button
              onClick={() => setActiveTab('ask-ai')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'ask-ai'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{t('Ask ThinkFlow (AI)', 'थिंकफ्लो एआई से पूछें')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-600/30 text-teal-200 border border-teal-500/30 font-semibold uppercase">
                Grok
              </span>
            </button>

            {/* Dynamic Multi-Subject Lessons */}
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'lessons'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('Lessons & Practice', 'पाठ एवं अभ्यास')}</span>
            </button>

            <button
              onClick={() => { setActiveTab('diagnostic'); setIsReassessment(false); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'diagnostic' && !isReassessment
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t('Diagnostic Quiz', 'निदानात्मक क्विज़')}</span>
            </button>

            {/* Feature B Tab: Spaced Revision */}
            <button
              onClick={() => setActiveTab('revision')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'revision'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('Spaced Revision', 'स्पेसड रिवीजन')}</span>
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'graph'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{t('Knowledge Graph', 'नॉलेज ग्राफ़')}</span>
            </button>

            <button
              onClick={() => setActiveTab('recovery')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'recovery'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>{t('Remediation Path', 'सुधार मार्ग')}</span>
            </button>

            <button
              onClick={() => setActiveTab('steps')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'steps'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('Step Mistake Detector', 'चरण त्रुटि पहचान')}</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'generator'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('Targeted Generator', 'लक्षित प्रश्न')}</span>
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'ask-ai' && (
          <AITutorView />
        )}

        {activeTab === 'lessons' && (
          <DynamicLessonAndAssessmentView />
        )}
        {activeTab === 'diagnostic' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-w-0">
            <div className="lg:col-span-2 space-y-6 min-w-0">
              <DiagnosticQuiz
                conceptId={focalConcept}
                isReassessment={isReassessment}
                onQuizComplete={() => setActiveTab('recovery')}
              />
            </div>
            <div className="space-y-6 min-w-0">
              <RecoveryScoreCard conceptId={focalConcept} compact={true} />
              <SpacedRevisionPanel
                studentId={activeStudentId}
                onSelectConceptForPractice={(cid) => {
                  setFocalConcept(cid);
                  setIsReassessment(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Feature B: Full Spaced Revision View with Glass Calendar */}
        {activeTab === 'revision' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <SpacedRevisionPanel
                  studentId={activeStudentId}
                  onSelectConceptForPractice={(cid) => {
                    setFocalConcept(cid);
                    setIsReassessment(false);
                    setActiveTab('diagnostic');
                  }}
                />
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                    {t('Study & Revision Calendar', 'अध्ययन एवं रिवीजन कैलेंडर')}
                  </h4>
                </div>
                <GlassCalendar />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="space-y-6">
            <KnowledgeGraph />
          </div>
        )}

        {activeTab === 'recovery' && (
          <div className="space-y-8">
            <RecoveryPathView
              conceptId={focalConcept}
              onStartReassessment={() => {
                setIsReassessment(true);
                setActiveTab('diagnostic');
              }}
            />
            <RecoveryScoreCard conceptId={focalConcept} />
          </div>
        )}

        {activeTab === 'steps' && (
          <div className="max-w-3xl mx-auto">
            <StepMistakeDetector />
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="max-w-3xl mx-auto">
            <MisconceptionGenerator />
          </div>
        )}
      </div>
    </div>
  );
}
