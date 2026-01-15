import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import type { TransitionEdgeType, TransitionEdgeProps } from '@/types';

const pathTypeColors: Record<string, string> = {
  happy: '#22c55e',
  error: '#ef4444',
  alternative: '#f59e0b',
};

function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<TransitionEdgeType>) {
  const edgeData = data as TransitionEdgeProps | undefined;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  const pathColor = edgeData?.isHighlighted
    ? (edgeData.highlightColor as string) ?? pathTypeColors[(edgeData.pathType as string) ?? 'happy']
    : selected
      ? '#2563eb'
      : '#9ca3af';

  const strokeWidth = edgeData?.isHighlighted ? 3 : selected ? 2 : 1.5;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: pathColor,
          strokeWidth,
          ...(edgeData?.pathType === 'error' && { strokeDasharray: '5,5' }),
        }}
        markerEnd={`url(#arrow-${(edgeData?.pathType as string) ?? 'happy'})`}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${pathColor}`,
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 10,
              color: '#374151',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {(edgeData?.trigger as string) ?? ''}
            {edgeData?.condition && (
              <span style={{ color: '#9ca3af', marginLeft: 4 }}>
                [{edgeData.condition as string}]
              </span>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(TransitionEdge);
