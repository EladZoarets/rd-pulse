import type {
  ReportDetail,
  ReportListResponse,
  WorkspaceCreateRequest,
  WorkspaceCreateResponse,
  WorkspaceStatusResponse,
} from '@rdpulse/types'
import { mockReportById, mockReports } from '../mocks/reports'
import { mockWorkspace, mockWorkspaceActive } from '../mocks/workspace'
import type { ApiClient } from './types'

const MOCK_LATENCY_MS = 300

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Per-workspaceId call counter for polling simulation
const statusCallCounters = new Map<string, number>()

export function resetMockState(): void {
  statusCallCounters.clear()
}

export const mockApi: ApiClient = {
  async createWorkspace(_req: WorkspaceCreateRequest): Promise<WorkspaceCreateResponse> {
    await delay(MOCK_LATENCY_MS)
    return mockWorkspace
  },

  async getWorkspaceStatus(workspaceId: string): Promise<WorkspaceStatusResponse> {
    await delay(MOCK_LATENCY_MS)
    const count = (statusCallCounters.get(workspaceId) ?? 0) + 1
    statusCallCounters.set(workspaceId, count)

    if (count >= 4) {
      return mockWorkspaceActive
    }

    return {
      workspaceId,
      status: 'pending_connection',
      lastHeartbeatAt: null,
    }
  },

  async getReports(_workspaceId: string): Promise<ReportListResponse> {
    await delay(MOCK_LATENCY_MS)
    const items = mockReports.map(
      (r: ReportDetail) => ({
        id: r.id,
        generatedAt: r.generatedAt,
        health: r.summary.health,
        headline: r.summary.headline,
        url: r.url,
        slug: r.slug,
      })
    )
    return { reports: items, nextCursor: null }
  },

  async getReport(id: string): Promise<ReportDetail> {
    const report = mockReportById[id]
    if (!report) {
      throw new Error(`Report not found: ${id}`)
    }
    await delay(MOCK_LATENCY_MS)
    return report
  },
}
