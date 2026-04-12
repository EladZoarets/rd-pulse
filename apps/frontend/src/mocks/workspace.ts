import type { WorkspaceCreateResponse, WorkspaceStatusResponse } from '@rdpulse/types'

export const mockWorkspace: WorkspaceCreateResponse = {
  workspaceId: 'workspace-acme-001',
  name: 'Acme Backend',
  status: 'pending_connection',
  licenseJwt: 'mock-jwt-token',
}

export const mockWorkspaceActive: WorkspaceStatusResponse = {
  workspaceId: 'workspace-acme-001',
  status: 'active',
  lastHeartbeatAt: '2026-04-12T09:00:00Z',
}
