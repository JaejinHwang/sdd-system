import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node,
  type Edge,
  addEdge,
} from '@xyflow/react';
import type { FlowNode, FlowEdge, PathDefinition } from '@/types';

interface GraphState {
  // 노드/엣지 데이터
  nodes: FlowNode[];
  edges: FlowEdge[];

  // 선택 상태
  selectedNodes: string[];
  selectedEdges: string[];

  // 뷰포트 상태
  viewport: { x: number; y: number; zoom: number };

  // 경로 하이라이트
  happyPaths: PathDefinition[];
  errorPaths: PathDefinition[];
  activeHappyPath: string | null;
  activeErrorPath: string | null;

  // 변경 추적
  hasUnsavedChanges: boolean;
}

interface GraphActions {
  // 노드/엣지 변경
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // 노드 조작
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, data: Partial<FlowNode['data']>) => void;
  deleteNode: (id: string) => void;

  // 엣지 조작
  addEdge: (edge: FlowEdge) => void;
  updateEdge: (id: string, data: Partial<FlowEdge['data']>) => void;
  deleteEdge: (id: string) => void;

  // 선택
  setSelectedNodes: (ids: string[]) => void;
  setSelectedEdges: (ids: string[]) => void;

  // 뷰포트
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // 경로 하이라이트
  setHappyPaths: (paths: PathDefinition[]) => void;
  setErrorPaths: (paths: PathDefinition[]) => void;
  setActiveHappyPath: (pathId: string | null) => void;
  setActiveErrorPath: (pathId: string | null) => void;

  // 데이터 설정
  setGraphData: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  markSaved: () => void;
  reset: () => void;
}

const initialState: GraphState = {
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  happyPaths: [],
  errorPaths: [],
  activeHappyPath: null,
  activeErrorPath: null,
  hasUnsavedChanges: false,
};

export const useGraphStore = create<GraphState & GraphActions>((set, get) => ({
  ...initialState,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes as Node[]) as FlowNode[],
      hasUnsavedChanges: true,
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges as Edge[]) as FlowEdge[],
      hasUnsavedChanges: true,
    });
  },

  onConnect: (connection) => {
    const newEdge = {
      id: `edge-${connection.source}-${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'transition',
      data: {
        sourceRef: '',
        trigger: 'new_trigger',
        condition: null,
        pathType: 'happy' as const,
        isHighlighted: false,
      },
    } as FlowEdge;
    set({
      edges: addEdge(newEdge as Edge, get().edges as Edge[]) as FlowEdge[],
      hasUnsavedChanges: true,
    });
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
      hasUnsavedChanges: true,
    });
  },

  updateNode: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ) as FlowNode[],
      hasUnsavedChanges: true,
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
      hasUnsavedChanges: true,
    });
  },

  addEdge: (edge) => {
    set({
      edges: [...get().edges, edge],
      hasUnsavedChanges: true,
    });
  },

  updateEdge: (id, data) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, ...data } } : edge
      ) as FlowEdge[],
      hasUnsavedChanges: true,
    });
  },

  deleteEdge: (id) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== id),
      hasUnsavedChanges: true,
    });
  },

  setSelectedNodes: (ids) => {
    set({ selectedNodes: ids });
  },

  setSelectedEdges: (ids) => {
    set({ selectedEdges: ids });
  },

  setViewport: (viewport) => {
    set({ viewport });
  },

  setHappyPaths: (paths) => {
    set({ happyPaths: paths });
  },

  setErrorPaths: (paths) => {
    set({ errorPaths: paths });
  },

  setActiveHappyPath: (pathId) => {
    const { nodes, edges, happyPaths } = get();
    const path = happyPaths.find((p) => p.id === pathId);

    // 노드/엣지 하이라이트 업데이트
    const updatedNodes = nodes.map((node) => {
      if (node.type === 'state') {
        const isHighlighted = path ? path.nodeIds.includes(node.id) : false;
        return {
          ...node,
          data: {
            ...node.data,
            isHighlighted,
            highlightColor: isHighlighted ? path?.color : undefined,
          },
        };
      }
      return node;
    }) as FlowNode[];

    const updatedEdges = edges.map((edge) => {
      if (edge.type === 'transition') {
        const isHighlighted = path ? path.edgeIds.includes(edge.id) : false;
        return {
          ...edge,
          data: {
            ...edge.data,
            isHighlighted,
            highlightColor: isHighlighted ? path?.color : undefined,
          },
        };
      }
      return edge;
    }) as FlowEdge[];

    set({
      activeHappyPath: pathId,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  },

  setActiveErrorPath: (pathId) => {
    const { nodes, edges, errorPaths } = get();
    const path = errorPaths.find((p) => p.id === pathId);

    const updatedNodes = nodes.map((node) => {
      if (node.type === 'state') {
        const isHighlighted = path ? path.nodeIds.includes(node.id) : false;
        return {
          ...node,
          data: {
            ...node.data,
            isHighlighted,
            highlightColor: isHighlighted ? path?.color : undefined,
          },
        };
      }
      return node;
    }) as FlowNode[];

    const updatedEdges = edges.map((edge) => {
      if (edge.type === 'transition') {
        const isHighlighted = path ? path.edgeIds.includes(edge.id) : false;
        return {
          ...edge,
          data: {
            ...edge.data,
            isHighlighted,
            highlightColor: isHighlighted ? path?.color : undefined,
          },
        };
      }
      return edge;
    }) as FlowEdge[];

    set({
      activeErrorPath: pathId,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  },

  setGraphData: (nodes, edges) => {
    set({ nodes, edges, hasUnsavedChanges: false });
  },

  markSaved: () => {
    set({ hasUnsavedChanges: false });
  },

  reset: () => {
    set(initialState);
  },
}));
