import { spawn, type ChildProcess, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { platform } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dist 빌드 버전과 소스 버전 모두 대응
const SYSTEM_ROOT = __dirname.includes('/dist/')
  ? path.resolve(__dirname, '../../../..')
  : path.resolve(__dirname, '../../..');

interface FlowOptions {
  port?: string;
  open?: boolean;
  view?: 'engineer' | 'journey';
}

export async function flowCommand(options: FlowOptions) {
  const port = options.port ?? '3333';
  const apiPort = String(parseInt(port) + 1);
  const viewMode = options.view ?? 'engineer';
  const projectPath = process.cwd();

  // 1. SDD 프로젝트 확인
  const specsDir = path.join(projectPath, 'specs');
  try {
    await fs.access(specsDir);
  } catch {
    console.error(chalk.red('❌ SDD 프로젝트가 아닙니다.'));
    console.log(chalk.gray('   specs/ 폴더가 있는 프로젝트 루트에서 실행하세요.'));
    console.log(chalk.gray(`   현재 경로: ${projectPath}`));
    process.exit(1);
  }

  // 2. flow-graph 앱 경로 확인
  const flowGraphAppPath = path.join(SYSTEM_ROOT, 'apps', 'flow-graph');
  try {
    await fs.access(flowGraphAppPath);
  } catch {
    console.error(chalk.red('❌ Flow Graph 앱을 찾을 수 없습니다.'));
    console.log(chalk.gray(`   경로: ${flowGraphAppPath}`));
    console.log(chalk.gray('   npm install을 실행해주세요.'));
    process.exit(1);
  }

  // 3. node_modules 확인 및 설치
  const nodeModulesPath = path.join(flowGraphAppPath, 'node_modules');
  try {
    await fs.access(nodeModulesPath);
  } catch {
    console.log(chalk.yellow('📦 의존성 설치 중...'));
    await runCommand('npm', ['install'], flowGraphAppPath);
  }

  const viewLabel = viewMode === 'journey' ? 'Journey Map (기획자용)' : 'Flow Graph (엔지니어용)';
  console.log(chalk.cyan(`\n🎯 ${viewLabel} 시작 중...\n`));
  console.log(chalk.gray(`   프로젝트: ${projectPath}`));
  console.log(chalk.gray(`   스펙 경로: ${specsDir}`));
  console.log(chalk.gray(`   뷰 모드: ${viewMode}`));
  console.log(chalk.gray(`   UI 포트: ${port}`));
  console.log(chalk.gray(`   API 포트: ${apiPort}\n`));

  // 4. API 서버 시작
  const apiServer = spawn('npx', ['tsx', 'server/index.ts'], {
    cwd: flowGraphAppPath,
    env: {
      ...process.env,
      PORT: apiPort,
      SPECS_PATH: specsDir,
    },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  apiServer.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(chalk.gray(`[API] ${output}`));
    }
  });

  apiServer.stderr?.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('ExperimentalWarning')) {
      console.error(chalk.red(`[API Error] ${output}`));
    }
  });

  // API 서버 준비 대기
  await sleep(1500);

  // 5. Vite 개발 서버 시작 (브라우저 자동 열기 비활성화)
  const viteServer = spawn('npx', ['vite', '--port', port], {
    cwd: flowGraphAppPath,
    env: {
      ...process.env,
      VITE_SPECS_PATH: specsDir,
      VITE_API_PORT: apiPort,
    },
    stdio: 'inherit',
  });

  // 6. 올바른 URL로 브라우저 열기
  const viewParam = viewMode === 'journey' ? `&view=journey` : '';
  const fullUrl = `http://localhost:${port}?path=${encodeURIComponent(specsDir)}${viewParam}`;

  console.log(chalk.green(`\n✅ ${viewLabel} 실행 중: ${fullUrl}\n`));
  console.log(chalk.gray('   종료하려면 Ctrl+C를 누르세요.\n'));

  // Vite 준비 후 브라우저 열기
  if (options.open !== false) {
    await sleep(1000);
    openBrowser(fullUrl);
  }

  // 7. 종료 처리
  const cleanup = () => {
    console.log(chalk.yellow('\n\n🛑 서버 종료 중...'));
    apiServer.kill();
    viteServer.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // 자식 프로세스 종료 감지
  viteServer.on('close', (code) => {
    if (code !== null) {
      apiServer.kill();
      process.exit(code);
    }
  });

  apiServer.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.error(chalk.red(`API 서버가 비정상 종료되었습니다 (코드: ${code})`));
      viteServer.kill();
      process.exit(code);
    }
  });
}

/**
 * 명령어 실행 헬퍼
 */
function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

/**
 * 대기 헬퍼
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 브라우저 열기 헬퍼
 */
function openBrowser(url: string): void {
  const os = platform();
  let command: string;

  switch (os) {
    case 'darwin':
      command = `open "${url}"`;
      break;
    case 'win32':
      command = `start "" "${url}"`;
      break;
    default:
      command = `xdg-open "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.log(chalk.yellow(`브라우저를 열 수 없습니다. 직접 URL을 복사하세요: ${url}`));
    }
  });
}
