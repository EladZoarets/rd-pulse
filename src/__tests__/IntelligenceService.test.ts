import * as path from 'path';
import { IntelligenceService } from '../services/IntelligenceService';
import { ActivityContext, AnalysisResult } from '../types';

// Use the real prompt.md from the project root so tests exercise the actual prompt file.
const PROMPT_PATH = path.resolve(__dirname, '../../prompt.md');

// ── OpenAI mock ───────────────────────────────────────────────────────────────

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date('2024-06-15T12:00:00Z');
const YESTERDAY = new Date('2024-06-14T12:00:00Z');

const makeContext = (overrides: Partial<ActivityContext> = {}): ActivityContext => ({
  owner: 'acme',
  repo: 'backend',
  defaultBranch: 'main',
  windowStart: YESTERDAY,
  windowEnd: NOW,
  pullRequests: [
    {
      number: 1,
      title: 'feat: add auth',
      state: 'merged',
      author: 'alice',
      createdAt: YESTERDAY,
      updatedAt: NOW,
      mergedAt: NOW,
      body: 'Adds OAuth2 login',
      commentCount: 2,
      comments: [{ author: 'bob', body: 'LGTM', createdAt: NOW }],
      isDraft: false,
      headRef: 'feature/auth',
      baseRef: 'main',
      changedFiles: 3,
      additions: 50,
      deletions: 10,
    },
  ],
  commits: [
    {
      sha: 'abc123',
      message: 'feat: add auth',
      fullMessage: 'feat: add auth\n\nImplement OAuth2',
      author: 'alice',
      committedAt: NOW,
      isDirectToMain: false,
    },
  ],
  stalePRs: [],
  heatedPRs: [],
  directCommits: [],
  bigPRs: [],
  bigPRThresholds: { files: 50, lines: 500 },
  ghostWorkPRs: [],
  ...overrides,
});

const validLLMPayload = {
  featureThemes: [{ name: 'Auth', commits: ['feat: add auth'], summary: 'OAuth2 login added' }],
  keyAchievements: ['Auth merged'],
  workInProgress: [],
  risksAndBlockers: [],
  managersNote: 'Good progress on auth.',
};

const makeLLMReply = (payload = validLLMPayload) => ({
  choices: [{ message: { content: JSON.stringify(payload) } }],
  usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('IntelligenceService', () => {
  let service: IntelligenceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IntelligenceService('sk-test-key', 'gpt-4o', PROMPT_PATH);
  });

  describe('constructor', () => {
    it('throws when the prompt file does not exist', () => {
      expect(
        () => new IntelligenceService('sk-test-key', 'gpt-4o', '/nonexistent/prompt.md')
      ).toThrow(/System prompt file not found/);
    });
  });

  describe('analyze()', () => {
    it('calls OpenAI with a prompt containing the repo name', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMReply());

      await service.analyze(makeContext());

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const call = mockCreate.mock.calls[0][0];
      expect(call.model).toBe('gpt-4o');
      const systemMsg = call.messages.find((m: { role: string }) => m.role === 'system');
      expect(systemMsg).toBeDefined();
      expect(systemMsg.content).toContain('JSON');
      const userMsg = call.messages.find((m: { role: string }) => m.role === 'user');
      expect(userMsg).toBeDefined();
      expect(userMsg.content).toContain('acme/backend');
    });

    it('uses the custom model passed to the constructor', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMReply());
      const customService = new IntelligenceService('sk-test-key', 'gpt-4-turbo', PROMPT_PATH);

      await customService.analyze(makeContext());

      expect(mockCreate.mock.calls[0][0].model).toBe('gpt-4-turbo');
    });

    it('returns a correctly shaped AnalysisResult', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMReply());

      const result = await service.analyze(makeContext());

      expect(result.repo).toBe('acme/backend');
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(Array.isArray(result.featureThemes)).toBe(true);
      expect(Array.isArray(result.keyAchievements)).toBe(true);
      expect(Array.isArray(result.workInProgress)).toBe(true);
      expect(Array.isArray(result.risksAndBlockers)).toBe(true);
      expect(typeof result.managersNote).toBe('string');
      expect(typeof result.rawLLMResponse).toBe('string');
    });

    it('stores the raw LLM response string in rawLLMResponse', async () => {
      const rawContent = JSON.stringify(validLLMPayload);
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: rawContent } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const result = await service.analyze(makeContext());

      expect(result.rawLLMResponse).toBe(rawContent);
    });

    it('sets generatedAt to current time using fake timers', async () => {
      jest.useFakeTimers();
      const fakeNow = new Date('2024-07-01T09:00:00Z');
      jest.setSystemTime(fakeNow);

      mockCreate.mockResolvedValueOnce(makeLLMReply());
      const result = await service.analyze(makeContext());

      expect(result.generatedAt).toEqual(fakeNow);
      jest.useRealTimers();
    });

    it('throws a human-readable error when OpenAI call fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(service.analyze(makeContext())).rejects.toThrow(/OpenAI analysis failed/);
    });

    it('throws a human-readable error when choices array is empty', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [],
        usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
      });

      await expect(service.analyze(makeContext())).rejects.toThrow(/OpenAI analysis failed/);
    });

    it('throws a human-readable error when response content is null', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
        usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
      });

      await expect(service.analyze(makeContext())).rejects.toThrow(/OpenAI analysis failed/);
    });

    it('throws a human-readable error when response JSON is malformed', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'not valid json }{' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      await expect(service.analyze(makeContext())).rejects.toThrow(/OpenAI analysis failed/);
    });

    it('includes PR titles and commit messages in the user prompt', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMReply());

      await service.analyze(makeContext());

      const userMsg = mockCreate.mock.calls[0][0].messages.find(
        (m: { role: string }) => m.role === 'user'
      );
      expect(userMsg.content).toContain('feat: add auth');
    });

    it('falls back to empty arrays when LLM returns wrong types for array fields', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                featureThemes: 'not an array',
                keyAchievements: 42,
                workInProgress: null,
                risksAndBlockers: { key: 'val' },
                managersNote: 'Fine.',
              }),
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const result = await service.analyze(makeContext());

      expect(result.featureThemes).toEqual([]);
      expect(result.keyAchievements).toEqual([]);
      expect(result.workInProgress).toEqual([]);
      expect(result.risksAndBlockers).toEqual([]);
      expect(result.managersNote).toBe('Fine.');
    });

    it('falls back to empty string when LLM returns wrong type for managersNote', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({ ...validLLMPayload, managersNote: 999 }),
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const result = await service.analyze(makeContext());

      expect(result.managersNote).toBe('');
    });

    it('does not emit a ## Flags header when stalePRs, heatedPRs, and directCommits are all empty', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMReply());

      await service.analyze(makeContext());

      const userMsg = mockCreate.mock.calls[0][0].messages.find(
        (m: { role: string }) => m.role === 'user'
      );
      expect(userMsg.content).not.toContain('## Flags');
    });

    it('includes the ## Flags section when stale PRs exist', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMReply());
      const stalePR = makeContext().pullRequests[0];
      const ctx = makeContext({ stalePRs: [stalePR] });

      await service.analyze(ctx);

      const userMsg = mockCreate.mock.calls[0][0].messages.find(
        (m: { role: string }) => m.role === 'user'
      );
      expect(userMsg.content).toContain('## Flags');
      expect(userMsg.content).toContain('Stale PRs');
    });

    it('trims prompt and stays within budget when payload is very large', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMReply());

      // 600 PRs each with a ~600-char body pushes the full prompt past 320k chars
      const largePRList = Array.from({ length: 600 }, (_, i) => ({
        number: i + 1,
        title: `feat: feature ${i}`,
        state: 'merged' as const,
        author: 'dev',
        createdAt: YESTERDAY,
        updatedAt: NOW,
        mergedAt: NOW,
        body: 'A'.repeat(600),
        commentCount: 0,
        comments: [],
        isDraft: false,
        headRef: `feature/${i}`,
        baseRef: 'main',
        changedFiles: 0,
        additions: 0,
        deletions: 0,
      }));

      const ctx = makeContext({ pullRequests: largePRList });
      await service.analyze(ctx);

      const userMsg = mockCreate.mock.calls[0][0].messages.find(
        (m: { role: string }) => m.role === 'user'
      );
      expect(userMsg.content.length).toBeLessThanOrEqual(320_000);
    });

    it('handles commits with null sha without throwing', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMReply());
      const ctx = makeContext({
        commits: [
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sha: null as any,
            message: 'feat: submodule update',
            fullMessage: 'feat: submodule update',
            author: 'bot',
            committedAt: NOW,
            isDirectToMain: false,
          },
        ],
      });

      const result = await service.analyze(ctx);

      expect(result.repo).toBe('acme/backend');
      const userMsg = mockCreate.mock.calls[0][0].messages.find(
        (m: { role: string }) => m.role === 'user'
      );
      expect(userMsg.content).toContain('unknown');
    });

    it('skips empty comment bodies in the PR section', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMReply());
      const ctx = makeContext({
        pullRequests: [
          {
            number: 1,
            title: 'feat: add auth',
            state: 'open',
            author: 'alice',
            createdAt: YESTERDAY,
            updatedAt: NOW,
            mergedAt: null,
            body: null,
            commentCount: 1,
            comments: [{ author: 'bot', body: '', createdAt: NOW }],
            isDraft: false,
            headRef: 'feat/auth',
            baseRef: 'main',
            changedFiles: 0,
            additions: 0,
            deletions: 0,
          },
        ],
      });

      await service.analyze(ctx);

      const userMsg = mockCreate.mock.calls[0][0].messages.find(
        (m: { role: string }) => m.role === 'user'
      );
      // Empty comment body should not produce a bullet line
      expect(userMsg.content).not.toContain('  - bot:');
    });
  });
});
