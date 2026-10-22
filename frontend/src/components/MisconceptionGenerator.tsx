'use client';

import React, { useState } from 'react';
import { api, Question } from '@/lib/api';
import { useApp } from '@/lib/context';
import { Sparkles, BrainCircuit, CheckCircle, ShieldCheck } from 'lucide-react';

const CONCEPT_MISCONCEPTIONS: Record<string, { id: string; label: string }[]> = {
  fraction_addition_like: [
    { id: 'add_denominators', label: 'Adding Across Denominators (a/b + c/b = (a+c)/2b)' }
  ],
  fraction_addition_unlike: [
    { id: 'add_denominators', label: 'Adding Across Denominators (a/b + c/d = (a+c)/(b+d))' },
    { id: 'cross_multiply_in_addition', label: 'Cross-Multiplication in Addition (1/2 + 1/3 = 1/6)' }
  ],
  algebra_expressions: [
    { id: 'unlike_terms_merging', label: 'Merging Unlike Algebraic Terms (3x + 4 = 7x)' }
  ],
  linear_equations_1step: [
    { id: 'sign_flip_omission', label: 'Missing Sign Reversal in Isolation' }
  ],
  linear_equations_2step: [
    { id: 'sign_flip_omission', label: 'Missing Sign Reversal in Isolation' }
  ]
};

export const MisconceptionGenerator: React.FC = () => {
  const { language, t } = useApp();
  const [conceptId, setConceptId] = useState<string>('fraction_addition_unlike');
  const [misconceptionId, setMisconceptionId] = useState<string>('add_denominators');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedQ, setGeneratedQ] = useState<Question | null>(null);

  const handleConceptChange = (newCid: string) => {
    setConceptId(newCid);
    const valid = CONCEPT_MISCONCEPTIONS[newCid] || [];
    if (valid.length > 0) {
      setMisconceptionId(valid[0].id);
    }
  };

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

  const availableMisconceptions = CONCEPT_MISCONCEPTIONS[conceptId] || [
    { id: 'add_denominators', label: 'Adding Across Denominators' }
  ];

  return (
    <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
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
            onChange={(e) => handleConceptChange(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white backdrop-blur-md focus:outline-none focus:border-teal-400"
          >
            <option value="fraction_addition_like" className="bg-[#18110c] text-white">Adding Fractions (Like Denominators)</option>
            <option value="fraction_addition_unlike" className="bg-[#18110c] text-white">Adding Fractions (Unlike Denominators)</option>
            <option value="algebra_expressions" className="bg-[#18110c] text-white">Algebraic Expressions & Like Terms</option>
            <option value="linear_equations_1step" className="bg-[#18110c] text-white">One-Step Linear Equations</option>
            <option value="linear_equations_2step" className="bg-[#18110c] text-white">Two-Step Linear Equations</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1 font-medium">{t('Target Misconception Trap:', 'लक्षित भ्रांति / त्रुटि:')}</label>
          <select
            value={misconceptionId}
            onChange={(e) => setMisconceptionId(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white backdrop-blur-md focus:outline-none focus:border-teal-400"
          >
            {availableMisconceptions.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#18110c] text-white">{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20 flex items-center space-x-2 active:scale-95"
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
        <div className="mt-5 p-5 bg-black/30 rounded-2xl border border-teal-500/30 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
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
                className={`p-3 rounded-xl border text-xs font-mono backdrop-blur-md ${
                  opt.text === generatedQ.correct_answer
                    ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                    : opt.misconception_id
                    ? 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                    : 'border-white/10 bg-black/40 text-slate-400'
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

          {generatedQ.worked_solution && generatedQ.worked_solution.length > 0 && (
            <div className="mt-3 pt-2 border-t border-white/10 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{t('Verified Solution:', 'सत्यापित हल:')}</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {generatedQ.worked_solution.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
