import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Node,
  type Edge,
} from '@xyflow/react';
import type {
  JourneySpec,
  JourneyScreen,
  JourneyAction,
  JourneyPath,
  JourneyPlaybackState,
} from '@/types/journey';
import type {
  JourneyReactFlowNode,
  JourneyReactFlowEdge,
} from '@/services/journeyTransformer';

interface JourneyState {
  // Journey 데이터
  journeySpec: JourneySpec | null;

  // React Flow 노드/엣지
  nodes: JourneyReactFlowNode[];
  edges: JourneyReactFlowEdge[];

  // 선택 상태
  selectedScreenId: string | null;
  selectedActionId: string | null;
  selectedPathId: string | null;

  // 재생 상태
  playback: JourneyPlaybackState;

  // 뷰포트
  viewport: { x: number; y: number; zoom: number };

  // 로딩/에러
  isLoading: boolean;
  error: string | null;
}

interface JourneyActions {
  // 데이터 설정
  setJourneySpec: (spec: JourneySpec) => void;
  setGraphData: (nodes: JourneyReactFlowNode[], edges: JourneyReactFlowEdge[]) => void;

  // React Flow 변경
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  // 선택
  selectScreen: (id: string | null) => void;
  selectAction: (id: string | null) => void;
  selectPath: (id: string | null) => void;

  // 뷰포트
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // 재생 컨트롤
  play: () => void;
  pause: () => void;
  stop: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setPlaybackSpeed: (speed: number) => void;

  // 경로 하이라이트
  highlightPath: (pathId: string | null) => void;

  // 상태
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialPlayback: JourneyPlaybackState = {
  isPlaying: false,
  currentStep: 0,
  totalSteps: 0,
  playbackSpeed: 1,
  activePath: null,
  activeScreenId: null,
  activeActionId: null,
};

const initialState: JourneyState = {
  journeySpec: null,
  nodes: [],
  edges: [],
  selectedScreenId: null,
  selectedActionId: null,
  selectedPathId: null,
  playback: initialPlayback,
  viewport: { x: 0, y: 0, zoom: 1 },
  isLoading: false,
  error: null,
};

export const useJourneyStore = create<JourneyState & JourneyActions>((set, get) => ({
  ...initialState,

  setJourneySpec: (spec) => {
    set({ journeySpec: spec });
  },

  setGraphData: (nodes, edges) => {
    set({ nodes, edges });
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes as unknown as Node[]) as unknown as JourneyReactFlowNode[],
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges as unknown as Edge[]) as unknown as JourneyReactFlowEdge[],
    });
  },

  selectScreen: (id) => {
    set({ selectedScreenId: id, selectedActionId: null });
  },

  selectAction: (id) => {
    set({ selectedActionId: id, selectedScreenId: null });
  },

  selectPath: (id) => {
    const { journeySpec } = get();
    if (!journeySpec) return;

    const path = journeySpec.paths.find((p) => p.id === id);
    set({ selectedPathId: id });

    if (path) {
      // 경로 하이라이트 적용
      get().highlightPath(id);

      // 재생 상태 초기화
      set({
        playback: {
          ...initialPlayback,
          totalSteps: path.screens.length,
          activePath: path,
          activeScreenId: path.screens[0] ?? null,
        },
      });
    }
  },

  setViewport: (viewport) => {
    set({ viewport });
  },

  play: () => {
    const { playback, journeySpec } = get();
    if (!playback.activePath || !journeySpec) return;

    set({
      playback: {
        ...playback,
        isPlaying: true,
      },
    });

    // 자동 진행 시작
    const interval = setInterval(() => {
      const { playback: currentPlayback } = get();
      if (!currentPlayback.isPlaying) {
        clearInterval(interval);
        return;
      }

      if (currentPlayback.currentStep < currentPlayback.totalSteps - 1) {
        get().nextStep();
      } else {
        // 끝에 도달하면 정지
        get().stop();
        clearInterval(interval);
      }
    }, 2000 / playback.playbackSpeed);
  },

  pause: () => {
    set({
      playback: {
        ...get().playback,
        isPlaying: false,
      },
    });
  },

  stop: () => {
    const { playback } = get();
    set({
      playback: {
        ...playback,
        isPlaying: false,
        currentStep: 0,
        activeScreenId: playback.activePath?.screens[0] ?? null,
        activeActionId: null,
      },
    });
  },

  nextStep: () => {
    const { playback } = get();
    if (!playback.activePath) return;

    const nextStepIndex = Math.min(playback.currentStep + 1, playback.totalSteps - 1);
    const activeScreenId = playback.activePath.screens[nextStepIndex] ?? null;
    const activeActionId =
      nextStepIndex > 0 ? playback.activePath.actions[nextStepIndex - 1] ?? null : null;

    set({
      playback: {
        ...playback,
        currentStep: nextStepIndex,
        activeScreenId,
        activeActionId,
      },
    });
  },

  prevStep: () => {
    const { playback } = get();
    if (!playback.activePath) return;

    const prevStepIndex = Math.max(playback.currentStep - 1, 0);
    const activeScreenId = playback.activePath.screens[prevStepIndex] ?? null;
    const activeActionId =
      prevStepIndex > 0 ? playback.activePath.actions[prevStepIndex - 1] ?? null : null;

    set({
      playback: {
        ...playback,
        currentStep: prevStepIndex,
        activeScreenId,
        activeActionId,
      },
    });
  },

  goToStep: (step) => {
    const { playback } = get();
    if (!playback.activePath) return;

    const clampedStep = Math.max(0, Math.min(step, playback.totalSteps - 1));
    const activeScreenId = playback.activePath.screens[clampedStep] ?? null;
    const activeActionId =
      clampedStep > 0 ? playback.activePath.actions[clampedStep - 1] ?? null : null;

    set({
      playback: {
        ...playback,
        currentStep: clampedStep,
        activeScreenId,
        activeActionId,
      },
    });
  },

  setPlaybackSpeed: (speed) => {
    set({
      playback: {
        ...get().playback,
        playbackSpeed: speed,
      },
    });
  },

  highlightPath: (pathId) => {
    const { journeySpec, nodes, edges } = get();
    if (!journeySpec) return;

    const path = journeySpec.paths.find((p) => p.id === pathId);

    // 모든 노드/엣지의 하이라이트 상태 업데이트
    const updatedNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: path ? path.screens.includes(node.id) : false,
        highlightColor: path?.highlightColor,
        isOnPath: path ? path.screens.includes(node.id) : true,
      },
    }));

    const updatedEdges = edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        isHighlighted: path ? path.actions.includes(edge.id) : false,
        highlightColor: path?.highlightColor,
        isOnPath: path ? path.actions.includes(edge.id) : true,
      },
    }));

    set({
      nodes: updatedNodes as JourneyReactFlowNode[],
      edges: updatedEdges as JourneyReactFlowEdge[],
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  reset: () => {
    set(initialState);
  },
}));

// 선택된 화면 정보 가져오기
export function getSelectedScreen(state: JourneyState): JourneyScreen | null {
  if (!state.journeySpec || !state.selectedScreenId) return null;
  return state.journeySpec.screens.find((s) => s.id === state.selectedScreenId) ?? null;
}

// 선택된 액션 정보 가져오기
export function getSelectedAction(state: JourneyState): JourneyAction | null {
  if (!state.journeySpec || !state.selectedActionId) return null;
  return state.journeySpec.actions.find((a) => a.id === state.selectedActionId) ?? null;
}

// 선택된 경로 정보 가져오기
export function getSelectedPath(state: JourneyState): JourneyPath | null {
  if (!state.journeySpec || !state.selectedPathId) return null;
  return state.journeySpec.paths.find((p) => p.id === state.selectedPathId) ?? null;
}
