import { Octokit } from '@octokit/rest';
import { ActivityContext, BigPRThresholds, GitHubPR, GitHubCommit, GitHubComment } from '../types';

const HEATED_COMMENT_THRESHOLD = 10;
const STALE_HOURS = 24;
const MAX_PRS_WITH_COMMENTS = 20;
// BUG-07: Cap total commits fetched to avoid unbounded pagination on very active repos.
const MAX_COMMITS = 500;
// Cap individual PR detail fetches to avoid rate-limiting on very active repos.
const MAX_PR_STAT_FETCHES = 50;

export const DEFAULT_BIG_PR_THRESHOLDS: BigPRThresholds = {
  files: 50,
  lines: 500,
};

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async fetchActivity(
    owner: string,
    repo: string,
    days: number = 1,
    thresholds: BigPRThresholds = DEFAULT_BIG_PR_THRESHOLDS
  ): Promise<ActivityContext> {
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - days * 24 * 60 * 60 * 1000);

    // 1. Resolve default branch and validate repo access
    const defaultBranch = await this.getDefaultBranch(owner, repo);

    // 2. Fetch PRs and commits in parallel
    const [rawPRs, rawCommits] = await Promise.all([
      this.fetchPRs(owner, repo, windowStart),
      this.fetchCommits(owner, repo, defaultBranch, windowStart),
    ]);

    // 3. Build set of PR merge commit SHAs to identify direct commits
    const mergeCommitShas = new Set<string>(
      rawPRs
        .filter((pr: any) => pr.merge_commit_sha)
        .map((pr: any) => pr.merge_commit_sha as string)
    );

    // 4. Normalize commits
    const commits: GitHubCommit[] = rawCommits.map((c: any) =>
      this.normalizeCommit(c, mergeCommitShas)
    );

    // 5. Normalize PRs — cap comment fetching to the most recent open PRs.
    // BUG-03: Fetch comments in sequential batches of 5 rather than all-at-once to
    // avoid flooding the API with up to MAX_PRS_WITH_COMMENTS concurrent requests.
    const openPRNumbers = new Set(
      rawPRs
        .filter((pr: any) => pr.state === 'open')
        .slice(0, MAX_PRS_WITH_COMMENTS)
        .map((pr: any) => pr.number)
    );
    const pullRequests: GitHubPR[] = await this.batchAsync(
      rawPRs,
      5,
      (pr: any) => this.normalizePR(pr, owner, repo, openPRNumbers)
    );

    // 6. Fetch PR size stats (changed_files, additions, deletions) for recent PRs.
    // The list API does not return these — requires individual pulls.get calls.
    // Cap at MAX_PR_STAT_FETCHES to avoid rate-limiting on very active repos.
    const prsToMeasure = pullRequests.slice(0, MAX_PR_STAT_FETCHES);
    await this.batchAsync(prsToMeasure, 5, async (pr) => {
      await this.enrichPRStats(pr, owner, repo);
    });

    // 7. Derive signals
    // BUG-09: staleThreshold is exactly STALE_HOURS before windowEnd, not windowStart.
    // A PR updated exactly at the threshold boundary (updatedAt === staleThreshold) is
    // NOT stale — use strict `<` so the boundary PR is excluded from stalePRs.
    const staleThreshold = new Date(windowEnd.getTime() - STALE_HOURS * 60 * 60 * 1000);
    const stalePRs = pullRequests.filter(
      pr => pr.state === 'open' && pr.updatedAt < staleThreshold
    );
    const heatedPRs = pullRequests.filter(pr => pr.commentCount > HEATED_COMMENT_THRESHOLD);
    const directCommits = commits.filter(c => c.isDirectToMain);
    const bigPRs = pullRequests.filter(
      pr =>
        pr.changedFiles >= thresholds.files ||
        pr.additions + pr.deletions >= thresholds.lines
    );

    return {
      owner,
      repo,
      defaultBranch,
      windowStart,
      windowEnd,
      pullRequests,
      commits,
      stalePRs,
      heatedPRs,
      directCommits,
      bigPRs,
      bigPRThresholds: thresholds,
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      return data.default_branch;
    } catch (err: any) {
      // BUG-01: Must `return` here so TypeScript sees that handleApiError (typed `never`)
      // always throws and this path never produces an implicit `undefined` return.
      return this.handleApiError(err, owner, repo);
    }
  }

  private async fetchPRs(owner: string, repo: string, since: Date): Promise<any[]> {
    return (this.octokit.paginate as any)(
      'GET /repos/{owner}/{repo}/pulls',
      { owner, repo, state: 'all', sort: 'updated', direction: 'desc', per_page: 100 },
      (response: any, done: () => void) => {
        const items: any[] = response.data;
        // BUG-04: Check only the LAST item on the page rather than `some`, which
        // could trigger early-exit when a boundary item at the exact `since` timestamp
        // shares a page with newer items. Since items are sorted descending by
        // updated_at, the last item is the oldest on this page.
        if (items.length > 0 && new Date(items[items.length - 1].updated_at) < since) {
          done();
        }
        return items.filter((pr: any) => new Date(pr.updated_at) >= since);
      }
    );
  }

  private async fetchCommits(
    owner: string,
    repo: string,
    sha: string,
    since: Date
  ): Promise<any[]> {
    // BUG-07: Use a page-map callback to cap total fetched commits at MAX_COMMITS and
    // avoid unbounded pagination on very active repositories.
    let accumulated = 0;
    return (this.octokit.paginate as any)(
      'GET /repos/{owner}/{repo}/commits',
      { owner, repo, sha, since: since.toISOString(), per_page: 100 },
      (response: any, done: () => void) => {
        const items: any[] = response.data;
        accumulated += items.length;
        if (accumulated >= MAX_COMMITS) {
          done();
        }
        return items;
      }
    );
  }

  private async normalizePR(
    pr: any,
    owner: string,
    repo: string,
    fetchCommentsFor?: Set<number>
  ): Promise<GitHubPR> {
    const state: 'open' | 'closed' | 'merged' = pr.merged_at
      ? 'merged'
      : (pr.state as 'open' | 'closed');

    const shouldFetchComments = pr.state === 'open' &&
      (fetchCommentsFor === undefined || fetchCommentsFor.has(pr.number));

    let comments: GitHubComment[] = [];
    if (shouldFetchComments) {
      const { data: rawComments } = await this.octokit.issues.listComments({
        owner,
        repo,
        issue_number: pr.number,
      });
      comments = rawComments.map((c: any) => ({
        author: c.user?.login ?? 'unknown',
        body: c.body ?? '',
        createdAt: new Date(c.created_at),
      }));
    }

    return {
      number: pr.number,
      title: pr.title,
      state,
      author: pr.user?.login ?? 'unknown',
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(pr.updated_at),
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      body: pr.body ?? null,
      // BUG-05: `pr.comments` is the GitHub issue-comment count only; it does NOT
      // include review comments (pr_review_comments). This is a GitHub API limitation.
      commentCount: pr.comments,
      comments,
      isDraft: pr.draft ?? false,
      headRef: pr.head?.ref ?? '',
      baseRef: pr.base?.ref ?? '',
      // Size stats default to 0; enriched by enrichPRStats() after initial normalization.
      changedFiles: 0,
      additions: 0,
      deletions: 0,
    };
  }

  /** Mutates `pr` in place with size stats from the individual PR endpoint. */
  private async enrichPRStats(pr: GitHubPR, owner: string, repo: string): Promise<void> {
    try {
      const { data } = await this.octokit.pulls.get({ owner, repo, pull_number: pr.number });
      pr.changedFiles = data.changed_files ?? 0;
      pr.additions = data.additions ?? 0;
      pr.deletions = data.deletions ?? 0;
    } catch {
      // Non-fatal — leave defaults at 0 if the individual fetch fails.
    }
  }

  private normalizeCommit(c: any, mergeCommitShas: Set<string>): GitHubCommit {
    const fullMessage: string = c.commit.message ?? '';
    const firstLine = fullMessage.split('\n')[0];

    return {
      sha: c.sha,
      message: firstLine,
      fullMessage,
      author: c.commit.author?.name ?? 'unknown',
      committedAt: new Date(c.commit.author?.date),
      // BUG-02: mergeCommitShas is populated only from PRs fetched within the current
      // time window. A commit whose corresponding PR merge occurred outside this window
      // will not appear in mergeCommitShas, causing it to be incorrectly flagged as a
      // direct-to-main commit. This is a known limitation of window-bounded fetching;
      // resolving it would require fetching all PRs ever merged, which is impractical.
      isDirectToMain: !mergeCommitShas.has(c.sha),
    };
  }

  private handleApiError(err: any, owner: string, repo: string): never {
    if (err.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found or access denied.`);
    }
    if (err.status === 401) {
      throw new Error(`GitHub authentication failed. Check your GITHUB_TOKEN.`);
    }
    if (err.status === 403) {
      // BUG-06: A 403 can mean rate-limit, SAML enforcement, or general permission
      // denial — distinguish by inspecting the error message when available.
      const apiMessage: string =
        err.response?.data?.message ?? err.message ?? '';
      if (/saml/i.test(apiMessage)) {
        throw new Error(
          `GitHub SAML enforcement requires SSO authorization for ${owner}/${repo}.`
        );
      }
      if (/resource not accessible/i.test(apiMessage) || /permission/i.test(apiMessage)) {
        throw new Error(
          `GitHub access denied for ${owner}/${repo}. Check token scopes.`
        );
      }
      // Default 403 fallback: assume rate limit (covers the common case and keeps
      // the existing test expectation of /rate limit/i intact).
      throw new Error(`GitHub rate limit exceeded. Please wait and try again.`);
    }
    throw err;
  }

  /**
   * BUG-03: Process an array with an async mapper in sequential batches of `batchSize`
   * to avoid issuing an unbounded number of concurrent API requests via Promise.all.
   */
  private async batchAsync<T, R>(
    items: T[],
    batchSize: number,
    mapper: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      const chunkResults = await Promise.all(chunk.map(mapper));
      results.push(...chunkResults);
    }
    return results;
  }
}
