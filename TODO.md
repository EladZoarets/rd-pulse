# rd-pulse — Task Board

## Web Product MVP

### Foundation
- [ ] Task 1 — Bootstrap monorepo workspace structure (`package.json` workspaces, `packages/types`, `apps/backend`, `apps/frontend` scaffolds)
- [ ] Task 2 — Define shared API contract types in `packages/types/src/index.ts` (`IngestPayload`, `WorkspaceCreateResponse`, `ReportDetail`, `RiskPayload`, etc.)

### Backend
- [ ] Task 3 — Supabase: create project, run schema migrations (`workspaces` + `reports` tables with composite unique key), add env vars
- [ ] Task 4 — Backend: `POST /workspaces` + `POST /workspaces/:id/heartbeat` — workspace creation, JWT issuance, status transition `pending_connection` → `active`
- [ ] Task 5 — Backend: `POST /ingest/report` (JWT auth, Zod validation, Supabase upsert) + `GET /reports/:id` (public, no auth)
- [ ] Task 6 — Backend: Express entry point, route mounting, integration smoke test (create → heartbeat → ingest → fetch)

### Connector
- [ ] Task 7 — `ReportSenderService.ts`: `sendHeartbeat()` on startup + `sendReport()` after analysis; unit tests; add `RDPULSE_SERVER`, `WORKSPACE_ID`, `RDPULSE_JWT` to `.env.example`
- [ ] Task 8 — Wire `ReportSenderService` into `src/index.ts` pipeline; existing 199 tests must still pass

### Frontend
- [ ] Task 9 — `/setup` page: workspace creation form, pre-filled connector install command, status polling until heartbeat activates workspace
- [ ] Task 10 — `/report/:id` page: public report viewer — 6 sections (Header, Top Risks, Jira Risks, Team Signals, GitHub Signals, Navigation Links), color-coded health badge, all links open in new tab
