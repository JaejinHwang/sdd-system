import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useJourneyStore } from '@/stores/journeyStore';
import { useSyncStore } from '@/stores';
import { transformSpecsToJourney, transformJourneyToReactFlow } from '@/services/journeyTransformer';
import JourneyScreenNode from './nodes/JourneyScreenNode';
import JourneyActionEdge from './edges/JourneyActionEdge';

const nodeTypes = {
  journeyScreen: JourneyScreenNode,
};

const edgeTypes = {
  journeyAction: JourneyActionEdge,
};

// Journey용 Arrow markers
function JourneyEdgeMarkers() {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
      <defs>
        <marker
          id="journey-arrow-happy"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
        </marker>
        <marker
          id="journey-arrow-error"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
        <marker
          id="journey-arrow-alternative"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
        </marker>
      </defs>
    </svg>
  );
}

export default function JourneyCanvas() {
  const { fitView } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    selectScreen,
    selectAction,
    setJourneySpec,
    setGraphData,
    setViewport,
    isLoading: journeyLoading,
  } = useJourneyStore();

  const {
    functionalSpec,
    uiSpec,
    flowGraph,
    isLoading: specsLoading,
    loadSpecs,
    specsPath,
  } = useSyncStore();

  const isLoading = journeyLoading || specsLoading;

  // 스펙 로드 후 Journey 변환
  useEffect(() => {
    if (functionalSpec || uiSpec) {
      console.log('[JourneyCanvas] Transforming specs to journey...', {
        hasUiSpec: !!uiSpec,
        hasFunctionalSpec: !!functionalSpec,
        hasFlowGraph: !!flowGraph,
        screensCount: uiSpec?.ui_spec?.screens?.length ?? 0,
      });

      const journeySpec = transformSpecsToJourney(functionalSpec, uiSpec, flowGraph);
      console.log('[JourneyCanvas] Journey spec created:', {
        screens: journeySpec.screens.length,
        actions: journeySpec.actions.length,
        paths: journeySpec.paths.length,
        screenIds: journeySpec.screens.map(s => s.id),
      });

      setJourneySpec(journeySpec);

      const { nodes: flowNodes, edges: flowEdges } = transformJourneyToReactFlow(journeySpec);
      console.log('[JourneyCanvas] React Flow data created:', {
        nodesCount: flowNodes.length,
        edgesCount: flowEdges.length,
        nodeTypes: flowNodes.map(n => n.type),
        nodeIds: flowNodes.map(n => n.id),
      });

      setGraphData(flowNodes, flowEdges);

      // 초기 로드 시 뷰 맞추기
      setTimeout(() => fitView({ padding: 0.3 }), 100);
    }
  }, [functionalSpec, uiSpec, flowGraph, setJourneySpec, setGraphData, fitView]);

  // 초기 스펙 로드
  useEffect(() => {
    if (specsPath && !functionalSpec && !specsLoading) {
      loadSpecs();
    }
  }, [specsPath, functionalSpec, specsLoading, loadSpecs]);

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      if (selectedNodes.length > 0) {
        selectScreen(selectedNodes[0].id);
      } else if (selectedEdges.length > 0) {
        selectAction(selectedEdges[0].id);
      } else {
        selectScreen(null);
        selectAction(null);
      }
    },
    [selectScreen, selectAction]
  );

  const handleViewportChange = useCallback(
    (viewport: { x: number; y: number; zoom: number }) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'journeyAction',
    }),
    []
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#64748b',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
        <span>사용자 여정 로딩 중...</span>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#64748b',
          gap: 16,
          padding: 40,
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 48 }}>📱</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
            화면 정보가 없습니다
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8', maxWidth: 400 }}>
            ui-spec.yaml 파일에 화면(screens) 정보를 추가하면
            사용자 여정 플로우차트가 자동으로 생성됩니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <JourneyEdgeMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onViewportChange={handleViewportChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        nodesDraggable={false} // Journey에서는 드래그 비활성화
        nodesConnectable={false} // 연결 비활성화
        elementsSelectable={true}
        panOnScroll
        zoomOnScroll
        minZoom={0.3}
        maxZoom={2}
      >
        <Background gap={30} size={1} color="#f1f5f9" />
        <Controls
          position="bottom-left"
          showInteractive={false}
          style={{
            backgroundColor: 'white',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            const data = node.data as { isErrorScreen?: boolean };
            return data?.isErrorScreen ? '#fee2e2' : '#dbeafe';
          }}
          maskColor="rgba(0,0,0,0.05)"
          style={{
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}
        />
      </ReactFlow>
    </div>
  );
}
