import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/cli/src/commands 또는 cli/src/commands 에서 실행될 수 있음
const SYSTEM_ROOT = __dirname.includes('/dist/')
  ? path.resolve(__dirname, '../../../..')  // dist/cli/src/commands → sdd-system
  : path.resolve(__dirname, '../../..');     // cli/src/commands → sdd-system

interface TypeConfig {
  templateFile: string;
  outputDir: string;
  outputPattern: string;
}

const TYPE_CONFIGS: Record<string, TypeConfig> = {
  feature: {
    templateFile: 'specs/02-specification/functional-spec.template.yaml',
    outputDir: 'specs/02-specification',
    outputPattern: 'feature-{name}.yaml',
  },
  requirement: {
    templateFile: 'specs/01-discovery/requirements.template.yaml',
    outputDir: 'specs/01-discovery',
    outputPattern: 'requirement-{name}.yaml',
  },
  adr: {
    templateFile: 'specs/02-specification/adrs/ADR-template.md',
    outputDir: 'specs/02-specification/adrs',
    outputPattern: 'ADR-{name}.md',
  },
  idea: {
    templateFile: 'specs/01-discovery/idea-crystal.template.yaml',
    outputDir: 'specs/01-discovery',
    outputPattern: 'idea-{name}.yaml',
  },
  technical: {
    templateFile: 'specs/02-specification/technical-spec.template.yaml',
    outputDir: 'specs/02-specification',
    outputPattern: 'technical-{name}.yaml',
  },
  ui: {
    templateFile: 'specs/02-specification/ui-spec.template.yaml',
    outputDir: 'specs/02-specification',
    outputPattern: 'ui-{name}.yaml',
  },
};

export async function newCommand(type: string, name: string) {
  const config = TYPE_CONFIGS[type];

  if (!config) {
    console.error(`\n❌ 유효하지 않은 타입: ${type}`);
    console.log(`   사용 가능: ${Object.keys(TYPE_CONFIGS).join(', ')}\n`);
    process.exit(1);
  }

  // 현재 디렉토리가 SDD 프로젝트인지 확인
  const specsDir = path.join(process.cwd(), 'specs');
  try {
    await fs.access(specsDir);
  } catch {
    console.error(`\n❌ SDD 프로젝트가 아닙니다.`);
    console.log(`   specs/ 폴더가 있는 프로젝트 루트에서 실행하세요.\n`);
    process.exit(1);
  }

  // 템플릿 파일 읽기
  const templatePath = path.join(SYSTEM_ROOT, 'templates', config.templateFile);
  let templateContent: string;

  try {
    templateContent = await fs.readFile(templatePath, 'utf-8');
  } catch {
    console.error(`\n❌ 템플릿 파일을 찾을 수 없습니다: ${config.templateFile}`);
    process.exit(1);
  }

  // 출력 파일 경로 생성
  const outputFileName = config.outputPattern.replace('{name}', name);
  const outputDir = path.join(process.cwd(), config.outputDir);
  const outputPath = path.join(outputDir, outputFileName);

  // 이미 존재하는지 확인
  try {
    await fs.access(outputPath);
    console.error(`\n❌ 파일이 이미 존재합니다: ${outputPath}\n`);
    process.exit(1);
  } catch {
    // 파일이 없으면 정상
  }

  // 템플릿 변수 치환
  const timestamp = new Date().toISOString().split('T')[0];
  const content = templateContent
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{NAME\}\}/g, name.toUpperCase())
    .replace(/\{\{date\}\}/g, timestamp)
    .replace(/\{\{id\}\}/g, generateId(type));

  // 디렉토리 생성 및 파일 쓰기
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, content);

  console.log(`
✅ ${type} 생성 완료!

   파일: ${outputPath}
   
다음 단계:
   에디터에서 파일을 열고 내용을 채우세요.
`);
}

function generateId(type: string): string {
  const prefixes: Record<string, string> = {
    feature: 'F',
    requirement: 'R',
    adr: 'ADR',
    idea: 'IDEA',
    technical: 'TECH',
    ui: 'UI',
  };
  const prefix = prefixes[type] || 'SPEC';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
}