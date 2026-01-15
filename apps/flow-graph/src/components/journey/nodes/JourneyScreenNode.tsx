import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { JourneyScreen } from '@/types/journey';

type JourneyScreenNodeType = Node<JourneyScreen & {
  isHighlighted?: boolean;
  isActive?: boolean;
  isOnPath?: boolean;
  highlightColor?: string;
}>;

function JourneyScreenNode({ data, selected }: NodeProps<JourneyScreenNodeType>) {
  const isHighlighted = data.isHighlighted ?? false;
  const isActive = data.isActive ?? false;
  const isOnPath = data.isOnPath ?? true;
  const highlightColor = data.highlightColor ?? '#22c55e';

  // 에러 화면 스타일
  const isError = data.isErrorScreen;
  const baseColor = isError ? '#fee2e2' : '#f8fafc';
  const borderColor = isError ? '#ef4444' : isActive ? '#3b82f6' : selected ? '#2563eb' : '#e2e8f0';

  // 경로에 없는 화면은 흐리게
  const opacity = isOnPath ? 1 : 0.4;

  return (
    <div
      style={{
        opacity,
        backgroundColor: baseColor,
        borderColor,
        borderWidth: isActive ? 3 : selected ? 2 : 1,
        borderStyle: 'solid',
        borderRadius: 12,
        width: 200,
        overflow: 'hidden',
        boxShadow: isActive
          ? `0 0 0 4px ${highlightColor}40, 0 4px 12px rgba(0,0,0,0.15)`
          : isHighlighted
            ? `0 0 0 3px ${highlightColor}60`
            : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: borderColor,
          width: 10,
          height: 10,
          border: '2px solid white',
        }}
      />

      {/* 썸네일 영역 */}
      <div
        style={{
          height: 80,
          backgroundColor: isError ? '#fecaca' : '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${borderColor}`,
          position: 'relative',
        }}
      >
        {data.thumbnail ? (
          <img
            src={data.thumbnail}
            alt={data.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: 32, color: isError ? '#ef4444' : '#94a3b8' }}>
            {isError ? '⚠️' : '📱'}
          </span>
        )}

        {/* 순서 번호 뱃지 */}
        {typeof data.order === 'number' && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: isActive ? highlightColor : '#3b82f6',
              color: 'white',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {data.order + 1}
          </div>
        )}
      </div>

      {/* 화면 정보 */}
      <div style={{ padding: '12px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: '#1f2937',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#64748b',
            fontFamily: 'monospace',
            backgroundColor: '#f1f5f9',
            padding: '2px 6px',
            borderRadius: 4,
            display: 'inline-block',
          }}
        >
          {data.route}
        </div>

        {/* 기능 태그 */}
        {data.featureNames && data.featureNames.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {data.featureNames.slice(0, 2).map((name, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 10,
                  color: '#6366f1',
                  backgroundColor: '#eef2ff',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {name}
              </span>
            ))}
            {data.featureNames.length > 2 && (
              <span
                style={{
                  fontSize: 10,
                  color: '#64748b',
                }}
              >
                +{data.featureNames.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: borderColor,
          width: 10,
          height: 10,
          border: '2px solid white',
        }}
      />
    </div>
  );
}

export default memo(JourneyScreenNode);
