import { Router, Request, Response } from 'express'
import { verifyJwt } from '../middleware/auth'
import { WorkspaceService } from '../services/WorkspaceService'

const router = Router()

function getService(): WorkspaceService {
  return new WorkspaceService()
}

// POST /api/v1/workspaces
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body as { name: string }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const result = await getService().create(name)
    res.status(201).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// POST /api/v1/workspaces/:id/heartbeat
router.post('/:id/heartbeat', verifyJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    if (req.workspaceId !== id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const service = getService()
    const workspace = await service.findById(id)
    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' })
      return
    }
    await service.activate(id)
    res.status(200).json({ workspaceId: id, status: 'active' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// GET /api/v1/workspaces/:id/reports
router.get('/:id/reports', verifyJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    if (req.workspaceId !== id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const result = await getService().getReports(id, cursor)
    res.status(200).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

export { router as workspacesRouter }
