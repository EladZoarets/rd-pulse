import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { AnalyzeOptions } from './types';

dotenv.config();

const program = new Command();

program
  .name('rd-pulse')
  .description('AI-powered R&D intelligence agent — transforms GitHub activity into daily digests')
  .version('0.1.0');

program
  .command('analyze')
  .requiredOption('--owner <owner>', 'GitHub repository owner')
  .requiredOption('--repo <repo>', 'GitHub repository name')
  .option('--days <days>', 'Number of days to look back', '1')
  .option('--output <path>', 'Output file path', 'DAILY_PULSE.md')
  .option('--model <model>', 'OpenAI model to use', 'gpt-4o')
  .action(async (opts) => {
    throw new Error('Not implemented');
  });

program.parse(process.argv);
