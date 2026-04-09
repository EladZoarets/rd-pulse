// Shared domain interfaces for rd-pulse

export interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  createdAt: Date;
  updatedAt: Date;
  mergedAt: Date | null;
  body: string | null;
  commentCount: number;
  comments: GitHubComment[];
  isDraft: boolean;
  headRef: string;
  baseRef: string;
  changedFiles: number;
  additions: number;
  deletions: number;
}

export interface BigPRThresholds {
  files: number;   // flag PR if changedFiles >= this value
  lines: number;   // flag PR if (additions + deletions) >= this value
}

export interface GitHubCommit {
  sha: string;
  message: string;
  fullMessage: string;
  author: string;
  committedAt: Date;
  isDirectToMain: boolean;
}

export interface GitHubComment {
  author: string;
  body: string;
  createdAt: Date;
}

export interface ActivityContext {
  owner: string;
  repo: string;
  defaultBranch: string;
  windowStart: Date;
  windowEnd: Date;
  pullRequests: GitHubPR[];
  commits: GitHubCommit[];
  stalePRs: GitHubPR[];
  heatedPRs: GitHubPR[];
  directCommits: GitHubCommit[];
  bigPRs: GitHubPR[];
  bigPRThresholds: BigPRThresholds;
  ghostWorkPRs: GitHubPR[];
}

export interface FeatureTheme {
  name: string;
  commits: string[];
  summary: string;
}

export interface ContributorSummary {
  name: string;
  prsMerged: number;
  prsOpen: number;
  commitsCount: number;
  highlights: string[];  // what they shipped or progressed
  risk: string | null;   // null = healthy; string = risk description
}

export interface AnalysisResult {
  repo: string;
  generatedAt: Date;
  contributors: ContributorSummary[];
  featureThemes: FeatureTheme[];
  keyAchievements: string[];
  workInProgress: string[];
  risksAndBlockers: string[];
  largePRs: string[];
  managersNote: string;
  rawLLMResponse: string;
}

export interface AnalyzeOptions {
  owner: string;
  repo: string;
  days: number;
  output?: string;
  format: string;
  model: string;
  bigPrFiles: number;
  bigPrLines: number;
}

// ── Jira types ────────────────────────────────────────────────────────────────

export type JiraIssueStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

export type RiskType = 'GHOST_WORK' | 'SPRINT_JEOPARDY' | 'OVERLOAD' | 'STALL' | 'UNASSIGNED';

export interface JiraIssue {
  key: string;
  summary: string;
  status: JiraIssueStatus;
  issueType: string;
  assignee: string | null;
  storyPoints: number | null;
  labels: string[];
  epicKey: string | null;
  epicName: string | null;
}

export interface JiraSprintContext {
  boardId: string;
  sprintId: number;
  sprintName: string;
  sprintEndDate: string | null;
  todoIssues: JiraIssue[];
  inProgressIssues: JiraIssue[];
  doneIssues: JiraIssue[];
}

export const DEFAULT_JIRA_FIELDS: string[] = [
  'summary',
  'status',
  'assignee',
  'issuetype',
  'labels',
  'epic',
  'parent',
];

export interface JiraFetchOptions {
  issueTypes?: string[];
  fields?: string[];
  storyPointsField?: string;
}

// ── Unified types ─────────────────────────────────────────────────────────────

export interface UnifiedActivity {
  github: ActivityContext;
  jira: JiraSprintContext;
}

export interface TopicBreakdown {
  topic: string;
  totalIssues: number;
  doneCount: number;
  inProgressCount: number;
  todoCount: number;
  completionPercent: number;
}

export interface RiskItem {
  type: RiskType;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface PersonalPulse {
  user: string;
  done: number;
  inProgress: number;
  inReview: number;
  unassignedCount: number;
}

export type GitHubHighlightType = 'PR_MERGED' | 'PR_IN_REVIEW' | 'GHOST_WORK' | 'DIRECT_COMMIT';

export interface GitHubHighlight {
  type: GitHubHighlightType;
  ref: string;        // e.g. "PR #42" or commit sha
  author: string;
  description: string;
}

export interface UnifiedReport {
  repo: string;
  boardId: string;
  generatedAt: Date;
  summary: string;
  githubHighlights: GitHubHighlight[];
  topicBreakdown: TopicBreakdown[];
  risks: RiskItem[];
  personalPulse: PersonalPulse[];
  managersNote: string;
  rawLLMResponse: string;
}

export interface PulseOptions {
  owner: string;
  repo: string;
  board: string;
  days: number;
  output?: string;
  format: string;
  model: string;
  jiraFields?: string;
  jiraSpField?: string;
}
