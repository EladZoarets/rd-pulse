// jest.mock calls are hoisted — factory functions must not reference outer-scope variables
jest.mock('../services/GitHubService', () => ({
  GitHubService: jest.fn(),
  DEFAULT_BIG_PR_THRESHOLDS: { files: 50, lines: 500 },
}));
jest.mock('../services/JiraService', () => ({
  JiraService: jest.fn(),
}));
jest.mock('../services/IntelligenceService', () => ({
  IntelligenceService: jest.fn(),
}));
jest.mock('../services/FormatterService', () => ({
  FormatterService: jest.fn(),
}));
jest.mock('../services/HtmlFormatterService', () => ({
  HtmlFormatterService: jest.fn(),
}));
jest.mock('fs', () => ({ writeFileSync: jest.fn() }));
jest.mock('../utils/logger', () => ({
  printHeader: jest.fn(),
  log: jest.fn(),
  handleFatalError: jest.fn(),
}));

import * as fs from 'fs';
import { runPulse } from '../index';
import { GitHubService } from '../services/GitHubService';
import { JiraService } from '../services/JiraService';
import { IntelligenceService } from '../services/IntelligenceService';
import { FormatterService } from '../services/FormatterService';
import { HtmlFormatterService } from '../services/HtmlFormatterService';
import { handleFatalError } from '../utils/logger';
import { PulseOptions } from '../types';

// ── Typed mock refs ───────────────────────────────────────────────────────────

const MockGitHubService = GitHubService as jest.MockedClass<typeof GitHubService>;
const MockJiraService = JiraService as jest.MockedClass<typeof JiraService>;
const MockIntelligenceService = IntelligenceService as jest.MockedClass<typeof IntelligenceService>;
const MockFormatterService = FormatterService as jest.MockedClass<typeof FormatterService>;
const MockHtmlFormatterService = HtmlFormatterService as jest.MockedClass<typeof HtmlFormatterService>;
const mockWriteFileSync = fs.writeFileSync as jest.Mock;
const mockHandleFatalError = handleFatalError as unknown as jest.Mock;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_ENV: NodeJS.ProcessEnv = {
  GITHUB_TOKEN: 'ghp-test',
  OPENAI_API_KEY: 'sk-test',
  JIRA_DOMAIN: 'https://acme.atlassian.net',
  JIRA_EMAIL: 'dev@acme.com',
  JIRA_TOKEN: 'jira-token-test',
};

const makeOpts = (overrides: Partial<PulseOptions> = {}): PulseOptions => ({
  owner: 'acme',
  repo: 'backend',
  board: '42',
  days: 1,
  format: 'md',
  model: 'gpt-4o',
  ...overrides,
});

const FAKE_GITHUB_CTX = {
  owner: 'acme', repo: 'backend', defaultBranch: 'main',
  windowStart: new Date(), windowEnd: new Date(),
  pullRequests: [], commits: [], stalePRs: [], heatedPRs: [],
  directCommits: [], bigPRs: [], bigPRThresholds: { files: 50, lines: 500 },
  ghostWorkPRs: [],
};

const FAKE_JIRA_CTX = {
  boardId: '42', sprintId: 1, sprintName: 'Sprint 1', sprintEndDate: null,
  todoIssues: [], inProgressIssues: [], doneIssues: [],
};

const FAKE_REPORT = {
  repo: 'acme/backend', boardId: '42', generatedAt: new Date(),
  summary: 'On track.', topicBreakdown: [], risks: [], personalPulse: [],
  managersNote: 'Good.', rawLLMResponse: '{}',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runPulse()', () => {
  let mockFetchActivity: jest.Mock;
  let mockFetchSprintContext: jest.Mock;
  let mockAnalyzeUnified: jest.Mock;
  let mockFormatUnified: jest.Mock;
  let mockHtmlFormatUnified: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // handleFatalError throws so execution halts like process.exit would
    mockHandleFatalError.mockImplementation((err: unknown) => {
      throw err instanceof Error ? err : new Error(String(err));
    });

    mockFetchActivity = jest.fn().mockResolvedValue(FAKE_GITHUB_CTX);
    mockFetchSprintContext = jest.fn().mockResolvedValue(FAKE_JIRA_CTX);
    mockAnalyzeUnified = jest.fn().mockResolvedValue(FAKE_REPORT);
    mockFormatUnified = jest.fn().mockReturnValue('# Pulse Report');
    mockHtmlFormatUnified = jest.fn().mockReturnValue('<html>report</html>');

    MockGitHubService.mockImplementation(() => ({ fetchActivity: mockFetchActivity } as unknown as GitHubService));
    MockJiraService.mockImplementation(() => ({ fetchSprintContext: mockFetchSprintContext } as unknown as JiraService));
    MockIntelligenceService.mockImplementation(() => ({ analyzeUnified: mockAnalyzeUnified } as unknown as IntelligenceService));
    MockFormatterService.mockImplementation(() => ({ formatUnified: mockFormatUnified } as unknown as FormatterService));
    MockHtmlFormatterService.mockImplementation(() => ({ formatUnified: mockHtmlFormatUnified } as unknown as HtmlFormatterService));
  });

  // ── Env validation ────────────────────────────────────────────────────────

  it('calls handleFatalError when GITHUB_TOKEN is missing', async () => {
    await expect(runPulse(makeOpts(), { ...VALID_ENV, GITHUB_TOKEN: undefined })).rejects.toThrow();
    expect(mockHandleFatalError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('GITHUB_TOKEN') }),
      'startup'
    );
  });

  it('calls handleFatalError when OPENAI_API_KEY is missing', async () => {
    await expect(runPulse(makeOpts(), { ...VALID_ENV, OPENAI_API_KEY: undefined })).rejects.toThrow();
    expect(mockHandleFatalError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('OPENAI_API_KEY') }),
      'startup'
    );
  });

  it('calls handleFatalError when JIRA_DOMAIN is missing', async () => {
    await expect(runPulse(makeOpts(), { ...VALID_ENV, JIRA_DOMAIN: undefined })).rejects.toThrow();
    expect(mockHandleFatalError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('JIRA_DOMAIN') }),
      'startup'
    );
  });

  it('calls handleFatalError when JIRA_EMAIL is missing', async () => {
    await expect(runPulse(makeOpts(), { ...VALID_ENV, JIRA_EMAIL: undefined })).rejects.toThrow();
    expect(mockHandleFatalError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('JIRA_EMAIL') }),
      'startup'
    );
  });

  it('calls handleFatalError when JIRA_TOKEN is missing', async () => {
    await expect(runPulse(makeOpts(), { ...VALID_ENV, JIRA_TOKEN: undefined })).rejects.toThrow();
    expect(mockHandleFatalError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('JIRA_TOKEN') }),
      'startup'
    );
  });

  it('calls handleFatalError when --days is not a positive integer', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(runPulse(makeOpts({ days: 'abc' as any }), VALID_ENV)).rejects.toThrow();
    expect(mockHandleFatalError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('--days') }),
      'startup'
    );
  });

  it('calls handleFatalError when --format is invalid', async () => {
    await expect(runPulse(makeOpts({ format: 'pdf' }), VALID_ENV)).rejects.toThrow();
    expect(mockHandleFatalError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('--format') }),
      'startup'
    );
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('calls all services in order on the happy path', async () => {
    await runPulse(makeOpts(), VALID_ENV);

    expect(mockFetchActivity).toHaveBeenCalledWith('acme', 'backend', 1, expect.any(Object));
    expect(mockFetchSprintContext).toHaveBeenCalledWith('42', {});
    expect(mockAnalyzeUnified).toHaveBeenCalledWith({ github: FAKE_GITHUB_CTX, jira: FAKE_JIRA_CTX });
    expect(mockFormatUnified).toHaveBeenCalledWith(FAKE_REPORT);
    expect(mockWriteFileSync).toHaveBeenCalledWith('PULSE_REPORT.md', '# Pulse Report', 'utf8');
  });

  it('uses HtmlFormatterService when --format is html', async () => {
    await runPulse(makeOpts({ format: 'html' }), VALID_ENV);
    expect(mockHtmlFormatUnified).toHaveBeenCalledWith(FAKE_REPORT);
    expect(mockFormatUnified).not.toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledWith('PULSE_REPORT.html', '<html>report</html>', 'utf8');
  });

  it('defaults output to PULSE_REPORT.md for md format', async () => {
    await runPulse(makeOpts({ format: 'md' }), VALID_ENV);
    expect(mockWriteFileSync).toHaveBeenCalledWith('PULSE_REPORT.md', expect.any(String), 'utf8');
  });

  it('defaults output to PULSE_REPORT.html for html format', async () => {
    await runPulse(makeOpts({ format: 'html' }), VALID_ENV);
    expect(mockWriteFileSync).toHaveBeenCalledWith('PULSE_REPORT.html', expect.any(String), 'utf8');
  });

  it('uses a custom --output path when provided', async () => {
    await runPulse(makeOpts({ output: 'custom/report.md' }), VALID_ENV);
    expect(mockWriteFileSync).toHaveBeenCalledWith('custom/report.md', expect.any(String), 'utf8');
  });

  it('passes parsed --jira-fields to fetchSprintContext', async () => {
    await runPulse(makeOpts({ jiraFields: 'summary,status,assignee' }), VALID_ENV);
    expect(mockFetchSprintContext).toHaveBeenCalledWith('42', {
      fields: ['summary', 'status', 'assignee'],
    });
  });

  it('passes --jira-sp-field to fetchSprintContext', async () => {
    await runPulse(makeOpts({ jiraSpField: 'customfield_10016' }), VALID_ENV);
    expect(mockFetchSprintContext).toHaveBeenCalledWith('42', {
      storyPointsField: 'customfield_10016',
    });
  });

  it('trims whitespace from comma-separated --jira-fields', async () => {
    await runPulse(makeOpts({ jiraFields: ' summary , status ' }), VALID_ENV);
    expect(mockFetchSprintContext).toHaveBeenCalledWith('42', {
      fields: ['summary', 'status'],
    });
  });

  it('calls handleFatalError with "pulse" context when a service throws', async () => {
    mockFetchActivity.mockRejectedValueOnce(new Error('GitHub API down'));
    await expect(runPulse(makeOpts(), VALID_ENV)).rejects.toThrow('GitHub API down');
    expect(mockHandleFatalError).toHaveBeenCalledWith(expect.any(Error), 'pulse');
  });
});
