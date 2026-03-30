import OpenAI from 'openai';
import {
  ActivityContext,
  AnalysisResult,
  ContributorSummary,
  FeatureTheme,
  GitHubCommit,
  GitHubPR,
} from '../types';

// Token budget: target ~20k prompt tokens leaving 10k for the response.
// Approximation: 1 token ≈ 4 chars → 20_000 × 4 = 80_000 chars.
const MAX_PROMPT_CHARS = 80_000;
const PR_BUDGET_FRACTION = 0.7;
const COMMIT_BUDGET_FRACTION = 0.9;

const SYSTEM_PROMPT = `You are an expert engineering manager assistant. Analyse the provided GitHub activity and return a structured JSON report.

Return ONLY valid JSON matching this exact schema — no markdown fences, no extra keys:
{
  "contributors": [
    {
      "name": "string",
      "prsMerged": 0,
      "prsOpen": 0,
      "commitsCount": 0,
      "highlights": ["string"],
      "risk": "string or null"
    }
  ],
  "featureThemes": [{ "name": "string", "commits": ["string"], "summary": "string" }],
  "keyAchievements": ["string"],
  "workInProgress": ["string"],
  "risksAndBlockers": ["string"],
  "managersNote": "string"
}

Guidelines:
- contributors: one entry per unique author who had any activity. Sort by impact (most active first).
  - highlights: 1-3 bullet strings describing what they shipped or progressed (use PR titles/numbers)
  - risk: null if healthy. Set to a short risk description if they have: stale open PRs, no merged work despite open PRs, direct commits to main, or unusually low activity compared to peers.
- featureThemes: group related PRs/commits into themes with a concise summary
- keyAchievements: merged PRs or notable completed work (max 8 bullet points)
- workInProgress: open PRs or ongoing work (max 8 bullet points)
- risksAndBlockers: stale PRs, heated discussions, direct-to-main commits (max 5 bullet points)
- managersNote: 2-3 sentence high-level narrative for a non-technical engineering manager`;

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

  constructor(private apiKey: string, private model: string = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
  }

  async analyze(context: ActivityContext): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(context);
    const raw = await this.callOpenAI(prompt);
    return this.parseResponse(raw, context);
  }

  // ── OpenAI call ─────────────────────────────────────────────────────────────

  private async callOpenAI(userPrompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
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

  private buildFlagSection(context: ActivityContext): string {
    const { stalePRs, heatedPRs, directCommits, defaultBranch } = context;
    if (!stalePRs.length && !heatedPRs.length && !directCommits.length) return '';

    const lines: string[] = ['## Flags\n'];
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

    return lines.join('\n');
  }

  private renderFlagSubsection(heading: string, items: string[]): string {
    return [`### ${heading}`, ...items, ''].join('\n');
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
