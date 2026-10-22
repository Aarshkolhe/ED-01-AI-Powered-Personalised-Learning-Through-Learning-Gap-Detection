'use client';

import React from 'react';
import { ConfidenceInsight } from '@/lib/api';
import { AlertCircle, CheckCircle, Lightbulb, Compass, ShieldAlert } from 'lucide-react';

interface ConfidenceInsightCardProps {
  insight: ConfidenceInsight;
}

export const ConfidenceInsightCard: React.FC<ConfidenceInsightCardProps> = ({ insight }) => {
  const getBadgeStyle = () => {
    switch (insight.pattern) {
      case 'overconfidence':
        return {
          border: 'border-amber-500/40',
          bg: 'bg-amber-500/10 backdrop-blur-xl',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
          title: 'Metacognitive Calibration Alert: Overconfidence'
        };
      case 'underconfidence':
        return {
          border: 'border-blue-500/40',
          bg: 'bg-blue-500/10 backdrop-blur-xl',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <Compass className="w-4 h-4 text-blue-400" />,
          title: 'Confidence Boost: Underconfidence'
        };
      case 'conscious_uncertainty':
        return {
          border: 'border-purple-500/40',
          bg: 'bg-purple-500/10 backdrop-blur-xl',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: <Lightbulb className="w-4 h-4 text-purple-400" />,
          title: 'Honest Self-Assessment: Conscious Uncertainty'
        };
      case 'mastery_alignment':
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-500/10 backdrop-blur-xl',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
          title: 'High Calibration: Mastery Alignment'
        };
      default:
        return {
          border: 'border-white/10',
          bg: 'bg-black/30 backdrop-blur-xl',
          badgeBg: 'bg-black/40 text-white/70 border-white/10',
          icon: <AlertCircle className="w-4 h-4 text-white/50" />,
          title: 'Learning Insight'
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className={`p-4 rounded-2xl border ${style.border} ${style.bg} space-y-2.5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {style.icon}
          <span className="text-xs font-bold text-white">{style.title}</span>
        </div>
        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${style.badgeBg}`}>
          Confidence: {insight.confidence}
        </span>
      </div>

      <p className="text-xs text-white/80 leading-relaxed font-medium">
        {insight.insight_message}
      </p>

      <div className="pt-2 border-t border-white/10 flex items-start space-x-2 text-[11px] text-teal-300">
        <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-teal-400" />
        <span>
          <strong className="text-teal-200">Recommended Action:</strong> {insight.actionable_guidance}
        </span>
      </div>
    </div>
  );
};
