# rd-pulse

AI-powered R&D intelligence agent that transforms engineering activity into a daily briefing for managers.

Instead of context-switching between GitHub, Slack, and Jira, you get one structured report — written to a file or your inbox — that tells you exactly what shipped, who's at risk, and what needs your attention.

---

## Commands

rd-pulse has two commands:

| Command | What it does |
|---------|-------------|
| `analyze` | GitHub-only daily digest (Stage 1) |
| `pulse` | Unified GitHub + Jira sprint report with visual dashboard (Stage 2) |

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

Combines GitHub activity + Jira sprint data in one report. Saved to `PULSE_REPORT.md` or `PULSE_REPORT.html`.

**HTML** (`--format html`) — visual manager dashboard:
- **Health banner** — 🟢 ON TRACK / 🟡 NEEDS ATTENTION / 🔴 AT RISK based on sprint risks
- **SVG donut chart** — done % with green/amber arcs and KPI strip (done · in progress · to do)
- **Danger Zone cards** — colour-coded risk cards (red=high, amber=medium, green=low) with severity badges
- **Personal Pulse** — per-developer mini bar charts (done/in-progress/in-review) with OVERLOADED and UNASSIGNED badges
- **Topic Breakdown** — inline stacked progress bars per Jira epic/topic
- **GitHub Activity** — styled timeline (✅ merged, 👁 in review, 👻 ghost work, ⚡ direct commit)
- **Manager's Note** — LLM-generated summary at the bottom

**Ghost Work detection** — PRs with no Jira ticket reference in branch name or title are flagged automatically.

---

## Installation

### Prerequisites

- **Node.js 18+** — check with `node --version`
- **npm** — bundled with Node.js
- A GitHub account with access to the repo you want to analyse
- An OpenAI account with GPT-4o access (paid plan)
- A Jira account (for the `pulse` command)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/EladZoarets/rd-pulse.git
cd rd-pulse

# 2. Install dependencies
npm install
```

No global install, no build step — run directly with `npx ts-node`.

---

## Configuration

### API Keys (required)

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

```env
# GitHub + OpenAI (required for both commands)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx

# Jira (required for the pulse command only)
JIRA_DOMAIN=https://your-org.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_TOKEN=your-jira-api-token
```

**GitHub token:** GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → `repo` scope.

**OpenAI key:** https://platform.openai.com/api-keys — requires a paid plan for GPT-4o.

**Jira token:** https://id.atlassian.com/manage-profile/security/api-tokens → Create API token.

---

### LLM Prompts (optional)

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

### CLI Flags

#### `analyze` flags

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

#### `pulse` flags

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

## Running

```bash
# GitHub-only daily digest (Markdown)
npx ts-node src/index.ts analyze --owner your-org --repo your-repo

# GitHub-only HTML dashboard
npx ts-node src/index.ts analyze --owner your-org --repo your-repo --format html
open DAILY_PULSE.html

# Unified GitHub + Jira sprint report (Markdown)
npx ts-node src/index.ts pulse --owner your-org --repo your-repo --board 42

# Unified HTML manager dashboard
npx ts-node src/index.ts pulse --owner your-org --repo your-repo --board 42 --format html
open PULSE_REPORT.html

# Last 7 days, save to a custom path
npx ts-node src/index.ts pulse --owner your-org --repo your-repo --board 42 --days 7 --output reports/sprint-12.html --format html

# Custom Jira fields + story points field
npx ts-node src/index.ts pulse --owner your-org --repo your-repo --board 42 \
  --jira-fields summary,status,assignee,story_points \
  --jira-sp-field customfield_10016
```

---

## Project Structure

```
rd-pulse/
├── prompt.md                       # LLM instructions for analyze command
├── prompt-unified.md               # LLM instructions for pulse command
├── .env                            # Your API keys (gitignored)
├── .env.example                    # Template — copy to .env and fill in
├── DAILY_PULSE.md/html             # Generated analyze reports (gitignored)
├── PULSE_REPORT.md/html            # Generated pulse reports (gitignored)
└── src/
    ├── index.ts                    # CLI entry — analyze + pulse commands
    ├── types.ts                    # All shared TypeScript interfaces
    ├── services/
    │   ├── GitHubService.ts        # GitHub API — PRs, commits, ghost work detection
    │   ├── JiraService.ts          # Jira Agile API — sprint context, issue buckets
    │   ├── IntelligenceService.ts  # OpenAI — analyze() + analyzeUnified()
    │   ├── FormatterService.ts     # Markdown renderer — format() + formatUnified()
    │   └── HtmlFormatterService.ts # HTML dashboard renderer — format() + formatUnified()
    └── utils/
        ├── logger.ts               # ASCII header, progress logs, fatal error handler
        └── tokenCounter.ts         # Token budget enforcement, tiered trimming
```

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

### Stage 3 — Full Daily Email Digest *(planned)*
- [ ] Slack integration — fetch messages and threads from relevant channels
- [ ] Cross-source correlation — link PRs ↔ Jira tickets ↔ Slack threads
- [ ] Email delivery — daily digest via SMTP or SendGrid
- [ ] Scheduling — cron job or external trigger for automated daily runs

### Stage 4 — AI Assist Tracking *(planned)*
> Track how much AI tooling (Copilot, Cursor, Claude, etc.) each developer uses via a lightweight PR-label convention that works for any tool.
- [ ] `AiAssistStat` types + `ai-assisted` PR label detection in GitHubService
- [ ] AI assist stats surfaced in unified LLM prompt and report
- [ ] Markdown + HTML AI Assist section (per-developer adoption rate)
- [ ] PR template helper script — drops `.github/pull_request_template.md` with AI-assisted checkbox

---

## Troubleshooting

**`401 Incorrect API key`** — Your `OPENAI_API_KEY` in `.env` is wrong. Check it at https://platform.openai.com/api-keys.

**`429 Request too large`** — Your OpenAI tier has a low TPM limit. The tool trims the prompt automatically, but try `--days 1` or upgrade your plan.

**`Bad credentials` from GitHub** — Your `GITHUB_TOKEN` is expired or missing the `repo` scope. Regenerate at https://github.com/settings/tokens.

**`System prompt file not found`** — `prompt.md` or `prompt-unified.md` is missing. Run `git checkout prompt.md prompt-unified.md` to restore.

**Jira `401 Unauthorized`** — Check `JIRA_EMAIL` and `JIRA_TOKEN` in `.env`. The token is your Atlassian API token, not your password.

**Jira `No active sprint found`** — The board has no active sprint. Start a sprint in Jira first, or check your `--board` ID is correct.
