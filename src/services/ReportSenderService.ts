export interface ReportSummary {
  health: 'good' | 'at_risk' | 'critical';
  headline: string;
}

export interface ReportLink {
  label: string;
  url: string;
}

export interface ReportRisk {
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  links: ReportLink[];
}

export interface ReportInsight {
  type: string;
  description: string;
}

export interface UserSprintPulse {
  user: string;
  done: number;
  inProgress: number;
  total: number;
}

export interface TopicBreakdown {
  topic: string;
  totalIssues: number;
  doneCount: number;
  inProgressCount: number;
  todoCount: number;
  completionPercent: number;
}

export interface SprintData {
  overallPercent: number;
  users: UserSprintPulse[];
  topics?: TopicBreakdown[];
}

export interface ReportPayload {
  workspaceId: string;
  reportType: string;
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  summary: ReportSummary;
  risks: ReportRisk[];
  insights: ReportInsight[];
  sprintData?: SprintData;
}

export class ReportSenderService {
  private readonly serverUrl: string;
  private readonly workspaceId: string;
  private readonly jwt: string;

  constructor(serverUrl: string, workspaceId: string, jwt: string) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.workspaceId = workspaceId;
    this.jwt = jwt;
  }

  async sendHeartbeat(): Promise<void> {
    const url = `${this.serverUrl}/api/v1/workspaces/${this.workspaceId}/heartbeat`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      throw new Error(
        `ReportSenderService: heartbeat network error — ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!response.ok) {
      throw new Error(
        `ReportSenderService: heartbeat failed with status ${response.status}`
      );
    }
  }

  async sendReport(payload: ReportPayload): Promise<void> {
    const url = `${this.serverUrl}/api/v1/ingest/report`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      throw new Error(
        `ReportSenderService: sendReport network error — ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!response.ok) {
      throw new Error(
        `ReportSenderService: sendReport failed with status ${response.status}`
      );
    }
  }
}
