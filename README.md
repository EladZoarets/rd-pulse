# rd-pulse

AI-powered R&D intelligence agent that transforms engineering activity into a daily briefing for managers.

Instead of context-switching between GitHub, Slack, and Jira, you get one structured report — written to a file or your inbox — that tells you exactly what shipped, who's at risk, and what needs your attention.

---

## Overview

rd-pulse has two parts:

| Part | What it is |
|------|-----------|
| **Web dashboard** | A hosted app where your team's reports appear automatically |
| **Connector CLI** | A command you run locally (or in CI) to generate and push reports |

---

## Web Dashboard

The dashboard is live at **https://rd-pulse-five.vercel.app**

It shows all reports pushed by the connector CLI. No login required — access is scoped per workspace.

**Setup flow:**

1. Open the dashboard → go to **/setup**
2. Enter a workspace name → click **Create Workspace**
3. Copy the generated `npx` install command (pre-filled with your workspace ID + JWT)
4. Run that command in your repo (see [Connector CLI](#connector-cli) below)
5. Once the connector sends its first heartbeat the workspace flips to **Active** and you land on **/reports**

---

## Connector CLI

The connector runs locally or in CI and pushes reports to the web dashboard.

### Quick start (npx — no install needed)

```bash
npx rdpulse-connector pulse \
  --owner your-org \
  --repo  your-repo \
  --board 42
```

The `npx` command on the **/setup** page is pre-filled with `--workspace` and `--jwt` flags pointing to your workspace. Copy it from there.

### Global install (optional)

```bash
npm install -g rdpulse-connector
rdpulse-connector pulse --owner your-org --repo your-repo --board 42
```

### Prerequisites

- **Node.js 18+** — check with `node --version`. Download at https://nodejs.org
- A GitHub personal access token — https://github.com/settings/tokens (`repo` scope)
- An OpenAI API key — https://platform.openai.com/api-keys (paid plan, GPT-4o)
- A Jira API token — https://id.atlassian.com/manage-profile/security/api-tokens

### Configuration

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
# Required for both commands
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx

# Required for the pulse command
JIRA_DOMAIN=https://your-org.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_TOKEN=your-jira-api-token

# Required to push reports to the web dashboard
# Copy these from the /setup page — they are pre-filled for you
RDPULSE_SERVER=https://rdpulse-backend-production.up.railway.app
WORKSPACE_ID=ws-xxxxxxxxxxxx
RDPULSE_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get each key:**

| Key | Where |
|-----|-------|
| `GITHUB_TOKEN` | https://github.com/settings/tokens → New token (classic) → `repo` scope |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `JIRA_TOKEN` | https://id.atlassian.com/manage-profile/security/api-tokens → Create API token |
| `JIRA_DOMAIN` | Your Atlassian URL, e.g. `https://acme.atlassian.net` |
| `RDPULSE_SERVER` / `WORKSPACE_ID` / `RDPULSE_JWT` | Copied from the **/setup** page of the dashboard |

---

## Commands

The connector CLI has two commands:

| Command | What it does |
|---------|-------------|
| `analyze` | GitHub-only daily digest — no Jira needed |
| `pulse` | Unified GitHub + Jira sprint report, pushes to web dashboard |

---

## What You Get

### `analyze` — GitHub Daily Digest

**Markdown** (`--format md`, default) — saves to `DAILY_PULSE.md`:

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

## Feature Themes / Key Achievements / Work in Progress / Risks & Blockers
...
```

**HTML** (`--format html`) — self-contained dashboard saved to `DAILY_PULSE.html`:
- Stat cards: Critical Risks · Active Contributors · PRs Merged
- Activity feed (achievements, feature themes, WIP, large PRs)
- Critical Risks sidebar with ⚠️ items
- Team Pulse sidebar with per-contributor AT RISK badges

---

### `pulse` — Unified Sprint Dashboard

Combines GitHub activity + Jira sprint data in one report. Saved to `PULSE_REPORT.md` or `PULSE_REPORT.html`. Also pushed to the web dashboard when `RDPULSE_SERVER`, `WORKSPACE_ID`, and `RDPULSE_JWT` are set.

**HTML** (`--format html`) — visual manager dashboard:
- **Health banner** — 🟢 ON TRACK / 🟡 NEEDS ATTENTION / 🔴 AT RISK based on sprint risks
- **SVG donut chart** — done % with green/amber arcs and KPI strip (done · in progress · to do)
- **Danger Zone cards** — colour-coded risk cards (red=high, amber=medium, green=low) with severity badges
- **Personal Pulse** — per-developer mini bar charts with OVERLOADED and UNASSIGNED badges
- **Topic Breakdown** — inline stacked progress bars per Jira epic/topic
- **GitHub Activity** — styled timeline (✅ merged, 👁 in review, 👻 ghost work, ⚡ direct commit)
- **Manager's Note** — LLM-generated summary at the bottom

**Ghost Work detection** — PRs with no Jira ticket reference in the branch name or title are flagged automatically.

---

## CLI Flags

### `analyze` flags

| Flag | Default | What it does |
|------|---------|-------------|
| `--owner` | *(required)* | GitHub organisation or username |
| `--repo` | *(required)* | Repository name |
| `--days` | `1` | Days of history to fetch |
| `--format` | `md` | `md` or `html` |
| `--output` | `DAILY_PULSE.md/html` | Output file path |
| `--model` | `gpt-4o` | OpenAI model |
| `--big-pr-files` | `50` | Flag PRs with ≥N changed files |
| `--big-pr-lines` | `500` | Flag PRs with ≥N changed lines |

### `pulse` flags

| Flag | Default | What it does |
|------|---------|-------------|
| `--owner` | *(required)* | GitHub organisation or username |
| `--repo` | *(required)* | Repository name |
| `--board` | *(required)* | Jira board ID |
| `--days` | `1` | Days of GitHub history to fetch |
| `--format` | `md` | `md` or `html` |
| `--output` | `PULSE_REPORT.md/html` | Output file path |
| `--model` | `gpt-4o` | OpenAI model |
| `--jira-fields` | *(default set)* | Comma-separated Jira fields to fetch |
| `--jira-sp-field` | `story_points` | Custom story points field name |

---

## Example Commands

```bash
# GitHub-only daily digest (Markdown)
npx rdpulse-connector analyze --owner your-org --repo your-repo

# GitHub-only HTML dashboard
npx rdpulse-connector analyze --owner your-org --repo your-repo --format html
open DAILY_PULSE.html

# Unified GitHub + Jira sprint report (Markdown)
npx rdpulse-connector pulse --owner your-org --repo your-repo --board 42

# Unified HTML manager dashboard
npx rdpulse-connector pulse --owner your-org --repo your-repo --board 42 --format html
open PULSE_REPORT.html

# Last 7 days, save to a custom path
npx rdpulse-connector pulse --owner your-org --repo your-repo --board 42 \
  --days 7 --output reports/sprint-12.html --format html

# Custom Jira fields + story points field
npx rdpulse-connector pulse --owner your-org --repo your-repo --board 42 \
  --jira-fields summary,status,assignee,story_points \
  --jira-sp-field customfield_10016
```

---

## Deploying Your Own Backend

The default backend at `https://rdpulse-backend-production.up.railway.app` is shared. To run your own:

### 1. Supabase (database)

1. Create a free project at https://supabase.com
2. Go to **Settings → API**
3. Copy **Project URL** → this is your `SUPABASE_URL`
4. Copy the **`service_role`** key (not `anon`) → this is your `SUPABASE_SERVICE_KEY`

### 2. Railway (hosting)

1. Create a free account at https://railway.app
2. Click **New Project → Deploy from GitHub repo** → select this repo
3. Set the root directory to `apps/backend`
4. Add these environment variables under **Variables**:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=<run: openssl rand -hex 32>
```

5. Railway auto-deploys on every push. Your backend URL appears under **Settings → Networking → Public Domain**.

### 3. Vercel (frontend)

1. Create a free account at https://vercel.com
2. Click **Add New → Project → Import Git Repository** → select this repo
3. Leave the root directory as `/` (uses the root `vercel.json`)
4. Add these environment variables:

```
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-railway-domain.up.railway.app
```

5. Click **Deploy**. Your dashboard URL appears once the build finishes.

---

## LLM Prompts (optional)

The AI instructions live in prompt files at the project root. Edit them freely:

| File | Used by |
|------|---------|
| `prompt.md` | `analyze` command |
| `prompt-unified.md` | `pulse` command |

What you can customise:
- **Risk criteria** — e.g. flag PRs stale for >3 days instead of 7
- **Team context** — add your team members' names
- **Custom sections** — e.g. "highlight any PRs missing a Jira ticket link"
- **Language** — translate the output to any language

> The JSON schema block at the top of each prompt file must stay intact.

---

## Project Structure

```
rd-pulse/
├── prompt.md                       # LLM instructions for analyze command
├── prompt-unified.md               # LLM instructions for pulse command
├── .env                            # Your API keys (gitignored)
├── .env.example                    # Template — copy to .env and fill in
├── vercel.json                     # Vercel monorepo build config
├── apps/
│   ├── frontend/                   # React 18 + Vite dashboard (Vercel)
│   └── backend/                    # Express + Supabase API (Railway)
├── packages/
│   └── types/                      # Shared TypeScript interfaces
└── src/                            # Connector CLI source
    ├── index.ts                    # CLI entry — analyze + pulse commands
    ├── types.ts                    # All shared TypeScript interfaces
    ├── services/
    │   ├── GitHubService.ts        # GitHub API — PRs, commits, ghost work detection
    │   ├── JiraService.ts          # Jira Agile API — sprint context, issue buckets
    │   ├── IntelligenceService.ts  # OpenAI — analyze() + analyzeUnified()
    │   ├── FormatterService.ts     # Markdown renderer
    │   ├── HtmlFormatterService.ts # HTML dashboard renderer
    │   └── ReportSenderService.ts  # Pushes reports to the web dashboard
    └── utils/
        ├── logger.ts               # ASCII header, progress logs, fatal error handler
        └── tokenCounter.ts         # Token budget enforcement, tiered trimming
```

---

## Troubleshooting

**`401 Incorrect API key`** — Your `OPENAI_API_KEY` in `.env` is wrong. Check it at https://platform.openai.com/api-keys.

**`429 Request too large`** — Your OpenAI tier has a low TPM limit. The tool trims the prompt automatically, but try `--days 1` or upgrade your plan.

**`Bad credentials` from GitHub** — Your `GITHUB_TOKEN` is expired or missing the `repo` scope. Regenerate at https://github.com/settings/tokens.

**`System prompt file not found`** — `prompt.md` or `prompt-unified.md` is missing. Run `git checkout prompt.md prompt-unified.md` to restore.

**Jira `401 Unauthorized`** — Check `JIRA_EMAIL` and `JIRA_TOKEN` in `.env`. The token is your Atlassian API token, not your password.

**Jira `No active sprint found`** — The board has no active sprint. Start a sprint in Jira first, or check your `--board` ID is correct.

**Dashboard shows no reports** — Make sure `RDPULSE_SERVER`, `WORKSPACE_ID`, and `RDPULSE_JWT` are set in `.env`. These are copied from the **/setup** page of the dashboard.

---

## Roadmap

### Stage 1 — GitHub Daily Digest ✅
- [x] GitHubService — PRs, commits, large PR detection, ghost work flagging
- [x] IntelligenceService — LLM analysis with token budget management
- [x] FormatterService — Markdown with per-contributor progress and risk flags
- [x] HtmlFormatterService — self-contained HTML dashboard
- [x] CLI — `analyze` command with `--format md|html`

### Stage 2 — Unified GitHub + Jira Sprint Report ✅
- [x] JiraService — active sprint, issue status buckets, story points, custom fields
- [x] Ghost work detection — PRs with no Jira ticket reference auto-flagged
- [x] IntelligenceService — `analyzeUnified()` combining GitHub + Jira signals
- [x] FormatterService — `formatUnified()` with Summary, Topic Breakdown, Danger Zone, Personal Pulse
- [x] HtmlFormatterService — visual manager dashboard with donut chart, risk cards, pulse bars
- [x] CLI — `pulse` command with `--board`, `--jira-fields`, `--jira-sp-field`

### Stage 3 — Web Dashboard ✅
- [x] Backend API — Express + Supabase, workspace management, report ingestion
- [x] Frontend — React 18 + Vite + TanStack Query dashboard
- [x] Connector — `ReportSenderService` pushes reports from CLI to dashboard
- [x] Deployment — Railway (backend), Vercel (frontend), npm (connector CLI)

### Stage 4 — Full Daily Email Digest *(planned)*
- [ ] Slack integration — fetch messages and threads from relevant channels
- [ ] Cross-source correlation — link PRs ↔ Jira tickets ↔ Slack threads
- [ ] Email delivery — daily digest via SMTP or SendGrid
- [ ] Scheduling — cron job or external trigger for automated daily runs

### Stage 5 — AI Assist Tracking *(planned)*
- [ ] `AiAssistStat` types + `ai-assisted` PR label detection in GitHubService
- [ ] AI assist stats surfaced in unified LLM prompt and report
- [ ] Markdown + HTML AI Assist section (per-developer adoption rate)
- [ ] PR template helper — drops `.github/pull_request_template.md` with AI-assisted checkbox
