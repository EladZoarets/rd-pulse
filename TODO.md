# rd-pulse — Task Board

## Stage 1: GitHub Daily Digest

### Foundation
- [x] Task 1 — Project scaffold (package.json, tsconfig.json, .gitignore, .env.example)
- [x] Task 2 — Shared type definitions (src/types.ts)
- [x] Task 3 — Project structure (stub files for all services)

### Services
- [x] Task 4 — `GitHubService.ts` — fetch PRs, commits, comments via @octokit/rest with pagination
- [x] Task 5 — `IntelligenceService.ts` — build LLM prompt, context window management, call OpenAI
- [x] Task 6 — `FormatterService.ts` — convert AnalysisResult to structured DAILY_PULSE.md

### Utilities
- [ ] Task 7 — `logger.ts` — ASCII header, progress logs, fatal error handler
- [ ] Task 8 — `tokenCounter.ts` — token budget enforcement, tiered trimming strategy

### CLI
- [ ] Task 9 — `index.ts` — wire up commander, orchestrate full pipeline, error handling

### Polish
- [ ] Task 10 — End-to-end test against a real GitHub repo
- [ ] Task 11 — Update CLAUDE.md with dev setup and module docs

---

## Stage 2: Unified GitHub + Jira Intelligence (v2.0)

### Types
- [x] Task 12 — Extend `types.ts` with Jira + Unified types (`JiraIssue`, `JiraSprintContext`, `JiraFetchOptions`, `UnifiedActivity`, `UnifiedReport`, `TopicBreakdown`, `RiskItem`, `PersonalPulse`). Move existing Jira types out of `JiraService.ts`.

### JiraService
- [ ] Task 13 — `JiraService.test.ts` (red phase) — mock axios; cover `fetchSprintContext`: active sprint, status bucket mapping, empty sprint, 401 error, missing active sprint, custom fields, story points field, default fields fallback
- [ ] Task 14 — Implement `JiraService.fetchSprintContext(boardId, options?)` — axios + Basic Auth, Jira Agile REST v1, map `statusCategory.key` → `TO_DO / IN_PROGRESS / DONE`, optional `storyPointsField`, `fields` override

### Ghost Work Detection
- [ ] Task 15 — Add `ghostWorkPRs: GitHubPR[]` to `ActivityContext` in `types.ts`; flag PRs in `GitHubService` where branch name AND title contain no `[A-Z]+-\d+` pattern; add unit tests

### IntelligenceService
- [ ] Task 16 — `IntelligenceService.test.ts` additions (red phase) — `analyzeUnified()`: valid `UnifiedReport`, pre-labeled Ghost Work PRs, token-trimmed path, empty LLM response, malformed JSON
- [ ] Task 17 — Implement `IntelligenceService.analyzeUnified(activity: UnifiedActivity)` + `buildUnifiedPrompt()` + `parseUnifiedResponse()`; write `prompt-unified.md` (Ghost Work pre-labeled, Unassigned risk rule, Sprint Jeopardy, Overload, Stall)

### Formatters
- [ ] Task 18 — `FormatterService.test.ts` additions + implement `formatUnified(report: UnifiedReport)` — 5 sections: Summary, Topic Breakdown, Risk/Danger Zone (with UNASSIGNED risk), Personal Pulse table, Manager's Note
- [ ] Task 19 — `HtmlFormatterService.test.ts` additions + implement `formatUnified(report: UnifiedReport)` — HTML equivalent

### CLI
- [ ] Task 20 — Add `pulse` command to `index.ts`: `--owner`, `--repo`, `--board`, `--days`, `--format`, `--model`, `--jira-fields`, `--jira-sp-field`; validate `JIRA_DOMAIN`, `JIRA_EMAIL`, `JIRA_TOKEN`; orchestrate unified pipeline; update `.env.example`

---

## Stage 3: Full Daily Email Digest

### Integrations
- [ ] Task 21 — Slack integration — fetch messages and threads from relevant channels
- [ ] Task 22 — Cross-source correlation — link PRs ↔ Jira tickets ↔ Slack threads

### Delivery
- [ ] Task 23 — Email service — compose and send daily digest via SMTP or SendGrid
- [ ] Task 24 — Scheduling — cron job or external trigger for automated daily runs

---

## Backlog / Ideas
- [ ] Support multiple repos in a single run
- [ ] Configurable report sections (opt-in/out per section)
- [ ] Web UI dashboard for historical pulses
- [ ] Webhook mode — trigger on PR activity instead of scheduled run
