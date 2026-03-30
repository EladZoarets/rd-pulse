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
  managersNote: string;
  rawLLMResponse: string;
}

export interface AnalyzeOptions {
  owner: string;
  repo: string;
  days: number;
  output: string;
  model: string;
}
