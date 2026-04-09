import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import {
  ActivityContext,
  AnalysisResult,
  ContributorSummary,
  FeatureTheme,
  GitHubCommit,
  GitHubHighlight,
  GitHubPR,
  JiraIssue,
  JiraSprintContext,
  PersonalPulse,
  RiskItem,
  TopicBreakdown,
  UnifiedActivity,
  UnifiedReport,
} from '../types';

// Token budget: target ~20k prompt tokens leaving 10k for the response.
// Approximation: 1 token ≈ 4 chars → 20_000 × 4 = 80_000 chars.
const MAX_PROMPT_CHARS = 80_000;
const PR_BUDGET_FRACTION = 0.7;
const COMMIT_BUDGET_FRACTION = 0.9;

const DEFAULT_PROMPT_PATH = path.resolve(process.cwd(), 'prompt.md');
const DEFAULT_UNIFIED_PROMPT_PATH = path.resolve(process.cwd(), 'prompt-unified.md');

function loadSystemPrompt(promptPath: string = DEFAULT_PROMPT_PATH): string {
  if (fs.existsSync(promptPath)) {
    return fs.readFileSync(promptPath, 'utf8').trim();
  }
  throw new Error(`System prompt file not found: ${promptPath}. Create prompt.md in the project root.`);
}

// ── Pure module-level helpers ─────────────────────────────────────────────────

function shortSha(sha: string | null | undefined): string {
  return sha ? sha.slice(0, 7) : 'unknown';
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function isFeatureTheme(v: unknown): v is FeatureTheme {
  if (v === null || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    typeof obj.summary === 'string' &&
    Array.isArray(obj.commits)
  );
}

function isContributorSummary(v: unknown): v is ContributorSummary {
  if (v === null || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    typeof obj.prsMerged === 'number' &&
    typeof obj.prsOpen === 'number' &&
    typeof obj.commitsCount === 'number' &&
    Array.isArray(obj.highlights) &&
    (obj.risk === null || typeof obj.risk === 'string')
  );
}

function isTopicBreakdown(v: unknown): v is TopicBreakdown {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.topic === 'string' &&
    typeof obj.totalIssues === 'number' &&
    typeof obj.doneCount === 'number' &&
    typeof obj.inProgressCount === 'number' &&
    typeof obj.todoCount === 'number' &&
    typeof obj.completionPercent === 'number'
  );
}

function isRiskItem(v: unknown): v is RiskItem {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    typeof obj.description === 'string' &&
    (obj.severity === 'high' || obj.severity === 'medium' || obj.severity === 'low')
  );
}

function isGitHubHighlight(v: unknown): v is GitHubHighlight {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    typeof obj.ref === 'string' &&
    typeof obj.author === 'string' &&
    typeof obj.description === 'string'
  );
}

function isPersonalPulse(v: unknown): v is PersonalPulse {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.user === 'string' &&
    typeof obj.done === 'number' &&
    typeof obj.inProgress === 'number' &&
    typeof obj.inReview === 'number' &&
    typeof obj.unassignedCount === 'number'
  );
}

/** Appends items from `list` until `budget` chars is reached. Returns consumed chars. */
function trimToBudget(list: string[], budget: number): { lines: string[]; chars: number } {
  const lines: string[] = [];
  let chars = 0;
  for (const item of list) {
    if (chars + item.length > budget) break;
    lines.push(item);
    chars += item.length;
  }
  return { lines, chars };
}

// ── Service ───────────────────────────────────────────────────────────────────

export class IntelligenceService {
  private client: OpenAI;
  private systemPrompt: string;
  private unifiedSystemPrompt: string;

  constructor(
    private apiKey: string,
    private model: string = 'gpt-4o',
    promptPath?: string
  ) {
    this.client = new OpenAI({ apiKey });
    this.systemPrompt = loadSystemPrompt(promptPath);
    const unifiedPath = promptPath
      ? path.join(path.dirname(promptPath), 'prompt-unified.md')
      : DEFAULT_UNIFIED_PROMPT_PATH;
    this.unifiedSystemPrompt = fs.existsSync(unifiedPath)
      ? fs.readFileSync(unifiedPath, 'utf8').trim()
      : '';
  }

  async analyze(context: ActivityContext): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(context);
    const raw = await this.callOpenAI(prompt);
    return this.parseResponse(raw, context);
  }

  async analyzeUnified(activity: UnifiedActivity): Promise<UnifiedReport> {
    if (!this.unifiedSystemPrompt) {
      throw new Error('prompt-unified.md not found. Create it in the project root before calling analyzeUnified().');
    }
    const prompt = this.buildUnifiedPrompt(activity);
    const raw = await this.callOpenAI(prompt, this.unifiedSystemPrompt);
    return this.parseUnifiedResponse(raw, activity);
  }

  // ── OpenAI call ─────────────────────────────────────────────────────────────

  private async callOpenAI(userPrompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt ?? this.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      });
      const content = response.choices[0]?.message?.content ?? '';
      if (!content) throw new Error('Empty response from OpenAI');
      return content;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`OpenAI analysis failed: ${msg}`);
    }
  }

  // ── Response parsing ────────────────────────────────────────────────────────

  private parseResponse(raw: string, context: ActivityContext): AnalysisResult {
    // Strip markdown code fences if the model wrapped the JSON in ```json ... ```
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(stripped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`OpenAI analysis failed: could not parse response JSON — ${msg}`);
    }

    return {
      repo: `${context.owner}/${context.repo}`,
      generatedAt: new Date(),
      contributors: Array.isArray(parsed.contributors)
        ? parsed.contributors.filter(isContributorSummary)
        : [],
      featureThemes: Array.isArray(parsed.featureThemes)
        ? parsed.featureThemes.filter(isFeatureTheme)
        : [],
      keyAchievements: toStringArray(parsed.keyAchievements),
      workInProgress: toStringArray(parsed.workInProgress),
      risksAndBlockers: toStringArray(parsed.risksAndBlockers),
      largePRs: toStringArray(parsed.largePRs),
      managersNote: typeof parsed.managersNote === 'string' ? parsed.managersNote : '',
      rawLLMResponse: stripped,
    };
  }

  // ── Prompt building ─────────────────────────────────────────────────────────

  private buildPrompt(context: ActivityContext): string {
    const header = this.buildHeader(context);
    const full = [
      header,
      this.buildPRSection(context),
      this.buildCommitSection(context),
      this.buildFlagSection(context),
    ].join('\n');
    return full.length <= MAX_PROMPT_CHARS ? full : this.trimPrompt(header, context);
  }

  private buildHeader(context: ActivityContext): string {
    return [
      `Repository: ${context.owner}/${context.repo}`,
      `Analysis window: ${context.windowStart.toISOString()} → ${context.windowEnd.toISOString()}`,
      `Default branch: ${context.defaultBranch}`,
      '',
    ].join('\n');
  }

  private buildPRSection(context: ActivityContext): string {
    if (context.pullRequests.length === 0) return '## Pull Requests\nNone.\n';
    const entries = context.pullRequests.map((pr) => this.renderPREntry(pr));
    return [`## Pull Requests (${context.pullRequests.length} total)\n`, ...entries, ''].join('\n');
  }

  private renderPREntry(pr: GitHubPR): string {
    const lines = [
      `### PR #${pr.number}: ${pr.title}`,
      `- State: ${pr.state}${pr.isDraft ? ' (draft)' : ''}`,
      `- Author: ${pr.author}`,
      `- Branch: ${pr.headRef} → ${pr.baseRef}`,
    ];
    if (pr.body) lines.push(`- Description: ${pr.body.slice(0, 500)}`);
    const comments = pr.comments.filter((c) => c.body.trim().length > 0).slice(0, 5);
    if (comments.length > 0) {
      lines.push(`- Comments (${comments.length}):`);
      comments.forEach((c) => lines.push(`  - ${c.author}: ${c.body.slice(0, 200)}`));
    }
    return lines.join('\n');
  }

  private buildCommitSection(context: ActivityContext): string {
    if (context.commits.length === 0) return '## Commits\nNone.\n';
    const lines = context.commits.map(
      (c) => `- [${shortSha(c.sha)}] ${c.message} (${c.author})`
    );
    return [`## Commits (${context.commits.length} total)\n`, ...lines, ''].join('\n');
  }

  private buildFlagSection(context: ActivityContext, includeGhostWork = true): string {
    const { stalePRs, heatedPRs, directCommits, defaultBranch, bigPRs, bigPRThresholds, ghostWorkPRs } = context;
    const ghostEntries = includeGhostWork ? ghostWorkPRs : [];
    if (!stalePRs.length && !heatedPRs.length && !directCommits.length && !bigPRs.length && !ghostEntries.length)
      return '';

    const lines: string[] = ['## Flags\n'];
    if (ghostEntries.length)
      lines.push(this.renderFlagSubsection(
        `Ghost Work PRs (${ghostEntries.length} — no linked Jira ticket)`,
        ghostEntries.map((pr) => `- PR #${pr.number}: ${pr.title} by ${pr.author} (branch: ${pr.headRef})`)
      ));
    if (stalePRs.length)
      lines.push(this.renderFlagSubsection(
        `Stale PRs (${stalePRs.length})`,
        stalePRs.map((pr) => `- PR #${pr.number}: ${pr.title} (${pr.author})`)
      ));
    if (heatedPRs.length)
      lines.push(this.renderFlagSubsection(
        `Heated PRs (${heatedPRs.length})`,
        heatedPRs.map((pr) => `- PR #${pr.number}: ${pr.title} (${pr.commentCount} comments)`)
      ));
    if (directCommits.length)
      lines.push(this.renderFlagSubsection(
        `Direct commits to ${defaultBranch} (${directCommits.length})`,
        directCommits.map((c: GitHubCommit) => `- [${shortSha(c.sha)}] ${c.message} (${c.author})`)
      ));

    if (bigPRs.length)
      lines.push(this.renderFlagSubsection(
        `Large PRs (>${bigPRThresholds.files} files or >${bigPRThresholds.lines} lines changed)`,
        bigPRs.map(
          (pr) =>
            `- PR #${pr.number} by ${pr.author}: ${pr.title} — ${pr.changedFiles} files, +${pr.additions}/-${pr.deletions} lines`
        )
      ));

    return lines.join('\n');
  }

  private renderFlagSubsection(heading: string, items: string[]): string {
    return [`### ${heading}`, ...items, ''].join('\n');
  }

  // ── Unified response parsing ────────────────────────────────────────────────

  private parseUnifiedResponse(raw: string, activity: UnifiedActivity): UnifiedReport {
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(stripped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`OpenAI analysis failed: could not parse response JSON — ${msg}`);
    }

    return {
      repo: `${activity.github.owner}/${activity.github.repo}`,
      boardId: activity.jira.boardId,
      generatedAt: new Date(),
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      githubHighlights: Array.isArray(parsed.githubHighlights)
        ? parsed.githubHighlights.filter(isGitHubHighlight)
        : [],
      topicBreakdown: Array.isArray(parsed.topicBreakdown)
        ? parsed.topicBreakdown.filter(isTopicBreakdown)
        : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.filter(isRiskItem) : [],
      personalPulse: Array.isArray(parsed.personalPulse)
        ? parsed.personalPulse.filter(isPersonalPulse)
        : [],
      managersNote: typeof parsed.managersNote === 'string' ? parsed.managersNote : '',
      rawLLMResponse: stripped,
    };
  }

  // ── Unified prompt building ─────────────────────────────────────────────────

  private buildUnifiedPrompt(activity: UnifiedActivity): string {
    const { github, jira } = activity;
    const header = this.buildUnifiedHeader(github, jira);
    const ghostSection = this.buildGhostWorkSection(github);
    const full = [
      header,
      ghostSection,
      this.buildPRSection(github),
      this.buildJiraSection(jira),
      this.buildFlagSection(github, false),
    ]
      .filter(Boolean)
      .join('\n');
    return full.length <= MAX_PROMPT_CHARS ? full : this.trimUnifiedPrompt(header, ghostSection, activity);
  }

  private buildUnifiedHeader(context: ActivityContext, jira: JiraSprintContext): string {
    return [
      `Repository: ${context.owner}/${context.repo}`,
      `Analysis window: ${context.windowStart.toISOString()} → ${context.windowEnd.toISOString()}`,
      `Default branch: ${context.defaultBranch}`,
      `Jira Board: ${jira.boardId} | Sprint: ${jira.sprintName}${jira.sprintEndDate ? ` | Ends: ${jira.sprintEndDate}` : ''}`,
      '',
    ].join('\n');
  }

  private buildGhostWorkSection(context: ActivityContext): string {
    if (!context.ghostWorkPRs.length) return '';
    const entries = context.ghostWorkPRs.map(
      (pr) => `- [GHOST WORK] PR #${pr.number}: ${pr.title} by ${pr.author} (branch: ${pr.headRef})`
    );
    return [
      `## Ghost Work PRs (${context.ghostWorkPRs.length} — no linked Jira ticket)\n`,
      ...entries,
      '',
    ].join('\n');
  }

  private buildJiraSection(jira: JiraSprintContext): string {
    const lines: string[] = [
      `## Jira Sprint: ${jira.sprintName} (Board ${jira.boardId})`,
      jira.sprintEndDate ? `Sprint end: ${jira.sprintEndDate}` : '',
      '',
    ];

    if (jira.inProgressIssues.length) {
      lines.push(`### In Progress (${jira.inProgressIssues.length})`);
      jira.inProgressIssues.forEach((i) => lines.push(this.renderJiraIssue(i)));
      lines.push('');
    }
    if (jira.todoIssues.length) {
      lines.push(`### To Do (${jira.todoIssues.length})`);
      jira.todoIssues.forEach((i) => lines.push(this.renderJiraIssue(i)));
      lines.push('');
    }
    if (jira.doneIssues.length) {
      lines.push(`### Done (${jira.doneIssues.length})`);
      jira.doneIssues.forEach((i) => lines.push(this.renderJiraIssue(i)));
      lines.push('');
    }

    return lines.filter((l) => l !== undefined).join('\n');
  }

  private renderJiraIssue(issue: JiraIssue): string {
    let line = `- ${issue.key}: ${issue.summary}`;
    line += issue.assignee ? ` (${issue.assignee})` : ' [UNASSIGNED]';
    if (issue.storyPoints !== null) line += ` [${issue.storyPoints}pts]`;
    if (issue.epicName) line += ` — Epic: ${issue.epicName}`;
    return line;
  }

  private trimUnifiedPrompt(
    header: string,
    ghostSection: string,
    activity: UnifiedActivity
  ): string {
    const { github, jira } = activity;
    const reserved = header.length + ghostSection.length + 200;
    const budget = Math.max(0, MAX_PROMPT_CHARS - reserved);

    const prItems = github.pullRequests.map(
      (pr) => `- PR #${pr.number} [${pr.state}]: ${pr.title} by ${pr.author}\n`
    );
    const { lines: prLines, chars: prChars } = trimToBudget(
      prItems,
      Math.floor(budget * PR_BUDGET_FRACTION)
    );

    const jiraItems = [
      ...jira.inProgressIssues,
      ...jira.todoIssues,
      ...jira.doneIssues,
    ].map((i) => `${this.renderJiraIssue(i)}\n`);
    const { lines: jiraLines, chars: jiraChars } = trimToBudget(
      jiraItems,
      Math.floor(Math.max(0, budget - prChars) * COMMIT_BUDGET_FRACTION)
    );

    const flagBudget = Math.max(0, budget - prChars - jiraChars);
    const flags = this.buildFlagSection(github, false);
    const trimmedFlags = flags.length <= flagBudget ? flags : flags.slice(0, flagBudget);

    const prSection = [
      `## Pull Requests (${github.pullRequests.length} total, trimmed)\n`,
      ...prLines,
      '',
    ].join('\n');
    const jiraSection = [
      `## Jira Sprint: ${jira.sprintName} (Board ${jira.boardId}) — trimmed\n`,
      ...jiraLines,
      '',
    ].join('\n');

    return [header, ghostSection, prSection, jiraSection, trimmedFlags]
      .filter(Boolean)
      .join('\n');
  }

  // ── Context trimming ────────────────────────────────────────────────────────

  private trimPrompt(header: string, context: ActivityContext): string {
    const budget = Math.max(0, MAX_PROMPT_CHARS - header.length - 200);

    const prItems = context.pullRequests.map(
      (pr) => `- PR #${pr.number} [${pr.state}]: ${pr.title} by ${pr.author}\n`
    );
    const { lines: prLines, chars: prChars } = trimToBudget(
      prItems,
      Math.floor(budget * PR_BUDGET_FRACTION)
    );

    const commitItems = context.commits.map(
      (c) => `- [${shortSha(c.sha)}] ${c.message} (${c.author})\n`
    );
    const { lines: commitLines, chars: commitChars } = trimToBudget(
      commitItems,
      Math.floor(Math.max(0, budget - prChars) * COMMIT_BUDGET_FRACTION)
    );

    const flagBudget = Math.max(0, budget - prChars - commitChars);
    const flags = this.buildFlagSection(context);
    const trimmedFlags = flags.length <= flagBudget ? flags : flags.slice(0, flagBudget);

    const prSection = [
      `## Pull Requests (${context.pullRequests.length} total, trimmed)\n`,
      ...prLines,
      '',
    ].join('\n');
    const commitSection = [
      `## Commits (${context.commits.length} total, trimmed)\n`,
      ...commitLines,
      '',
    ].join('\n');

    return [header, prSection, commitSection, trimmedFlags].filter(Boolean).join('\n');
  }
}
