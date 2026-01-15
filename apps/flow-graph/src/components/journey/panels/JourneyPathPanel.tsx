import { useJourneyStore } from '@/stores/journeyStore';
import type { JourneyPath } from '@/types/journey';

export default function JourneyPathPanel() {
  const {
    journeySpec,
    selectedPathId,
    selectPath,
    playback,
  } = useJourneyStore();

  if (!journeySpec) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          스펙을 로드하면 시나리오가 표시됩니다
        </div>
      </div>
    );
  }

  const happyPaths = journeySpec.paths.filter((p) => p.type === 'happy');
  const errorPaths = journeySpec.paths.filter((p) => p.type === 'error');
  const altPaths = journeySpec.paths.filter((p) => p.type === 'alternative');

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <span style={styles.title}>시나리오</span>
        <span style={styles.count}>{journeySpec.paths.length}</span>
      </div>

      {/* 성공 시나리오 */}
      {happyPaths.length > 0 && (
        <PathSection
          title="성공 시나리오"
          icon="✓"
          color="#22c55e"
          paths={happyPaths}
          selectedId={selectedPathId}
          activePath={playback.activePath}
          onSelect={selectPath}
        />
      )}

      {/* 에러 시나리오 */}
      {errorPaths.length > 0 && (
        <PathSection
          title="에러 시나리오"
          icon="✕"
          color="#ef4444"
          paths={errorPaths}
          selectedId={selectedPathId}
          activePath={playback.activePath}
          onSelect={selectPath}
        />
      )}

      {/* 대체 시나리오 */}
      {altPaths.length > 0 && (
        <PathSection
          title="대체 시나리오"
          icon="↗"
          color="#f97316"
          paths={altPaths}
          selectedId={selectedPathId}
          activePath={playback.activePath}
          onSelect={selectPath}
        />
      )}

      {/* 화면 목록 */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span>📱 화면 ({journeySpec.screens.length})</span>
        </div>
        <div style={styles.screenList}>
          {journeySpec.screens.map((screen, idx) => (
            <div
              key={screen.id}
              style={{
                ...styles.screenItem,
                backgroundColor: screen.isErrorScreen ? '#fef2f2' : '#f8fafc',
              }}
            >
              <span style={styles.screenOrder}>{idx + 1}</span>
              <div style={styles.screenInfo}>
                <div style={styles.screenName}>{screen.name}</div>
                <div style={styles.screenRoute}>{screen.route}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 경로 섹션 컴포넌트
function PathSection({
  title,
  icon,
  color,
  paths,
  selectedId,
  activePath,
  onSelect,
}: {
  title: string;
  icon: string;
  color: string;
  paths: JourneyPath[];
  selectedId: string | null;
  activePath: JourneyPath | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <span style={{ color }}>{icon}</span>
        <span>{title}</span>
      </div>
      {paths.map((path) => {
        const isSelected = selectedId === path.id;
        const isActive = activePath?.id === path.id;

        return (
          <button
            key={path.id}
            onClick={() => onSelect(isSelected ? null : path.id)}
            style={{
              ...styles.pathItem,
              backgroundColor: isActive ? `${color}15` : isSelected ? '#f1f5f9' : 'transparent',
              borderColor: isActive ? color : isSelected ? '#cbd5e1' : 'transparent',
            }}
          >
            <div
              style={{
                ...styles.pathIndicator,
                backgroundColor: isActive ? color : isSelected ? color : '#e2e8f0',
              }}
            />
            <div style={styles.pathContent}>
              <div style={styles.pathName}>{path.name}</div>
              <div style={styles.pathSteps}>
                {path.screens.length} 화면 · {path.actions.length} 액션
              </div>
            </div>
            {isActive && (
              <span style={{ color, fontSize: 10 }}>재생 중</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 260,
    height: '100%',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 16px 12px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1f2937',
  },
  count: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
  },
  empty: {
    padding: 20,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    padding: '12px 12px 8px',
    borderBottom: '1px solid #f1f5f9',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 8,
  },
  pathItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    marginBottom: 4,
    borderRadius: 8,
    border: '1px solid transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  pathIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  pathContent: {
    flex: 1,
    minWidth: 0,
  },
  pathName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#1f2937',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  pathSteps: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  screenList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 200,
    overflowY: 'auto',
  },
  screenItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
  },
  screenOrder: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: '50%',
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
  },
  screenInfo: {
    flex: 1,
    minWidth: 0,
  },
  screenName: {
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  screenRoute: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
};
