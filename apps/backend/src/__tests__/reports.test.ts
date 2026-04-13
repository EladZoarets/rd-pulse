import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

// Mock supabase before any imports that use it
vi.mock('../db/supabase', () => ({
  supabase: {},
}))

// Mock ReportService
vi.mock('../services/ReportService')

import { createApp } from '../app'
import { ReportService } from '../services/ReportService'

const TEST_JWT_SECRET = 'test-secret-that-is-long-enough-32chars'

function makeToken(workspaceId: string): string {
  return jwt.sign({ workspaceId }, TEST_JWT_SECRET)
}

const validIngestBody = {
  workspaceId: 'ws-123',
  reportType: 'sprint',
  windowStart: '2024-01-01T00:00:00Z',
  windowEnd: '2024-01-14T00:00:00Z',
  generatedAt: '2024-01-14T12:00:00Z',
  summary: {
    health: 'good',
    headline: 'Sprint is on track',
  },
  risks: [],
  insights: [],
}

describe('POST /api/v1/ingest/report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = TEST_JWT_SECRET
  })

  it('returns 401 without token', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/ingest/report')
      .send(validIngestBody)

    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 422 with invalid body', async () => {
    const app = createApp()
    const token = makeToken('ws-123')
    const res = await request(app)
      .post('/api/v1/ingest/report')
      .set('Authorization', `Bearer ${token}`)
      .send({ workspaceId: 'ws-123' }) // missing required fields

    expect(res.status).toBe(422)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 201 with valid payload', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({
      reportId: 'report-abc',
      url: 'https://app.rdpulse.ai/report/report-abc',
    })
    vi.mocked(ReportService).prototype.upsert = mockUpsert

    const app = createApp()
    const token = makeToken('ws-123')
    const res = await request(app)
      .post('/api/v1/ingest/report')
      .set('Authorization', `Bearer ${token}`)
      .send(validIngestBody)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      reportId: 'report-abc',
      url: 'https://app.rdpulse.ai/report/report-abc',
    })
    expect(mockUpsert).toHaveBeenCalledWith(validIngestBody, 'ws-123')
  })
})

describe('GET /api/v1/reports/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = TEST_JWT_SECRET
  })

  it('returns 404 for unknown id', async () => {
    const mockFindById = vi.fn().mockResolvedValue(null)
    vi.mocked(ReportService).prototype.findById = mockFindById

    const app = createApp()
    const res = await request(app).get('/api/v1/reports/unknown-id')

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ error: 'Report not found' })
  })

  it('returns 200 with full report for known id', async () => {
    const mockReport = {
      id: 'report-abc',
      workspaceId: 'ws-123',
      reportType: 'sprint',
      windowStart: '2024-01-01T00:00:00Z',
      windowEnd: '2024-01-14T00:00:00Z',
      generatedAt: '2024-01-14T12:00:00Z',
      summary: { health: 'good', headline: 'Sprint is on track' },
      risks: [],
      insights: [],
      url: 'https://app.rdpulse.ai/report/report-abc',
      lastSyncedAt: '2024-01-14T12:00:00Z',
      runCount: 1,
    }
    const mockFindById = vi.fn().mockResolvedValue(mockReport)
    vi.mocked(ReportService).prototype.findById = mockFindById

    const app = createApp()
    const res = await request(app).get('/api/v1/reports/report-abc')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject(mockReport)
  })
})
