import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

// Mock supabase before any imports that use it
vi.mock('../db/supabase', () => ({
  supabase: {},
}))

// Mock WorkspaceService
vi.mock('../services/WorkspaceService')

import { createApp } from '../app'
import { WorkspaceService } from '../services/WorkspaceService'

const TEST_JWT_SECRET = 'test-secret-that-is-long-enough-32chars'

function makeToken(workspaceId: string): string {
  return jwt.sign({ workspaceId }, TEST_JWT_SECRET)
}

describe('POST /api/v1/workspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = TEST_JWT_SECRET
  })

  it('returns 201 with correct shape', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      workspaceId: 'ws-123',
      name: 'Test Workspace',
      status: 'pending_connection',
      licenseJwt: 'signed-jwt-token',
    })
    vi.mocked(WorkspaceService).prototype.create = mockCreate

    const app = createApp()
    const res = await request(app)
      .post('/api/v1/workspaces')
      .send({ name: 'Test Workspace' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      workspaceId: 'ws-123',
      name: 'Test Workspace',
      status: 'pending_connection',
      licenseJwt: 'signed-jwt-token',
    })
  })
})

describe('POST /api/v1/workspaces/:id/heartbeat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = TEST_JWT_SECRET
  })

  it('returns 401 without token', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/workspaces/ws-123/heartbeat')

    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 403 when JWT workspaceId does not match URL :id', async () => {
    const app = createApp()
    const token = makeToken('ws-other') // JWT for a different workspace
    const res = await request(app)
      .post('/api/v1/workspaces/ws-123/heartbeat')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({ error: 'Forbidden' })
  })

  it('returns 404 when workspace does not exist', async () => {
    const mockFindById = vi.fn().mockResolvedValue(null)
    vi.mocked(WorkspaceService).prototype.findById = mockFindById

    const app = createApp()
    const token = makeToken('ws-missing')
    const res = await request(app)
      .post('/api/v1/workspaces/ws-missing/heartbeat')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ error: 'Workspace not found' })
  })

  it('returns 200 with active status on valid JWT and existing workspace', async () => {
    const mockFindById = vi.fn().mockResolvedValue({
      id: 'ws-123',
      name: 'Test Workspace',
      status: 'pending_connection',
      license_jwt: 'some-jwt',
      created_at: new Date().toISOString(),
      last_heartbeat_at: null,
    })
    const mockActivate = vi.fn().mockResolvedValue(undefined)
    vi.mocked(WorkspaceService).prototype.findById = mockFindById
    vi.mocked(WorkspaceService).prototype.activate = mockActivate

    const app = createApp()
    const token = makeToken('ws-123')
    const res = await request(app)
      .post('/api/v1/workspaces/ws-123/heartbeat')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      workspaceId: 'ws-123',
      status: 'active',
    })
    expect(mockActivate).toHaveBeenCalledWith('ws-123')
  })
})
