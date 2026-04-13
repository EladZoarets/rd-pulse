import { createApp } from './app'

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'] as const
const missing = REQUIRED_ENV.filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(', ')}`)
  process.exit(1)
}

const app = createApp()
const port = process.env.PORT ?? 3001
app.listen(port, () => {
  console.log(`rd-pulse backend listening on :${port}`)
})
