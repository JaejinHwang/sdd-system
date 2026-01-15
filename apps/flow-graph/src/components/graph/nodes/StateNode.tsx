import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StateNodeType } from '@/types';

const stateTypeStyles: Record<string, { bg: string; border: string; icon: string }> = {
  initial: { bg: '#dbeafe', border: '#3b82f6', icon: '▶' },
  normal: { bg: '#f3f4f6', border: '#6b7280', icon: '○' },
  final: { bg: '#dcfce7', border: '#22c55e', icon: '◆' },
  error: { bg: '#fee2e2', border: '#ef4444', icon: '✕' },
};

function StateNode({ data, selected }: NodeProps<StateNodeType>) {
  const style = stateTypeStyles[data.stateType as string] ?? stateTypeStyles.normal;
  const highlightStyle = data.isHighlighted
    ? { boxShadow: `0 0 0 3px ${data.highlightColor ?? '#22c55e'}` }
    : {};

  return (
    <div
      style={{
        backgroundColor: style.bg,
        borderColor: selected ? '#2563eb' : style.border,
        borderWidth: selected ? 2 : 1,
        borderStyle: 'solid',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 120,
        ...highlightStyle,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: style.border }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: style.border }}>{style.icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>
            {data.label}
          </div>
          {data.description && (
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              {data.description}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          fontSize: 10,
          color: '#9ca3af',
          marginTop: 4,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{data.featureId}</span>
        {data.onHappyPath && (
          <span style={{ color: '#22c55e' }}>● Happy</span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: style.border }}
      />
    </div>
  );
}

export default memo(StateNode);
