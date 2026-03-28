# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Project Overview

**rd-pulse** is a two-stage AI-powered R&D intelligence agent for engineering managers.

- **Stage 1:** Fetches 24h of GitHub activity → LLM analysis → `DAILY_PULSE.md`
- **Stage 2 (planned):** GitHub + Slack + Jira → unified LLM synthesis → daily email digest

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Language | TypeScript (strict mode) |
| Runtime | Node.js 18+ |
| CLI framework | `commander` |
| GitHub API | `@octokit/rest` |
| AI | OpenAI (`openai` SDK), default model `gpt-4o` |
| Env | `dotenv` — `.env` file, never committed |
| Testing | Jest + `ts-jest` |

---

## Project Structure

```
src/
├── index.ts                      # CLI entry — commander, pipeline orchestration
├── types.ts                      # All shared interfaces — source of truth for types
├── services/
│   ├── GitHubService.ts          # GitHub API layer — fetchActivity()
│   ├── IntelligenceService.ts    # OpenAI layer — analyze()
│   └── FormatterService.ts       # Markdown builder — format()
└── utils/
    ├── logger.ts                 # ASCII header, progress logs, fatal error handler
    └── tokenCounter.ts           # Token budget enforcement, tiered trimming
scripts/
    └── test-github.ts            # Manual smoke test against a real GitHub repo
```

---

## Development Rules

### Test-Driven Development (TDD) — mandatory

Every new feature or service method must follow the red → green cycle:

1. **Red** — write the test first. Run `npm test` and confirm it fails.
2. **Green** — implement the minimum code to make the test pass.
3. **Refactor** — clean up without breaking tests.

Never write implementation code before the test exists. Never skip the red phase.

### Test file conventions

- All tests live in `src/__tests__/`
- Filename pattern: `<ServiceName>.test.ts`
- Mock external dependencies (Octokit, OpenAI) at the module level with `jest.mock()`
- Never make real API calls in tests
- Use `jest.useFakeTimers()` whenever time-dependent logic is tested

### Running tests

```bash
npm test              # run all tests once
npm run test:watch    # watch mode during development
```

---

## Code Rules

### TypeScript

- `strict: true` is enforced — no `any` in production code (test files may use `any` for mock fixtures)
- All shared data shapes must be defined as interfaces in `src/types.ts`
- No type is defined more than once — import from `types.ts`

### Services

- Each service has a **single responsibility** — no cross-service imports
- `GitHubService` → data only, no LLM calls
- `IntelligenceService` → LLM only, no GitHub calls
- `FormatterService` → pure string transformation, no I/O or API calls

### Error handling

- All external API errors (GitHub, OpenAI) must be caught and re-thrown with a human-readable message
- Never surface raw stack traces to the user
- All fatal errors funnel through `handleFatalError()` in `logger.ts`
- Use `process.exit(1)` for all fatal failures — never let unhandled rejections crash silently

### Environment

- `GITHUB_TOKEN` and `OPENAI_API_KEY` are the only required env vars
- Validate both at startup before any API call is made
- `.env` is gitignored — never commit real credentials
- `.env.example` must stay up to date with all required variables

---

## Git Rules

- Commit after each completed task
- Commit message format: `type: short description` (e.g. `feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- `DAILY_PULSE.md` is gitignored — never commit generated reports
- `dist/` is gitignored — never commit build output

---

## Task Completion Pipeline — mandatory

After every task, run the full quality gate in this order:

1. **`/chaos`** — stress test the diff. Find failure scenarios, edge cases, and regression risks. If verdict is `[FAIL]`, fix all breaking scenarios before proceeding.
2. **`/code-review`** — review for design adherence, code cleanliness, and spec compliance. Address all findings.
3. **Commit & push** — only after both `/chaos` and `/code-review` pass.

No task is complete until all three steps are done. Never skip chaos or code review, even for small changes.

---

## Definition of Done

A task is done when:

1. All tests pass (`npm test` exits 0)
2. No `tsc --noEmit` errors
3. No `any` types in production code
4. `/chaos` verdict is `[PASS]`
5. `/code-review` has been completed
6. The feature works end-to-end (manual smoke test where applicable)
7. `TODO.md` checkbox is ticked
