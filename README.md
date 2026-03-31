# rd-pulse

AI-powered R&D intelligence agent that transforms engineering activity into a daily briefing for managers.

Instead of context-switching between GitHub, Slack, and Jira, you get one structured report — written to a file or your inbox — that tells you exactly what shipped, who's at risk, and what needs your attention.

---

## What You Get

```
# Daily Pulse — acme/backend
_Generated: 2026-03-31T09:00:00.000Z_

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

## Feature Themes
...

## Key Achievements / Work in Progress / Risks & Blockers
...
```

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/EladZoarets/rd-pulse.git
cd rd-pulse
npm install
```

### 2. Get your API keys

You need two keys to run Stage 1.

#### GitHub Personal Access Token

1. Go to **GitHub → Settings → Developer Settings → Personal access tokens → Tokens (classic)**
   - Direct link: https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Give it a name (e.g. `rd-pulse`)
4. Select scope: **`repo`** (read access to repositories)
5. Click **Generate token** and copy it

#### OpenAI API Key

1. Go to **https://platform.openai.com/api-keys**
2. Click **Create new secret key**
3. Give it a name (e.g. `rd-pulse`) and copy it
4. Make sure your account has **GPT-4o access** (requires a paid plan)
   - If you're on the free tier (30k TPM limit), the default settings will work

### 3. Configure

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
```

### 4. Run

```bash
npx ts-node src/index.ts analyze --owner <github-owner> --repo <repo-name>
```

Examples:

```bash
# Analyse the last 24 hours
npx ts-node src/index.ts analyze --owner microsoft --repo vscode

# Analyse the last 7 days
npx ts-node src/index.ts analyze --owner your-org --repo your-repo --days 7

# Write report to a custom file
npx ts-node src/index.ts analyze --owner your-org --repo your-repo --output reports/monday.md

# Use a different model
npx ts-node src/index.ts analyze --owner your-org --repo your-repo --model gpt-4-turbo
```

The report prints to the terminal and is saved to `DAILY_PULSE.md` (or `--output` path).

---

## Customising the Prompt

The LLM instructions live in `prompt.md` at the project root. Edit it freely — no code changes needed.

```bash
# open and edit the prompt
open prompt.md
```

Useful customisations:
- Add your team's names so the LLM recognises contributors
- Change the risk criteria (e.g. flag PRs stale for >3 days instead of 7)
- Add a section specific to your process (e.g. "highlight any PRs missing a Jira ticket link")
- Translate the output to another language

The schema block at the top of `prompt.md` must stay intact — it tells the LLM what JSON shape to return.

---

## All CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `--owner` | *(required)* | GitHub organisation or username |
| `--repo` | *(required)* | Repository name |
| `--days` | `1` | How many days of history to fetch |
| `--output` | `DAILY_PULSE.md` | Output file path |
| `--model` | `gpt-4o` | OpenAI model to use |

---

## Project Structure

```
rd-pulse/
├── prompt.md                     # ← Edit this to customise the LLM instructions
├── .env                          # Your API keys (never committed)
├── .env.example                  # Template for .env
├── DAILY_PULSE.md                # Generated report (never committed)
└── src/
    ├── index.ts                  # CLI entry point
    ├── types.ts                  # Shared TypeScript interfaces
    ├── services/
    │   ├── GitHubService.ts      # Fetches PRs, commits, comments via Octokit
    │   ├── IntelligenceService.ts # Builds prompt, calls OpenAI, parses response
    │   ├── FormatterService.ts   # Renders AnalysisResult → Markdown
    │   ├── SlackService.ts       # Stage 2 — Slack messages and threads
    │   └── JiraService.ts        # Stage 2 — Jira ticket activity
    └── utils/
        ├── logger.ts             # ASCII header, progress logs, fatal error handler
        └── tokenCounter.ts       # Token budget utilities
```

---

## Roadmap

### Stage 1 — GitHub Daily Digest ✅
- [x] Project scaffold and type definitions
- [x] GitHubService — fetch PRs, commits, comments (pagination + rate limit handling)
- [x] IntelligenceService — LLM analysis with context window management
- [x] FormatterService — structured Markdown with per-contributor progress and risk flags
- [x] CLI — `analyze` command with full error handling

### Stage 2 — Full Daily Email Digest *(planned)*
- [ ] SlackService — fetch messages and threads from relevant channels
- [ ] JiraService — fetch ticket activity (status changes, comments, assignments)
- [ ] Cross-source correlation — link PRs ↔ Jira tickets ↔ Slack threads
- [ ] Unified LLM synthesis — GitHub + Slack + Jira in one report
- [ ] Email delivery — daily digest via SMTP or SendGrid
- [ ] Scheduling — cron job or external trigger

---

## Troubleshooting

**`401 Incorrect API key`** — Your `OPENAI_API_KEY` in `.env` is wrong or still the placeholder. Double-check it at https://platform.openai.com/api-keys.

**`429 Request too large`** — Your OpenAI tier has a low TPM limit. The tool automatically trims the prompt, but very active repos on free-tier accounts may still hit limits. Try `--days 1` (the default) or upgrade your OpenAI plan.

**`Bad credentials` from GitHub** — Your `GITHUB_TOKEN` is expired or missing the `repo` scope. Regenerate it at https://github.com/settings/tokens.

**`System prompt file not found`** — `prompt.md` is missing from the project root. Run `git checkout prompt.md` to restore the default.
