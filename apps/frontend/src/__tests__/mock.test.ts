import { describe, it, expect, beforeEach } from 'vitest'
import { mockApi, resetMockState } from '../api/mock'

beforeEach(() => {
  resetMockState()
})

describe('mockApi.getReport', () => {
  it('resolves with health good for report-good', async () => {
    const report = await mockApi.getReport('report-good')
    expect(report.summary.health).toBe('good')
    expect(report.id).toBe('report-good')
  })

  it('resolves with health at_risk for report-at-risk', async () => {
    const report = await mockApi.getReport('report-at-risk')
    expect(report.summary.health).toBe('at_risk')
    expect(report.id).toBe('report-at-risk')
  })

  it('resolves with health critical for report-critical', async () => {
    const report = await mockApi.getReport('report-critical')
    expect(report.summary.health).toBe('critical')
    expect(report.id).toBe('report-critical')
  })

  it('rejects with not found error for unknown id', async () => {
    await expect(mockApi.getReport('unknown-id')).rejects.toThrow(/not found/i)
  })
})

describe('mockApi.getReports', () => {
  it('resolves with an array of length 3', async () => {
    const result = await mockApi.getReports('workspace-acme-001')
    expect(result.reports).toHaveLength(3)
  })

  it('result items have correct shape (id, health, headline present)', async () => {
    const result = await mockApi.getReports('workspace-acme-001')
    for (const item of result.reports) {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('health')
      expect(item).toHaveProperty('headline')
      expect(typeof item.id).toBe('string')
      expect(typeof item.health).toBe('string')
      expect(typeof item.headline).toBe('string')
    }
  })
})

describe('mockApi.getWorkspaceStatus — polling simulation', () => {
  it('returns pending_connection on first call', async () => {
    const result = await mockApi.getWorkspaceStatus('ws-test')
    expect(result.status).toBe('pending_connection')
  })

  it('returns pending_connection on second call', async () => {
    await mockApi.getWorkspaceStatus('ws-test')
    const result = await mockApi.getWorkspaceStatus('ws-test')
    expect(result.status).toBe('pending_connection')
  })

  it('returns pending_connection on third call', async () => {
    await mockApi.getWorkspaceStatus('ws-test')
    await mockApi.getWorkspaceStatus('ws-test')
    const result = await mockApi.getWorkspaceStatus('ws-test')
    expect(result.status).toBe('pending_connection')
  })

  it('returns active on fourth call', async () => {
    await mockApi.getWorkspaceStatus('ws-test')
    await mockApi.getWorkspaceStatus('ws-test')
    await mockApi.getWorkspaceStatus('ws-test')
    const result = await mockApi.getWorkspaceStatus('ws-test')
    expect(result.status).toBe('active')
  })
})

describe('mockApi.createWorkspace', () => {
  it('resolves with a workspace name', async () => {
    const result = await mockApi.createWorkspace({ name: 'My Team' })
    expect(typeof result.name).toBe('string')
    expect(result.name.length).toBeGreaterThan(0)
  })

  it('resolves with a workspaceId and licenseJwt', async () => {
    const result = await mockApi.createWorkspace({ name: 'My Team' })
    expect(typeof result.workspaceId).toBe('string')
    expect(typeof result.licenseJwt).toBe('string')
  })
})
