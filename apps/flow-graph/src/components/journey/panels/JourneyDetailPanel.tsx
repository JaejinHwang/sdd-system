import { useJourneyStore, getSelectedScreen, getSelectedAction } from '@/stores/journeyStore';
import { ACTION_TYPE_ICONS, ACTION_TYPE_LABELS } from '@/types/journey';

export default function JourneyDetailPanel() {
  const state = useJourneyStore();
  const { journeySpec } = state;

  const selectedScreen = getSelectedScreen(state);
  const selectedAction = getSelectedAction(state);

  if (!journeySpec) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          스펙을 로드하면 상세 정보가 표시됩니다
        </div>
      </div>
    );
  }

  // 화면 선택됨
  if (selectedScreen) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>📱</span>
          <span style={styles.headerTitle}>화면 정보</span>
        </div>

        <div style={styles.content}>
          {/* 기본 정보 */}
          <div style={styles.section}>
            <h3 style={styles.screenName}>{selectedScreen.name}</h3>
            <div style={styles.route}>{selectedScreen.route}</div>
            {selectedScreen.description && (
              <p style={styles.description}>{selectedScreen.description}</p>
            )}
          </div>

          {/* 기능 목록 */}
          {selectedScreen.featureNames.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>구현 기능</div>
              <div style={styles.tagList}>
                {selectedScreen.featureNames.map((name, idx) => (
                  <span key={idx} style={styles.featureTag}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 인터랙션 목록 */}
          {selectedScreen.interactions.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>인터랙션</div>
              <div style={styles.interactionList}>
                {selectedScreen.interactions.map((interaction, idx) => (
                  <div key={idx} style={styles.interactionItem}>
                    <div style={styles.interactionTrigger}>
                      👆 {interaction.trigger}
                    </div>
                    <div style={styles.interactionArrow}>↓</div>
                    <div style={styles.interactionAction}>
                      ⚡ {interaction.action}
                    </div>
                    <div style={styles.interactionFeedback}>
                      💬 {interaction.feedback}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 연결된 화면 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>연결된 화면</div>
            <div style={styles.connections}>
              {/* 이전 화면 */}
              {journeySpec.actions
                .filter((a) => a.to === selectedScreen.id)
                .map((action) => {
                  const fromScreen = journeySpec.screens.find((s) => s.id === action.from);
                  return fromScreen ? (
                    <div key={action.id} style={styles.connectionItem}>
                      <span style={styles.connectionDirection}>← 이전</span>
                      <span style={styles.connectionName}>{fromScreen.name}</span>
                    </div>
                  ) : null;
                })}

              {/* 다음 화면 */}
              {journeySpec.actions
                .filter((a) => a.from === selectedScreen.id)
                .map((action) => {
                  const toScreen = journeySpec.screens.find((s) => s.id === action.to);
                  return toScreen ? (
                    <div key={action.id} style={styles.connectionItem}>
                      <span style={styles.connectionDirection}>→ 다음</span>
                      <span style={styles.connectionName}>{toScreen.name}</span>
                      <span style={styles.connectionAction}>{action.label}</span>
                    </div>
                  ) : null;
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 액션 선택됨
  if (selectedAction) {
    const fromScreen = journeySpec.screens.find((s) => s.id === selectedAction.from);
    const toScreen = journeySpec.screens.find((s) => s.id === selectedAction.to);
    const icon = ACTION_TYPE_ICONS[selectedAction.actionType];
    const typeLabel = ACTION_TYPE_LABELS[selectedAction.actionType];

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>{icon}</span>
          <span style={styles.headerTitle}>액션 정보</span>
        </div>

        <div style={styles.content}>
          {/* 기본 정보 */}
          <div style={styles.section}>
            <div style={styles.actionLabel}>{selectedAction.label}</div>
            <div style={styles.actionType}>
              <span style={styles.actionTypeIcon}>{icon}</span>
              <span>{typeLabel}</span>
            </div>
          </div>

          {/* 흐름 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>플로우</div>
            <div style={styles.flowDiagram}>
              <div style={styles.flowScreen}>
                <span style={styles.flowIcon}>📱</span>
                <span>{fromScreen?.name ?? '시작'}</span>
              </div>
              <div style={styles.flowArrow}>
                <div style={styles.flowLine} />
                <div style={styles.flowActionBadge}>
                  {icon} {selectedAction.label}
                </div>
                <div style={styles.flowLine} />
                <span>▼</span>
              </div>
              <div style={styles.flowScreen}>
                <span style={styles.flowIcon}>📱</span>
                <span>{toScreen?.name ?? '종료'}</span>
              </div>
            </div>
          </div>

          {/* 피드백 */}
          {selectedAction.feedback && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>시스템 반응</div>
              <div style={styles.feedbackBox}>
                💬 {selectedAction.feedback}
              </div>
            </div>
          )}

          {/* 조건 */}
          {selectedAction.condition && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>조건</div>
              <div style={styles.conditionBox}>
                {selectedAction.condition}
              </div>
            </div>
          )}

          {/* 경로 타입 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>경로 타입</div>
            <span
              style={{
                ...styles.pathTypeBadge,
                backgroundColor:
                  selectedAction.pathType === 'happy'
                    ? '#dcfce7'
                    : selectedAction.pathType === 'error'
                      ? '#fee2e2'
                      : '#fef3c7',
                color:
                  selectedAction.pathType === 'happy'
                    ? '#16a34a'
                    : selectedAction.pathType === 'error'
                      ? '#dc2626'
                      : '#d97706',
              }}
            >
              {selectedAction.pathType === 'happy'
                ? '✓ 성공 경로'
                : selectedAction.pathType === 'error'
                  ? '✕ 에러 경로'
                  : '↗ 대체 경로'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 아무것도 선택되지 않음
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>ℹ️</span>
        <span style={styles.headerTitle}>상세 정보</span>
      </div>
      <div style={styles.emptyState}>
        <span style={{ fontSize: 32, marginBottom: 12 }}>👆</span>
        <div>화면이나 액션을 선택하면</div>
        <div>상세 정보가 표시됩니다</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 280,
    height: '100%',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1f2937',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },
  empty: {
    padding: 20,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 8,
  },
  screenName: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
    marginBottom: 4,
  },
  route: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    padding: '4px 8px',
    borderRadius: 4,
    display: 'inline-block',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 12,
    lineHeight: 1.5,
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureTag: {
    fontSize: 11,
    color: '#6366f1',
    backgroundColor: '#eef2ff',
    padding: '4px 10px',
    borderRadius: 12,
  },
  interactionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  interactionItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
  },
  interactionTrigger: {
    color: '#3b82f6',
    fontWeight: 500,
    marginBottom: 4,
  },
  interactionArrow: {
    color: '#cbd5e1',
    textAlign: 'center',
    fontSize: 10,
    margin: '4px 0',
  },
  interactionAction: {
    color: '#8b5cf6',
    marginBottom: 4,
  },
  interactionFeedback: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  connections: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  connectionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    fontSize: 12,
  },
  connectionDirection: {
    color: '#94a3b8',
    fontSize: 10,
    width: 40,
  },
  connectionName: {
    color: '#374151',
    fontWeight: 500,
    flex: 1,
  },
  connectionAction: {
    color: '#64748b',
    fontSize: 10,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: 8,
  },
  actionType: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    color: '#64748b',
  },
  actionTypeIcon: {
    fontSize: 14,
  },
  flowDiagram: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0',
  },
  flowScreen: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    width: '100%',
    justifyContent: 'center',
  },
  flowIcon: {
    fontSize: 16,
  },
  flowArrow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 0',
    color: '#94a3b8',
  },
  flowLine: {
    width: 2,
    height: 12,
    backgroundColor: '#e2e8f0',
  },
  flowActionBadge: {
    backgroundColor: '#dbeafe',
    color: '#3b82f6',
    fontSize: 11,
    padding: '4px 12px',
    borderRadius: 12,
    margin: '8px 0',
    whiteSpace: 'nowrap',
    maxWidth: '90%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  feedbackBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#166534',
  },
  conditionBox: {
    backgroundColor: '#fefce8',
    border: '1px solid #fef08a',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#854d0e',
  },
  pathTypeBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 500,
  },
};
