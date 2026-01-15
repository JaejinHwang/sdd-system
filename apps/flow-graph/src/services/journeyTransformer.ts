import dagre from 'dagre';
import type { FunctionalSpec, UiSpec, Screen, Feature } from '@/types/spec';
import type { FlowGraphSpec } from '@/types/flow-graph';
import type {
  JourneySpec,
  JourneyScreen,
  JourneyAction,
  JourneyPath,
  JourneyInteraction,
  ActionType,
  JourneyPathType,
} from '@/types/journey';

const LAYOUT_CONFIG = {
  nodeWidth: 220,
  nodeHeight: 140,
  rankSep: 150,
  nodeSep: 100,
};

/**
 * 스펙 파일들을 Journey 형태로 변환 (기획자/디자이너용)
 * 화면 단위로 그룹화하고, 사용자 액션 기반으로 표현
 */
export function transformSpecsToJourney(
  functionalSpec: FunctionalSpec | null,
  uiSpec: UiSpec | null,
  flowGraph: FlowGraphSpec | null
): JourneySpec {
  const screens: JourneyScreen[] = [];
  const actions: JourneyAction[] = [];
  const paths: JourneyPath[] = [];

  if (!uiSpec?.ui_spec?.screens) {
    return { screens, actions, paths };
  }

  // 1. Screen → Feature 매핑 생성
  const screenFeatureMap = new Map<string, Feature[]>();
  if (functionalSpec?.functional_spec?.features) {
    uiSpec.ui_spec.screens.forEach((screen) => {
      const features = functionalSpec.functional_spec.features.filter((f) =>
        screen.implements_features.includes(f.id)
      );
      screenFeatureMap.set(screen.id, features);
    });
  }

  // 2. Screen 노드 생성
  uiSpec.ui_spec.screens.forEach((screen, index) => {
    const features = screenFeatureMap.get(screen.id) ?? [];
    const isErrorScreen =
      screen.name.toLowerCase().includes('error') ||
      screen.route.toLowerCase().includes('error');

    const journeyScreen: JourneyScreen = {
      id: `journey-screen-${screen.id}`,
      name: screen.name,
      route: screen.route,
      description: screen.description,
      thumbnail: undefined, // ui-spec에 thumbnail 필드가 추가되면 사용
      features: features.map((f) => f.id),
      featureNames: features.map((f) => f.name),
      interactions: extractInteractions(screen),
      order: index,
      isErrorScreen,
    };
    screens.push(journeyScreen);
  });

  // 3. 화면 간 액션(네비게이션) 생성
  const navigationActions = extractNavigationActions(uiSpec.ui_spec.screens, screens);
  actions.push(...navigationActions);

  // 4. 경로 정보 생성
  if (flowGraph?.flow_graph?.paths) {
    // 저장된 경로 정보 활용
    const { happy_paths, error_paths } = flowGraph.flow_graph.paths;

    happy_paths?.forEach((path) => {
      const journeyPath = convertToJourneyPath(path, screens, actions, 'happy');
      if (journeyPath) paths.push(journeyPath);
    });

    error_paths?.forEach((path) => {
      const journeyPath = convertToJourneyPath(path, screens, actions, 'error');
      if (journeyPath) paths.push(journeyPath);
    });
  }

  // 기본 경로가 없으면 자동 생성
  if (paths.length === 0 && screens.length > 0) {
    const defaultPath = generateDefaultJourneyPath(screens, actions);
    if (defaultPath) paths.push(defaultPath);
  }

  return { screens, actions, paths };
}

/**
 * Screen의 interactions를 JourneyInteraction으로 변환
 */
function extractInteractions(screen: Screen): JourneyInteraction[] {
  return screen.interactions.map((interaction) => ({
    trigger: humanizeTrigger(interaction.trigger),
    action: interaction.action,
    feedback: interaction.feedback,
  }));
}

/**
 * 화면 간 네비게이션 액션 추출
 * ui-spec의 interactions에서 화면 전환을 암시하는 액션 찾기
 */
function extractNavigationActions(
  uiScreens: Screen[],
  journeyScreens: JourneyScreen[]
): JourneyAction[] {
  const actions: JourneyAction[] = [];
  const screenRouteMap = new Map<string, JourneyScreen>();

  journeyScreens.forEach((screen) => {
    screenRouteMap.set(screen.route, screen);
  });

  uiScreens.forEach((screen, index) => {
    const fromScreen = journeyScreens.find((s) => s.route === screen.route);
    if (!fromScreen) return;

    screen.interactions.forEach((interaction, iIndex) => {
      // 네비게이션을 암시하는 키워드 찾기
      const actionLower = interaction.action.toLowerCase();
      const feedbackLower = interaction.feedback.toLowerCase();

      // 다른 화면으로 이동하는 액션 감지
      const isNavigation =
        actionLower.includes('navigate') ||
        actionLower.includes('redirect') ||
        actionLower.includes('go to') ||
        feedbackLower.includes('이동') ||
        feedbackLower.includes('navigate') ||
        feedbackLower.includes('screen');

      if (isNavigation) {
        // 다음 화면 찾기 (순서상 다음 또는 명시된 화면)
        const nextScreen =
          journeyScreens[index + 1] ?? journeyScreens.find((s) => s.id !== fromScreen.id);

        if (nextScreen && nextScreen.id !== fromScreen.id) {
          const isError =
            nextScreen.isErrorScreen ||
            interaction.feedback.toLowerCase().includes('error') ||
            interaction.feedback.toLowerCase().includes('에러');

          actions.push({
            id: `action-${fromScreen.id}-to-${nextScreen.id}-${iIndex}`,
            from: fromScreen.id,
            to: nextScreen.id,
            actionType: inferActionType(interaction.trigger),
            label: humanizeTrigger(interaction.trigger),
            feedback: interaction.feedback,
            pathType: isError ? 'error' : 'happy',
          });
        }
      }
    });

    // 명시적 네비게이션이 없으면 순차 연결 생성
    if (index < uiScreens.length - 1) {
      const nextScreen = journeyScreens[index + 1];
      const existingAction = actions.find(
        (a) => a.from === fromScreen.id && a.to === nextScreen.id
      );

      if (!existingAction && nextScreen) {
        // 첫 번째 interaction을 기반으로 액션 생성
        const primaryInteraction = screen.interactions[0];
        actions.push({
          id: `action-${fromScreen.id}-to-${nextScreen.id}-auto`,
          from: fromScreen.id,
          to: nextScreen.id,
          actionType: primaryInteraction ? inferActionType(primaryInteraction.trigger) : 'click',
          label: primaryInteraction ? humanizeTrigger(primaryInteraction.trigger) : '다음 단계',
          feedback: primaryInteraction?.feedback ?? nextScreen.name + '으로 이동',
          pathType: nextScreen.isErrorScreen ? 'error' : 'happy',
        });
      }
    }
  });

  return actions;
}

/**
 * flow-graph의 경로를 JourneyPath로 변환
 */
function convertToJourneyPath(
  path: { id: string; name: string; description: string; nodes: string[]; edges: string[] },
  screens: JourneyScreen[],
  actions: JourneyAction[],
  type: JourneyPathType
): JourneyPath | null {
  // State 노드 ID에서 Feature ID 추출하여 해당 Screen 찾기
  const screenIds: string[] = [];
  const actionIds: string[] = [];

  // 각 노드에 해당하는 화면 찾기 (중복 제거)
  path.nodes.forEach((nodeId) => {
    // nodeId 형식: state-F-001-idle
    const featureMatch = nodeId.match(/state-(F-\d+)-/);
    if (featureMatch) {
      const featureId = featureMatch[1];
      const screen = screens.find((s) => s.features.includes(featureId));
      if (screen && !screenIds.includes(screen.id)) {
        screenIds.push(screen.id);
      }
    }
  });

  // 화면 간 액션 찾기
  for (let i = 0; i < screenIds.length - 1; i++) {
    const fromScreen = screenIds[i];
    const toScreen = screenIds[i + 1];
    const action = actions.find((a) => a.from === fromScreen && a.to === toScreen);
    if (action) {
      actionIds.push(action.id);
    }
  }

  if (screenIds.length === 0) return null;

  return {
    id: `journey-${path.id}`,
    name: path.name,
    description: path.description,
    type,
    screens: screenIds,
    actions: actionIds,
    highlightColor: type === 'happy' ? '#22c55e' : type === 'error' ? '#ef4444' : '#f97316',
  };
}

/**
 * 기본 Journey 경로 자동 생성
 */
function generateDefaultJourneyPath(
  screens: JourneyScreen[],
  actions: JourneyAction[]
): JourneyPath | null {
  // 에러가 아닌 화면들만 순서대로
  const happyScreens = screens.filter((s) => !s.isErrorScreen);
  if (happyScreens.length === 0) return null;

  const screenIds = happyScreens.map((s) => s.id);
  const actionIds: string[] = [];

  // 순차 액션 찾기
  for (let i = 0; i < screenIds.length - 1; i++) {
    const action = actions.find(
      (a) => a.from === screenIds[i] && a.to === screenIds[i + 1] && a.pathType === 'happy'
    );
    if (action) actionIds.push(action.id);
  }

  return {
    id: 'journey-path-default',
    name: '기본 사용자 여정',
    description: '메인 플로우를 따라가는 기본 사용자 여정',
    type: 'happy',
    screens: screenIds,
    actions: actionIds,
    highlightColor: '#22c55e',
  };
}

/**
 * 트리거 문자열을 사람이 읽기 쉬운 형태로 변환
 */
function humanizeTrigger(trigger: string): string {
  // snake_case나 camelCase를 공백으로 분리
  let humanized = trigger
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase();

  // 일반적인 액션 패턴을 한글로 변환 (선택적)
  const patterns: [RegExp, string][] = [
    [/^click\s+(.+)$/i, '$1 클릭'],
    [/^tap\s+(.+)$/i, '$1 탭'],
    [/^input\s+(.+)$/i, '$1 입력'],
    [/^enter\s+(.+)$/i, '$1 입력'],
    [/^select\s+(.+)$/i, '$1 선택'],
    [/^submit\s*(.*)$/i, '제출 버튼 클릭'],
    [/^scroll\s+(.+)$/i, '$1 스크롤'],
    [/^swipe\s+(.+)$/i, '$1 스와이프'],
  ];

  for (const [pattern, replacement] of patterns) {
    if (pattern.test(humanized)) {
      humanized = humanized.replace(pattern, replacement);
      break;
    }
  }

  // 첫 글자 대문자
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}

/**
 * 트리거에서 액션 타입 추론
 */
function inferActionType(trigger: string): ActionType {
  const lower = trigger.toLowerCase();

  if (lower.includes('click') || lower.includes('tap') || lower.includes('press')) {
    return 'click';
  }
  if (lower.includes('input') || lower.includes('enter') || lower.includes('type')) {
    return 'input';
  }
  if (lower.includes('swipe')) {
    return 'swipe';
  }
  if (lower.includes('scroll')) {
    return 'scroll';
  }
  if (lower.includes('back') || lower.includes('navigate')) {
    return 'navigate';
  }
  if (
    lower.includes('load') ||
    lower.includes('complete') ||
    lower.includes('timeout') ||
    lower.includes('receive')
  ) {
    return 'system';
  }
  if (lower.includes('external') || lower.includes('link') || lower.includes('open')) {
    return 'external';
  }

  return 'click'; // 기본값
}

/**
 * Journey 데이터를 React Flow 노드/엣지로 변환
 */
export function transformJourneyToReactFlow(journeySpec: JourneySpec): {
  nodes: JourneyReactFlowNode[];
  edges: JourneyReactFlowEdge[];
} {
  const nodes: JourneyReactFlowNode[] = [];
  const edges: JourneyReactFlowEdge[] = [];

  // Dagre 레이아웃 계산
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR', // 좌에서 우로 진행
    ranksep: LAYOUT_CONFIG.rankSep,
    nodesep: LAYOUT_CONFIG.nodeSep,
  });

  // 노드 추가
  journeySpec.screens.forEach((screen) => {
    dagreGraph.setNode(screen.id, {
      width: LAYOUT_CONFIG.nodeWidth,
      height: LAYOUT_CONFIG.nodeHeight,
    });
  });

  // 엣지 추가
  journeySpec.actions.forEach((action) => {
    dagreGraph.setEdge(action.from, action.to);
  });

  // 레이아웃 계산
  dagre.layout(dagreGraph);

  // 노드 생성
  journeySpec.screens.forEach((screen) => {
    const nodeWithPosition = dagreGraph.node(screen.id);
    nodes.push({
      id: screen.id,
      type: 'journeyScreen',
      position: {
        x: nodeWithPosition.x - LAYOUT_CONFIG.nodeWidth / 2,
        y: nodeWithPosition.y - LAYOUT_CONFIG.nodeHeight / 2,
      },
      data: screen,
    });
  });

  // 엣지 생성
  journeySpec.actions.forEach((action) => {
    edges.push({
      id: action.id,
      source: action.from,
      target: action.to,
      type: 'journeyAction',
      data: action,
    });
  });

  return { nodes, edges };
}

// React Flow 타입 정의
export interface JourneyReactFlowNode {
  id: string;
  type: 'journeyScreen';
  position: { x: number; y: number };
  data: JourneyScreen;
}

export interface JourneyReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type: 'journeyAction';
  data: JourneyAction;
}
