#!/usr/bin/env node
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AnalyzeOptions, JiraFetchOptions, PulseOptions, UnifiedReport, ActivityContext, JiraSprintContext } from './types';
import { GitHubService, DEFAULT_BIG_PR_THRESHOLDS } from './services/GitHubService';
import { JiraService } from './services/JiraService';
import { IntelligenceService } from './services/IntelligenceService';
import { FormatterService } from './services/FormatterService';
import { HtmlFormatterService } from './services/HtmlFormatterService';
import { ReportSenderService, ReportPayload } from './services/ReportSenderService';
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
  .option('--output <path>', 'Output file path (default: DAILY_PULSE.md or DAILY_PULSE.html)')
  .option('--format <fmt>', 'Output format: md or html', 'md')
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

    const fmt = String(opts.format).toLowerCase();
    if (fmt !== 'md' && fmt !== 'html')
      handleFatalError(new Error('--format must be "md" or "html"'), 'startup');

    // Default output filename based on format if not explicitly provided
    const outputPath = opts.output ?? (fmt === 'html' ? 'DAILY_PULSE.html' : 'DAILY_PULSE.md');

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

      log(`Formatting report as ${fmt.toUpperCase()}…`);
      const output =
        fmt === 'html'
          ? new HtmlFormatterService().format(result)
          : new FormatterService().format(result);

      fs.writeFileSync(outputPath, output, 'utf8');
      log(`Report written to ${outputPath}`);

      if (fmt === 'md') {
        console.log('\n' + '─'.repeat(60));
        console.log(output);
        console.log('─'.repeat(60) + '\n');
      } else {
        log(`Open in browser: open ${outputPath}`);
      }
    } catch (err) {
      handleFatalError(err, 'analyze');
    }
  });

// ── Sprint data builder ───────────────────────────────────────────────────────

function buildSprintData(jiraCtx: JiraSprintContext): ReportPayload['sprintData'] {
  const totalIssues =
    jiraCtx.doneIssues.length + jiraCtx.inProgressIssues.length + jiraCtx.todoIssues.length;
  if (totalIssues === 0) return undefined;

  const overallPercent = Math.round((jiraCtx.doneIssues.length / totalIssues) * 100);

  // Group issues by assignee across all statuses
  const userMap = new Map<string, { done: number; inProgress: number; total: number }>();

  function tally(issues: JiraSprintContext['doneIssues'], status: 'done' | 'inProgress' | 'todo') {
    for (const issue of issues) {
      const name = issue.assignee ?? 'Unassigned';
      const u = userMap.get(name) ?? { done: 0, inProgress: 0, total: 0 };
      if (status === 'done') u.done++;
      else if (status === 'inProgress') u.inProgress++;
      u.total++;
      userMap.set(name, u);
    }
  }

  tally(jiraCtx.doneIssues, 'done');
  tally(jiraCtx.inProgressIssues, 'inProgress');
  tally(jiraCtx.todoIssues, 'todo');

  const users = Array.from(userMap.entries())
    .map(([user, counts]) => ({ user, ...counts }))
    .filter((u) => u.user !== 'Unassigned')          // exclude unassigned bucket
    .sort((a, b) => b.total - a.total);

  return { overallPercent, users };
}

// ── Risk link builder ─────────────────────────────────────────────────────────

const PR_REF_RE = /^PR\s*#(\d+)$/i;
const JIRA_KEY_RE = /^[A-Z][A-Z0-9]+-\d+$/;

function buildRiskLinks(
  refs: string[],
  githubCtx: ActivityContext,
  jiraCtx?: JiraSprintContext
): Array<{ label: string; url: string }> {
  const links: Array<{ label: string; url: string }> = [];
  const jiraDomain = process.env.JIRA_DOMAIN?.replace(/\/$/, '');
  const ghBase = `https://github.com/${githubCtx.owner}/${githubCtx.repo}`;

  for (const ref of refs) {
    const prMatch = PR_REF_RE.exec(ref);
    if (prMatch) {
      links.push({ label: `PR #${prMatch[1]}`, url: `${ghBase}/pull/${prMatch[1]}` });
      continue;
    }
    if (JIRA_KEY_RE.test(ref) && jiraDomain) {
      links.push({ label: ref, url: `${jiraDomain}/browse/${ref}` });
    }
  }

  // Fallback: if no refs resolved but we have Jira context, link to the board
  if (links.length === 0 && jiraCtx && jiraDomain) {
    links.push({
      label: `Board ${jiraCtx.boardId}`,
      url: `${jiraDomain}/jira/software/boards/${jiraCtx.boardId}`,
    });
  }

  return links;
}

// ── IngestPayload builder ─────────────────────────────────────────────────────

export function buildIngestPayload(
  report: UnifiedReport,
  githubCtx: ActivityContext,
  workspaceId: string,
  jiraCtx?: JiraSprintContext
): ReportPayload {
  const hasHighSeverity = report.risks.some((r) => r.severity === 'high');
  const hasSprintJeopardy = report.risks.some(
    (r) => r.type === 'SPRINT_JEOPARDY' && r.severity === 'high'
  );
  const health = hasSprintJeopardy ? 'critical' : hasHighSeverity ? 'at_risk' : 'good';

  return {
    workspaceId,
    reportType: 'unified_sprint',
    windowStart: githubCtx.windowStart.toISOString(),
    windowEnd: githubCtx.windowEnd.toISOString(),
    generatedAt: report.generatedAt.toISOString(),
    summary: {
      health,
      headline: report.summary,
    },
    risks: report.risks.map((r) => ({
      type: r.type.toLowerCase(),
      severity: r.severity,
      title: r.description.split('.')[0].trim(),
      description: r.description,
      links: buildRiskLinks(r.refs ?? [], githubCtx, jiraCtx),
    })),
    insights: report.githubHighlights.map((h) => ({
      type: h.type.toLowerCase(),
      description: h.description,
    })),
    sprintData: (() => {
      const base = jiraCtx ? buildSprintData(jiraCtx) : undefined;
      if (!base) return undefined;
      return {
        ...base,
        topics: report.topicBreakdown.length > 0 ? report.topicBreakdown : undefined,
      };
    })(),
  };
}

// ── pulse command ─────────────────────────────────────────────────────────────

export async function runPulse(opts: PulseOptions, env: NodeJS.ProcessEnv): Promise<void> {
  printHeader();

  const githubToken = env.GITHUB_TOKEN;
  const openaiKey = env.OPENAI_API_KEY;
  const jiraDomain = env.JIRA_DOMAIN;
  const jiraEmail = env.JIRA_EMAIL;
  const jiraToken = env.JIRA_TOKEN;

  if (!githubToken) handleFatalError(new Error('GITHUB_TOKEN is not set'), 'startup');
  if (!openaiKey) handleFatalError(new Error('OPENAI_API_KEY is not set'), 'startup');
  if (!jiraDomain) handleFatalError(new Error('JIRA_DOMAIN is not set'), 'startup');
  if (!jiraEmail) handleFatalError(new Error('JIRA_EMAIL is not set'), 'startup');
  if (!jiraToken) handleFatalError(new Error('JIRA_TOKEN is not set'), 'startup');

  const days = parseInt(String(opts.days), 10);
  if (isNaN(days) || days < 1) handleFatalError(new Error('--days must be a positive integer'), 'startup');

  const fmt = String(opts.format).toLowerCase();
  if (fmt !== 'md' && fmt !== 'html')
    handleFatalError(new Error('--format must be "md" or "html"'), 'startup');

  const outputPath = opts.output ?? (fmt === 'html' ? 'PULSE_REPORT.html' : 'PULSE_REPORT.md');

  const jiraOptions: JiraFetchOptions = {};
  if (opts.jiraFields) jiraOptions.fields = opts.jiraFields.split(',').map((f) => f.trim());
  if (opts.jiraSpField) jiraOptions.storyPointsField = opts.jiraSpField;

  const rdpulseServer = env.RDPULSE_SERVER;
  const workspaceId = opts.workspace ?? env.WORKSPACE_ID;
  const rdpulseJwt = opts.jwt ?? env.RDPULSE_JWT;
  const sender = rdpulseServer && workspaceId && rdpulseJwt
    ? new ReportSenderService(rdpulseServer, workspaceId, rdpulseJwt)
    : null;

  try {
    if (sender) {
      try {
        await sender.sendHeartbeat();
        log('Heartbeat sent to rd-pulse server');
      } catch (err) {
        log(`Warning: heartbeat failed — ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`Fetching ${days}d of GitHub activity for ${opts.owner}/${opts.repo}…`);
    const github = new GitHubService(githubToken!);
    const githubCtx = await github.fetchActivity(opts.owner, opts.repo, days, DEFAULT_BIG_PR_THRESHOLDS);
    log(`Fetched ${githubCtx.pullRequests.length} PRs, ${githubCtx.commits.length} commits, ${githubCtx.ghostWorkPRs.length} ghost work PRs`);

    log(`Fetching Jira sprint context for board ${opts.board}…`);
    const jira = new JiraService(jiraDomain!, jiraEmail!, jiraToken!);
    const jiraCtx = await jira.fetchSprintContext(opts.board, jiraOptions);
    log(`Fetched sprint: ${jiraCtx.sprintName}`);

    log(`Analysing with ${opts.model}…`);
    const intelligence = new IntelligenceService(openaiKey!, opts.model);
    const report = await intelligence.analyzeUnified({ github: githubCtx, jira: jiraCtx });
    log(`Analysis complete — ${report.risks.length} risks, ${report.topicBreakdown.length} topics`);

    if (sender) {
      try {
        const payload = buildIngestPayload(report, githubCtx, workspaceId!, jiraCtx);
        await sender.sendReport(payload);
        log('Report sent to rd-pulse server');
      } catch (err) {
        log(`Warning: sendReport failed — ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`Formatting report as ${fmt.toUpperCase()}…`);
    const output =
      fmt === 'html'
        ? new HtmlFormatterService().formatUnified(report)
        : new FormatterService().formatUnified(report);

    fs.writeFileSync(outputPath, output, 'utf8');
    log(`Report written to ${outputPath}`);

    if (fmt === 'md') {
      console.log('\n' + '─'.repeat(60));
      console.log(output);
      console.log('─'.repeat(60) + '\n');
    } else {
      log(`Open in browser: open ${outputPath}`);
    }
  } catch (err) {
    handleFatalError(err, 'pulse');
  }
}

program
  .command('pulse')
  .requiredOption('--owner <owner>', 'GitHub repository owner')
  .requiredOption('--repo <repo>', 'GitHub repository name')
  .requiredOption('--board <board>', 'Jira board ID')
  .option('--days <days>', 'Number of days to look back', '1')
  .option('--output <path>', 'Output file path (default: PULSE_REPORT.md or PULSE_REPORT.html)')
  .option('--format <fmt>', 'Output format: md or html', 'md')
  .option('--model <model>', 'OpenAI model to use', 'gpt-4o')
  .option('--jira-fields <fields>', 'Comma-separated Jira fields to fetch')
  .option('--jira-sp-field <field>', 'Jira custom field for story points')
  .option('--workspace <id>', 'rd-pulse workspace ID (overrides WORKSPACE_ID env var)')
  .option('--jwt <token>', 'rd-pulse JWT token (overrides RDPULSE_JWT env var)')
  .action((opts: PulseOptions) => runPulse(opts, process.env));

program
  .command('connect')
  .description('Verify connectivity by sending a heartbeat to the rd-pulse dashboard')
  .requiredOption('--workspace <id>', 'rd-pulse workspace ID')
  .requiredOption('--jwt <token>', 'rd-pulse JWT token')
  .option('--server <url>', 'rd-pulse server URL', 'https://rdpulse-backend-production.up.railway.app')
  .action(async (opts: { workspace: string; jwt: string; server: string }) => {
    const { ReportSenderService } = await import('./services/ReportSenderService');
    const sender = new ReportSenderService(opts.server, opts.workspace, opts.jwt);
    try {
      await sender.sendHeartbeat();
      console.log('✓ Workspace connected! Head back to the dashboard.');
    } catch (err) {
      console.error('Connection failed:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse(process.argv);
}
