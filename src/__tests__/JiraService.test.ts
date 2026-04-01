import axios from 'axios';
import { JiraService } from '../services/JiraService';
import { DEFAULT_JIRA_FIELDS } from '../types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BOARD_ID = '42';
const SPRINT_ID = 10;

function makeAxiosInstance(getImpl: jest.Mock) {
  return { get: getImpl };
}

function makeSprintResponse() {
  return {
    data: {
      values: [
        {
          id: SPRINT_ID,
          name: 'Sprint 5',
          state: 'active',
          endDate: '2026-04-10T00:00:00.000Z',
        },
      ],
    },
  };
}

function makeIssuesResponse(issues: object[]) {
  return { data: { issues } };
}

function makeIssue(overrides: Partial<{
  key: string;
  summary: string;
  statusCategoryKey: string;
  assignee: string | null;
  labels: string[];
  epicKey: string | null;
  epicName: string | null;
  issueType: string;
  storyPoints: number | null;
  storyPointsField: string;
}> = {}) {
  const {
    key = 'PROJ-1',
    summary = 'Do the thing',
    statusCategoryKey = 'new',
    assignee = 'alice',
    labels = [],
    epicKey = null,
    epicName = null,
    issueType = 'Story',
    storyPoints = null,
    storyPointsField = 'customfield_10016',
  } = overrides;

  return {
    key,
    fields: {
      summary,
      status: { statusCategory: { key: statusCategoryKey } },
      assignee: assignee ? { displayName: assignee } : null,
      labels,
      epic: epicKey ? { key: epicKey, name: epicName } : null,
      parent: null,
      issuetype: { name: issueType },
      [storyPointsField]: storyPoints,
    },
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

let service: JiraService;
let mockGet: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGet = jest.fn();
  mockedAxios.create = jest.fn().mockReturnValue(makeAxiosInstance(mockGet));
  service = new JiraService('https://acme.atlassian.net', 'user@acme.com', 'token123');
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('JiraService.fetchSprintContext', () => {
  describe('happy path — active sprint with issues', () => {
    it('returns sprint metadata correctly', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(makeIssuesResponse([]));

      const result = await service.fetchSprintContext(BOARD_ID);

      expect(result.boardId).toBe(BOARD_ID);
      expect(result.sprintId).toBe(SPRINT_ID);
      expect(result.sprintName).toBe('Sprint 5');
      expect(result.sprintEndDate).toBe('2026-04-10T00:00:00.000Z');
    });

    it('buckets issues by statusCategory.key into TO_DO / IN_PROGRESS / DONE', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(
          makeIssuesResponse([
            makeIssue({ key: 'PROJ-1', statusCategoryKey: 'new' }),
            makeIssue({ key: 'PROJ-2', statusCategoryKey: 'indeterminate' }),
            makeIssue({ key: 'PROJ-3', statusCategoryKey: 'done' }),
            makeIssue({ key: 'PROJ-4', statusCategoryKey: 'new' }),
          ])
        );

      const result = await service.fetchSprintContext(BOARD_ID);

      expect(result.todoIssues).toHaveLength(2);
      expect(result.inProgressIssues).toHaveLength(1);
      expect(result.doneIssues).toHaveLength(1);
      expect(result.todoIssues.map((i) => i.key)).toEqual(['PROJ-1', 'PROJ-4']);
      expect(result.inProgressIssues[0].key).toBe('PROJ-2');
      expect(result.doneIssues[0].key).toBe('PROJ-3');
    });

    it('maps issue fields to JiraIssue correctly', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(
          makeIssuesResponse([
            makeIssue({
              key: 'PROJ-5',
              summary: 'Implement login',
              statusCategoryKey: 'indeterminate',
              assignee: 'bob',
              labels: ['backend', 'auth'],
              epicKey: 'PROJ-99',
              epicName: 'Auth Epic',
              issueType: 'Bug',
            }),
          ])
        );

      const result = await service.fetchSprintContext(BOARD_ID);
      const issue = result.inProgressIssues[0];

      expect(issue.key).toBe('PROJ-5');
      expect(issue.summary).toBe('Implement login');
      expect(issue.assignee).toBe('bob');
      expect(issue.labels).toEqual(['backend', 'auth']);
      expect(issue.epicKey).toBe('PROJ-99');
      expect(issue.epicName).toBe('Auth Epic');
      expect(issue.issueType).toBe('Bug');
      expect(issue.storyPoints).toBeNull();
    });

    it('maps null assignee correctly', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(
          makeIssuesResponse([makeIssue({ assignee: null })])
        );

      const result = await service.fetchSprintContext(BOARD_ID);
      expect(result.todoIssues[0].assignee).toBeNull();
    });
  });

  describe('story points field', () => {
    it('reads story points when storyPointsField is provided', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(
          makeIssuesResponse([
            makeIssue({ key: 'PROJ-1', storyPoints: 5, storyPointsField: 'customfield_10016' }),
          ])
        );

      const result = await service.fetchSprintContext(BOARD_ID, {
        storyPointsField: 'customfield_10016',
      });

      expect(result.todoIssues[0].storyPoints).toBe(5);
    });

    it('leaves storyPoints null when no storyPointsField provided', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(
          makeIssuesResponse([makeIssue({ key: 'PROJ-1', storyPoints: 8 })])
        );

      const result = await service.fetchSprintContext(BOARD_ID);
      expect(result.todoIssues[0].storyPoints).toBeNull();
    });
  });

  describe('fields param', () => {
    it('uses DEFAULT_JIRA_FIELDS when no fields option provided', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(makeIssuesResponse([]));

      await service.fetchSprintContext(BOARD_ID);

      const issuesCall = mockGet.mock.calls[1];
      const params = issuesCall[1]?.params as Record<string, string>;
      const requestedFields = params.fields.split(',');

      DEFAULT_JIRA_FIELDS.forEach((f) => expect(requestedFields).toContain(f));
    });

    it('uses custom fields when fields option provided', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(makeIssuesResponse([]));

      await service.fetchSprintContext(BOARD_ID, { fields: ['summary', 'status'] });

      const issuesCall = mockGet.mock.calls[1];
      const params = issuesCall[1]?.params as Record<string, string>;
      expect(params.fields).toBe('summary,status');
    });

    it('falls back to DEFAULT_JIRA_FIELDS when empty fields array provided', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(makeIssuesResponse([]));

      await service.fetchSprintContext(BOARD_ID, { fields: [] });

      const issuesCall = mockGet.mock.calls[1];
      const params = issuesCall[1]?.params as Record<string, string>;
      const requestedFields = params.fields.split(',');
      DEFAULT_JIRA_FIELDS.forEach((f) => expect(requestedFields).toContain(f));
    });

    it('appends storyPointsField to the fields list when provided', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(makeIssuesResponse([]));

      await service.fetchSprintContext(BOARD_ID, { storyPointsField: 'customfield_10016' });

      const issuesCall = mockGet.mock.calls[1];
      const params = issuesCall[1]?.params as Record<string, string>;
      expect(params.fields).toContain('customfield_10016');
    });
  });

  describe('issueTypes filter', () => {
    it('passes issueTypes as JQL filter when provided', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(makeIssuesResponse([]));

      await service.fetchSprintContext(BOARD_ID, { issueTypes: ['Story', 'Bug'] });

      const issuesCall = mockGet.mock.calls[1];
      const params = issuesCall[1]?.params as Record<string, string>;
      expect(params.jql).toContain('Story');
      expect(params.jql).toContain('Bug');
    });
  });

  describe('empty sprint', () => {
    it('returns empty buckets when sprint has no issues', async () => {
      mockGet
        .mockResolvedValueOnce(makeSprintResponse())
        .mockResolvedValueOnce(makeIssuesResponse([]));

      const result = await service.fetchSprintContext(BOARD_ID);

      expect(result.todoIssues).toHaveLength(0);
      expect(result.inProgressIssues).toHaveLength(0);
      expect(result.doneIssues).toHaveLength(0);
    });

    it('returns null sprintEndDate when not provided by Jira', async () => {
      mockGet
        .mockResolvedValueOnce({
          data: {
            values: [{ id: SPRINT_ID, name: 'Sprint 5', state: 'active' }],
          },
        })
        .mockResolvedValueOnce(makeIssuesResponse([]));

      const result = await service.fetchSprintContext(BOARD_ID);
      expect(result.sprintEndDate).toBeNull();
    });
  });

  describe('error handling', () => {
    it('throws a human-readable error on 401 Unauthorized', async () => {
      const err = Object.assign(new Error('Unauthorized'), {
        response: { status: 401 },
      });
      mockGet.mockRejectedValueOnce(err);

      await expect(service.fetchSprintContext(BOARD_ID)).rejects.toThrow(
        /invalid credentials|unauthorized|401/i
      );
    });

    it('throws a human-readable error when no active sprint found', async () => {
      mockGet.mockResolvedValueOnce({ data: { values: [] } });

      await expect(service.fetchSprintContext(BOARD_ID)).rejects.toThrow(
        /no active sprint/i
      );
    });

    it('throws a human-readable error on generic network failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network Error'));

      await expect(service.fetchSprintContext(BOARD_ID)).rejects.toThrow(
        /jira.*failed|failed.*jira/i
      );
    });
  });
});
