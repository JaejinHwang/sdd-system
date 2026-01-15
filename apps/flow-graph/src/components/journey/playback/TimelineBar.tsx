import { useJourneyStore } from '@/stores/journeyStore';

export default function TimelineBar() {
  const {
    playback,
    journeySpec,
    goToStep,
    prevStep,
    nextStep,
  } = useJourneyStore();

  const { activePath, currentStep, totalSteps } = playback;

  if (!activePath || !journeySpec) {
    return null;
  }

  // 경로에 해당하는 화면들
  const pathScreens = activePath.screens
    .map((screenId) => journeySpec.screens.find((s) => s.id === screenId))
    .filter(Boolean);

  return (
    <div style={styles.container}>
      {/* 이전 버튼 */}
      <button
        onClick={prevStep}
        disabled={currentStep === 0}
        style={{
          ...styles.navButton,
          opacity: currentStep === 0 ? 0.4 : 1,
        }}
      >
        ◀
      </button>

      {/* 타임라인 */}
      <div style={styles.timeline}>
        {pathScreens.map((screen, index) => {
          if (!screen) return null;

          const isActive = index === currentStep;
          const isPast = index < currentStep;
          const isLast = index === pathScreens.length - 1;

          return (
            <div key={screen.id} style={styles.stepWrapper}>
              {/* 스텝 노드 */}
              <button
                onClick={() => goToStep(index)}
                style={{
                  ...styles.stepNode,
                  backgroundColor: isActive
                    ? activePath.highlightColor
                    : isPast
                      ? '#94a3b8'
                      : '#e2e8f0',
                  transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: isActive
                    ? `0 0 0 4px ${activePath.highlightColor}30`
                    : 'none',
                }}
                title={screen.name}
              >
                {isActive && (
                  <span style={styles.activeIndicator}>●</span>
                )}
              </button>

              {/* 스텝 라벨 */}
              <div
                style={{
                  ...styles.stepLabel,
                  color: isActive ? activePath.highlightColor : isPast ? '#64748b' : '#94a3b8',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {screen.name}
              </div>

              {/* 연결선 */}
              {!isLast && (
                <div
                  style={{
                    ...styles.connector,
                    backgroundColor: isPast ? '#94a3b8' : '#e2e8f0',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={nextStep}
        disabled={currentStep >= totalSteps - 1}
        style={{
          ...styles.navButton,
          opacity: currentStep >= totalSteps - 1 ? 0.4 : 1,
        }}
      >
        ▶
      </button>

      {/* 경로 정보 */}
      <div style={styles.pathInfo}>
        <span style={styles.pathName}>{activePath.name}</span>
        <span style={styles.stepCount}>
          Step {currentStep + 1} / {totalSteps}
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: 64,
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: 16,
  },
  navButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    color: '#64748b',
    flexShrink: 0,
  },
  timeline: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    overflow: 'auto',
    padding: '8px 0',
  },
  stepWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    position: 'relative',
  },
  stepNode: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    position: 'relative',
    zIndex: 1,
  },
  activeIndicator: {
    fontSize: 6,
    color: 'white',
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 4,
    whiteSpace: 'nowrap',
    maxWidth: 80,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'center',
  },
  connector: {
    width: 40,
    height: 2,
    position: 'absolute',
    top: 7,
    left: '50%',
    marginLeft: 8,
    zIndex: 0,
  },
  pathInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
    minWidth: 120,
  },
  pathName: {
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
  },
  stepCount: {
    fontSize: 11,
    color: '#94a3b8',
  },
};
