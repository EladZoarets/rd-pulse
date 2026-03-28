import { GitHubService } from '../services/GitHubService';
import { ActivityContext, GitHubPR, GitHubCommit } from '../types';

// ── Octokit mock ──────────────────────────────────────────────────────────────

jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => mockOctokit),
  };
});

const mockOctokit = {
  repos: {
    get: jest.fn(),
  },
  paginate: jest.fn(),
  issues: {
    listComments: jest.fn(),
  },
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date('2024-06-15T12:00:00Z');
const YESTERDAY = new Date('2024-06-14T12:00:00Z');
const TWO_DAYS_AGO = new Date('2024-06-13T12:00:00Z');

const makeRawPR = (overrides: Partial<Record<string, unknown>> = {}) => ({
  number: 1,
  title: 'feat: add login',
  state: 'open',
  user: { login: 'alice' },
  created_at: YESTERDAY.toISOString(),
  updated_at: NOW.toISOString(),
  merged_at: null,
  body: 'Adds login flow',
  comments: 3,
  draft: false,
  head: { ref: 'feature/login' },
  base: { ref: 'main' },
  ...overrides,
});

const makeRawCommit = (overrides: Partial<Record<string, unknown>> = {}) => ({
  sha: 'abc123',
  commit: {
    message: 'fix: correct typo\n\nMore details here',
    author: { name: 'bob', date: NOW.toISOString() },
  },
  ...overrides,
});

const makeRawComment = (overrides: Partial<Record<string, unknown>> = {}) => ({
  user: { login: 'carol' },
  body: 'LGTM',
  created_at: NOW.toISOString(),
  ...overrides,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupDefaultMocks() {
  mockOctokit.repos.get.mockResolvedValue({
    data: { default_branch: 'main' },
  });
  mockOctokit.paginate.mockImplementation((fn: unknown, params: Record<string, unknown>) => {
    // Return PRs or commits based on the URL pattern in params
    if (params && 'state' in params) {
      return Promise.resolve([makeRawPR()]);
    }
    return Promise.resolve([makeRawCommit()]);
  });
  mockOctokit.issues.listComments.mockResolvedValue({ data: [makeRawComment()] });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GitHubService', () => {
  let service: GitHubService;

  beforeEach(() => {
    service = new GitHubService('fake-token');
    setupDefaultMocks();
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Construction ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('initializes without throwing', () => {
      expect(() => new GitHubService('token')).not.toThrow();
    });
  });

  // ── fetchActivity — shape ───────────────────────────────────────────────────

  describe('fetchActivity — return shape', () => {
    it('returns an ActivityContext with the correct owner and repo', async () => {
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.owner).toBe('acme');
      expect(result.repo).toBe('backend');
    });

    it('includes the default branch from the GitHub API', async () => {
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.defaultBranch).toBe('main');
    });

    it('sets windowEnd to now and windowStart to (days * 24h) ago', async () => {
      const result = await service.fetchActivity('acme', 'backend', 1);
      const expectedStart = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
      expect(result.windowEnd.getTime()).toBeCloseTo(NOW.getTime(), -3);
      expect(result.windowStart.getTime()).toBeCloseTo(expectedStart.getTime(), -3);
    });

    it('respects the days parameter for the window start', async () => {
      const result = await service.fetchActivity('acme', 'backend', 3);
      const expectedStart = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(result.windowStart.getTime()).toBeCloseTo(expectedStart.getTime(), -3);
    });
  });

  // ── fetchActivity — pull requests ───────────────────────────────────────────

  describe('fetchActivity — pull requests', () => {
    it('returns normalized PRs in pullRequests array', async () => {
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.pullRequests).toHaveLength(1);
    });

    it('normalizes PR fields correctly', async () => {
      const result = await service.fetchActivity('acme', 'backend');
      const pr: GitHubPR = result.pullRequests[0];
      expect(pr.number).toBe(1);
      expect(pr.title).toBe('feat: add login');
      expect(pr.state).toBe('open');
      expect(pr.author).toBe('alice');
      expect(pr.body).toBe('Adds login flow');
      expect(pr.isDraft).toBe(false);
      expect(pr.headRef).toBe('feature/login');
      expect(pr.baseRef).toBe('main');
      expect(pr.mergedAt).toBeNull();
      expect(pr.createdAt).toBeInstanceOf(Date);
      expect(pr.updatedAt).toBeInstanceOf(Date);
    });

    it('maps merged PRs with state "merged"', async () => {
      mockOctokit.paginate.mockImplementationOnce(() =>
        Promise.resolve([makeRawPR({ state: 'closed', merged_at: NOW.toISOString() })])
      );
      mockOctokit.paginate.mockImplementationOnce(() => Promise.resolve([]));
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.pullRequests[0].state).toBe('merged');
    });

    it('attaches fetched comments to each open PR', async () => {
      const result = await service.fetchActivity('acme', 'backend');
      const pr = result.pullRequests[0];
      expect(pr.comments).toHaveLength(1);
      expect(pr.comments[0].author).toBe('carol');
      expect(pr.comments[0].body).toBe('LGTM');
    });

    it('does not fetch comments for closed/merged PRs', async () => {
      mockOctokit.paginate.mockImplementationOnce(() =>
        Promise.resolve([makeRawPR({ state: 'closed', merged_at: null })])
      );
      mockOctokit.paginate.mockImplementationOnce(() => Promise.resolve([]));
      await service.fetchActivity('acme', 'backend');
      expect(mockOctokit.issues.listComments).not.toHaveBeenCalled();
    });
  });

  // ── fetchActivity — commits ─────────────────────────────────────────────────

  describe('fetchActivity — commits', () => {
    it('returns normalized commits in commits array', async () => {
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.commits).toHaveLength(1);
    });

    it('normalizes commit fields correctly', async () => {
      const result = await service.fetchActivity('acme', 'backend');
      const commit: GitHubCommit = result.commits[0];
      expect(commit.sha).toBe('abc123');
      expect(commit.message).toBe('fix: correct typo');
      expect(commit.fullMessage).toBe('fix: correct typo\n\nMore details here');
      expect(commit.author).toBe('bob');
      expect(commit.committedAt).toBeInstanceOf(Date);
    });
  });

  // ── fetchActivity — derived signals ────────────────────────────────────────

  describe('fetchActivity — derived signals', () => {
    it('flags PRs with >10 comments as heatedPRs', async () => {
      mockOctokit.paginate.mockImplementationOnce(() =>
        Promise.resolve([makeRawPR({ comments: 11 })])
      );
      mockOctokit.paginate.mockImplementationOnce(() => Promise.resolve([]));
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.heatedPRs).toHaveLength(1);
      expect(result.heatedPRs[0].number).toBe(1);
    });

    it('does not flag PRs with ≤10 comments as heated', async () => {
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.heatedPRs).toHaveLength(0);
    });

    it('flags open PRs with no activity in the last 24h as stalePRs', async () => {
      mockOctokit.paginate.mockImplementationOnce(() =>
        Promise.resolve([makeRawPR({ updated_at: TWO_DAYS_AGO.toISOString() })])
      );
      mockOctokit.paginate.mockImplementationOnce(() => Promise.resolve([]));
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.stalePRs).toHaveLength(1);
    });

    it('does not flag recently updated open PRs as stale', async () => {
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.stalePRs).toHaveLength(0);
    });

    it('marks commits as direct-to-main when not associated with any PR merge commit', async () => {
      // PR has a different merge commit sha — so abc123 is a direct commit
      mockOctokit.paginate.mockImplementationOnce(() =>
        Promise.resolve([makeRawPR({ merge_commit_sha: 'different-sha' })])
      );
      mockOctokit.paginate.mockImplementationOnce(() =>
        Promise.resolve([makeRawCommit({ sha: 'abc123' })])
      );
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.directCommits).toHaveLength(1);
      expect(result.commits[0].isDirectToMain).toBe(true);
    });

    it('does not flag PR merge commits as direct-to-main', async () => {
      mockOctokit.paginate.mockImplementationOnce(() =>
        Promise.resolve([makeRawPR({ merge_commit_sha: 'abc123' })])
      );
      mockOctokit.paginate.mockImplementationOnce(() =>
        Promise.resolve([makeRawCommit({ sha: 'abc123' })])
      );
      const result = await service.fetchActivity('acme', 'backend');
      expect(result.directCommits).toHaveLength(0);
      expect(result.commits[0].isDirectToMain).toBe(false);
    });
  });

  // ── fetchActivity — error handling ──────────────────────────────────────────

  describe('fetchActivity — error handling', () => {
    it('throws a readable error when the repo is not found (404)', async () => {
      mockOctokit.repos.get.mockRejectedValue({ status: 404 });
      await expect(service.fetchActivity('acme', 'nonexistent')).rejects.toThrow(
        /not found|access denied/i
      );
    });

    it('throws a readable error on auth failure (401)', async () => {
      mockOctokit.repos.get.mockRejectedValue({ status: 401 });
      await expect(service.fetchActivity('acme', 'backend')).rejects.toThrow(
        /authentication|token/i
      );
    });

    it('throws a readable error on rate limit (403)', async () => {
      mockOctokit.repos.get.mockRejectedValue({ status: 403 });
      await expect(service.fetchActivity('acme', 'backend')).rejects.toThrow(
        /rate limit/i
      );
    });
  });
});
