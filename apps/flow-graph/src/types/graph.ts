import type { Node, Edge } from '@xyflow/react';

// 노드 Props (index signature 필요)
export interface ScreenNodeProps {
  [key: string]: unknown;
  sourceRef: string;
  label: string;
  route: string;
  implementsFeatures: string[];
  expanded: boolean;
  colorTheme: 'default' | 'primary' | 'success' | 'error' | 'warning';
}

export interface StateNodeProps {
  [key: string]: unknown;
  sourceRef: string;
  featureId: string;
  label: string;
  description: string;
  stateType: 'initial' | 'normal' | 'final' | 'error';
  onHappyPath: boolean;
  isHighlighted: boolean;
  highlightColor?: string;
}

export interface FeatureGroupNodeProps {
  [key: string]: unknown;
  sourceRef: string;
  label: string;
  featureId: string;
  collapsed: boolean;
}

// React Flow 노드 타입
export type ScreenNodeType = Node<ScreenNodeProps, 'screen'>;
export type StateNodeType = Node<StateNodeProps, 'state'>;
export type FeatureGroupNodeType = Node<FeatureGroupNodeProps, 'featureGroup'>;

export type FlowNode = ScreenNodeType | StateNodeType | FeatureGroupNodeType;

// 엣지 Props (index signature 필요)
export interface TransitionEdgeProps {
  [key: string]: unknown;
  sourceRef: string;
  trigger: string;
  condition: string | null;
  pathType: 'happy' | 'error' | 'alternative';
  isHighlighted: boolean;
  highlightColor?: string;
}

export interface NavigationEdgeProps {
  [key: string]: unknown;
  sourceRef: string;
  trigger: string;
  label: string;
}

// React Flow 엣지 타입
export type TransitionEdgeType = Edge<TransitionEdgeProps, 'transition'>;
export type NavigationEdgeType = Edge<NavigationEdgeProps, 'navigation'>;

export type FlowEdge = TransitionEdgeType | NavigationEdgeType;

// 그래프 상태
export interface GraphState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  activeHappyPath: string | null;
  activeErrorPath: string | null;
}

// 그래프 변환 결과
export interface TransformResult {
  nodes: FlowNode[];
  edges: FlowEdge[];
  paths: {
    happyPaths: PathDefinition[];
    errorPaths: PathDefinition[];
  };
}

export interface PathDefinition {
  id: string;
  name: string;
  description: string;
  nodeIds: string[];
  edgeIds: string[];
  color: string;
}

// 변경 사항 추적
export interface GraphChange {
  type: 'node_added' | 'node_updated' | 'node_deleted' | 'edge_added' | 'edge_updated' | 'edge_deleted';
  target: 'state' | 'screen' | 'transition' | 'navigation';
  id: string;
  data?: Record<string, unknown>;
  previousData?: Record<string, unknown>;
}

// 충돌 정보
export interface Conflict {
  id: string;
  type: 'node_modified' | 'node_deleted' | 'edge_modified' | 'edge_deleted';
  elementId: string;
  graphVersion: unknown;
  specVersion: unknown;
  affectedFiles: string[];
}
