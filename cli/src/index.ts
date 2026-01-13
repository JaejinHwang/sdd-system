#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { newCommand } from './commands/new.js';

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

program.parse();