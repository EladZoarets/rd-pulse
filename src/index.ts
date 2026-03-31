import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AnalyzeOptions } from './types';
import { GitHubService, DEFAULT_BIG_PR_THRESHOLDS } from './services/GitHubService';
import { IntelligenceService } from './services/IntelligenceService';
import { FormatterService } from './services/FormatterService';
import { printHeader, log, handleFatalError } from './utils/logger';

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
  .option('--big-pr-files <n>', 'Flag PRs with this many changed files or more', String(DEFAULT_BIG_PR_THRESHOLDS.files))
  .option('--big-pr-lines <n>', 'Flag PRs with this many changed lines or more', String(DEFAULT_BIG_PR_THRESHOLDS.lines))
  .action(async (opts: AnalyzeOptions) => {
    printHeader();

    const githubToken = process.env.GITHUB_TOKEN;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!githubToken) handleFatalError(new Error('GITHUB_TOKEN is not set'), 'startup');
    if (!openaiKey) handleFatalError(new Error('OPENAI_API_KEY is not set'), 'startup');

    const days = parseInt(String(opts.days), 10);
    if (isNaN(days) || days < 1) handleFatalError(new Error('--days must be a positive integer'), 'startup');

    try {
      const bigPRThresholds = {
        files: parseInt(String(opts.bigPrFiles), 10) || DEFAULT_BIG_PR_THRESHOLDS.files,
        lines: parseInt(String(opts.bigPrLines), 10) || DEFAULT_BIG_PR_THRESHOLDS.lines,
      };

      log(`Fetching ${days}d of activity for ${opts.owner}/${opts.repo}… (large PR threshold: ${bigPRThresholds.files} files / ${bigPRThresholds.lines} lines)`);
      const github = new GitHubService(githubToken!);
      const context = await github.fetchActivity(opts.owner, opts.repo, days, bigPRThresholds);
      log(`Fetched ${context.pullRequests.length} PRs, ${context.commits.length} commits`);

      log(`Analysing with ${opts.model}…`);
      const intelligence = new IntelligenceService(openaiKey!, opts.model);
      const result = await intelligence.analyze(context);
      log(`Analysis complete — ${result.featureThemes.length} themes, ${result.keyAchievements.length} achievements`);

      log(`Formatting report…`);
      const formatter = new FormatterService();
      const markdown = formatter.format(result);

      fs.writeFileSync(opts.output, markdown, 'utf8');
      log(`Report written to ${opts.output}`);

      console.log('\n' + '─'.repeat(60));
      console.log(markdown);
      console.log('─'.repeat(60) + '\n');
    } catch (err) {
      handleFatalError(err, 'analyze');
    }
  });

program.parse(process.argv);
