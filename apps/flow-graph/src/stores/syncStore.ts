import { create } from 'zustand';
import type { FunctionalSpec, UiSpec, FlowGraphSpec, Conflict } from '@/types';

interface SyncState {
  // 로드된 스펙 데이터
  functionalSpec: FunctionalSpec | null;
  uiSpec: UiSpec | null;
  flowGraph: FlowGraphSpec | null;

  // 동기화 상태
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;

  // 충돌 상태
  conflicts: Conflict[];

  // 프로젝트 경로
  specsPath: string | null;

  // 연결 상태
  isConnected: boolean;
}

interface SyncActions {
  // 스펙 로드
  setSpecsPath: (path: string) => void;
  loadSpecs: () => Promise<void>;
  setSpecs: (specs: {
    functionalSpec?: FunctionalSpec | null;
    uiSpec?: UiSpec | null;
    flowGraph?: FlowGraphSpec | null;
  }) => void;

  // 동기화
  syncToYaml: () => Promise<void>;
  syncFromYaml: () => Promise<void>;

  // 충돌 해결
  addConflict: (conflict: Conflict) => void;
  resolveConflict: (conflictId: string, resolution: 'graph' | 'spec') => void;
  clearConflicts: () => void;

  // 에러 처리
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;

  // 리셋
  reset: () => void;
}

const initialState: SyncState = {
  functionalSpec: null,
  uiSpec: null,
  flowGraph: null,
  isLoading: false,
  isSyncing: false,
  lastSyncTime: null,
  error: null,
  conflicts: [],
  specsPath: null,
  isConnected: false,
};

export const useSyncStore = create<SyncState & SyncActions>((set, get) => ({
  ...initialState,

  setSpecsPath: (path) => {
    set({ specsPath: path });
  },

  loadSpecs: async () => {
    const { specsPath } = get();
    if (!specsPath) {
      set({ error: 'specs 경로가 설정되지 않았습니다.' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/specs?path=${encodeURIComponent(specsPath)}`);
      if (!response.ok) {
        throw new Error(`스펙 로드 실패: ${response.statusText}`);
      }
      const data = await response.json();
      set({
        functionalSpec: data.functionalSpec,
        uiSpec: data.uiSpec,
        flowGraph: data.flowGraph,
        isLoading: false,
        lastSyncTime: new Date(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '스펙 로드 중 오류 발생',
        isLoading: false,
      });
    }
  },

  setSpecs: (specs) => {
    set({
      ...(specs.functionalSpec !== undefined && { functionalSpec: specs.functionalSpec }),
      ...(specs.uiSpec !== undefined && { uiSpec: specs.uiSpec }),
      ...(specs.flowGraph !== undefined && { flowGraph: specs.flowGraph }),
    });
  },

  syncToYaml: async () => {
    const { specsPath } = get();
    if (!specsPath) return;

    set({ isSyncing: true, error: null });

    try {
      // graphStore에서 현재 그래프 데이터 가져오기
      const { useGraphStore } = await import('./graphStore');
      const graphState = useGraphStore.getState();

      const response = await fetch('/api/specs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: specsPath,
          nodes: graphState.nodes,
          edges: graphState.edges,
          viewport: graphState.viewport,
          happyPaths: graphState.happyPaths,
          errorPaths: graphState.errorPaths,
        }),
      });

      if (!response.ok) {
        throw new Error(`동기화 실패: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.conflicts?.length > 0) {
        set({ conflicts: result.conflicts });
      } else {
        set({ lastSyncTime: new Date() });
        useGraphStore.getState().markSaved();
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '동기화 중 오류 발생',
      });
    } finally {
      set({ isSyncing: false });
    }
  },

  syncFromYaml: async () => {
    await get().loadSpecs();
  },

  addConflict: (conflict) => {
    set({ conflicts: [...get().conflicts, conflict] });
  },

  resolveConflict: async (conflictId, resolution) => {
    const { conflicts, specsPath } = get();
    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict || !specsPath) return;

    try {
      await fetch('/api/specs/resolve-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: specsPath,
          conflictId,
          resolution,
        }),
      });

      set({
        conflicts: conflicts.filter((c) => c.id !== conflictId),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '충돌 해결 중 오류 발생',
      });
    }
  },

  clearConflicts: () => {
    set({ conflicts: [] });
  },

  setError: (error) => {
    set({ error });
  },

  setConnected: (connected) => {
    set({ isConnected: connected });
  },

  reset: () => {
    set(initialState);
  },
}));
