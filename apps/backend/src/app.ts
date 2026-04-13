import express from 'express'
import cors from 'cors'
import { workspacesRouter } from './routes/workspaces'
import { reportsRouter } from './routes/reports'

export function createApp(): express.Application {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api/v1/workspaces', workspacesRouter)
  app.use('/api/v1', reportsRouter)
  return app
}
