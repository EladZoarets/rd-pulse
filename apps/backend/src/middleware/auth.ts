import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extend Express Request to include workspaceId
declare global {
  namespace Express {
    interface Request {
      workspaceId?: string
    }
  }
}

interface JwtPayload {
  workspaceId: string
}

export function verifyJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    if (!payload.workspaceId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    req.workspaceId = payload.workspaceId
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
