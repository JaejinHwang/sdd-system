import { useGraphStore } from '@/stores';
import type { FlowNode, FlowEdge, StateNodeProps, ScreenNodeProps, TransitionEdgeProps } from '@/types';

export default function PropertyPanel() {
  const { nodes, edges, selectedNodes, selectedEdges } = useGraphStore();

  const selectedNode = selectedNodes.length === 1 ? nodes.find((n) => n.id === selectedNodes[0]) : null;
  const selectedEdge = selectedEdges.length === 1 ? edges.find((e) => e.id === selectedEdges[0]) : null;

  if (!selectedNode && !selectedEdge) {
    return (
      <div
        style={{
          width: 280,
          height: '100%',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 13,
        }}
      >
        요소를 선택하세요
      </div>
    );
  }

  return (
    <div
      style={{
        width: 280,
        height: '100%',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e5e7eb',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          fontWeight: 600,
          fontSize: 14,
          color: '#1f2937',
        }}
      >
        속성
      </div>

      {selectedNode && <NodeProperties node={selectedNode} />}
      {selectedEdge && <EdgeProperties edge={selectedEdge} />}
    </div>
  );
}

function NodeProperties({ node }: { node: FlowNode }) {
  if (node.type === 'state') {
    return <StateProperties data={node.data as StateNodeProps} />;
  }
  if (node.type === 'screen') {
    return <ScreenProperties data={node.data as ScreenNodeProps} />;
  }
  return null;
}

function StateProperties({ data }: { data: StateNodeProps }) {
  return (
    <div style={{ padding: 16 }}>
      <PropertyGroup title="기본 정보">
        <PropertyRow label="이름" value={data.label} />
        <PropertyRow label="설명" value={data.description || '-'} />
        <PropertyRow label="Feature" value={data.featureId} />
        <PropertyRow label="타입" value={getStateTypeLabel(data.stateType)} />
      </PropertyGroup>

      <PropertyGroup title="경로">
        <PropertyRow label="Happy Path" value={data.onHappyPath ? '예' : '아니오'} />
        <PropertyRow label="하이라이트" value={data.isHighlighted ? '활성' : '비활성'} />
      </PropertyGroup>

      <PropertyGroup title="참조">
        <PropertyRow label="소스" value={data.sourceRef} mono />
      </PropertyGroup>
    </div>
  );
}

function ScreenProperties({ data }: { data: ScreenNodeProps }) {
  return (
    <div style={{ padding: 16 }}>
      <PropertyGroup title="기본 정보">
        <PropertyRow label="이름" value={data.label} />
        <PropertyRow label="경로" value={data.route} />
        <PropertyRow label="테마" value={data.colorTheme} />
      </PropertyGroup>

      <PropertyGroup title="구현 기능">
        {data.implementsFeatures.map((f) => (
          <div key={f} style={{ fontSize: 12, color: '#3b82f6', marginBottom: 4 }}>
            {f}
          </div>
        ))}
      </PropertyGroup>

      <PropertyGroup title="참조">
        <PropertyRow label="소스" value={data.sourceRef} mono />
      </PropertyGroup>
    </div>
  );
}

function EdgeProperties({ edge }: { edge: FlowEdge }) {
  if (edge.type === 'transition') {
    const data = edge.data as TransitionEdgeProps | undefined;
    return (
      <div style={{ padding: 16 }}>
        <PropertyGroup title="전이 정보">
          <PropertyRow label="트리거" value={data?.trigger ?? '-'} />
          <PropertyRow label="조건" value={data?.condition ?? '없음'} />
          <PropertyRow label="경로 타입" value={getPathTypeLabel(data?.pathType ?? 'happy')} />
        </PropertyGroup>

        <PropertyGroup title="연결">
          <PropertyRow label="시작" value={edge.source} mono />
          <PropertyRow label="도착" value={edge.target} mono />
        </PropertyGroup>

        <PropertyGroup title="참조">
          <PropertyRow label="소스" value={data?.sourceRef ?? '-'} mono />
        </PropertyGroup>
      </div>
    );
  }
  return null;
}

function PropertyGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#6b7280',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function PropertyRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', marginBottom: 6 }}>
      <div style={{ width: 80, fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div
        style={{
          flex: 1,
          fontSize: 12,
          color: '#1f2937',
          fontFamily: mono ? 'monospace' : 'inherit',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function getStateTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    initial: '초기 상태',
    normal: '일반 상태',
    final: '종료 상태',
    error: '에러 상태',
  };
  return labels[type] ?? type;
}

function getPathTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    happy: 'Happy Path',
    error: 'Error Path',
    alternative: 'Alternative',
  };
  return labels[type] ?? type;
}
