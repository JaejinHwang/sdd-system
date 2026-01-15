import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import {
  JourneyCanvas,
  JourneyPathPanel,
  JourneyDetailPanel,
  JourneyToolbar,
  TimelineBar,
} from '@/components/journey';
import { useSyncStore } from '@/stores';
import { useJourneyStore } from '@/stores/journeyStore';

export default function JourneyView() {
  const { setSpecsPath, setConnected } = useSyncStore();
  const { playback } = useJourneyStore();

  // URL에서 스펙 경로 가져오기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathFromUrl = urlParams.get('path');
    const pathFromEnv = import.meta.env.VITE_SPECS_PATH;

    const specsPath = pathFromUrl || pathFromEnv || null;

    if (specsPath) {
      setSpecsPath(specsPath);
    }

    setConnected(true);
  }, [setSpecsPath, setConnected]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { nextStep, prevStep, play, pause, playback: pb } = useJourneyStore.getState();

      // 화살표 키로 스텝 이동
      if (e.key === 'ArrowRight' && pb.activePath) {
        e.preventDefault();
        nextStep();
      }
      if (e.key === 'ArrowLeft' && pb.activePath) {
        e.preventDefault();
        prevStep();
      }
      // Space로 재생/일시정지
      if (e.key === ' ' && pb.activePath) {
        e.preventDefault();
        pb.isPlaying ? pause() : play();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActivePath = playback.activePath !== null;

  return (
    <ReactFlowProvider>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#f8fafc',
        }}
      >
        {/* 상단 툴바 */}
        <JourneyToolbar />

        {/* 메인 영역 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 좌측: 시나리오 패널 */}
          <JourneyPathPanel />

          {/* 중앙: 캔버스 */}
          <div style={{ flex: 1, position: 'relative' }}>
            <JourneyCanvas />
          </div>

          {/* 우측: 상세 정보 패널 */}
          <JourneyDetailPanel />
        </div>

        {/* 하단 타임라인 (경로 선택 시에만) */}
        {hasActivePath && <TimelineBar />}
      </div>
    </ReactFlowProvider>
  );
}
