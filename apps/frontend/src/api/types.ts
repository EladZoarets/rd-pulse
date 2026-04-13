import type {
  ReportDetail,
  ReportListResponse,
  WorkspaceCreateRequest,
  WorkspaceCreateResponse,
  WorkspaceStatusResponse,
} from '@rdpulse/types'

export interface ApiClient {
  createWorkspace(req: WorkspaceCreateRequest): Promise<WorkspaceCreateResponse>
  getWorkspaceStatus(workspaceId: string): Promise<WorkspaceStatusResponse>
  getReports(workspaceId: string): Promise<ReportListResponse>
  getReport(id: string): Promise<ReportDetail>
}
