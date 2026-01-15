import { useJourneyStore } from '@/stores/journeyStore';
import { useSyncStore } from '@/stores';

export default function JourneyToolbar() {
  const {
    playback,
    play,
    pause,
    stop,
    nextStep,
    prevStep,
    setPlaybackSpeed,
  } = useJourneyStore();

  const { specsPath } = useSyncStore();

  const hasActivePath = playback.activePath !== null;
  const isPlaying = playback.isPlaying;

  // 프로젝트 이름 추출
  const projectName = specsPath?.split('/').filter(Boolean).pop() ?? 'SDD Project';

  return (
    <div style={styles.container}>
      {/* 좌측: 타이틀 */}
      <div style={styles.left}>
        <span style={styles.logo}>🗺️</span>
        <span style={styles.title}>SDD Journey Map</span>
        <span style={styles.separator}>|</span>
        <span style={styles.projectName}>{projectName}</span>
      </div>

      {/* 중앙: 재생 컨트롤 */}
      <div style={styles.center}>
        {!hasActivePath ? (
          <div style={styles.hint}>
            ← 시나리오를 선택하세요
          </div>
        ) : (
          <>
            {/* 처음으로 */}
            <button
              onClick={stop}
              style={styles.controlButton}
              title="처음으로"
            >
              ⏮
            </button>

            {/* 이전 */}
            <button
              onClick={prevStep}
              disabled={playback.currentStep === 0}
              style={{
                ...styles.controlButton,
                opacity: playback.currentStep === 0 ? 0.4 : 1,
              }}
              title="이전 단계"
            >
              ◀
            </button>

            {/* 재생/일시정지 */}
            <button
              onClick={isPlaying ? pause : play}
              style={styles.playButton}
              title={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* 다음 */}
            <button
              onClick={nextStep}
              disabled={playback.currentStep >= playback.totalSteps - 1}
              style={{
                ...styles.controlButton,
                opacity: playback.currentStep >= playback.totalSteps - 1 ? 0.4 : 1,
              }}
              title="다음 단계"
            >
              ▶
            </button>

            {/* 진행 상태 */}
            <div style={styles.progress}>
              <span style={styles.progressCurrent}>{playback.currentStep + 1}</span>
              <span style={styles.progressSeparator}>/</span>
              <span style={styles.progressTotal}>{playback.totalSteps}</span>
            </div>

            {/* 재생 속도 */}
            <select
              value={playback.playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              style={styles.speedSelect}
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </>
        )}
      </div>

      {/* 우측: 뷰 전환 */}
      <div style={styles.right}>
        <a
          href={`?path=${specsPath ?? ''}`}
          style={styles.viewSwitch}
          title="엔지니어 뷰로 전환"
        >
          ⚙️ 엔지니어 뷰
        </a>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: 52,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1f2937',
  },
  separator: {
    color: '#e2e8f0',
    margin: '0 4px',
  },
  projectName: {
    fontSize: 13,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: 6,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    fontSize: 13,
    color: '#94a3b8',
  },
  controlButton: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: '#64748b',
    transition: 'all 0.15s',
  },
  playButton: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: 16,
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.15s',
  },
  progress: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 500,
  },
  progressCurrent: {
    color: '#3b82f6',
  },
  progressSeparator: {
    color: '#cbd5e1',
  },
  progressTotal: {
    color: '#64748b',
  },
  speedSelect: {
    marginLeft: 8,
    padding: '6px 8px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  viewSwitch: {
    fontSize: 12,
    color: '#64748b',
    textDecoration: 'none',
    padding: '6px 12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    transition: 'all 0.15s',
  },
};
