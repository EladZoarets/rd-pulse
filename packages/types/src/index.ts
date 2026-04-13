// Health + severity enums
export type Health = 'good' | 'at_risk' | 'critical'
export type Severity = 'low' | 'medium' | 'high'
export type WorkspaceStatus = 'pending_connection' | 'active'

// Risk types recognized by the AI prompt
export type RiskType =
  | 'review_bottleneck'
  | 'sprint_jeopardy'
  | 'ghost_work'
  | 'unassigned_risk'
  | 'stall'
  | 'overload'

// Core data shapes
export interface ReportLink {
  label: string
  url: string
}

export interface RiskPayload {
  type: RiskType | string   // string fallback for future types
  severity: Severity
  title: string
  description: string
  links: ReportLink[]
}

export interface InsightPayload {
  type: string
  description: string
}

// Ingest payload (connector → backend)
export interface IngestPayload {
  workspaceId: string
  reportType: string
  windowStart: string   // ISO 8601
  windowEnd: string     // ISO 8601
  generatedAt: string   // ISO 8601
  summary: {
    health: Health
    headline: string
  }
  risks: RiskPayload[]
  insights: InsightPayload[]
}

export interface IngestResponse {
  reportId: string
  url: string
}

// Workspace API shapes
export interface WorkspaceCreateRequest {
  name: string
}

export interface WorkspaceCreateResponse {
  workspaceId: string
  name: string
  status: WorkspaceStatus
  licenseJwt: string
}

export interface WorkspaceStatusResponse {
  workspaceId: string
  status: WorkspaceStatus
  lastHeartbeatAt: string | null
}

// Report list item (for /reports page)
export interface ReportListItem {
  id: string
  generatedAt: string
  health: Health
  headline: string
  url: string
  slug?: string
}

export interface ReportListResponse {
  reports: ReportListItem[]
  nextCursor: string | null
}

// Full report detail (for /report/:id page)
export interface ReportDetail extends IngestPayload {
  id: string
  slug?: string
  url: string
  lastSyncedAt: string
  runCount: number
}
