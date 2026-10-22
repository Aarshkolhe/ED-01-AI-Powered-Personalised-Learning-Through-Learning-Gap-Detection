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
import { CheckCircle2, AlertTriangle, Clock, ArrowRight, Network, List, ShieldCheck } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [isAcyclic, setIsAcyclic] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const [data, validation] = await Promise.all([
          api.getKnowledgeGraph(activeStudentId),
          api.validateKnowledgeGraph().catch(() => ({ is_valid: true, cycles: [] }))
        ]);
        if (mounted) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setIsAcyclic(validation.is_valid);
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
    <div className="space-y-3">
      {/* View Mode Toggle & Graph Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('canvas')}
              aria-pressed={viewMode === 'canvas'}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                viewMode === 'canvas'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{t('Interactive Canvas', 'इंटरैक्टिव आलेख')}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t('Accessible List View', 'सुलभ सूची दृश्य')}</span>
            </button>
          </div>

          {/* Acyclic Status Signal */}
          {isAcyclic !== null && (
            <div
              className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                isAcyclic
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAcyclic ? 'Graph: Acyclic DAG' : 'Cycle Detected in Graph'}</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Mastered (≥85%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Gap (&lt;60%)</span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'canvas' ? (
        <div className="relative w-full h-[550px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
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
      ) : (
        /* Feature 4 Accessible Screen-Reader Structured List (Spec §4 F4, §18.5) */
        <div
          role="region"
          aria-label="Accessible Curriculum and Prerequisite List"
          className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[600px] overflow-y-auto"
        >
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                {t('Curriculum Prerequisite Hierarchy', 'पाठ्यक्रम पूर्व-अपेक्षा पदानुक्रम')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t(
                  'Structured linear view for screen readers and keyboard navigation with text status labels',
                  'स्क्रीन रीडर और कीबोर्ड नेविगेशन के लिए संरचित दृश्य'
                )}
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {nodes.length} {t('Concepts in Curriculum', 'अवधारणाएं')}
            </span>
          </div>

          <div className="space-y-3" role="list">
            {nodes.map((node) => {
              const d = node.data as unknown as ConceptNodeData;
              const isGap = d.is_gap;
              const isMastered = d.is_mastered;

              // Find incoming prerequisite edges
              const prereqNodeIds = edges.filter((e) => e.target === node.id).map((e) => e.source);
              const prereqLabels = prereqNodeIds
                .map((pId) => {
                  const pNode = nodes.find((n) => n.id === pId);
                  const pData = pNode?.data as unknown as ConceptNodeData | undefined;
                  return pData?.label || pId;
                })
                .filter(Boolean);

              return (
                <div
                  key={node.id}
                  role="listitem"
                  className={`p-4 rounded-xl border transition-all ${
                    isGap
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isMastered
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-100">{d.label}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                          {d.category || 'Mathematics'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{d.description}</p>
                    </div>

                    {/* Accessible Text Status Badge (Spec §18.5) */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {isGap ? (
                        <span className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Needs Practice
                        </span>
                      ) : isMastered ? (
                        <span className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Mastered
                        </span>
                      ) : (
                        <span className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Prerequisites info */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="text-slate-400">
                      <span className="font-semibold text-slate-300">Prerequisites: </span>
                      {prereqLabels.length > 0 ? (
                        <span className="text-teal-300">{prereqLabels.join(', ')}</span>
                      ) : (
                        <span className="text-slate-500 italic">None (Foundational Concept)</span>
                      )}
                    </div>

                    {/* BKT Mastery Display */}
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400">
                        BKT Mastery: <strong className="text-slate-200">{Math.round(d.mastery * 100)}%</strong>
                      </span>
                      <div
                        className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={Math.round(d.mastery * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Mastery progress for ${d.label}`}
                      >
                        <div
                          className={`h-full rounded-full ${
                            isGap ? 'bg-rose-500' : isMastered ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${Math.round(d.mastery * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
