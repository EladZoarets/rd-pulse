# rd-pulse — Task Board

## Stage 1: GitHub Daily Digest

### Foundation
- [x] Task 1 — Project scaffold (package.json, tsconfig.json, .gitignore, .env.example)
- [x] Task 2 — Shared type definitions (src/types.ts)
- [x] Task 3 — Project structure (stub files for all services)

### Services
- [x] Task 4 — `GitHubService.ts` — fetch PRs, commits, comments via @octokit/rest with pagination
- [ ] Task 5 — `IntelligenceService.ts` — build LLM prompt, context window management, call OpenAI
- [ ] Task 6 — `FormatterService.ts` — convert AnalysisResult to structured DAILY_PULSE.md

### Utilities
- [ ] Task 7 — `logger.ts` — ASCII header, progress logs, fatal error handler
- [ ] Task 8 — `tokenCounter.ts` — token budget enforcement, tiered trimming strategy

### CLI
- [ ] Task 9 — `index.ts` — wire up commander, orchestrate full pipeline, error handling

### Polish
- [ ] Task 10 — End-to-end test against a real GitHub repo
- [ ] Task 11 — Update CLAUDE.md with dev setup and module docs

---

## Stage 2: Full Daily Email Digest

### Integrations
- [ ] Task 12 — Slack integration — fetch messages and threads from relevant channels
- [ ] Task 13 — Jira integration — fetch ticket activity (status changes, comments, assignments)

### Intelligence
- [ ] Task 14 — Cross-source correlation — link PRs ↔ Jira tickets ↔ Slack threads
- [ ] Task 15 — Unified prompt — synthesize GitHub + Slack + Jira into one AnalysisResult

### Delivery
- [ ] Task 16 — Email service — compose and send daily digest via SMTP or SendGrid
- [ ] Task 17 — Scheduling — cron job or external trigger for automated daily runs

---

## Backlog / Ideas
- [ ] Support multiple repos in a single run
- [ ] Configurable report sections (opt-in/out per section)
- [ ] Web UI dashboard for historical pulses
- [ ] Webhook mode — trigger on PR activity instead of scheduled run
