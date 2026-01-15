import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import chokidar from 'chokidar';

const app = express();
const PORT = process.env.PORT || 3334;

app.use(cors());
app.use(express.json());

// 활성 클라이언트 목록
const clients = new Set<WebSocket>();

// 파일 워처 인스턴스
let watcher: chokidar.FSWatcher | null = null;

/**
 * 스펙 파일 로드
 */
app.get('/api/specs', async (req, res) => {
  try {
    const specsPath = req.query.path as string;
    if (!specsPath) {
      return res.status(400).json({ error: 'path 파라미터가 필요합니다' });
    }

    const specDir = path.join(specsPath, '02-specification');

    // 파일 경로들
    const functionalSpecPath = path.join(specDir, 'functional-spec.yaml');
    const uiSpecPath = path.join(specDir, 'ui-spec.yaml');
    const flowGraphPath = path.join(specDir, 'flow-graph.yaml');

    // 파일 읽기
    const [functionalSpec, uiSpec, flowGraph] = await Promise.all([
      readYamlFile(functionalSpecPath),
      readYamlFile(uiSpecPath),
      readYamlFile(flowGraphPath),
    ]);

    // 파일 워처 설정
    setupWatcher(specsPath);

    res.json({
      functionalSpec,
      uiSpec,
      flowGraph,
    });
  } catch (error) {
    console.error('스펙 로드 에러:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '스펙 로드 실패',
    });
  }
});

/**
 * 그래프 동기화 (저장)
 */
app.post('/api/specs/sync', async (req, res) => {
  try {
    const { path: specsPath, nodes, edges, viewport, happyPaths, errorPaths } = req.body;

    if (!specsPath) {
      return res.status(400).json({ error: 'path가 필요합니다' });
    }

    const specDir = path.join(specsPath, '02-specification');
    const flowGraphPath = path.join(specDir, 'flow-graph.yaml');

    // flow-graph.yaml 생성
    const flowGraphData = generateFlowGraphYaml(nodes, edges, viewport, happyPaths, errorPaths);

    // 파일 저장
    await fs.writeFile(flowGraphPath, yaml.stringify(flowGraphData), 'utf-8');

    // 구조적 변경이 있으면 원본 스펙도 업데이트
    const structuralChanges = detectStructuralChanges(nodes, edges);

    if (structuralChanges.hasChanges) {
      // 향후 구현: functional-spec.yaml, ui-spec.yaml 업데이트
      console.log('구조적 변경 감지:', structuralChanges);
    }

    res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('동기화 에러:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '동기화 실패',
    });
  }
});

/**
 * YAML 파일 읽기 헬퍼
 */
async function readYamlFile(filePath: string): Promise<unknown | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.parse(content);
  } catch {
    return null;
  }
}

/**
 * 파일 워처 설정
 */
function setupWatcher(specsPath: string) {
  // 기존 워처 정리
  if (watcher) {
    watcher.close();
  }

  const watchPath = path.join(specsPath, '02-specification');

  watcher = chokidar.watch(watchPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', (filePath) => {
    console.log(`파일 변경 감지: ${filePath}`);
    // 모든 클라이언트에 알림
    const message = JSON.stringify({
      type: 'file_changed',
      file: filePath,
      timestamp: new Date().toISOString(),
    });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}

/**
 * flow-graph.yaml 데이터 생성
 */
function generateFlowGraphYaml(
  nodes: unknown[],
  edges: unknown[],
  viewport: { x: number; y: number; zoom: number },
  happyPaths: unknown[],
  errorPaths: unknown[]
) {
  const now = new Date().toISOString();

  return {
    flow_graph: {
      metadata: {
        version: '1.0.0',
        created_at: now,
        last_modified: now,
        source_hashes: {
          functional_spec: '',
          ui_spec: '',
        },
        layout: {
          type: 'hierarchical',
          direction: 'TB',
          spacing: {
            node_x: 200,
            node_y: 150,
            group_padding: 40,
          },
        },
      },
      nodes: transformNodesToYaml(nodes),
      edges: transformEdgesToYaml(edges),
      paths: {
        happy_paths: happyPaths,
        error_paths: errorPaths,
      },
      viewport: {
        zoom: viewport.zoom,
        pan: { x: viewport.x, y: viewport.y },
        selection: [],
        expanded_groups: [],
      },
    },
    sync: {
      last_sync: now,
      conflict_resolution: 'manual',
      manual_nodes: [],
      history: [
        {
          timestamp: now,
          action: 'save',
          changes: [],
        },
      ],
    },
  };
}

/**
 * 노드를 YAML 형식으로 변환
 */
function transformNodesToYaml(nodes: unknown[]) {
  const screens: unknown[] = [];
  const states: unknown[] = [];

  (nodes as { type: string; id: string; position: { x: number; y: number }; data: Record<string, unknown> }[]).forEach((node) => {
    if (node.type === 'screen') {
      screens.push({
        id: node.id,
        source_ref: node.data.sourceRef,
        label: node.data.label,
        route: node.data.route,
        position: node.position,
        size: { width: 300, height: 200 },
        contains_states: [],
        style: {
          expanded: node.data.expanded ?? true,
          color_theme: node.data.colorTheme ?? 'default',
        },
      });
    } else if (node.type === 'state') {
      states.push({
        id: node.id,
        source_ref: node.data.sourceRef,
        feature_id: node.data.featureId,
        label: node.data.label,
        description: node.data.description,
        position: node.position,
        type: node.data.stateType,
        parent_screen: null,
        on_happy_path: node.data.onHappyPath ?? true,
      });
    }
  });

  return { screens, states, feature_groups: [] };
}

/**
 * 엣지를 YAML 형식으로 변환
 */
function transformEdgesToYaml(edges: unknown[]) {
  const transitions: unknown[] = [];

  (edges as { type: string; id: string; source: string; target: string; data?: Record<string, unknown> }[]).forEach((edge) => {
    if (edge.type === 'transition') {
      transitions.push({
        id: edge.id,
        source_ref: edge.data?.sourceRef ?? '',
        source_node: edge.source,
        target_node: edge.target,
        label: edge.data?.trigger ?? '',
        trigger: edge.data?.trigger ?? '',
        condition: edge.data?.condition ?? null,
        path_type: edge.data?.pathType ?? 'happy',
        style: {
          animated: false,
          stroke_style: 'solid',
        },
      });
    }
  });

  return { transitions, navigations: [], dependencies: [] };
}

/**
 * 구조적 변경 감지
 */
function detectStructuralChanges(_nodes: unknown[], _edges: unknown[]) {
  // 향후 구현: 새 상태, 새 전이 등 감지
  return {
    hasChanges: false,
    newStates: [],
    newTransitions: [],
    deletedStates: [],
    deletedTransitions: [],
  };
}

// HTTP 서버 생성
const server = createServer(app);

// WebSocket 서버 생성
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('클라이언트 연결됨');
  clients.add(ws);

  ws.on('close', () => {
    console.log('클라이언트 연결 해제');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket 에러:', error);
    clients.delete(ws);
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 Flow Graph API 서버 시작: http://localhost:${PORT}`);
});

// 종료 처리
process.on('SIGINT', () => {
  console.log('\n서버 종료 중...');
  if (watcher) {
    watcher.close();
  }
  server.close();
  process.exit(0);
});
