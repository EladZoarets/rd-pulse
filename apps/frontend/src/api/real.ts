import type {
  ReportDetail,
  ReportListResponse,
  WorkspaceCreateRequest,
  WorkspaceCreateResponse,
  WorkspaceStatusResponse,
} from '@rdpulse/types'
import type { ApiClient } from './types'

export const realApi: ApiClient = {
  async createWorkspace(_req: WorkspaceCreateRequest): Promise<WorkspaceCreateResponse> {
    throw new Error('Real API not implemented yet')
  },

  async getWorkspaceStatus(_workspaceId: string): Promise<WorkspaceStatusResponse> {
    throw new Error('Real API not implemented yet')
  },

  async getReports(_workspaceId: string): Promise<ReportListResponse> {
    throw new Error('Real API not implemented yet')
  },

  async getReport(_id: string): Promise<ReportDetail> {
    throw new Error('Real API not implemented yet')
  },
}
