'use client';

import React, { useState } from 'react';
import { api, StepMistakeAnalysis } from '@/lib/api';
import { useApp } from '@/lib/context';
import { CheckCircle2, AlertOctagon, HelpCircle, ArrowRight, CornerDownRight, Sparkles } from 'lucide-react';

interface StepMistakeDetectorProps {
  defaultProblem?: string;
  defaultAnswer?: string;
  onAnalysisComplete?: (result: StepMistakeAnalysis) => void;
}

export const StepMistakeDetector: React.FC<StepMistakeDetectorProps> = ({
  defaultProblem = "2x + 6 = 20",
  defaultAnswer = "7",
  onAnalysisComplete,
}) => {
  const { t } = useApp();
  const [problem] = useState<string>(defaultProblem);
  const [steps, setSteps] = useState<string[]>([
    "2x = 26",
    "x = 13"
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<StepMistakeAnalysis | null>(null);

  const handleStepChange = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const analyze = async () => {
    setLoading(true);
    try {
      const result = await api.analyzeSteps({
        problem_statement: problem,
        correct_final_answer: defaultAnswer,
        student_steps: steps.filter(s => s.trim().length > 0)
      });
      setAnalysis(result);
      if (onAnalysisComplete) onAnalysisComplete(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <span>{t('Step-by-Step Algebraic Mistake Detector', 'चरण-दर-चरण गणितीय त्रुटि पहचानकर्ता')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {t('Deconstructs intermediate transformation steps to isolate the earliest faulty operation.', 'आरंभिक गलत बदलाव को अलग करने के लिए मध्यवर्ती चरणों का विश्लेषण करता है।')}
          </p>
        </div>
        <div className="px-3 py-1 bg-black/40 rounded-xl text-xs font-mono text-teal-300 border border-white/10 backdrop-blur-md">
          Target: {problem} &rarr; x = {defaultAnswer}
        </div>
      </div>

      {/* Steps Inputs */}
      <div className="mt-5 space-y-3">
        <label className="text-xs font-medium text-slate-300">
          {t('Your Solution Steps:', 'आपके हल के चरण:')}
        </label>
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center space-x-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white/80">
              {idx + 1}
            </span>
            <input
              type="text"
              value={step}
              onChange={(e) => handleStepChange(idx, e.target.value)}
              placeholder={`Step ${idx + 1} (e.g. 2x = 14)`}
              className="flex-1 bg-black/40 border border-white/10 focus:border-teal-400 rounded-2xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-white/40 focus:outline-none transition-colors backdrop-blur-md"
            />
            {steps.length > 1 && (
              <button
                onClick={() => removeStep(idx)}
                className="text-white/50 hover:text-rose-400 text-xs px-2"
                title="Remove step"
              >
                &times;
              </button>
            )}
          </div>
        ))}

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={addStep}
            className="text-xs font-medium text-white/80 hover:text-teal-300 bg-black/40 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 transition-colors backdrop-blur-md"
          >
            + {t('Add Step', 'चरण जोड़ें')}
          </button>

          <button
            onClick={analyze}
            disabled={loading}
            className="ml-auto text-xs font-semibold px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 transition-colors flex items-center space-x-2 shadow-lg shadow-teal-500/20 active:scale-95"
          >
            {loading ? (
              <span className="animate-spin w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{t('Detect Faulty Step', 'दोषपूर्ण चरण का पता लगाएं')}</span>
          </button>
        </div>
      </div>

      {/* Analysis Output Result */}
      {analysis && (
        <div className="mt-6 pt-5 border-t border-white/10">
          {analysis.has_error ? (
            <div className="bg-rose-950/20 border border-rose-500/40 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex items-start space-x-3">
                <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-rose-300">
                      {t('First Mistake Detected at Step', 'पहली त्रुटि पकड़ी गई - चरण')} {analysis.first_error_step_index! + 1}
                    </span>
                    <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                      {analysis.error_type}
                    </span>
                  </div>

                  <p className="text-xs text-rose-200 mt-2 font-medium">
                    {analysis.error_explanation}
                  </p>

                  <div className="mt-4 bg-black/30 p-3.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="text-xs text-slate-400 flex items-center space-x-2">
                      <CornerDownRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-emerald-400">{t('Correct Transformation:', 'सही रूपांतरण:')}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-200 mt-1 pl-5">
                      {analysis.corrected_step}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-5 flex items-center space-x-3 backdrop-blur-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">
                  {t('All Solution Steps Mathematically Valid!', 'सभी चरण गणितीय रूप से सही हैं!')}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {t('Each algebraic transformation preserved equality and reached the target value.', 'प्रत्येक चरण ने समानता बनाए रखी और सही मान प्राप्त किया।')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
