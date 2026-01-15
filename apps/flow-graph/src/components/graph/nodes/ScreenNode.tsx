import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ScreenNodeType } from '@/types';

const themeStyles: Record<string, { bg: string; border: string; header: string }> = {
  default: { bg: '#ffffff', border: '#e5e7eb', header: '#f9fafb' },
  primary: { bg: '#eff6ff', border: '#3b82f6', header: '#dbeafe' },
  success: { bg: '#f0fdf4', border: '#22c55e', header: '#dcfce7' },
  error: { bg: '#fef2f2', border: '#ef4444', header: '#fee2e2' },
  warning: { bg: '#fffbeb', border: '#f59e0b', header: '#fef3c7' },
};

function ScreenNode({ data, selected }: NodeProps<ScreenNodeType>) {
  const style = themeStyles[data.colorTheme as string] ?? themeStyles.default;

  return (
    <div
      style={{
        backgroundColor: style.bg,
        borderColor: selected ? '#2563eb' : style.border,
        borderWidth: selected ? 2 : 1,
        borderStyle: 'solid',
        borderRadius: 12,
        minWidth: 280,
        minHeight: 180,
        overflow: 'hidden',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: style.border, left: -4 }}
      />

      {/* Header */}
      <div
        style={{
          backgroundColor: style.header,
          padding: '10px 14px',
          borderBottom: `1px solid ${style.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📱</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>
              {data.label}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              {data.route}
            </div>
          </div>
        </div>
      </div>

      {/* Content area for child nodes */}
      <div
        style={{
          padding: 12,
          minHeight: 120,
        }}
      >
        {(data.implementsFeatures as string[]).length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(data.implementsFeatures as string[]).map((featureId: string) => (
              <span
                key={featureId}
                style={{
                  fontSize: 10,
                  backgroundColor: '#e5e7eb',
                  color: '#4b5563',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {featureId}
              </span>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: style.border, right: -4 }}
      />
    </div>
  );
}

export default memo(ScreenNode);
