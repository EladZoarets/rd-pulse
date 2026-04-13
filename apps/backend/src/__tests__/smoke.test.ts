import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

// Mock supabase before any imports that use it
vi.mock('../db/supabase', () => ({
  supabase: {},
}))

// Mock services
vi.mock('../services/WorkspaceService')
vi.mock('../services/ReportService')

import { createApp } from '../app'
import { WorkspaceService } from '../services/WorkspaceService'
import { ReportService } from '../services/ReportService'

const TEST_JWT_SECRET = 'test-secret-that-is-long-enough-32chars'

describe('smoke: full request chain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = TEST_JWT_SECRET
    process.env.APP_BASE_URL = 'https://app.rdpulse.ai'
  })

  it('create workspace → heartbeat → ingest report → fetch report', async () => {
    const workspaceId = 'smoke-ws-001'
    const reportId = 'smoke-report-001'
    const licenseJwt = jwt.sign({ workspaceId }, TEST_JWT_SECRET)

    // Step 1: Create workspace
    vi.mocked(WorkspaceService).prototype.create = vi.fn().mockResolvedValue({
      workspaceId,
      name: 'Smoke Test Workspace',
      status: 'pending_connection',
      licenseJwt,
    })

    const app = createApp()

    const createRes = await request(app)
      .post('/api/v1/workspaces')
      .send({ name: 'Smoke Test Workspace' })

    expect(createRes.status).toBe(201)
    expect(createRes.body.workspaceId).toBe(workspaceId)
    const token = createRes.body.licenseJwt

    // Step 2: Heartbeat
    vi.mocked(WorkspaceService).prototype.findById = vi.fn().mockResolvedValue({
      id: workspaceId,
      name: 'Smoke Test Workspace',
      status: 'pending_connection',
      license_jwt: licenseJwt,
      created_at: new Date().toISOString(),
      last_heartbeat_at: null,
    })
    vi.mocked(WorkspaceService).prototype.activate = vi.fn().mockResolvedValue(undefined)

    const heartbeatRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/heartbeat`)
      .set('Authorization', `Bearer ${token}`)

    expect(heartbeatRes.status).toBe(200)
    expect(heartbeatRes.body.status).toBe('active')

    // Step 3: Ingest report
    const reportUrl = `https://app.rdpulse.ai/report/${reportId}`
    vi.mocked(ReportService).prototype.upsert = vi.fn().mockResolvedValue({
      reportId,
      url: reportUrl,
    })

    const ingestBody = {
      workspaceId,
      reportType: 'sprint',
      windowStart: '2024-01-01T00:00:00Z',
      windowEnd: '2024-01-14T00:00:00Z',
      generatedAt: '2024-01-14T12:00:00Z',
      summary: { health: 'good', headline: 'All systems go' },
      risks: [],
      insights: [],
    }

    const ingestRes = await request(app)
      .post('/api/v1/ingest/report')
      .set('Authorization', `Bearer ${token}`)
      .send(ingestBody)

    expect(ingestRes.status).toBe(201)
    expect(ingestRes.body.reportId).toBe(reportId)

    // Step 4: Fetch report
    const fullReport = {
      id: reportId,
      ...ingestBody,
      url: reportUrl,
      lastSyncedAt: '2024-01-14T12:00:00Z',
      runCount: 1,
    }
    vi.mocked(ReportService).prototype.findById = vi.fn().mockResolvedValue(fullReport)

    const fetchRes = await request(app).get(`/api/v1/reports/${reportId}`)

    expect(fetchRes.status).toBe(200)
    expect(fetchRes.body.id).toBe(reportId)
    expect(fetchRes.body.summary.health).toBe('good')
  })
})
