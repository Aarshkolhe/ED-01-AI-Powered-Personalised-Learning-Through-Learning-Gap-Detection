'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  useNodesInitialized
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '@/lib/api';
import { useApp } from '@/lib/context';
import {
  layoutKnowledgeGraph,
  ConceptNodeData,
  CARD_WIDTH,
  CARD_MIN_HEIGHT
} from '@/lib/graphLayout';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Network,
  List,
  ShieldCheck,
  Maximize2,
  X,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface CustomNodeData extends ConceptNodeData {
  isSelected?: boolean;
  onCardClick?: (id: string) => void;
}

const ConceptCustomNode = ({ data }: NodeProps) => {
  const d = data as unknown as CustomNodeData;
  const isGap = d.is_gap;
  const isMastered = d.is_mastered;
  const isSelected = !!d.isSelected;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => d.onCardClick?.(d.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          d.onCardClick?.(d.id);
        }
      }}
      style={{ width: `${CARD_WIDTH}px`, minHeight: `${CARD_MIN_HEIGHT}px` }}
      className={`p-4 rounded-xl shadow-xl transition-all border-2 flex flex-col justify-between cursor-pointer select-none relative z-10 backdrop-blur-xl ${
        isSelected
          ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-black scale-[1.02]'
          : ''
      } ${
        isGap
          ? 'bg-rose-950/60 border-rose-500/70 shadow-rose-950/30 hover:border-rose-400'
          : isMastered
          ? 'bg-emerald-950/60 border-emerald-500/70 shadow-emerald-950/30 hover:border-emerald-400'
          : 'bg-black/60 border-amber-500/50 shadow-black/40 hover:border-amber-400'
      }`}
    >
      {/* Target connection handles on the left (spaced for converging edges) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-top"
        style={{ top: '28%' }}
        className="!w-2.5 !h-2.5 !bg-teal-400 !border-2 !border-slate-950 !rounded-full opacity-80"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-center"
        style={{ top: '50%' }}
        className="!w-2.5 !h-2.5 !bg-teal-400 !border-2 !border-slate-950 !rounded-full opacity-80"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-bottom"
        style={{ top: '72%' }}
        className="!w-2.5 !h-2.5 !bg-teal-400 !border-2 !border-slate-950 !rounded-full opacity-80"
      />

      {/* Card Header: Title + Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-100 leading-snug break-words flex-1 min-w-0">
            {d.label}
          </h4>
          {isGap ? (
            <span className="flex-shrink-0 flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <AlertTriangle className="w-3 h-3 mr-1" /> Gap
            </span>
          ) : isMastered ? (
            <span className="flex-shrink-0 flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Mastered
            </span>
          ) : (
            <span className="flex-shrink-0 flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Clock className="w-3 h-3 mr-1" /> In Progress
            </span>
          )}
        </div>

        {/* Category & Difficulty Tag */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
            {d.category || 'Mathematics'}
          </span>
          <span className="text-[10px] font-mono capitalize px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">
            {d.difficulty}
          </span>
        </div>

        {/* Topic Description (Natural wrapping, no text cutoff) */}
        <p className="text-xs text-slate-300/90 mt-2 leading-relaxed break-words">
          {d.description}
        </p>
      </div>

      {/* Mastery Progress Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
        <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
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

      {/* Source connection handles on the right (spaced for diverging edges) */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-top"
        style={{ top: '28%' }}
        className="!w-2.5 !h-2.5 !bg-teal-400 !border-2 !border-slate-950 !rounded-full opacity-80"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-center"
        style={{ top: '50%' }}
        className="!w-2.5 !h-2.5 !bg-teal-400 !border-2 !border-slate-950 !rounded-full opacity-80"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-bottom"
        style={{ top: '72%' }}
        className="!w-2.5 !h-2.5 !bg-teal-400 !border-2 !border-slate-950 !rounded-full opacity-80"
      />
    </div>
  );
};

const nodeTypes = {
  conceptNode: ConceptCustomNode,
};

/**
 * Automatically fits the viewport once when graph nodes are initialized.
 * Preserves user zoom and pan during subsequent re-renders or clicks.
 */
function ViewportController({ layoutVersion }: { layoutVersion: number }) {
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const lastFittedVersion = useRef<number | null>(null);

  useEffect(() => {
    if (nodesInitialized && lastFittedVersion.current !== layoutVersion) {
      const timer = setTimeout(() => {
        fitView({
          padding: 0.15,
          minZoom: 0.35,
          maxZoom: 1.1,
          duration: 400,
        });
        lastFittedVersion.current = layoutVersion;
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [nodesInitialized, layoutVersion, fitView]);

  return null;
}

interface KnowledgeGraphProps {
  onSelectConcept?: (conceptId: string) => void;
  selectedConceptId?: string;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  onSelectConcept,
  selectedConceptId: externalSelectedId,
}) => {
  const { activeStudentId, t } = useApp();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [isAcyclic, setIsAcyclic] = useState<boolean | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [layoutVersion, setLayoutVersion] = useState<number>(0);

  const activeSelectedId = externalSelectedId ?? internalSelectedId;

  const handleSelectNode = useCallback(
    (conceptId: string) => {
      setInternalSelectedId((prev) => (prev === conceptId ? null : conceptId));
      onSelectConcept?.(conceptId);
    },
    [onSelectConcept]
  );

  useEffect(() => {
    let mounted = true;
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const [data, validation] = await Promise.all([
          api.getKnowledgeGraph(activeStudentId),
          api.validateKnowledgeGraph().catch(() => ({ is_valid: true, cycles: [] })),
        ]);

        if (mounted) {
          // Run deterministic Dagre Left-to-Right layout
          const { nodes: layoutedNodes, edges: layoutedEdges } = layoutKnowledgeGraph(
            data.nodes || [],
            data.edges || []
          );

          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          setIsAcyclic(validation.is_valid);
          setError(null);
          setLayoutVersion((v) => v + 1);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load graph');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchGraph();
    return () => {
      mounted = false;
    };
  }, [activeStudentId]);

  // Inject dynamic selection state and click handler into nodes
  const displayNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isSelected: node.id === activeSelectedId,
        onCardClick: handleSelectNode,
      },
    }));
  }, [nodes, activeSelectedId, handleSelectNode]);

  const selectedNodeData = useMemo(() => {
    if (!activeSelectedId) return null;
    const found = nodes.find((n) => n.id === activeSelectedId);
    return found ? (found.data as unknown as ConceptNodeData) : null;
  }, [nodes, activeSelectedId]);

  // Selected node prerequisite relationships for detail view
  const selectedPrereqLabels = useMemo(() => {
    if (!activeSelectedId) return [];
    const prereqIds = edges
      .filter((e) => e.target === activeSelectedId)
      .map((e) => e.source);
    return prereqIds
      .map((pId) => {
        const pNode = nodes.find((n) => n.id === pId);
        const pData = pNode?.data as unknown as ConceptNodeData | undefined;
        return pData?.label || pId;
      })
      .filter(Boolean);
  }, [edges, nodes, activeSelectedId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[550px] bg-slate-950/80 rounded-2xl border border-slate-800">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">
            {t('Synthesizing prerequisite knowledge graph...', 'ज्ञान आलेख तैयार किया जा रहा है...')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-950/20 border border-rose-800/50 rounded-3xl backdrop-blur-xl">
        <p className="text-rose-400 text-sm font-medium">{error}</p>
        <p className="text-xs text-slate-500 mt-1">Make sure the FastAPI backend is running on port 8000.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle & Graph Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/30 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 text-xs shadow-2xl">
        <div className="flex items-center space-x-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setViewMode('canvas')}
              aria-pressed={viewMode === 'canvas'}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all ${
                viewMode === 'canvas'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{t('Interactive Canvas', 'इंटरैक्टिव आलेख')}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t('Accessible List View', 'सुलभ सूची दृश्य')}</span>
            </button>
          </div>

          {/* Acyclic DAG Status Signal */}
          {isAcyclic !== null && (
            <div
              className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-xl border text-[11px] font-medium backdrop-blur-md ${
                isAcyclic
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAcyclic ? 'Prerequisite Graph: Acyclic DAG' : 'Cycle Detected in Graph'}</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="text-white/80">Mastered (≥85%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span className="text-white/80">In Progress</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="text-white/80">Gap (&lt;60%)</span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'canvas' ? (
        <div className="relative w-full h-[640px] md:h-[680px] bg-black/30 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
          <ReactFlowProvider>
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              minZoom={0.25}
              maxZoom={1.5}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              attributionPosition="bottom-right"
              elevateNodesOnSelect={false}
              proOptions={{ hideAttribution: true }}
            >
              {/* Subtle dotted background preserving dark theme */}
              <Background
                color="#524336"
                gap={20}
                size={1.2}
                variant={BackgroundVariant.Dots}
                className="opacity-30"
              />

              {/* Viewport fit controller ensures single automatic fitView */}
              <ViewportController layoutVersion={layoutVersion} />

              {/* Controls positioned unobtrusively */}
              <Controls
                position="bottom-left"
                showInteractive={false}
                className="!bg-black/40 !border !border-white/10 !rounded-2xl !shadow-xl !fill-white !text-white backdrop-blur-xl"
              />

              {/* Flow Direction Indicator Overlay */}
              <div className="absolute top-3 left-3 pointer-events-none hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/70 backdrop-blur-md">
                <span>Prerequisites (Foundational)</span>
                <ArrowRight className="w-3 h-3 text-teal-400" />
                <span>Dependent (Advanced)</span>
              </div>

              {/* Manual Fit View Helper Button */}
              <ManualFitButton />
            </ReactFlow>

            {/* Selected Topic Inspector Drawer Overlay */}
            {selectedNodeData && (
              <div className="absolute bottom-4 right-4 max-w-sm w-full bg-black/60 backdrop-blur-2xl border border-teal-500/40 rounded-3xl p-5 shadow-2xl z-20 transition-all animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {selectedNodeData.category || 'Topic Details'}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{selectedNodeData.label}</h3>
                  </div>
                  <button
                    onClick={() => setInternalSelectedId(null)}
                    className="text-white/60 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
                    aria-label="Close details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {selectedNodeData.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Prerequisites:</span>
                    <span className="text-teal-300 font-medium">
                      {selectedPrereqLabels.length > 0 ? selectedPrereqLabels.join(', ') : 'None (Foundational)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Mastery Level:</span>
                    <span className="font-semibold text-slate-200">
                      {Math.round(selectedNodeData.mastery * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </ReactFlowProvider>
        </div>
      ) : (
        /* Accessible Screen-Reader Structured List View */
        <div
          role="region"
          aria-label="Accessible Curriculum and Prerequisite List"
          className="bg-black/30 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-4 max-h-[650px] overflow-y-auto"
        >
          <div className="pb-3 border-b border-white/10 flex items-center justify-between">
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
            <span className="text-xs text-white/60 font-mono">
              {nodes.length} {t('Concepts in Curriculum', 'अवधारणाएं')}
            </span>
          </div>

          <div className="space-y-3" role="list">
            {nodes.map((node) => {
              const d = node.data as unknown as ConceptNodeData;
              const isGap = d.is_gap;
              const isMastered = d.is_mastered;

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
                  className={`p-4 rounded-2xl border transition-all backdrop-blur-xl ${
                    isGap
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isMastered
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-black/30 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-100">{d.label}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase tracking-wider font-mono">
                          {d.category || 'Mathematics'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{d.description}</p>
                    </div>

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
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="text-slate-400">
                      <span className="font-semibold text-slate-300">Prerequisites: </span>
                      {prereqLabels.length > 0 ? (
                        <span className="text-teal-300 font-medium">{prereqLabels.join(', ')}</span>
                      ) : (
                        <span className="text-white/40 italic">None (Foundational Concept)</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400">
                        BKT Mastery: <strong className="text-slate-200">{Math.round(d.mastery * 100)}%</strong>
                      </span>
                      <div
                        className="w-20 bg-white/10 rounded-full h-1.5 overflow-hidden"
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

function ManualFitButton() {
  const { fitView } = useReactFlow();

  return (
    <div className="absolute top-3 right-3 z-10">
      <button
        onClick={() => fitView({ padding: 0.15, duration: 400 })}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 shadow-lg backdrop-blur-md text-xs font-medium transition-all"
        title="Reset & Fit View"
      >
        <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
        <span>Fit View</span>
      </button>
    </div>
  );
}
