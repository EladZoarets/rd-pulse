import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { verifyJwt } from '../middleware/auth'
import { ReportService } from '../services/ReportService'
import type { IngestPayload } from '@rdpulse/types'

const router = Router()

function getService(): ReportService {
  return new ReportService()
}

const riskSchema = z.object({
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  title: z.string(),
  description: z.string(),
  links: z.array(
    z.object({
      label: z.string(),
      url: z.string(),
    })
  ),
})

const insightSchema = z.object({
  type: z.string(),
  description: z.string(),
})

const ingestSchema = z.object({
  workspaceId: z.string(),
  reportType: z.string(),
  windowStart: z.string().datetime({ offset: true }),
  windowEnd: z.string().datetime({ offset: true }),
  generatedAt: z.string().datetime({ offset: true }),
  summary: z.object({
    health: z.enum(['good', 'at_risk', 'critical']),
    headline: z.string(),
  }),
  risks: z.array(riskSchema),
  insights: z.array(insightSchema),
})

// POST /api/v1/ingest/report
router.post('/ingest/report', verifyJwt, async (req: Request, res: Response): Promise<void> => {
  const parsed = ingestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: 'Validation failed', details: parsed.error.errors })
    return
  }

  try {
    const workspaceId = req.workspaceId!
    const result = await getService().upsert(parsed.data as IngestPayload, workspaceId)
    res.status(201).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// GET /api/v1/reports/:id  (public, no auth)
router.get('/reports/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const report = await getService().findById(id)
    if (!report) {
      res.status(404).json({ error: 'Report not found' })
      return
    }
    res.status(200).json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

export { router as reportsRouter }
