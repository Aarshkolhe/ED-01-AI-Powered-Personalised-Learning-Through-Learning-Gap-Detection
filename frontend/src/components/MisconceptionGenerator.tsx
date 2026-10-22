'use client';

import React, { useState } from 'react';
import { api, Question } from '@/lib/api';
import { useApp } from '@/lib/context';
import { Sparkles, BrainCircuit, CheckCircle, ShieldCheck } from 'lucide-react';

export const MisconceptionGenerator: React.FC = () => {
  const { language, t } = useApp();
  const [conceptId, setConceptId] = useState<string>('fraction_addition_like');
  const [misconceptionId, setMisconceptionId] = useState<string>('add_denominators');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedQ, setGeneratedQ] = useState<Question | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const q = await api.generateMisconceptionQuestion({
        concept_id: conceptId,
        misconception_id: misconceptionId,
        difficulty: 0.5,
        language: language
      });
      setGeneratedQ(q);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-teal-400" />
            <span>{t('Misconception-Specific Diagnostic Item Generator', 'भ्रांति-विशिष्ट नैदानिक प्रश्न जनरेटर')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('Synthesizes verified items with schema-validated distractors targeting specific mental traps.', 'विशिष्ट अवधारणात्मक त्रुटियों को पकड़ने हेतु सत्यापित प्रश्न उत्पन्न करता है।')}
          </p>
        </div>
        <span className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Schema Validated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1 font-medium">{t('Target Concept:', 'लक्षित अवधारणा:')}</label>
          <select
            value={conceptId}
            onChange={(e) => setConceptId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="fraction_addition_like">Adding Fractions (Like Denominators)</option>
            <option value="fraction_addition_unlike">Adding Fractions (Unlike Denominators)</option>
            <option value="algebra_expressions">Algebraic Expressions & Like Terms</option>
            <option value="linear_equations_1step">One-Step Linear Equations</option>
            <option value="linear_equations_2step">Two-Step Linear Equations</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1 font-medium">{t('Target Misconception Trap:', 'लक्षित भ्रांति / त्रुटि:')}</label>
          <select
            value={misconceptionId}
            onChange={(e) => setMisconceptionId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="add_denominators">Adding Across Denominators (a/b + c/d = (a+c)/(b+d))</option>
            <option value="sign_flip_omission">Missing Sign Reversal in Isolation</option>
            <option value="unlike_terms_merging">Merging Unlike Algebraic Terms (3x + 4 = 7x)</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20 flex items-center space-x-2"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{t('Generate Verified Diagnostic Item', 'सत्यापित प्रश्न तैयार करें')}</span>
        </button>
      </div>

      {generatedQ && (
        <div className="mt-5 p-4 bg-slate-950 rounded-xl border border-teal-500/30">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-teal-400">{generatedQ.id}</span>
            <span className="text-xs text-slate-400">Difficulty: {generatedQ.difficulty}</span>
          </div>
          <h4 className="text-sm font-semibold text-slate-100 mt-2">
            {(language === 'hi' && generatedQ.prompt_hi) ? generatedQ.prompt_hi : generatedQ.prompt}
          </h4>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {generatedQ.options.map((opt) => (
              <div
                key={opt.id}
                className={`p-2.5 rounded-lg border text-xs font-mono ${
                  opt.text === generatedQ.correct_answer
                    ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                    : opt.misconception_id
                    ? 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{opt.text}</span>
                  {opt.text === generatedQ.correct_answer && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-sans">
                      Correct
                    </span>
                  )}
                  {opt.misconception_id && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-sans">
                      Trap: {opt.misconception_id}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-900 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{t('Verified Solution:', 'सत्यापित हल:')}</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {generatedQ.worked_solution.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
