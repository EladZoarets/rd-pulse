export interface JiraTicket {
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
  reporter: string;
  priority: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  comments: JiraComment[];
}

export interface JiraComment {
  author: string;
  body: string;
  createdAt: Date;
}

export interface JiraActivityContext {
  projects: string[];
  windowStart: Date;
  windowEnd: Date;
  tickets: JiraTicket[];
  statusChanges: Array<{ ticket: string; from: string; to: string; at: Date; by: string }>;
}

export class JiraService {
  constructor(
    private host: string,
    private email: string,
    private apiToken: string
  ) {}

  async fetchActivity(projectKeys: string[], days: number = 1): Promise<JiraActivityContext> {
    throw new Error('Not implemented');
  }
}
