import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYSTEM_ROOT = path.resolve(__dirname, '../../../..');

interface InitOptions {
  stack: string;
  template?: string;
}

export async function initCommand(projectName: string, options: InitOptions) {
  const projectPath = path.resolve(process.cwd(), projectName);
  
  console.log(`\n🚀 SDD 프로젝트 생성: ${projectName}\n`);

  // 1. 프로젝트 폴더 생성
  try {
    await fs.mkdir(projectPath, { recursive: true });
    console.log(`✅ 프로젝트 폴더 생성: ${projectPath}`);
  } catch (err) {
    console.error(`❌ 폴더 생성 실패: ${err}`);
    process.exit(1);
  }

  // 2. specs 폴더 구조 생성
  const specDirs = [
    'specs/01-discovery',
    'specs/02-specification',
    'specs/02-specification/adrs',
    'specs/03-implementation',
  ];

  for (const dir of specDirs) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }
  console.log(`✅ specs/ 폴더 구조 생성`);

  // 3. 템플릿 파일 복사
  const templatesDir = path.join(SYSTEM_ROOT, 'templates');
  await copyTemplates(templatesDir, projectPath, options.stack);
  console.log(`✅ 템플릿 파일 복사 완료`);

  // 4. CLAUDE.md 생성
  await generateClaudeMd(projectPath, projectName, options.stack);
  console.log(`✅ CLAUDE.md 생성`);

  // 5. 완료 메시지
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 프로젝트 생성 완료!

다음 단계:
  cd ${projectName}
  claude 또는 cursor로 열기
  /spec-discovery 명령어로 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

async function copyTemplates(templatesDir: string, projectPath: string, stack: string) {
  // specs 템플릿 복사
  const specsTemplateDir = path.join(templatesDir, 'specs');
  
  try {
    await copyDir(specsTemplateDir, path.join(projectPath, 'specs'));
  } catch (err) {
    console.log(`⚠️  스펙 템플릿 복사 스킵 (템플릿 없음)`);
  }

  // 기술 스택 프리셋 복사
  const stackFile = path.join(templatesDir, 'tech-stacks', `${stack}.yaml`);
  try {
    await fs.access(stackFile);
    await fs.copyFile(stackFile, path.join(projectPath, 'specs', 'tech-stack.yaml'));
  } catch {
    console.log(`⚠️  기술 스택 프리셋 없음: ${stack}`);
  }
}

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function generateClaudeMd(projectPath: string, projectName: string, stack: string) {
  const content = `# ${projectName}

## 프로젝트 개요
이 프로젝트는 Spec-Driven Development(SDD) 방식으로 개발됩니다.

## 기술 스택
- 프리셋: ${stack}

## SDD 명령어
- \`/spec-discovery\` - 새 기능 발견 및 정의
- \`/spec-specification\` - 상세 스펙 작성
- \`/implement\` - 구현 시작
- \`/validate\` - 스펙 검증
- \`/status\` - 진행 상황 확인

## 폴더 구조
\`\`\`
specs/
├── 01-discovery/      # 아이디어, 문제정의, 요구사항
├── 02-specification/  # 기능명세, 기술명세, UI명세
│   └── adrs/          # 아키텍처 결정 기록
└── 03-implementation/ # 작업 큐, 결과 기록
\`\`\`

## 작업 규칙
1. 모든 기능은 스펙 문서로 시작한다
2. 스펙 없이 코드를 작성하지 않는다
3. 변경 시 영향 분석을 먼저 수행한다
`;

  await fs.writeFile(path.join(projectPath, 'CLAUDE.md'), content);
}