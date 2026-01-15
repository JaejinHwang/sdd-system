import dagre from 'dagre';
import type {
  FunctionalSpec,
  UiSpec,
  FlowGraphSpec,
  FlowNode,
  FlowEdge,
  StateNodeType,
  ScreenNodeType,
  TransitionEdgeType,
  PathDefinition,
  TransformResult,
  Feature,
  State,
} from '@/types';

const LAYOUT_CONFIG = {
  nodeWidth: 200,
  nodeHeight: 70,
  screenPadding: 40,
  screenHeaderHeight: 50,
  rankSep: 120,
  nodeSep: 80,
  screenGap: 100, // Screen 간 간격
};

/**
 * 스펙 파일들을 React Flow 그래프로 변환
 */
export function transformSpecsToGraph(
  functionalSpec: FunctionalSpec | null,
  uiSpec: UiSpec | null,
  flowGraph: FlowGraphSpec | null
): TransformResult {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const happyPaths: PathDefinition[] = [];
  const errorPaths: PathDefinition[] = [];

  // 기존 flow-graph.yaml이 있으면 레이아웃 정보 사용
  const savedPositions = flowGraph?.flow_graph?.nodes;
  const savedPaths = flowGraph?.flow_graph?.paths;

  // Screen별 Feature 매핑 생성
  const screenFeatureMap = new Map<string, Feature[]>();
  const featureScreenMap = new Map<string, string>();

  if (uiSpec?.ui_spec?.screens && functionalSpec?.functional_spec?.features) {
    uiSpec.ui_spec.screens.forEach((screen) => {
      const features = functionalSpec.functional_spec.features.filter((f) =>
        screen.implements_features.includes(f.id)
      );
      screenFeatureMap.set(screen.id, features);
      features.forEach((f) => featureScreenMap.set(f.id, screen.id));
    });
  }

  // 1. State 노드 및 Transition 엣지 생성 (functional-spec 기반)
  // Screen 없이 독립적으로 먼저 생성
  if (functionalSpec?.functional_spec?.features) {
    functionalSpec.functional_spec.features.forEach((feature) => {
      const featureStates = createStateNodes(feature, savedPositions);
      nodes.push(...featureStates.nodes);
      edges.push(...featureStates.edges);
    });
  }

  // 2. 레이아웃 적용 (저장된 위치가 없는 경우)
  if (!flowGraph) {
    applyDagreLayout(nodes, edges, functionalSpec, uiSpec);
  }

  // 3. Screen 노드 생성 (State 노드들의 위치를 기반으로 크기 계산)
  if (uiSpec?.ui_spec?.screens) {
    uiSpec.ui_spec.screens.forEach((screen, index) => {
      const savedScreen = savedPositions?.screens?.find(
        (s) => s.source_ref === `ui-spec.yaml#${screen.id}`
      );

      // 이 Screen에 속한 State 노드들 찾기
      const screenFeatures = screenFeatureMap.get(screen.id) ?? [];
      const childStateNodes = nodes.filter(
        (n) => n.type === 'state' && screenFeatures.some((f) => n.data.featureId === f.id)
      );

      // State 노드들의 bounding box 계산
      let screenPos = savedScreen?.position ?? { x: index * 500, y: 0 };
      let screenSize = {
        width: savedScreen?.size?.width ?? 350,
        height: savedScreen?.size?.height ?? 300,
      };

      if (childStateNodes.length > 0 && !savedScreen) {
        const minX = Math.min(...childStateNodes.map((n) => n.position.x));
        const minY = Math.min(...childStateNodes.map((n) => n.position.y));
        const maxX = Math.max(...childStateNodes.map((n) => n.position.x + LAYOUT_CONFIG.nodeWidth));
        const maxY = Math.max(...childStateNodes.map((n) => n.position.y + LAYOUT_CONFIG.nodeHeight));

        screenPos = {
          x: minX - LAYOUT_CONFIG.screenPadding,
          y: minY - LAYOUT_CONFIG.screenPadding - LAYOUT_CONFIG.screenHeaderHeight,
        };
        screenSize = {
          width: maxX - minX + LAYOUT_CONFIG.screenPadding * 2,
          height: maxY - minY + LAYOUT_CONFIG.screenPadding * 2 + LAYOUT_CONFIG.screenHeaderHeight,
        };
      }

      const screenNode: ScreenNodeType = {
        id: `screen-${screen.id}`,
        type: 'screen',
        position: screenPos,
        zIndex: -1, // Screen을 State 노드 뒤에 배치
        data: {
          sourceRef: `ui-spec.yaml#${screen.id}`,
          label: screen.name,
          route: screen.route,
          implementsFeatures: screen.implements_features,
          expanded: savedScreen?.style?.expanded ?? true,
          colorTheme: savedScreen?.style?.color_theme ?? 'default',
        },
        style: {
          width: screenSize.width,
          height: screenSize.height,
        },
      };
      nodes.push(screenNode);
    });
  }

  // 4. 경로 정보 생성
  if (savedPaths) {
    savedPaths.happy_paths?.forEach((path) => {
      happyPaths.push({
        id: path.id,
        name: path.name,
        description: path.description,
        nodeIds: path.nodes,
        edgeIds: path.edges,
        color: path.highlight_color ?? '#22c55e',
      });
    });

    savedPaths.error_paths?.forEach((path) => {
      errorPaths.push({
        id: path.id,
        name: path.name,
        description: path.description,
        nodeIds: path.nodes,
        edgeIds: path.edges,
        color: path.highlight_color ?? '#ef4444',
      });
    });
  } else {
    // 기본 Happy Path 자동 생성 (첫 번째 feature의 정상 플로우)
    const defaultHappyPath = generateDefaultHappyPath(functionalSpec);
    if (defaultHappyPath) {
      happyPaths.push(defaultHappyPath);
    }
  }

  return { nodes, edges, paths: { happyPaths, errorPaths } };
}

/**
 * Feature의 State 노드 및 Transition 엣지 생성
 * State 노드는 Screen의 자식이 아닌 독립적인 노드로 생성
 */
function createStateNodes(
  feature: Feature,
  savedPositions: FlowGraphSpec['flow_graph']['nodes'] | undefined
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  feature.states.forEach((state, index) => {
    const stateId = `state-${feature.id}-${state.name}`;
    const savedState = savedPositions?.states?.find(
      (s) => s.source_ref === `functional-spec.yaml#${feature.id}.states.${state.name}`
    );

    // 독립적인 노드로 생성 (parentId 없음)
    const stateNode: StateNodeType = {
      id: stateId,
      type: 'state',
      position: savedState?.position ?? { x: 0, y: index * 100 }, // 임시 위치, dagre가 재계산
      data: {
        sourceRef: `functional-spec.yaml#${feature.id}.states.${state.name}`,
        featureId: feature.id,
        label: state.name,
        description: state.description,
        stateType: detectStateType(state, feature.states, index),
        onHappyPath: savedState?.on_happy_path ?? true,
        isHighlighted: false,
      },
    };
    nodes.push(stateNode);

    // Transition 엣지 생성
    state.transitions.forEach((transition, tIndex) => {
      const edgeId = `edge-${feature.id}-${state.name}-to-${transition.target}`;
      const targetStateId = `state-${feature.id}-${transition.target}`;

      // 에러 케이스와 연결된 전이인지 확인
      const isErrorTransition = feature.error_cases?.some(
        (ec) => transition.target.toLowerCase().includes('error') || ec.condition === transition.condition
      ) ?? false;

      const edge: TransitionEdgeType = {
        id: edgeId,
        source: stateId,
        target: targetStateId,
        type: 'transition',
        data: {
          sourceRef: `functional-spec.yaml#${feature.id}.states.${state.name}.transitions[${tIndex}]`,
          trigger: transition.trigger,
          condition: transition.condition,
          pathType: isErrorTransition ? 'error' : 'happy',
          isHighlighted: false,
        },
      };
      edges.push(edge);
    });
  });

  return { nodes, edges };
}

/**
 * State 타입 자동 감지
 */
function detectStateType(
  state: State,
  _allStates: State[],
  index: number
): 'initial' | 'normal' | 'final' | 'error' {
  const name = state.name.toLowerCase();

  if (name.includes('error') || name.includes('fail')) {
    return 'error';
  }
  if (
    name.includes('complete') ||
    name.includes('success') ||
    name.includes('done') ||
    state.transitions.length === 0
  ) {
    return 'final';
  }
  if (index === 0 || name === 'idle' || name === 'initial') {
    return 'initial';
  }
  return 'normal';
}

/**
 * Dagre 레이아웃 적용 - Screen 단위로 분리하여 배치
 */
function applyDagreLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  functionalSpec: FunctionalSpec | null,
  uiSpec: UiSpec | null
): void {
  // Screen별로 Feature 그룹핑
  const screenFeatures = new Map<string, string[]>();
  const featureToScreen = new Map<string, string>();

  if (uiSpec?.ui_spec?.screens) {
    uiSpec.ui_spec.screens.forEach((screen) => {
      screenFeatures.set(screen.id, screen.implements_features);
      screen.implements_features.forEach((fId) => featureToScreen.set(fId, screen.id));
    });
  }

  // Screen이 없는 Feature들
  const orphanFeatures: string[] = [];
  if (functionalSpec?.functional_spec?.features) {
    functionalSpec.functional_spec.features.forEach((feature) => {
      if (!featureToScreen.has(feature.id)) {
        orphanFeatures.push(feature.id);
      }
    });
  }

  // Screen 단위로 레이아웃 계산
  let currentXOffset = 0;
  const screenLayouts: { screenId: string; features: string[]; width: number }[] = [];

  // 각 Screen의 노드들에 대해 별도의 dagre 레이아웃 적용
  if (uiSpec?.ui_spec?.screens) {
    uiSpec.ui_spec.screens.forEach((screen) => {
      const featureIds = screen.implements_features;
      const screenNodes = nodes.filter(
        (n) => n.type === 'state' && featureIds.includes(n.data.featureId as string)
      );
      const screenEdges = edges.filter(
        (e) =>
          screenNodes.some((n) => n.id === e.source) && screenNodes.some((n) => n.id === e.target)
      );

      if (screenNodes.length === 0) {
        screenLayouts.push({ screenId: screen.id, features: featureIds, width: 300 });
        currentXOffset += 300 + LAYOUT_CONFIG.screenGap;
        return;
      }

      // 이 Screen의 노드들에 대한 dagre 그래프 생성
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({
        rankdir: 'TB',
        ranksep: LAYOUT_CONFIG.rankSep,
        nodesep: LAYOUT_CONFIG.nodeSep,
      });

      screenNodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
          width: LAYOUT_CONFIG.nodeWidth,
          height: LAYOUT_CONFIG.nodeHeight,
        });
      });

      screenEdges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      // 위치 적용 (X offset 추가)
      let minX = Infinity;
      let maxX = 0;

      screenNodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        if (nodeWithPosition) {
          const x = currentXOffset + nodeWithPosition.x - LAYOUT_CONFIG.nodeWidth / 2;
          const y = nodeWithPosition.y - LAYOUT_CONFIG.nodeHeight / 2 + LAYOUT_CONFIG.screenHeaderHeight + LAYOUT_CONFIG.screenPadding;
          node.position = { x, y };
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x + LAYOUT_CONFIG.nodeWidth);
        }
      });

      const screenWidth = maxX - minX + LAYOUT_CONFIG.screenPadding * 2;
      screenLayouts.push({ screenId: screen.id, features: featureIds, width: screenWidth });
      currentXOffset += screenWidth + LAYOUT_CONFIG.screenGap;
    });
  }

  // 고아 Feature들 (Screen에 속하지 않는)
  if (orphanFeatures.length > 0) {
    const orphanNodes = nodes.filter(
      (n) => n.type === 'state' && orphanFeatures.includes(n.data.featureId as string)
    );
    const orphanEdges = edges.filter(
      (e) => orphanNodes.some((n) => n.id === e.source) && orphanNodes.some((n) => n.id === e.target)
    );

    if (orphanNodes.length > 0) {
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({
        rankdir: 'TB',
        ranksep: LAYOUT_CONFIG.rankSep,
        nodesep: LAYOUT_CONFIG.nodeSep,
      });

      orphanNodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
          width: LAYOUT_CONFIG.nodeWidth,
          height: LAYOUT_CONFIG.nodeHeight,
        });
      });

      orphanEdges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      orphanNodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        if (nodeWithPosition) {
          node.position = {
            x: currentXOffset + nodeWithPosition.x - LAYOUT_CONFIG.nodeWidth / 2,
            y: nodeWithPosition.y - LAYOUT_CONFIG.nodeHeight / 2,
          };
        }
      });
    }
  }
}

/**
 * 기본 Happy Path 자동 생성
 */
function generateDefaultHappyPath(functionalSpec: FunctionalSpec | null): PathDefinition | null {
  if (!functionalSpec?.functional_spec?.features?.length) return null;

  const feature = functionalSpec.functional_spec.features[0];
  const nodeIds: string[] = [];
  const edgeIds: string[] = [];

  // 초기 상태에서 시작해서 에러가 아닌 경로 추적
  let currentState = feature.states.find(
    (s) => s.name.toLowerCase() === 'idle' || feature.states.indexOf(s) === 0
  );

  while (currentState) {
    nodeIds.push(`state-${feature.id}-${currentState.name}`);

    // 에러가 아닌 첫 번째 전이 찾기
    const nextTransition = currentState.transitions.find(
      (t) => !t.target.toLowerCase().includes('error')
    );

    if (!nextTransition) break;

    edgeIds.push(`edge-${feature.id}-${currentState.name}-to-${nextTransition.target}`);
    currentState = feature.states.find((s) => s.name === nextTransition.target);

    // 순환 방지
    if (nodeIds.includes(`state-${feature.id}-${currentState?.name}`)) break;
  }

  return {
    id: 'path-default-happy',
    name: '기본 성공 플로우',
    description: `${feature.name}의 정상 실행 경로`,
    nodeIds,
    edgeIds,
    color: '#22c55e',
  };
}

/**
 * React Flow 그래프를 flow-graph.yaml 형식으로 변환
 */
export function transformGraphToFlowGraphSpec(
  nodes: FlowNode[],
  edges: FlowEdge[],
  viewport: { x: number; y: number; zoom: number },
  happyPaths: PathDefinition[],
  errorPaths: PathDefinition[]
): FlowGraphSpec {
  const now = new Date().toISOString();

  return {
    flow_graph: {
      metadata: {
        version: '1.0.0',
        created_at: now,
        last_modified: now,
        source_hashes: {
          functional_spec: '',
          ui_spec: '',
        },
        layout: {
          type: 'hierarchical',
          direction: 'TB',
          spacing: {
            node_x: 200,
            node_y: 150,
            group_padding: 40,
          },
        },
      },
      nodes: {
        screens: nodes
          .filter((n): n is ScreenNodeType => n.type === 'screen')
          .map((node) => ({
            id: node.id,
            source_ref: node.data.sourceRef,
            label: node.data.label,
            route: node.data.route,
            position: node.position,
            size: {
              width: (node.style?.width as number) ?? 300,
              height: (node.style?.height as number) ?? 200,
            },
            contains_states: nodes
              .filter((n) => n.type === 'state' && n.parentId === node.id)
              .map((n) => n.id),
            style: {
              expanded: node.data.expanded,
              color_theme: node.data.colorTheme,
            },
          })),
        states: nodes
          .filter((n): n is StateNodeType => n.type === 'state')
          .map((node) => ({
            id: node.id,
            source_ref: node.data.sourceRef,
            feature_id: node.data.featureId,
            label: node.data.label,
            description: node.data.description,
            position: node.position,
            type: node.data.stateType,
            parent_screen: node.parentId ?? null,
            on_happy_path: node.data.onHappyPath,
          })),
        feature_groups: [],
      },
      edges: {
        transitions: edges
          .filter((e): e is TransitionEdgeType => e.type === 'transition')
          .map((edge) => ({
            id: edge.id,
            source_ref: edge.data?.sourceRef ?? '',
            source_node: edge.source,
            target_node: edge.target,
            label: edge.data?.trigger ?? '',
            trigger: edge.data?.trigger ?? '',
            condition: edge.data?.condition ?? null,
            path_type: edge.data?.pathType ?? 'happy',
            style: {
              animated: false,
              stroke_style: 'solid' as const,
            },
          })),
        navigations: [],
        dependencies: [],
      },
      paths: {
        happy_paths: happyPaths.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          nodes: p.nodeIds,
          edges: p.edgeIds,
          highlight_color: p.color,
        })),
        error_paths: errorPaths.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          branch_from: p.nodeIds[0] ?? '',
          nodes: p.nodeIds,
          edges: p.edgeIds,
          error_case_ref: '',
          highlight_color: p.color,
        })),
      },
      viewport: {
        zoom: viewport.zoom,
        pan: { x: viewport.x, y: viewport.y },
        selection: [],
        expanded_groups: [],
      },
    },
    sync: {
      last_sync: now,
      conflict_resolution: 'manual',
      manual_nodes: [],
      history: [
        {
          timestamp: now,
          action: 'save',
          changes: [],
        },
      ],
    },
  };
}
