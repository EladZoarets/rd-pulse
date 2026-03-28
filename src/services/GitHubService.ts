import { Octokit } from '@octokit/rest';
import { ActivityContext, GitHubPR, GitHubCommit, GitHubComment } from '../types';

const HEATED_COMMENT_THRESHOLD = 10;
const STALE_HOURS = 24;
const MAX_PRS_WITH_COMMENTS = 20;

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async fetchActivity(owner: string, repo: string, days: number = 1): Promise<ActivityContext> {
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

    // 5. Normalize PRs — cap comment fetching to the most recent open PRs
    const openPRNumbers = new Set(
      rawPRs
        .filter((pr: any) => pr.state === 'open')
        .slice(0, MAX_PRS_WITH_COMMENTS)
        .map((pr: any) => pr.number)
    );
    const pullRequests: GitHubPR[] = await Promise.all(
      rawPRs.map((pr: any) => this.normalizePR(pr, owner, repo, openPRNumbers))
    );

    // 6. Derive signals
    const staleThreshold = new Date(windowEnd.getTime() - STALE_HOURS * 60 * 60 * 1000);
    const stalePRs = pullRequests.filter(
      pr => pr.state === 'open' && pr.updatedAt < staleThreshold
    );
    const heatedPRs = pullRequests.filter(pr => pr.commentCount > HEATED_COMMENT_THRESHOLD);
    const directCommits = commits.filter(c => c.isDirectToMain);

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
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      return data.default_branch;
    } catch (err: any) {
      this.handleApiError(err, owner, repo);
    }
  }

  private async fetchPRs(owner: string, repo: string, since: Date): Promise<any[]> {
    return (this.octokit.paginate as any)(
      'GET /repos/{owner}/{repo}/pulls',
      { owner, repo, state: 'all', sort: 'updated', direction: 'desc', per_page: 100 },
      (response: any, done: () => void) => {
        const items: any[] = response.data;
        // Stop paginating once items fall outside our window
        if (items.some((pr: any) => new Date(pr.updated_at) < since)) {
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
    return (this.octokit.paginate as any)(
      'GET /repos/{owner}/{repo}/commits',
      { owner, repo, sha, since: since.toISOString(), per_page: 100 }
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
      commentCount: pr.comments,
      comments,
      isDraft: pr.draft ?? false,
      headRef: pr.head?.ref ?? '',
      baseRef: pr.base?.ref ?? '',
    };
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
      throw new Error(`GitHub rate limit exceeded. Please wait and try again.`);
    }
    throw err;
  }
}
