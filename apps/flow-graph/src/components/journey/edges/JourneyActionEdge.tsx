import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';
import type { JourneyAction, JourneyPathType } from '@/types/journey';
import { ACTION_TYPE_ICONS, PATH_TYPE_COLORS } from '@/types/journey';

type JourneyActionEdgeType = Edge<JourneyAction & {
  isHighlighted?: boolean;
  isActive?: boolean;
  isOnPath?: boolean;
  highlightColor?: string;
}>;

const pathTypeStyles: Record<JourneyPathType, { stroke: string; dash?: string }> = {
  happy: { stroke: PATH_TYPE_COLORS.happy },
  error: { stroke: PATH_TYPE_COLORS.error, dash: '8,4' },
  alternative: { stroke: PATH_TYPE_COLORS.alternative, dash: '4,4' },
};

function JourneyActionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<JourneyActionEdgeType>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const isHighlighted = data?.isHighlighted ?? false;
  const isActive = data?.isActive ?? false;
  const isOnPath = data?.isOnPath ?? true;
  const pathType = data?.pathType ?? 'happy';
  const highlightColor = data?.highlightColor ?? pathTypeStyles[pathType].stroke;

  // 경로에 없는 액션은 흐리게
  const opacity = isOnPath ? 1 : 0.3;

  // 스타일 계산
  const strokeColor = isActive
    ? highlightColor
    : isHighlighted
      ? highlightColor
      : selected
        ? '#2563eb'
        : '#94a3b8';

  const strokeWidth = isActive ? 4 : isHighlighted ? 3 : selected ? 2 : 1.5;
  const strokeDasharray = pathType === 'error' ? '8,4' : pathType === 'alternative' ? '4,4' : undefined;

  // 액션 타입 아이콘
  const actionIcon = data?.actionType ? ACTION_TYPE_ICONS[data.actionType] : '👆';

  return (
    <>
      {/* 활성화 시 배경 글로우 */}
      {isActive && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: highlightColor,
            strokeWidth: 12,
            opacity: 0.3,
            filter: 'blur(4px)',
          }}
        />
      )}

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          opacity,
          transition: 'all 0.3s ease',
        }}
        markerEnd={`url(#journey-arrow-${pathType})`}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            opacity,
          }}
          className="nodrag nopan"
        >
          <div
            style={{
              backgroundColor: isActive ? highlightColor : '#ffffff',
              border: `2px solid ${strokeColor}`,
              borderRadius: 20,
              padding: '6px 12px',
              fontSize: 12,
              color: isActive ? '#ffffff' : '#374151',
              whiteSpace: 'nowrap',
              boxShadow: isActive
                ? `0 4px 12px ${highlightColor}40`
                : '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.3s ease',
              maxWidth: 200,
            }}
          >
            <span style={{ fontSize: 14 }}>{actionIcon}</span>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: 500,
              }}
            >
              {data?.label ?? '액션'}
            </span>
          </div>

          {/* 피드백 툴팁 (호버 시 표시될 수 있도록) */}
          {data?.feedback && (
            <div
              style={{
                marginTop: 4,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 10,
                color: '#64748b',
                maxWidth: 180,
                textAlign: 'center',
                opacity: isActive || selected ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            >
              {data.feedback}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(JourneyActionEdge);
