import dagre from '@dagrejs/dagre';
import { Node, Edge, MarkerType, Position } from '@xyflow/react';

export const CARD_WIDTH = 280;
export const CARD_MIN_HEIGHT = 175;
export const HORIZONTAL_RANK_SEP = 140; // 100-150px
export const VERTICAL_NODE_SEP = 85;    // 70-100px

export interface ConceptNodeData {
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

export interface LayoutOptions {
  direction?: 'LR' | 'TB';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

/**
 * Deterministic DAG layout using Dagre.
 * Positions prerequisite foundational concepts on the left,
 * intermediate concepts in the middle, and advanced/gaps on the right.
 */
export function layoutKnowledgeGraph(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const {
    direction = 'LR',
    nodeWidth = CARD_WIDTH,
    nodeHeight = CARD_MIN_HEIGHT,
    rankSep = HORIZONTAL_RANK_SEP,
    nodeSep = VERTICAL_NODE_SEP,
  } = options;

  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
    marginx: 40,
    marginy: 40,
  });

  // 1. Register all nodes with exact dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // 2. Register all edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 3. Execute deterministic Dagre layout
  dagre.layout(dagreGraph);

  // 4. Transform center coordinates into React Flow top-left coordinates
  const layoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPos = dagreGraph.node(node.id);
    const x = nodeWithPos ? Math.round(nodeWithPos.x - nodeWidth / 2) : 0;
    const y = nodeWithPos ? Math.round(nodeWithPos.y - nodeHeight / 2) : 0;

    return {
      ...node,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      position: { x, y },
      width: nodeWidth,
      style: {
        width: nodeWidth,
        minHeight: nodeHeight,
      },
    };
  });

  // 5. Calculate sensible connection handles for converging and diverging edges
  const nodeYMap = new Map<string, number>();
  layoutedNodes.forEach((n) => {
    nodeYMap.set(n.id, n.position.y);
  });

  const incomingEdgesMap = new Map<string, Edge[]>();
  const outgoingEdgesMap = new Map<string, Edge[]>();

  edges.forEach((edge) => {
    if (!incomingEdgesMap.has(edge.target)) incomingEdgesMap.set(edge.target, []);
    incomingEdgesMap.get(edge.target)!.push(edge);

    if (!outgoingEdgesMap.has(edge.source)) outgoingEdgesMap.set(edge.source, []);
    outgoingEdgesMap.get(edge.source)!.push(edge);
  });

  // Target handle assignment: spaced top, center, bottom based on relative source position
  const targetHandleMap = new Map<string, string>();
  incomingEdgesMap.forEach((inEdges) => {
    if (inEdges.length === 1) {
      targetHandleMap.set(inEdges[0].id, 'target-center');
    } else if (inEdges.length > 1) {
      const sorted = [...inEdges].sort((a, b) => {
        const yA = nodeYMap.get(a.source) ?? 0;
        const yB = nodeYMap.get(b.source) ?? 0;
        return yA - yB;
      });
      sorted.forEach((e, idx) => {
        if (idx === 0) targetHandleMap.set(e.id, 'target-top');
        else if (idx === sorted.length - 1) targetHandleMap.set(e.id, 'target-bottom');
        else targetHandleMap.set(e.id, 'target-center');
      });
    }
  });

  // Source handle assignment: spaced top, center, bottom based on relative target position
  const sourceHandleMap = new Map<string, string>();
  outgoingEdgesMap.forEach((outEdges) => {
    if (outEdges.length === 1) {
      sourceHandleMap.set(outEdges[0].id, 'source-center');
    } else if (outEdges.length > 1) {
      const sorted = [...outEdges].sort((a, b) => {
        const yA = nodeYMap.get(a.target) ?? 0;
        const yB = nodeYMap.get(b.target) ?? 0;
        return yA - yB;
      });
      sorted.forEach((e, idx) => {
        if (idx === 0) sourceHandleMap.set(e.id, 'source-top');
        else if (idx === sorted.length - 1) sourceHandleMap.set(e.id, 'source-bottom');
        else sourceHandleMap.set(e.id, 'source-center');
      });
    }
  });

  // 6. Style edges cleanly with smooth orthogonal routing and restrained semantic colors
  const layoutedEdges: Edge[] = edges.map((edge) => {
    const targetNode = layoutedNodes.find((n) => n.id === edge.target);
    const sourceNode = layoutedNodes.find((n) => n.id === edge.source);

    const targetData = targetNode?.data as unknown as ConceptNodeData | undefined;
    const sourceData = sourceNode?.data as unknown as ConceptNodeData | undefined;

    const isGap = !!targetData?.is_gap;
    const isMastered = !!targetData?.is_mastered && !!sourceData?.is_mastered;

    // Distinct semantic colors matching ThinkFlow design
    let strokeColor = '#0d9488'; // teal-600
    if (isGap) {
      strokeColor = '#f43f5e'; // rose-500
    } else if (isMastered) {
      strokeColor = '#10b981'; // emerald-500
    } else if (targetData?.mastery !== undefined && targetData.mastery >= 0.6) {
      strokeColor = '#f59e0b'; // amber-500
    }

    const targetHandle = targetHandleMap.get(edge.id) || 'target-center';
    const sourceHandle = sourceHandleMap.get(edge.id) || 'source-center';

    return {
      ...edge,
      type: 'smoothstep',
      sourceHandle,
      targetHandle,
      animated: isGap,
      pathOptions: {
        borderRadius: 16,
        offset: 14,
      },
      style: {
        stroke: strokeColor,
        strokeWidth: isGap ? 2.5 : 2,
        opacity: isGap ? 1 : 0.85,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: strokeColor,
      },
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
