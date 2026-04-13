import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures mockFrom is initialized before vi.mock factory runs
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('../db/supabase', () => ({
  supabase: { from: mockFrom },
}))

import { ReportService } from '../services/ReportService'

const BASE_PAYLOAD = {
  workspaceId: 'ws-123',
  reportType: 'sprint',
  windowStart: '2024-01-01T00:00:00Z',
  windowEnd: '2024-01-14T00:00:00Z',
  generatedAt: '2024-01-14T12:00:00Z',
  summary: { health: 'good' as const, headline: 'All good' },
  risks: [],
  insights: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.APP_BASE_URL = 'https://app.rdpulse.ai'
})

describe('ReportService.upsert', () => {
  it('inserts a new row and returns reportId + url when no existing record', async () => {
    // First call: UPDATE finds no matching row → error
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'no rows' } }),
    }
    // Second call: INSERT succeeds
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'report-new' }, error: null }),
    }

    mockFrom.mockReturnValueOnce({ update: vi.fn().mockReturnValue(updateChain) })
    mockFrom.mockReturnValueOnce({ insert: vi.fn().mockReturnValue(insertChain) })

    const result = await new ReportService().upsert(BASE_PAYLOAD, 'ws-123')

    expect(result.reportId).toBe('report-new')
    expect(result.url).toBe('https://app.rdpulse.ai/report/report-new')
  })

  it('updates existing row and increments run_count when record already exists', async () => {
    // First call: UPDATE finds existing row, returns id + current run_count
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'report-existing', run_count: 3 }, error: null }),
    }
    // Second call: UPDATE to increment run_count
    const incChain = {
      eq: vi.fn().mockResolvedValue({ error: null }),
    }

    mockFrom.mockReturnValueOnce({ update: vi.fn().mockReturnValue(updateChain) })
    mockFrom.mockReturnValueOnce({ update: vi.fn().mockReturnValue(incChain) })

    const result = await new ReportService().upsert(BASE_PAYLOAD, 'ws-123')

    expect(result.reportId).toBe('report-existing')
    expect(result.url).toBe('https://app.rdpulse.ai/report/report-existing')
    // Verify increment: run_count was 3 → should be set to 4
    const incUpdateFn = mockFrom.mock.results[1].value.update
    expect(incUpdateFn).toHaveBeenCalledWith({ run_count: 4 })
  })

  it('throws when insert fails', async () => {
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'no rows' } }),
    }
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }

    mockFrom.mockReturnValueOnce({ update: vi.fn().mockReturnValue(updateChain) })
    mockFrom.mockReturnValueOnce({ insert: vi.fn().mockReturnValue(insertChain) })

    await expect(new ReportService().upsert(BASE_PAYLOAD, 'ws-123')).rejects.toThrow('Failed to insert report')
  })

  it('throws when run_count increment fails', async () => {
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'report-existing', run_count: 1 }, error: null }),
    }
    const incChain = {
      eq: vi.fn().mockResolvedValue({ error: { message: 'increment failed' } }),
    }

    mockFrom.mockReturnValueOnce({ update: vi.fn().mockReturnValue(updateChain) })
    mockFrom.mockReturnValueOnce({ update: vi.fn().mockReturnValue(incChain) })

    await expect(new ReportService().upsert(BASE_PAYLOAD, 'ws-123')).rejects.toThrow('Failed to increment run_count')
  })
})
