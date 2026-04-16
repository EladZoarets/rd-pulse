import type { ReportDetail } from '@rdpulse/types'

export const mockReportGood: ReportDetail = {
  id: 'report-good',
  slug: 'report-good',
  url: '/report/report-good',
  workspaceId: 'workspace-acme-001',
  reportType: 'unified_sprint',
  windowStart: '2026-04-06T00:00:00Z',
  windowEnd: '2026-04-12T23:59:59Z',
  generatedAt: '2026-04-12T10:00:00Z',
  lastSyncedAt: '2026-04-12T10:05:00Z',
  runCount: 3,
  summary: {
    health: 'good',
    headline: 'Sprint is on track — no blockers detected.',
  },
  risks: [
    {
      type: 'review_bottleneck',
      severity: 'low',
      title: 'One PR awaiting review for 2 days',
      description: 'PR #42 has been open for 2 days without a review. Consider nudging a reviewer.',
      links: [
        {
          label: 'PR #42: Add auth middleware',
          url: 'https://github.com/acme/backend/pull/42',
        },
      ],
    },
    {
      type: 'stall',
      severity: 'low',
      title: 'Minor stall on feature branch',
      description: 'Branch feature/logging has not received a commit in 36 hours.',
      links: [
        {
          label: 'PR #38: Add structured logging',
          url: 'https://github.com/acme/backend/pull/38',
        },
      ],
    },
  ],
  insights: [
    {
      type: 'throughput',
      description: 'Team merged 8 PRs this week, up 25% from last sprint.',
    },
  ],
  sprintData: {
    overallPercent: 82,
    users: [
      { user: 'Alice',   done: 5, inProgress: 1, total: 7 },
      { user: 'Bob',     done: 4, inProgress: 2, total: 6 },
      { user: 'Charlie', done: 3, inProgress: 0, total: 4 },
    ],
    topics: [
      { topic: 'Auth & Security',   totalIssues: 5, doneCount: 5, inProgressCount: 0, todoCount: 0, completionPercent: 100 },
      { topic: 'API Layer',         totalIssues: 6, doneCount: 5, inProgressCount: 1, todoCount: 0, completionPercent: 83  },
      { topic: 'Frontend',          totalIssues: 6, doneCount: 4, inProgressCount: 1, todoCount: 1, completionPercent: 67  },
    ],
  },
}

export const mockReportAtRisk: ReportDetail = {
  id: 'report-at-risk',
  slug: 'report-at-risk',
  url: '/report/report-at-risk',
  workspaceId: 'workspace-acme-001',
  reportType: 'unified_sprint',
  windowStart: '2026-04-06T00:00:00Z',
  windowEnd: '2026-04-12T23:59:59Z',
  generatedAt: '2026-04-12T10:00:00Z',
  lastSyncedAt: '2026-04-12T10:05:00Z',
  runCount: 5,
  summary: {
    health: 'at_risk',
    headline: 'Sprint at risk — review bottleneck and two stalled tickets detected.',
  },
  risks: [
    {
      type: 'review_bottleneck',
      severity: 'high',
      title: 'Critical PR blocked for 4 days',
      description: 'PR #101 is blocking the release pipeline and has had no review activity for 4 days.',
      links: [
        {
          label: 'PR #101: Migrate database schema',
          url: 'https://github.com/acme/backend/pull/101',
        },
      ],
    },
    {
      type: 'stall',
      severity: 'medium',
      title: 'Two tickets stalled mid-sprint',
      description: 'JIRA-234 and JIRA-235 have not had any activity for 3 days.',
      links: [
        {
          label: 'JIRA-234: Implement rate limiting',
          url: 'https://acme.atlassian.net/browse/JIRA-234',
        },
        {
          label: 'JIRA-235: Cache invalidation logic',
          url: 'https://acme.atlassian.net/browse/JIRA-235',
        },
      ],
    },
    {
      type: 'unassigned_risk',
      severity: 'medium',
      title: 'High-priority ticket unassigned',
      description: 'JIRA-240 is marked high priority but has no assignee after 2 days in the sprint.',
      links: [
        {
          label: 'JIRA-240: Fix production memory leak',
          url: 'https://acme.atlassian.net/browse/JIRA-240',
        },
      ],
    },
    {
      type: 'ghost_work',
      severity: 'low',
      title: 'Commits without linked tickets',
      description: '3 commits were pushed this week with no corresponding Jira ticket reference.',
      links: [
        {
          label: 'PR #98: Miscellaneous fixes',
          url: 'https://github.com/acme/backend/pull/98',
        },
      ],
    },
  ],
  insights: [
    {
      type: 'reviewer_load',
      description: 'Alice reviewed 7 of the last 9 PRs — consider distributing review load.',
    },
    {
      type: 'cycle_time',
      description: 'Average PR cycle time increased to 3.2 days, up from 1.8 days last sprint.',
    },
  ],
  sprintData: {
    overallPercent: 54,
    users: [
      { user: 'Alice',   done: 3, inProgress: 2, total: 8 },
      { user: 'Bob',     done: 2, inProgress: 1, total: 5 },
      { user: 'Charlie', done: 1, inProgress: 2, total: 6 },
    ],
    topics: [
      { topic: 'Auth & Security',   totalIssues: 5, doneCount: 3, inProgressCount: 1, todoCount: 1, completionPercent: 60 },
      { topic: 'API Layer',         totalIssues: 8, doneCount: 4, inProgressCount: 2, todoCount: 2, completionPercent: 50 },
      { topic: 'Frontend',          totalIssues: 6, doneCount: 2, inProgressCount: 2, todoCount: 2, completionPercent: 33 },
    ],
  },
}

export const mockReportCritical: ReportDetail = {
  id: 'report-critical',
  slug: 'report-critical',
  url: '/report/report-critical',
  workspaceId: 'workspace-acme-001',
  reportType: 'unified_sprint',
  windowStart: '2026-04-06T00:00:00Z',
  windowEnd: '2026-04-12T23:59:59Z',
  generatedAt: '2026-04-12T10:00:00Z',
  lastSyncedAt: '2026-04-12T10:05:00Z',
  runCount: 7,
  summary: {
    health: 'critical',
    headline: 'Sprint in critical state — jeopardy detected, multiple blockers require immediate action.',
  },
  risks: [
    {
      type: 'sprint_jeopardy',
      severity: 'high',
      title: 'Sprint goal at jeopardy — 60% of story points unfinished with 1 day left',
      description: 'Only 8 of 20 committed story points are done. Sprint close-out is tomorrow.',
      links: [
        {
          label: 'Sprint board: Acme Sprint 14',
          url: 'https://acme.atlassian.net/jira/software/projects/BE/boards/14',
        },
      ],
    },
    {
      type: 'review_bottleneck',
      severity: 'high',
      title: '5 PRs awaiting review for 3+ days',
      description: 'PRs #110–#114 are all blocking dependent tickets and have no reviewers assigned.',
      links: [
        {
          label: 'PR #110: Payment gateway integration',
          url: 'https://github.com/acme/backend/pull/110',
        },
        {
          label: 'PR #111: Webhook retry logic',
          url: 'https://github.com/acme/backend/pull/111',
        },
        {
          label: 'PR #112: OAuth token refresh',
          url: 'https://github.com/acme/backend/pull/112',
        },
      ],
    },
    {
      type: 'stall',
      severity: 'medium',
      title: 'Core feature stalled for 4 days',
      description: 'JIRA-260 (Core checkout flow) has had no commits or comments in 4 days.',
      links: [
        {
          label: 'JIRA-260: Core checkout flow',
          url: 'https://acme.atlassian.net/browse/JIRA-260',
        },
      ],
    },
    {
      type: 'overload',
      severity: 'medium',
      title: 'Bob carrying 70% of sprint workload',
      description: 'Bob is assigned 14 of 20 story points this sprint and is the sole reviewer on 4 PRs.',
      links: [
        {
          label: 'JIRA-261: Refactor order service',
          url: 'https://acme.atlassian.net/browse/JIRA-261',
        },
      ],
    },
    {
      type: 'ghost_work',
      severity: 'low',
      title: 'Untracked deployment scripts committed',
      description: 'Several commits to the infra repo reference no Jira tickets and predate the sprint by 5 days.',
      links: [
        {
          label: 'PR #105: Infra cleanup scripts',
          url: 'https://github.com/acme/infra/pull/105',
        },
      ],
    },
  ],
  insights: [
    {
      type: 'burndown',
      description: 'Burndown rate is 2x slower than needed to complete the sprint on time.',
    },
    {
      type: 'reviewer_load',
      description: 'Only 2 out of 6 engineers have reviewed any PR this sprint.',
    },
    {
      type: 'carry_over_risk',
      description: 'At current velocity, 7 tickets will carry over to the next sprint.',
    },
  ],
  sprintData: {
    overallPercent: 28,
    users: [
      { user: 'Alice',   done: 1, inProgress: 2, total: 9 },
      { user: 'Bob',     done: 0, inProgress: 3, total: 8 },
      { user: 'Charlie', done: 2, inProgress: 1, total: 5 },
      { user: 'Dana',    done: 0, inProgress: 1, total: 4 },
    ],
    topics: [
      { topic: 'Checkout Flow',     totalIssues: 10, doneCount: 2, inProgressCount: 3, todoCount: 5, completionPercent: 20 },
      { topic: 'Payment Gateway',   totalIssues: 8,  doneCount: 1, inProgressCount: 2, todoCount: 5, completionPercent: 13 },
      { topic: 'Auth & Security',   totalIssues: 4,  doneCount: 2, inProgressCount: 1, todoCount: 1, completionPercent: 50 },
      { topic: 'Infra & DevOps',    totalIssues: 4,  doneCount: 0, inProgressCount: 1, todoCount: 3, completionPercent: 0  },
    ],
  },
}

export const mockReports: ReportDetail[] = [mockReportGood, mockReportAtRisk, mockReportCritical]

export const mockReportById: Record<string, ReportDetail> = {
  [mockReportGood.id]: mockReportGood,
  [mockReportAtRisk.id]: mockReportAtRisk,
  [mockReportCritical.id]: mockReportCritical,
}
