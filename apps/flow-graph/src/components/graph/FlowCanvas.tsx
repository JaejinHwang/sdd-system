import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore, useSyncStore } from '@/stores';
import { transformSpecsToGraph } from '@/services';
import { StateNode, ScreenNode } from './nodes';
import { TransitionEdge } from './edges';

const nodeTypes = {
  state: StateNode,
  screen: ScreenNode,
};

const edgeTypes = {
  transition: TransitionEdge,
};

// Arrow markers for edges
function EdgeMarkers() {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <marker
          id="arrow-happy"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
        </marker>
        <marker
          id="arrow-error"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
        <marker
          id="arrow-alternative"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
        </marker>
      </defs>
    </svg>
  );
}

export default function FlowCanvas() {
  const { fitView } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodes,
    setSelectedEdges,
    setGraphData,
    setHappyPaths,
    setErrorPaths,
    hasUnsavedChanges,
  } = useGraphStore();

  const {
    functionalSpec,
    uiSpec,
    flowGraph,
    isLoading,
    loadSpecs,
    syncToYaml,
    specsPath,
  } = useSyncStore();

  // 스펙 로드 후 그래프 변환
  useEffect(() => {
    if (functionalSpec || uiSpec) {
      const result = transformSpecsToGraph(functionalSpec, uiSpec, flowGraph);
      setGraphData(result.nodes, result.edges);
      setHappyPaths(result.paths.happyPaths);
      setErrorPaths(result.paths.errorPaths);

      // 초기 로드 시 뷰 맞추기
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [functionalSpec, uiSpec, flowGraph, setGraphData, setHappyPaths, setErrorPaths, fitView]);

  // 초기 스펙 로드
  useEffect(() => {
    if (specsPath && !functionalSpec && !isLoading) {
      loadSpecs();
    }
  }, [specsPath, functionalSpec, isLoading, loadSpecs]);

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      setSelectedNodes(selectedNodes.map((n) => n.id));
      setSelectedEdges(selectedEdges.map((e) => e.id));
    },
    [setSelectedNodes, setSelectedEdges]
  );

  const handleSave = useCallback(async () => {
    await syncToYaml();
  }, [syncToYaml]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'transition',
      animated: false,
    }),
    []
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6b7280',
        }}
      >
        스펙 파일 로딩 중...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <EdgeMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[10, 10]}
        connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2 }}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background gap={20} size={1} color="#e5e7eb" />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            if (node.type === 'screen') return '#dbeafe';
            if (node.type === 'state') {
              const stateType = (node.data as { stateType?: string })?.stateType;
              if (stateType === 'error') return '#fee2e2';
              if (stateType === 'final') return '#dcfce7';
              if (stateType === 'initial') return '#dbeafe';
            }
            return '#f3f4f6';
          }}
          style={{ borderRadius: 8 }}
        />

        {/* 상태 표시 패널 */}
        <Panel position="top-right">
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              backgroundColor: '#ffffff',
              padding: '8px 12px',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {hasUnsavedChanges && (
              <span style={{ color: '#f59e0b', fontSize: 12 }}>
                ● 저장되지 않은 변경
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              style={{
                backgroundColor: hasUnsavedChanges ? '#3b82f6' : '#e5e7eb',
                color: hasUnsavedChanges ? '#ffffff' : '#9ca3af',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                cursor: hasUnsavedChanges ? 'pointer' : 'default',
              }}
            >
              저장 (⌘S)
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
