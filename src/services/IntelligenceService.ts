import OpenAI from 'openai';
import { ActivityContext, AnalysisResult, FeatureTheme } from '../types';

// Token budget: GPT-4o context is 128k tokens; we target ~80k to leave room for the response.
// Rough approximation: 1 token ≈ 4 chars. 80_000 tokens × 4 = 320_000 chars max prompt.
const MAX_PROMPT_CHARS = 320_000;
// Reserve 30% of budget for flags + commits after PRs fill their 70% slice.
const PR_BUDGET_FRACTION = 0.7;
const COMMIT_BUDGET_FRACTION = 0.9;

const SYSTEM_PROMPT = `You are an expert engineering manager assistant. Analyse the provided GitHub activity and return a structured JSON report.

Return ONLY valid JSON matching this exact schema:
{
  "featureThemes": [{ "name": "string", "commits": ["string"], "summary": "string" }],
  "keyAchievements": ["string"],
  "workInProgress": ["string"],
  "risksAndBlockers": ["string"],
  "managersNote": "string"
}

Guidelines:
- featureThemes: group related PRs/commits into themes with a concise summary
- keyAchievements: merged PRs or notable completed work (max 8 bullet points)
- workInProgress: open PRs or ongoing work (max 8 bullet points)
- risksAndBlockers: stale PRs, heated discussions, direct-to-main commits (max 5 bullet points)
- managersNote: 2-3 sentence high-level narrative for a non-technical engineering manager`;

export class IntelligenceService {
  private client: OpenAI;

  constructor(private apiKey: string, private model: string = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
  }

  async analyze(context: ActivityContext): Promise<AnalysisResult> {
    const userPrompt = this.buildPrompt(context);

    let rawContent: string;
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      });

      rawContent = response.choices[0]?.message?.content ?? '';
      if (!rawContent) {
        throw new Error('Empty response from OpenAI');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`OpenAI analysis failed: ${msg}`);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`OpenAI analysis failed: could not parse response JSON — ${msg}`);
    }

    return {
      repo: `${context.owner}/${context.repo}`,
      generatedAt: new Date(),
      featureThemes: this.toFeatureThemes(parsed.featureThemes),
      keyAchievements: this.toStringArray(parsed.keyAchievements),
      workInProgress: this.toStringArray(parsed.workInProgress),
      risksAndBlockers: this.toStringArray(parsed.risksAndBlockers),
      managersNote: typeof parsed.managersNote === 'string' ? parsed.managersNote : '',
      rawLLMResponse: rawContent,
    };
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string');
  }

  private toFeatureThemes(value: unknown): FeatureTheme[] {
    if (!Array.isArray(value)) return [];
    return value.filter(
      (v): v is FeatureTheme =>
        v !== null &&
        typeof v === 'object' &&
        typeof (v as Record<string, unknown>).name === 'string' &&
        typeof (v as Record<string, unknown>).summary === 'string' &&
        Array.isArray((v as Record<string, unknown>).commits)
    );
  }

  private buildPrompt(context: ActivityContext): string {
    const header = this.buildHeader(context);
    const prSection = this.buildPRSection(context);
    const commitSection = this.buildCommitSection(context);
    const flagSection = this.buildFlagSection(context);

    const full = [header, prSection, commitSection, flagSection].join('\n');

    if (full.length <= MAX_PROMPT_CHARS) {
      return full;
    }
    return this.trimPrompt(header, context);
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

    const lines = [`## Pull Requests (${context.pullRequests.length} total)\n`];
    for (const pr of context.pullRequests) {
      lines.push(`### PR #${pr.number}: ${pr.title}`);
      lines.push(`- State: ${pr.state}${pr.isDraft ? ' (draft)' : ''}`);
      lines.push(`- Author: ${pr.author}`);
      lines.push(`- Branch: ${pr.headRef} → ${pr.baseRef}`);
      if (pr.body) {
        lines.push(`- Description: ${pr.body.slice(0, 500)}`);
      }
      const nonEmptyComments = pr.comments.filter((c) => c.body.trim().length > 0);
      if (nonEmptyComments.length > 0) {
        lines.push(`- Comments (${nonEmptyComments.length}):`);
        for (const c of nonEmptyComments.slice(0, 5)) {
          lines.push(`  - ${c.author}: ${c.body.slice(0, 200)}`);
        }
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  private buildCommitSection(context: ActivityContext): string {
    if (context.commits.length === 0) return '## Commits\nNone.\n';

    const lines = [`## Commits (${context.commits.length} total)\n`];
    for (const c of context.commits) {
      const sha = c.sha ? c.sha.slice(0, 7) : 'unknown';
      lines.push(`- [${sha}] ${c.message} (${c.author})`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildFlagSection(context: ActivityContext): string {
    const hasFlags =
      context.stalePRs.length > 0 ||
      context.heatedPRs.length > 0 ||
      context.directCommits.length > 0;

    if (!hasFlags) return '';

    const lines: string[] = ['## Flags\n'];

    if (context.stalePRs.length > 0) {
      lines.push(`### Stale PRs (${context.stalePRs.length})`);
      for (const pr of context.stalePRs) {
        lines.push(`- PR #${pr.number}: ${pr.title} (${pr.author})`);
      }
      lines.push('');
    }

    if (context.heatedPRs.length > 0) {
      lines.push(`### Heated PRs (${context.heatedPRs.length})`);
      for (const pr of context.heatedPRs) {
        lines.push(`- PR #${pr.number}: ${pr.title} (${pr.commentCount} comments)`);
      }
      lines.push('');
    }

    if (context.directCommits.length > 0) {
      lines.push(
        `### Direct commits to ${context.defaultBranch} (${context.directCommits.length})`
      );
      for (const c of context.directCommits) {
        const sha = c.sha ? c.sha.slice(0, 7) : 'unknown';
        lines.push(`- [${sha}] ${c.message} (${c.author})`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private trimPrompt(header: string, context: ActivityContext): string {
    // Guard: budget must be non-negative even for pathologically long headers.
    const budget = Math.max(0, MAX_PROMPT_CHARS - header.length - 200);

    const prBudget = Math.floor(budget * PR_BUDGET_FRACTION);
    const prLines: string[] = [
      `## Pull Requests (${context.pullRequests.length} total, trimmed)\n`,
    ];
    let prChars = prLines[0].length;

    for (const pr of context.pullRequests) {
      const line = `- PR #${pr.number} [${pr.state}]: ${pr.title} by ${pr.author}\n`;
      if (prChars + line.length > prBudget) break;
      prLines.push(line);
      prChars += line.length;
    }
    prLines.push('');

    const remainingBudget = Math.max(0, budget - prChars);
    const commitBudget = Math.floor(remainingBudget * COMMIT_BUDGET_FRACTION);
    const commitLines: string[] = [
      `## Commits (${context.commits.length} total, trimmed)\n`,
    ];
    let commitChars = commitLines[0].length;

    for (const c of context.commits) {
      const sha = c.sha ? c.sha.slice(0, 7) : 'unknown';
      const line = `- [${sha}] ${c.message} (${c.author})\n`;
      if (commitChars + line.length > commitBudget) break;
      commitLines.push(line);
      commitChars += line.length;
    }
    commitLines.push('');

    // Always include flags even when trimming — they carry risk signals.
    const flagBudget = Math.max(0, budget - prChars - commitChars);
    const flagSection = this.buildFlagSection(context);
    const trimmedFlags =
      flagSection.length <= flagBudget ? flagSection : flagSection.slice(0, flagBudget);

    return [header, prLines.join('\n'), commitLines.join('\n'), trimmedFlags]
      .filter(Boolean)
      .join('\n');
  }
}
