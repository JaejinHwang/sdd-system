// flow-graph.yaml 스키마 타입 정의

export interface FlowGraphSpec {
  flow_graph: FlowGraph;
  sync: SyncMetadata;
}

export interface FlowGraph {
  metadata: FlowGraphMetadata;
  nodes: FlowNodes;
  edges: FlowEdges;
  paths: FlowPaths;
  viewport: Viewport;
}

export interface FlowGraphMetadata {
  version: string;
  created_at: string;
  last_modified: string;
  source_hashes: {
    functional_spec: string;
    ui_spec: string;
  };
  layout: LayoutSettings;
}

export interface LayoutSettings {
  type: 'hierarchical' | 'dagre' | 'force';
  direction: 'TB' | 'LR' | 'BT' | 'RL';
  spacing: {
    node_x: number;
    node_y: number;
    group_padding: number;
  };
}

// 노드 정의
export interface FlowNodes {
  screens: ScreenNodeData[];
  states: StateNodeData[];
  feature_groups: FeatureGroupData[];
}

export interface ScreenNodeData {
  id: string;
  source_ref: string;
  label: string;
  route?: string;
  position: Position;
  size: Size;
  contains_states: string[];
  style: NodeStyle;
}

export interface StateNodeData {
  id: string;
  source_ref: string;
  feature_id: string;
  label: string;
  description: string;
  position: Position;
  type: StateType;
  parent_screen: string | null;
  on_happy_path: boolean;
}

export type StateType = 'initial' | 'normal' | 'final' | 'error';

export interface FeatureGroupData {
  id: string;
  source_ref: string;
  label: string;
  member_states: string[];
  bounds: Bounds;
  collapsed: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds extends Position, Size {}

export interface NodeStyle {
  expanded: boolean;
  color_theme: 'default' | 'primary' | 'success' | 'error' | 'warning';
}

// 엣지 정의
export interface FlowEdges {
  transitions: TransitionEdgeData[];
  navigations: NavigationEdgeData[];
  dependencies: DependencyEdgeData[];
}

export interface TransitionEdgeData {
  id: string;
  source_ref: string;
  source_node: string;
  target_node: string;
  label: string;
  trigger: string;
  condition: string | null;
  path_type: PathType;
  style: EdgeStyle;
}

export interface NavigationEdgeData {
  id: string;
  source_ref: string;
  source_screen: string;
  target_screen: string;
  trigger: string;
  label: string;
}

export interface DependencyEdgeData {
  id: string;
  source_feature: string;
  target_feature: string;
  dependency_type: 'requires' | 'triggers' | 'blocks';
}

export type PathType = 'happy' | 'error' | 'alternative';

export interface EdgeStyle {
  animated: boolean;
  stroke_style: 'solid' | 'dashed' | 'dotted';
}

// 경로 정의
export interface FlowPaths {
  happy_paths: HappyPath[];
  error_paths: ErrorPath[];
}

export interface HappyPath {
  id: string;
  name: string;
  description: string;
  nodes: string[];
  edges: string[];
  highlight_color: string;
}

export interface ErrorPath {
  id: string;
  name: string;
  description: string;
  branch_from: string;
  nodes: string[];
  edges: string[];
  error_case_ref: string;
  highlight_color: string;
}

// 뷰포트
export interface Viewport {
  zoom: number;
  pan: Position;
  selection: string[];
  expanded_groups: string[];
}

// 동기화 메타데이터
export interface SyncMetadata {
  last_sync: string;
  conflict_resolution: 'manual' | 'prefer_graph' | 'prefer_spec';
  manual_nodes: string[];
  history: SyncHistoryEntry[];
}

export interface SyncHistoryEntry {
  timestamp: string;
  action: string;
  changes: string[];
}
