import type {
  ReportDetail,
  ReportListResponse,
  WorkspaceCreateRequest,
  WorkspaceCreateResponse,
  WorkspaceStatusResponse,
} from '@rdpulse/types'
import type { ApiClient } from './types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const realApi: ApiClient = {
  createWorkspace(req: WorkspaceCreateRequest): Promise<WorkspaceCreateResponse> {
    return apiFetch('/api/v1/workspaces', {
      method: 'POST',
      body: JSON.stringify(req),
    })
  },

  getWorkspaceStatus(workspaceId: string): Promise<WorkspaceStatusResponse> {
    return apiFetch(`/api/v1/workspaces/${workspaceId}/status`)
  },

  getReports(workspaceId: string): Promise<ReportListResponse> {
    return apiFetch(`/api/v1/reports?workspaceId=${encodeURIComponent(workspaceId)}`)
  },

  getReport(id: string): Promise<ReportDetail> {
    return apiFetch(`/api/v1/reports/${encodeURIComponent(id)}`)
  },
}
