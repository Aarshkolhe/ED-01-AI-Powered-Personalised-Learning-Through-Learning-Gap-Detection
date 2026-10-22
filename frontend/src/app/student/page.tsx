'use client';

import React, { useState } from 'react';
import { DiagnosticQuiz } from '@/components/DiagnosticQuiz';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { RecoveryPathView } from '@/components/RecoveryPathView';
import { RecoveryScoreCard } from '@/components/RecoveryScoreCard';
import { StepMistakeDetector } from '@/components/StepMistakeDetector';
import { MisconceptionGenerator } from '@/components/MisconceptionGenerator';
import { SpacedRevisionPanel } from '@/components/SpacedRevisionPanel';
import { useApp } from '@/lib/context';
import {
  Network,
  Activity,
  Route,
  TrendingUp,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function StudentPortalPage() {
  const { activeStudentId, t } = useApp();
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'revision' | 'graph' | 'recovery' | 'steps' | 'generator'>('diagnostic');
  const [focalConcept, setFocalConcept] = useState<string>('fraction_addition_unlike');
  const [isReassessment, setIsReassessment] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
              {t('Interactive Student Portal', 'छात्र पोर्टल')}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
              {t('Precision Mastery & Gap Remediation', 'सटीक दक्षता एवं लर्निंग गैप सुधार')}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {t('Bayesian Knowledge Tracing (BKT) active for session', 'सत्र के लिए बायेसियन नॉलेज ट्रेसिंग सक्रिय')} ({activeStudentId})
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => { setActiveTab('diagnostic'); setIsReassessment(false); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'diagnostic' && !isReassessment
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
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
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('Spaced Revision', 'स्पेसड रिवीजन')}</span>
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'graph'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{t('Knowledge Graph', 'नॉलेज ग्राफ़')}</span>
            </button>

            <button
              onClick={() => setActiveTab('recovery')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'recovery'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>{t('Remediation Path', 'सुधार मार्ग')}</span>
            </button>

            <button
              onClick={() => setActiveTab('steps')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'steps'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('Step Mistake Detector', 'चरण त्रुटि पहचान')}</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'generator'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('Targeted Generator', 'लक्षित प्रश्न')}</span>
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'diagnostic' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <DiagnosticQuiz
                conceptId={focalConcept}
                isReassessment={isReassessment}
                onQuizComplete={() => setActiveTab('recovery')}
              />
            </div>
            <div className="space-y-6">
              <RecoveryScoreCard conceptId={focalConcept} />
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

        {/* Feature B: Full Spaced Revision View */}
        {activeTab === 'revision' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <SpacedRevisionPanel
              studentId={activeStudentId}
              onSelectConceptForPractice={(cid) => {
                setFocalConcept(cid);
                setIsReassessment(false);
                setActiveTab('diagnostic');
              }}
            />
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
