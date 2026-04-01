import axios, { AxiosInstance } from 'axios';
import {
  JiraFetchOptions,
  JiraIssue,
  JiraIssueStatus,
  JiraSprintContext,
  DEFAULT_JIRA_FIELDS,
} from '../types';

const MAX_RESULTS = 50;

// ── Raw Jira API shapes (internal only, not exported) ─────────────────────────

interface JiraRawFields {
  summary?: string;
  status?: { statusCategory?: { key?: string } };
  assignee?: { displayName?: string } | null;
  issuetype?: { name?: string };
  labels?: string[];
  epic?: { key?: string; name?: string } | null;
  [field: string]: unknown; // dynamic custom fields (e.g. storyPointsField)
}

interface JiraRawIssue {
  key: string;
  fields: JiraRawFields;
}

interface JiraRawSprint {
  id: number;
  name: string;
  state: string;
  endDate?: string;
}

interface JiraApiError extends Error {
  response?: { status?: number };
}

function mapStatusCategory(categoryKey: string): JiraIssueStatus {
  if (categoryKey === 'indeterminate') return 'IN_PROGRESS';
  if (categoryKey === 'done') return 'DONE';
  return 'TO_DO'; // 'new' and any unknown key → TO_DO
}

function buildFields(options?: JiraFetchOptions): string {
  const base =
    options?.fields && options.fields.length > 0
      ? [...options.fields]
      : [...DEFAULT_JIRA_FIELDS];

  if (options?.storyPointsField && !base.includes(options.storyPointsField)) {
    base.push(options.storyPointsField);
  }

  return base.join(',');
}

function buildJql(sprintId: number, options?: JiraFetchOptions): string {
  let jql = `sprint = ${sprintId}`;
  if (options?.issueTypes && options.issueTypes.length > 0) {
    const types = options.issueTypes.map((t) => `"${t}"`).join(', ');
    jql += ` AND issueType in (${types})`;
  }
  return jql;
}

function mapIssue(raw: JiraRawIssue, options?: JiraFetchOptions): JiraIssue {
  const fields = raw.fields ?? {};
  const statusCategoryKey = fields.status?.statusCategory?.key ?? '';
  const epic = fields.epic ?? null;
  const storyPoints =
    options?.storyPointsField != null
      ? (fields[options.storyPointsField] ?? null)
      : null;

  return {
    key: raw.key,
    summary: fields.summary ?? '',
    status: mapStatusCategory(statusCategoryKey),
    issueType: fields.issuetype?.name ?? '',
    assignee: fields.assignee?.displayName ?? null,
    storyPoints: typeof storyPoints === 'number' ? storyPoints : null,
    labels: Array.isArray(fields.labels) ? fields.labels : [],
    epicKey: epic?.key ?? null,
    epicName: epic?.name ?? null,
  };
}

export class JiraService {
  private client: AxiosInstance;

  constructor(
    private host: string,
    private email: string,
    private apiToken: string
  ) {
    const token = Buffer.from(`${email}:${apiToken}`).toString('base64');
    this.client = axios.create({
      baseURL: host,
      headers: {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async fetchSprintContext(boardId: string, options?: JiraFetchOptions): Promise<JiraSprintContext> {
    const sprint = await this.fetchActiveSprint(boardId);
    const issues = await this.fetchAllIssues(sprint.id, options);

    const todoIssues: JiraIssue[] = [];
    const inProgressIssues: JiraIssue[] = [];
    const doneIssues: JiraIssue[] = [];

    for (const raw of issues) {
      const issue = mapIssue(raw, options);
      if (issue.status === 'IN_PROGRESS') inProgressIssues.push(issue);
      else if (issue.status === 'DONE') doneIssues.push(issue);
      else todoIssues.push(issue);
    }

    return {
      boardId,
      sprintId: sprint.id,
      sprintName: sprint.name,
      sprintEndDate: sprint.endDate ?? null,
      todoIssues,
      inProgressIssues,
      doneIssues,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async fetchActiveSprint(
    boardId: string
  ): Promise<{ id: number; name: string; endDate?: string }> {
    try {
      const response = await this.client.get(
        `/rest/agile/1.0/board/${boardId}/sprint`,
        { params: { state: 'active' } }
      );
      const sprints: JiraRawSprint[] = response.data?.values ?? [];

      const active = sprints.find((s) => s.state === 'active');
      if (!active) {
        throw new Error(`No active sprint found for board ${boardId}`);
      }
      return active;
    } catch (err) {
      this.rethrow(err);
    }
  }

  private async fetchAllIssues(
    sprintId: number,
    options?: JiraFetchOptions
  ): Promise<JiraRawIssue[]> {
    const fields = buildFields(options);
    const jql = buildJql(sprintId, options);
    const allIssues: JiraRawIssue[] = [];
    let startAt = 0;

    try {
      while (true) {
        const response = await this.client.get(
          `/rest/agile/1.0/sprint/${sprintId}/issue`,
          { params: { fields, jql, maxResults: MAX_RESULTS, startAt } }
        );
        const data = response.data;
        const page: JiraRawIssue[] = data.issues ?? [];
        allIssues.push(...page);

        const total: number = data.total ?? page.length;
        startAt += page.length;
        if (startAt >= total || page.length === 0) break;
      }
    } catch (err) {
      this.rethrow(err);
    }

    return allIssues;
  }

  private rethrow(err: unknown): never {
    if (err instanceof Error) {
      if (err.message.startsWith('No active sprint')) throw err;

      const status = (err as JiraApiError).response?.status;
      if (status === 401) {
        throw new Error(
          `Jira request failed: invalid credentials — check JIRA_EMAIL and JIRA_TOKEN (401 Unauthorized)`
        );
      }
      throw new Error(`Jira request failed: ${err.message}`);
    }
    throw new Error(`Jira request failed: ${String(err)}`);
  }
}
