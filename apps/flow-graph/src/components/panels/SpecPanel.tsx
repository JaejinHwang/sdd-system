import { useSyncStore, useGraphStore } from '@/stores';
import type { Feature, Screen } from '@/types';

export default function SpecPanel() {
  const { functionalSpec, uiSpec } = useSyncStore();
  const { happyPaths, errorPaths, activeHappyPath, activeErrorPath, setActiveHappyPath, setActiveErrorPath } =
    useGraphStore();

  const features = functionalSpec?.functional_spec?.features ?? [];
  const screens = uiSpec?.ui_spec?.screens ?? [];

  return (
    <div
      style={{
        width: 260,
        height: '100%',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
        스펙 탐색기
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Paths Section */}
        <Section title="경로">
          <SubSection title="Happy Paths" color="#22c55e">
            {happyPaths.map((path) => (
              <PathItem
                key={path.id}
                name={path.name}
                isActive={activeHappyPath === path.id}
                onClick={() =>
                  setActiveHappyPath(activeHappyPath === path.id ? null : path.id)
                }
                color="#22c55e"
              />
            ))}
            {happyPaths.length === 0 && <EmptyMessage>정의된 경로 없음</EmptyMessage>}
          </SubSection>
          <SubSection title="Error Paths" color="#ef4444">
            {errorPaths.map((path) => (
              <PathItem
                key={path.id}
                name={path.name}
                isActive={activeErrorPath === path.id}
                onClick={() =>
                  setActiveErrorPath(activeErrorPath === path.id ? null : path.id)
                }
                color="#ef4444"
              />
            ))}
            {errorPaths.length === 0 && <EmptyMessage>정의된 경로 없음</EmptyMessage>}
          </SubSection>
        </Section>

        {/* Features Section */}
        <Section title="Features">
          {features.map((feature) => (
            <FeatureItem key={feature.id} feature={feature} />
          ))}
          {features.length === 0 && <EmptyMessage>기능이 없습니다</EmptyMessage>}
        </Section>

        {/* Screens Section */}
        <Section title="Screens">
          {screens.map((screen) => (
            <ScreenItem key={screen.id} screen={screen} />
          ))}
          {screens.length === 0 && <EmptyMessage>화면이 없습니다</EmptyMessage>}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #e5e7eb' }}>
      <div
        style={{
          padding: '10px 16px',
          fontSize: 12,
          fontWeight: 600,
          color: '#6b7280',
          textTransform: 'uppercase',
          backgroundColor: '#f9fafb',
        }}
      >
        {title}
      </div>
      <div style={{ padding: '8px 0' }}>{children}</div>
    </div>
  );
}

function SubSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          padding: '4px 16px',
          fontSize: 11,
          color,
          fontWeight: 500,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function PathItem({
  name,
  isActive,
  onClick,
  color,
}: {
  name: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 16px',
        fontSize: 12,
        color: isActive ? color : '#374151',
        backgroundColor: isActive ? `${color}10` : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ color }}>{isActive ? '●' : '○'}</span>
      {name}
    </div>
  );
}

function FeatureItem({ feature }: { feature: Feature }) {
  return (
    <div style={{ padding: '6px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>{feature.id}</span>
        <span style={{ fontSize: 12, color: '#1f2937' }}>{feature.name}</span>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
        {feature.states.length} states
      </div>
    </div>
  );
}

function ScreenItem({ screen }: { screen: Screen }) {
  return (
    <div style={{ padding: '6px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12 }}>📱</span>
        <span style={{ fontSize: 12, color: '#1f2937' }}>{screen.name}</span>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
        {screen.route}
      </div>
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 16px', fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
      {children}
    </div>
  );
}
