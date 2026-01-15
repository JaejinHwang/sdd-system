import { useGraphStore, useSyncStore } from '@/stores';

export default function Toolbar() {
  const { hasUnsavedChanges } = useGraphStore();
  const { specsPath, isLoading, isSyncing, lastSyncTime, loadSpecs, syncToYaml, error } = useSyncStore();

  const handleRefresh = async () => {
    await loadSpecs();
  };

  const handleSave = async () => {
    await syncToYaml();
  };

  return (
    <div
      style={{
        height: 48,
        backgroundColor: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        color: '#ffffff',
      }}
    >
      {/* Left: Logo and project path */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🔀</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>SDD Flow Graph</span>
        </div>
        {specsPath && (
          <div
            style={{
              fontSize: 12,
              color: '#9ca3af',
              backgroundColor: '#374151',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            {specsPath}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Status */}
        {error && (
          <div style={{ fontSize: 12, color: '#f87171' }}>
            ⚠ {error}
          </div>
        )}
        {lastSyncTime && !error && (
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            마지막 동기화: {lastSyncTime.toLocaleTimeString()}
          </div>
        )}
        {hasUnsavedChanges && (
          <div style={{ fontSize: 12, color: '#fbbf24' }}>
            ● 저장되지 않은 변경
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #4b5563',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#e5e7eb',
            fontSize: 12,
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>🔄</span>
          {isLoading ? '로딩...' : '새로고침'}
        </button>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSyncing}
          style={{
            backgroundColor: hasUnsavedChanges ? '#3b82f6' : '#4b5563',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#ffffff',
            fontSize: 12,
            cursor: hasUnsavedChanges && !isSyncing ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>💾</span>
          {isSyncing ? '저장 중...' : '저장 (⌘S)'}
        </button>
      </div>
    </div>
  );
}
