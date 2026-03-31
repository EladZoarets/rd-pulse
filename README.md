# rd-pulse

AI-powered R&D intelligence agent that transforms engineering activity into a daily briefing for managers.

Instead of context-switching between GitHub, Slack, and Jira, you get one structured report — written to a file or your inbox — that tells you exactly what shipped, who's at risk, and what needs your attention.

---

## What You Get

Two output formats, one command.

**Markdown** (`--format md`, default) — prints to the terminal and saves to `DAILY_PULSE.md`:

```
# Daily Pulse — acme/backend
_Generated: 2026-03-31_

## Manager's Note
Strong week. Auth shipped and payments unblocked the mobile team...

## Team Progress

### bob ⚠️ AT RISK
- **Merged:** 0 PRs · **Open:** 3 · **Commits:** 2
- ⚠️ No merged work despite 3 open PRs — may be blocked

### alice
- **Merged:** 5 PRs · **Open:** 1 · **Commits:** 12
- Merged PR #42: feat: OAuth2 login
- Merged PR #43: fix: refresh token expiry

## Feature Themes / Key Achievements / Work in Progress / Risks & Blockers
...
```

**HTML** (`--format html`) — saves a self-contained `DAILY_PULSE.html` you can open in any browser:

- Two-column dashboard with stat cards (Critical Risks · Active Contributors · PRs Merged)
- Activity feed (achievements, feature themes, WIP, large PRs)
- Critical Risks sidebar with ⚠️ items
- Team Pulse sidebar with per-contributor cards and AT RISK badges
- No external dependencies — one file, works offline

---

## Installation

### Prerequisites

- **Node.js 18+** — check with `node --version`
- **npm** — bundled with Node.js
- A GitHub account with access to the repo you want to analyse
- An OpenAI account with GPT-4o access (paid plan)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/EladZoarets/rd-pulse.git
cd rd-pulse

# 2. Install dependencies
npm install
```

That's it. No global install, no build step — run directly with `npx ts-node`.

---

## Configuration

There are three layers of configuration. You only need to touch the first one to get started.

### Layer 1 — API Keys (required)

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

```env
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
```

**How to get your GitHub token:**
1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name it `rd-pulse`, select the **`repo`** scope, click **Generate token**
4. Copy the token — you won't see it again

**How to get your OpenAI key:**
1. Go to **https://platform.openai.com/api-keys**
2. Click **Create new secret key**, name it `rd-pulse`, copy it
3. Your account needs a paid plan for GPT-4o access

---

### Layer 2 — LLM Prompt (optional, no code changes needed)

The AI instructions live in `prompt.md` at the project root. Open and edit it freely:

```bash
open prompt.md   # macOS
# or: code prompt.md / nano prompt.md
```

What you can change:
- **Risk criteria** — e.g. flag PRs stale for >3 days instead of 7
- **Team context** — add your team members' names so the LLM recognises them
- **Custom sections** — e.g. "highlight any PRs missing a Jira ticket link"
- **Language** — translate the output to any language

> The JSON schema block at the top of `prompt.md` must stay intact — it defines what the LLM returns.

---

### Layer 3 — CLI Flags (optional, per-run)

Pass flags when you run the command to override defaults for that run:

| Flag | Default | What it does |
|------|---------|-------------|
| `--owner` | *(required)* | GitHub organisation or username |
| `--repo` | *(required)* | Repository name |
| `--days` | `1` | How many days of history to fetch |
| `--format` | `md` | Output format: `md` (Markdown) or `html` (dashboard) |
| `--output` | `DAILY_PULSE.md` / `DAILY_PULSE.html` | Output file path |
| `--model` | `gpt-4o` | OpenAI model to use |
| `--big-pr-files` | `50` | Flag PRs with this many changed files or more |
| `--big-pr-lines` | `500` | Flag PRs with this many changed lines or more |

---

## Running

```bash
# Basic — last 24 hours, Markdown report
npx ts-node src/index.ts analyze --owner your-org --repo your-repo

# HTML dashboard
npx ts-node src/index.ts analyze --owner your-org --repo your-repo --format html
open DAILY_PULSE.html

# Last 7 days
npx ts-node src/index.ts analyze --owner your-org --repo your-repo --days 7

# Save to a specific file
npx ts-node src/index.ts analyze --owner your-org --repo your-repo --output reports/monday.md

# Tighter large-PR threshold (flag PRs with ≥30 files or ≥300 lines)
npx ts-node src/index.ts analyze --owner your-org --repo your-repo --big-pr-files 30 --big-pr-lines 300
```

---

## Project Structure

```
rd-pulse/
├── prompt.md                       # ← Edit to customise the LLM instructions
├── .env                            # Your API keys (gitignored — never committed)
├── .env.example                    # Template — copy to .env and fill in keys
├── DAILY_PULSE.md                  # Generated Markdown report (gitignored)
├── DAILY_PULSE.html                # Generated HTML report (gitignored)
└── src/
    ├── index.ts                    # CLI entry point
    ├── types.ts                    # Shared TypeScript interfaces
    ├── services/
    │   ├── GitHubService.ts        # Fetches PRs, commits, comments via Octokit
    │   ├── IntelligenceService.ts  # Builds prompt, calls OpenAI, parses response
    │   ├── FormatterService.ts     # Renders AnalysisResult → Markdown
    │   ├── HtmlFormatterService.ts # Renders AnalysisResult → self-contained HTML dashboard
    │   ├── SlackService.ts         # Stage 2 — Slack messages and threads
    │   └── JiraService.ts          # Stage 2 — Jira ticket activity
    └── utils/
        ├── logger.ts               # ASCII header, progress logs, fatal error handler
        └── tokenCounter.ts         # Token budget utilities
```

---

## Roadmap

### Stage 1 — GitHub Daily Digest ✅
- [x] Project scaffold and type definitions
- [x] GitHubService — fetch PRs, commits, comments (pagination + rate limit handling)
- [x] IntelligenceService — LLM analysis with context window management
- [x] FormatterService — structured Markdown with per-contributor progress and risk flags
- [x] HtmlFormatterService — self-contained HTML dashboard (two-column grid, stat cards, AT RISK badges)
- [x] Large PR detection — configurable file and line thresholds (`--big-pr-files`, `--big-pr-lines`)
- [x] CLI — `analyze` command with `--format md|html` and full error handling

### Stage 2 — Full Daily Email Digest *(planned)*
- [ ] SlackService — fetch messages and threads from relevant channels
- [ ] JiraService — fetch ticket activity (status changes, comments, assignments)
- [ ] Cross-source correlation — link PRs ↔ Jira tickets ↔ Slack threads
- [ ] Unified LLM synthesis — GitHub + Slack + Jira in one report
- [ ] Email delivery — daily digest via SMTP or SendGrid
- [ ] Scheduling — cron job or external trigger

---

## Troubleshooting

**`401 Incorrect API key`** — Your `OPENAI_API_KEY` in `.env` is wrong or still the placeholder. Check it at https://platform.openai.com/api-keys.

**`429 Request too large`** — Your OpenAI tier has a low TPM limit. The tool automatically trims the prompt, but very active repos on free-tier accounts may still hit limits. Try `--days 1` (the default) or upgrade your OpenAI plan.

**`Bad credentials` from GitHub** — Your `GITHUB_TOKEN` is expired or missing the `repo` scope. Regenerate it at https://github.com/settings/tokens.

**`System prompt file not found`** — `prompt.md` is missing from the project root. Run `git checkout prompt.md` to restore the default.
