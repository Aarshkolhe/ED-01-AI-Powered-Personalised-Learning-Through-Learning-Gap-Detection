'use client';

import React, { useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '@/lib/api';
import { useApp } from '@/lib/context';
import { CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

interface ConceptNodeData {
  id: string;
  label: string;
  description: string;
  category: string;
  difficulty: string;
  mastery: number;
  is_gap: boolean;
  is_mastered: boolean;
  threshold: number;
}

const ConceptCustomNode = ({ data }: NodeProps) => {
  const d = data as unknown as ConceptNodeData;
  const isGap = d.is_gap;
  const isMastered = d.is_mastered;

  return (
    <div
      className={`p-4 rounded-xl shadow-xl transition-all border-2 w-64 ${
        isGap
          ? 'bg-rose-950/40 border-rose-500/60 shadow-rose-500/10'
          : isMastered
          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-500/10'
          : 'bg-slate-900/90 border-slate-700/80 shadow-slate-900/50'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-teal-400" />
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-bold text-slate-100">{d.label}</h4>
        {isGap ? (
          <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" /> Gap
          </span>
        ) : isMastered ? (
          <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Mastered
          </span>
        ) : (
          <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" /> In Progress
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{d.description}</p>

      {/* Mastery Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>BKT Mastery Probability:</span>
          <span className="font-semibold text-slate-200">{Math.round(d.mastery * 100)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGap ? 'bg-rose-500' : isMastered ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.round(d.mastery * 100)}%` }}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-teal-400" />
    </div>
  );
};

const nodeTypes = {
  conceptNode: ConceptCustomNode,
};

export const KnowledgeGraph: React.FC = () => {
  const { activeStudentId, t } = useApp();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await api.getKnowledgeGraph(activeStudentId);
        if (mounted) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load graph');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchGraph();
    return () => { mounted = false; };
  }, [activeStudentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-slate-900/50 rounded-2xl border border-slate-800">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">{t('Synthesizing prerequisite knowledge graph...', 'ज्ञान आलेख तैयार किया जा रहा है...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-950/20 border border-rose-800/50 rounded-2xl">
        <p className="text-rose-400 text-sm font-medium">{error}</p>
        <p className="text-xs text-slate-500 mt-1">Make sure the FastAPI backend is running on port 8000.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[550px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Legend Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center space-x-4 shadow-lg">
        <span className="font-semibold text-teal-400">{t('Graph Explorer', 'ज्ञान-आलेख')}:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>{t('Mastered (≥85%)', 'दक्षता प्राप्त')}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>{t('In Progress', 'प्रगतिशील')}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>{t('Detected Gap (<60%)', 'पहचाना गया गैप')}</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#1e293b" gap={16} />
        <Controls className="bg-slate-900 border border-slate-800 text-slate-200 fill-slate-200" />
      </ReactFlow>
    </div>
  );
};
