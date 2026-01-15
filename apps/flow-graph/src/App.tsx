import { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas, SpecPanel, PropertyPanel, Toolbar } from '@/components';
import { useSyncStore } from '@/stores';
import { JourneyView } from '@/views';

type ViewMode = 'engineer' | 'journey';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('engineer');
  const { setSpecsPath, setConnected } = useSyncStore();

  // URL에서 view 모드와 스펙 경로 가져오기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view') as ViewMode | null;
    const pathFromUrl = urlParams.get('path');
    const pathFromEnv = import.meta.env.VITE_SPECS_PATH;

    // view 모드 설정
    if (viewFromUrl === 'journey') {
      setViewMode('journey');
    } else {
      setViewMode('engineer');
    }

    const specsPath = pathFromUrl || pathFromEnv || null;

    if (specsPath) {
      setSpecsPath(specsPath);
    }

    // WebSocket 연결 상태 (향후 실시간 동기화용)
    setConnected(true);
  }, [setSpecsPath, setConnected]);

  // Journey 뷰 모드
  if (viewMode === 'journey') {
    return <JourneyView />;
  }

  // 엔지니어 뷰 모드 (기존)
  return (
    <ReactFlowProvider>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Toolbar />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <SpecPanel />
          <div style={{ flex: 1, position: 'relative' }}>
            <FlowCanvas />
          </div>
          <PropertyPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
