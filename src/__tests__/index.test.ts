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
jest.mock('../services/ReportSenderService', () => ({
  ReportSenderService: jest.fn(),
}));
jest.mock('../services/LicenseService', () => ({
  LicenseService: jest.fn().mockImplementation(() => ({
    getStatus: jest.fn().mockReturnValue({ active: true, expired: false, daysRemaining: 14, runs: 0 }),
    formatBanner: jest.fn().mockReturnValue('  🟢 rd-pulse trial — 14 days remaining (run 1)'),
    htmlWatermark: jest.fn().mockReturnValue(''),
    recordRun: jest.fn(),
  })),
}));
jest.mock('fs', () => ({ writeFileSync: jest.fn() }));
jest.mock('../utils/logger', () => ({
  printHeader: jest.fn(),
  log: jest.fn(),
  handleFatalError: jest.fn(),
}));

import * as fs from 'fs';
import { runPulse, buildIngestPayload } from '../index';
import { GitHubService } from '../services/GitHubService';
import { JiraService } from '../services/JiraService';
import { IntelligenceService } from '../services/IntelligenceService';
import { FormatterService } from '../services/FormatterService';
import { HtmlFormatterService } from '../services/HtmlFormatterService';
import { ReportSenderService } from '../services/ReportSenderService';
import { handleFatalError } from '../utils/logger';
import { PulseOptions } from '../types';

// ── Typed mock refs ───────────────────────────────────────────────────────────

const MockGitHubService = GitHubService as jest.MockedClass<typeof GitHubService>;
const MockJiraService = JiraService as jest.MockedClass<typeof JiraService>;
const MockIntelligenceService = IntelligenceService as jest.MockedClass<typeof IntelligenceService>;
const MockFormatterService = FormatterService as jest.MockedClass<typeof FormatterService>;
const MockHtmlFormatterService = HtmlFormatterService as jest.MockedClass<typeof HtmlFormatterService>;
const MockReportSenderService = ReportSenderService as jest.MockedClass<typeof ReportSenderService>;
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

const SENDER_ENV: NodeJS.ProcessEnv = {
  ...VALID_ENV,
  RDPULSE_SERVER: 'https://api.rdpulse.io',
  WORKSPACE_ID: 'ws-001',
  RDPULSE_JWT: 'jwt-test',
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
  summary: 'On track.', githubHighlights: [], topicBreakdown: [], risks: [], personalPulse: [],
  managersNote: 'Good.', rawLLMResponse: '{}',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runPulse()', () => {
  let mockFetchActivity: jest.Mock;
  let mockFetchSprintContext: jest.Mock;
  let mockAnalyzeUnified: jest.Mock;
  let mockFormatUnified: jest.Mock;
  let mockHtmlFormatUnified: jest.Mock;
  let mockSendHeartbeat: jest.Mock;
  let mockSendReport: jest.Mock;

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
    mockSendHeartbeat = jest.fn().mockResolvedValue(undefined);
    mockSendReport = jest.fn().mockResolvedValue(undefined);

    MockGitHubService.mockImplementation(() => ({ fetchActivity: mockFetchActivity } as unknown as GitHubService));
    MockJiraService.mockImplementation(() => ({ fetchSprintContext: mockFetchSprintContext } as unknown as JiraService));
    MockIntelligenceService.mockImplementation(() => ({ analyzeUnified: mockAnalyzeUnified } as unknown as IntelligenceService));
    MockFormatterService.mockImplementation(() => ({ formatUnified: mockFormatUnified } as unknown as FormatterService));
    MockHtmlFormatterService.mockImplementation(() => ({ formatUnified: mockHtmlFormatUnified } as unknown as HtmlFormatterService));
    MockReportSenderService.mockImplementation(() => ({
      sendHeartbeat: mockSendHeartbeat,
      sendReport: mockSendReport,
    } as unknown as ReportSenderService));
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
    expect(mockHtmlFormatUnified).toHaveBeenCalledWith(FAKE_REPORT, { owner: 'acme', repo: 'backend', jiraDomain: 'https://acme.atlassian.net' }, '');
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

  // ── ReportSenderService wiring ────────────────────────────────────────────

  it('does not create ReportSenderService when sender env vars are absent', async () => {
    await runPulse(makeOpts(), VALID_ENV);
    expect(MockReportSenderService).not.toHaveBeenCalled();
  });

  it('creates ReportSenderService and calls sendHeartbeat when sender env vars are present', async () => {
    await runPulse(makeOpts(), SENDER_ENV);
    expect(MockReportSenderService).toHaveBeenCalledWith(
      'https://api.rdpulse.io', 'ws-001', 'jwt-test'
    );
    expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
  });

  it('calls sendReport after analysis when sender env vars are present', async () => {
    await runPulse(makeOpts(), SENDER_ENV);
    expect(mockSendReport).toHaveBeenCalledTimes(1);
    const payload = mockSendReport.mock.calls[0][0];
    expect(payload.workspaceId).toBe('ws-001');
    expect(payload.reportType).toBe('unified_sprint');
    expect(['good', 'at_risk', 'critical']).toContain(payload.summary.health);
  });

  it('sendHeartbeat is called before fetchActivity', async () => {
    const order: string[] = [];
    mockSendHeartbeat.mockImplementation(async () => { order.push('heartbeat'); });
    mockFetchActivity.mockImplementation(async () => { order.push('fetchActivity'); return FAKE_GITHUB_CTX; });
    await runPulse(makeOpts(), SENDER_ENV);
    expect(order.indexOf('heartbeat')).toBeLessThan(order.indexOf('fetchActivity'));
  });

  it('pipeline continues and writes file even when sendHeartbeat fails', async () => {
    mockSendHeartbeat.mockRejectedValueOnce(new Error('server down'));
    await runPulse(makeOpts(), SENDER_ENV);
    expect(mockWriteFileSync).toHaveBeenCalled();
  });

  it('pipeline continues and writes file even when sendReport fails', async () => {
    mockSendReport.mockRejectedValueOnce(new Error('ingest error'));
    await runPulse(makeOpts(), SENDER_ENV);
    expect(mockWriteFileSync).toHaveBeenCalled();
  });
});

// ── buildIngestPayload ─────────────────────────────────────────────────────────

describe('buildIngestPayload()', () => {
  const baseGithubCtx = {
    ...{
      owner: 'acme', repo: 'backend', defaultBranch: 'main',
      windowStart: new Date('2026-04-06T00:00:00Z'),
      windowEnd: new Date('2026-04-12T23:59:59Z'),
      pullRequests: [], commits: [], stalePRs: [], heatedPRs: [],
      directCommits: [], bigPRs: [], bigPRThresholds: { files: 50, lines: 500 },
      ghostWorkPRs: [],
    },
  };

  const baseReport = {
    repo: 'acme/backend', boardId: '42',
    generatedAt: new Date('2026-04-13T10:00:00Z'),
    summary: 'Sprint on track.',
    githubHighlights: [], topicBreakdown: [], risks: [], personalPulse: [],
    managersNote: 'Good.', rawLLMResponse: '{}',
  };

  it('sets workspaceId, reportType, windowStart, windowEnd, generatedAt correctly', () => {
    const payload = buildIngestPayload(baseReport, baseGithubCtx, 'ws-001');
    expect(payload.workspaceId).toBe('ws-001');
    expect(payload.reportType).toBe('unified_sprint');
    expect(payload.windowStart).toBe('2026-04-06T00:00:00.000Z');
    expect(payload.windowEnd).toBe('2026-04-12T23:59:59.000Z');
    expect(payload.generatedAt).toBe('2026-04-13T10:00:00.000Z');
  });

  it('derives health=good when no risks', () => {
    const payload = buildIngestPayload({ ...baseReport, risks: [] }, baseGithubCtx, 'ws-001');
    expect(payload.summary.health).toBe('good');
  });

  it('derives health=at_risk when there is a high severity risk', () => {
    const report = {
      ...baseReport,
      risks: [{ type: 'STALL' as const, severity: 'high' as const, description: 'Stalled.' }],
    };
    const payload = buildIngestPayload(report, baseGithubCtx, 'ws-001');
    expect(payload.summary.health).toBe('at_risk');
  });

  it('derives health=critical when there is a high severity SPRINT_JEOPARDY risk', () => {
    const report = {
      ...baseReport,
      risks: [{ type: 'SPRINT_JEOPARDY' as const, severity: 'high' as const, description: 'Sprint in jeopardy.' }],
    };
    const payload = buildIngestPayload(report, baseGithubCtx, 'ws-001');
    expect(payload.summary.health).toBe('critical');
  });

  it('uses summary string as headline', () => {
    const payload = buildIngestPayload(baseReport, baseGithubCtx, 'ws-001');
    expect(payload.summary.headline).toBe('Sprint on track.');
  });

  it('maps risks with lowercase type and first sentence as title', () => {
    const report = {
      ...baseReport,
      risks: [{ type: 'GHOST_WORK' as const, severity: 'low' as const, description: 'No Jira ticket found. Check PRs.' }],
    };
    const payload = buildIngestPayload(report, baseGithubCtx, 'ws-001');
    expect(payload.risks[0].type).toBe('ghost_work');
    expect(payload.risks[0].title).toBe('No Jira ticket found');
    expect(payload.risks[0].links).toEqual([]);
  });

  it('maps githubHighlights to insights', () => {
    const report = {
      ...baseReport,
      githubHighlights: [{ type: 'PR_MERGED' as const, ref: 'PR #42', author: 'alice', description: 'Auth middleware merged.' }],
    };
    const payload = buildIngestPayload(report, baseGithubCtx, 'ws-001');
    expect(payload.insights[0].type).toBe('pr_merged');
    expect(payload.insights[0].description).toBe('Auth middleware merged.');
  });

  // ── sprintData ────────────────────────────────────────────────────────────

  it('omits sprintData when jiraCtx is not provided', () => {
    const payload = buildIngestPayload(baseReport, baseGithubCtx, 'ws-001');
    expect(payload.sprintData).toBeUndefined();
  });

  it('omits sprintData when jiraCtx has zero issues', () => {
    const emptyJira = {
      boardId: '42', sprintId: 1, sprintName: 'Sprint 1', sprintEndDate: null,
      todoIssues: [], inProgressIssues: [], doneIssues: [],
    };
    const payload = buildIngestPayload(baseReport, baseGithubCtx, 'ws-001', emptyJira);
    expect(payload.sprintData).toBeUndefined();
  });

  it('computes overallPercent from done/total', () => {
    const jiraCtx = {
      boardId: '42', sprintId: 1, sprintName: 'Sprint 1', sprintEndDate: null,
      doneIssues: [
        { key: 'A-1', summary: 'Done1', status: 'DONE' as const, issueType: 'Story', assignee: 'Alice', storyPoints: null, labels: [], epicKey: null, epicName: null },
        { key: 'A-2', summary: 'Done2', status: 'DONE' as const, issueType: 'Story', assignee: 'Bob', storyPoints: null, labels: [], epicKey: null, epicName: null },
      ],
      inProgressIssues: [
        { key: 'A-3', summary: 'WIP', status: 'IN_PROGRESS' as const, issueType: 'Story', assignee: 'Alice', storyPoints: null, labels: [], epicKey: null, epicName: null },
      ],
      todoIssues: [
        { key: 'A-4', summary: 'Todo', status: 'TO_DO' as const, issueType: 'Story', assignee: 'Bob', storyPoints: null, labels: [], epicKey: null, epicName: null },
      ],
    };
    const payload = buildIngestPayload(baseReport, baseGithubCtx, 'ws-001', jiraCtx);
    // 2 done out of 4 total = 50%
    expect(payload.sprintData?.overallPercent).toBe(50);
  });

  it('builds per-user breakdown excluding Unassigned', () => {
    const jiraCtx = {
      boardId: '42', sprintId: 1, sprintName: 'Sprint 1', sprintEndDate: null,
      doneIssues: [
        { key: 'A-1', summary: 'Done1', status: 'DONE' as const, issueType: 'Story', assignee: 'Alice', storyPoints: null, labels: [], epicKey: null, epicName: null },
      ],
      inProgressIssues: [
        { key: 'A-2', summary: 'WIP', status: 'IN_PROGRESS' as const, issueType: 'Story', assignee: 'Alice', storyPoints: null, labels: [], epicKey: null, epicName: null },
      ],
      todoIssues: [
        { key: 'A-3', summary: 'Todo', status: 'TO_DO' as const, issueType: 'Story', assignee: null, storyPoints: null, labels: [], epicKey: null, epicName: null },
      ],
    };
    const payload = buildIngestPayload(baseReport, baseGithubCtx, 'ws-001', jiraCtx);
    const users = payload.sprintData?.users ?? [];
    // Alice should appear, Unassigned should not
    expect(users).toHaveLength(1);
    expect(users[0].user).toBe('Alice');
    expect(users[0].done).toBe(1);
    expect(users[0].inProgress).toBe(1);
    expect(users[0].total).toBe(2);
  });
});
