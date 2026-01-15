#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { newCommand } from './commands/new.js';
import { updateCommand } from './commands/update.js';
import { flowCommand } from './commands/flow.js';

const program = new Command();

program
  .name('sdd')
  .description('Spec-Driven Development CLI')
  .version('1.0.0');

program
  .command('init <project-name>')
  .description('새 SDD 프로젝트 생성')
  .option('-s, --stack <stack>', '기술 스택 프리셋', 'nextjs-supabase')
  .option('-t, --template <path>', '커스텀 템플릿 경로')
  .action(initCommand);

program
  .command('new <type> <name>')
  .description('새 스펙 파일 생성 (feature, requirement, adr)')
  .action(newCommand);

program
  .command('update')
  .description('SDD System 업데이트 (템플릿, 명령어, 스크립트)')
  .option('-t, --templates', '스펙 템플릿만 업데이트')
  .option('-c, --commands', 'Claude 명령어만 업데이트')
  .option('-s, --scripts', '스크립트만 업데이트')
  .option('-a, --all', '모든 컴포넌트 업데이트')
  .option('--check', '업데이트 가능 여부만 확인')
  .option('-f, --force', '백업 없이 강제 업데이트')
  .action(updateCommand);

program
  .command('flow')
  .description('Flow Graph 시각화 웹 앱 실행')
  .option('-p, --port <port>', '서버 포트', '3333')
  .option('-v, --view <mode>', '뷰 모드 (engineer | journey)', 'engineer')
  .option('--no-open', '브라우저 자동 열기 비활성화')
  .action(flowCommand);

program.parse();