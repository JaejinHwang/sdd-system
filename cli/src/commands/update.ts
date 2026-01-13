import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import inquirer from 'inquirer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/cli/src/commands 또는 cli/src/commands 에서 실행될 수 있음
const SYSTEM_ROOT = __dirname.includes('/dist/')
  ? path.resolve(__dirname, '../../../..')  // dist/cli/src/commands → sdd-system
  : path.resolve(__dirname, '../../..');     // cli/src/commands → sdd-system

interface UpdateOptions {
  templates?: boolean;
  commands?: boolean;
  scripts?: boolean;
  all?: boolean;
  check?: boolean;
  force?: boolean;
}

interface ComponentConfig {
  name: string;
  sourceDir: string;
  targetDir: string;
  description: string;
}

const COMPONENTS: ComponentConfig[] = [
  {
    name: 'templates',
    sourceDir: 'templates/specs',
    targetDir: 'specs',
    description: '스펙 템플릿 (discovery, specification, implementation)',
  },
  {
    name: 'commands',
    sourceDir: 'commands',
    targetDir: '.claude/commands',
    description: 'Claude Code 슬래시 명령어',
  },
  {
    name: 'scripts',
    sourceDir: 'scripts',
    targetDir: 'scripts',
    description: '검증 및 분석 스크립트',
  },
];

export async function updateCommand(options: UpdateOptions) {
  const projectPath = process.cwd();

  console.log(chalk.cyan('\n🔄 SDD Update\n'));

  // SDD 프로젝트인지 확인
  const isValidProject = await checkSddProject(projectPath);
  if (!isValidProject) {
    console.error(chalk.red('❌ SDD 프로젝트가 아닙니다.'));
    console.log(chalk.gray('   specs/ 폴더가 있는 프로젝트 루트에서 실행하세요.\n'));
    process.exit(1);
  }

  // 현재 버전 정보 읽기
  const localVersion = await getLocalVersion(projectPath);
  const systemVersion = await getSystemVersion();

  console.log(chalk.gray(`현재 프로젝트 버전: ${localVersion || '알 수 없음'}`));
  console.log(chalk.gray(`SDD System 버전: ${systemVersion}\n`));

  // --check 옵션: 업데이트 가능 여부만 확인
  if (options.check) {
    await checkUpdates(projectPath);
    return;
  }

  // 업데이트할 컴포넌트 결정
  let componentsToUpdate: ComponentConfig[] = [];

  if (options.all) {
    componentsToUpdate = COMPONENTS;
  } else if (options.templates || options.commands || options.scripts) {
    if (options.templates) {
      componentsToUpdate.push(COMPONENTS.find(c => c.name === 'templates')!);
    }
    if (options.commands) {
      componentsToUpdate.push(COMPONENTS.find(c => c.name === 'commands')!);
    }
    if (options.scripts) {
      componentsToUpdate.push(COMPONENTS.find(c => c.name === 'scripts')!);
    }
  } else {
    // 대화형 모드: 사용자에게 선택 요청
    componentsToUpdate = await promptComponentSelection();
  }

  if (componentsToUpdate.length === 0) {
    console.log(chalk.yellow('업데이트할 컴포넌트가 선택되지 않았습니다.\n'));
    return;
  }

  // 각 컴포넌트 업데이트
  for (const component of componentsToUpdate) {
    await updateComponent(component, projectPath, options.force ?? false);
  }

  // .sdd-version 파일 업데이트
  await updateVersionFile(projectPath, systemVersion);

  console.log(chalk.green('\n✅ 업데이트 완료!\n'));
}

async function checkSddProject(projectPath: string): Promise<boolean> {
  try {
    await fs.access(path.join(projectPath, 'specs'));
    return true;
  } catch {
    return false;
  }
}

async function getLocalVersion(projectPath: string): Promise<string | null> {
  try {
    const versionFile = path.join(projectPath, '.sdd-version');
    const content = await fs.readFile(versionFile, 'utf-8');
    return content.trim();
  } catch {
    return null;
  }
}

async function getSystemVersion(): Promise<string> {
  try {
    const packageJson = await fs.readFile(
      path.join(SYSTEM_ROOT, 'package.json'),
      'utf-8'
    );
    return JSON.parse(packageJson).version;
  } catch {
    return '1.0.0';
  }
}

async function checkUpdates(projectPath: string): Promise<void> {
  console.log(chalk.cyan('📋 업데이트 가능 여부 확인\n'));

  for (const component of COMPONENTS) {
    const sourcePath = path.join(SYSTEM_ROOT, component.sourceDir);
    const targetPath = path.join(projectPath, component.targetDir);

    const diff = await compareDirectories(sourcePath, targetPath);

    if (diff.added.length > 0 || diff.modified.length > 0 || diff.deleted.length > 0) {
      console.log(chalk.yellow(`📦 ${component.name}`));
      console.log(chalk.gray(`   ${component.description}`));

      if (diff.added.length > 0) {
        console.log(chalk.green(`   + 추가: ${diff.added.length}개 파일`));
        diff.added.slice(0, 3).forEach(f => console.log(chalk.gray(`     - ${f}`)));
        if (diff.added.length > 3) {
          console.log(chalk.gray(`     ... 외 ${diff.added.length - 3}개`));
        }
      }

      if (diff.modified.length > 0) {
        console.log(chalk.blue(`   ~ 변경: ${diff.modified.length}개 파일`));
        diff.modified.slice(0, 3).forEach(f => console.log(chalk.gray(`     - ${f}`)));
        if (diff.modified.length > 3) {
          console.log(chalk.gray(`     ... 외 ${diff.modified.length - 3}개`));
        }
      }

      if (diff.deleted.length > 0) {
        console.log(chalk.red(`   - 삭제됨: ${diff.deleted.length}개 파일`));
      }

      console.log('');
    } else {
      console.log(chalk.green(`✓ ${component.name} - 최신 상태`));
    }
  }
}

interface DiffResult {
  added: string[];
  modified: string[];
  deleted: string[];
}

async function compareDirectories(
  sourcePath: string,
  targetPath: string
): Promise<DiffResult> {
  const result: DiffResult = { added: [], modified: [], deleted: [] };

  try {
    const sourceFiles = await getAllFiles(sourcePath, sourcePath);
    const targetFiles = await getAllFiles(targetPath, targetPath);

    const sourceSet = new Set(sourceFiles);
    const targetSet = new Set(targetFiles);

    // 새로 추가된 파일 (source에만 있음)
    for (const file of sourceFiles) {
      if (!targetSet.has(file)) {
        result.added.push(file);
      } else {
        // 양쪽에 있는 파일은 내용 비교
        const sourceContent = await fs.readFile(path.join(sourcePath, file), 'utf-8').catch(() => '');
        const targetContent = await fs.readFile(path.join(targetPath, file), 'utf-8').catch(() => '');

        if (sourceContent !== targetContent) {
          result.modified.push(file);
        }
      }
    }

    // 삭제된 파일 (target에만 있음) - 템플릿 파일만 체크
    for (const file of targetFiles) {
      if (!sourceSet.has(file) && file.includes('.template.')) {
        result.deleted.push(file);
      }
    }
  } catch {
    // 디렉토리가 없으면 전부 새로운 것
    try {
      const sourceFiles = await getAllFiles(sourcePath, sourcePath);
      result.added = sourceFiles;
    } catch {
      // source도 없으면 비어있음
    }
  }

  return result;
}

async function getAllFiles(dir: string, baseDir: string): Promise<string[]> {
  const files: string[] = [];
  const IGNORE_PATTERNS = ['.DS_Store', '.git', 'node_modules'];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // 무시할 파일/폴더 건너뛰기
      if (IGNORE_PATTERNS.includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else {
        files.push(relativePath);
      }
    }
  } catch {
    // 디렉토리가 없으면 빈 배열 반환
  }

  return files;
}

async function promptComponentSelection(): Promise<ComponentConfig[]> {
  const choices = COMPONENTS.map(c => ({
    name: `${c.name} - ${c.description}`,
    value: c,
    checked: true,
  }));

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: '업데이트할 컴포넌트를 선택하세요:',
      choices,
    },
  ]);

  return selected;
}

async function updateComponent(
  component: ComponentConfig,
  projectPath: string,
  force: boolean
): Promise<void> {
  const sourcePath = path.join(SYSTEM_ROOT, component.sourceDir);
  const targetPath = path.join(projectPath, component.targetDir);

  console.log(chalk.cyan(`\n📦 ${component.name} 업데이트 중...`));

  const diff = await compareDirectories(sourcePath, targetPath);

  if (diff.added.length === 0 && diff.modified.length === 0) {
    console.log(chalk.green(`   ✓ 이미 최신 상태입니다.`));
    return;
  }

  // 백업 생성 (수정되는 파일만)
  if (diff.modified.length > 0 && !force) {
    const backupDir = path.join(projectPath, '.sdd-backup', Date.now().toString());
    await fs.mkdir(backupDir, { recursive: true });

    for (const file of diff.modified) {
      const sourceFile = path.join(targetPath, file);
      const backupFile = path.join(backupDir, component.name, file);

      await fs.mkdir(path.dirname(backupFile), { recursive: true });
      await fs.copyFile(sourceFile, backupFile);
    }

    console.log(chalk.gray(`   백업 생성: ${backupDir}`));
  }

  // 디렉토리 생성
  await fs.mkdir(targetPath, { recursive: true });

  // 새 파일 추가
  for (const file of diff.added) {
    const sourceFile = path.join(sourcePath, file);
    const targetFile = path.join(targetPath, file);

    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.copyFile(sourceFile, targetFile);
    console.log(chalk.green(`   + ${file}`));
  }

  // 수정된 파일 업데이트
  for (const file of diff.modified) {
    const sourceFile = path.join(sourcePath, file);
    const targetFile = path.join(targetPath, file);

    // 템플릿 파일만 업데이트 (실제 스펙 파일은 건드리지 않음)
    if (file.includes('.template.') || component.name !== 'templates') {
      await fs.copyFile(sourceFile, targetFile);
      console.log(chalk.blue(`   ~ ${file}`));
    } else {
      console.log(chalk.yellow(`   ⚠ ${file} (스킵 - 사용자 파일)`));
    }
  }
}

async function updateVersionFile(projectPath: string, version: string): Promise<void> {
  const versionFile = path.join(projectPath, '.sdd-version');
  await fs.writeFile(versionFile, version);
}
