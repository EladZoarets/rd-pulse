# rd-pulse

AI-powered R&D intelligence agent that transforms GitHub + Jira activity into a daily briefing for engineering managers.

Instead of context-switching between GitHub and Jira, you get one structured HTML report — with sprint health, risk cards, clickable PR and Jira links, sprint completion charts, and a per-developer pulse — delivered to your browser automatically every morning.

---

## How It Works

```
GitHub + Jira  →  rdpulse-connector (AI analysis)  →  HTML report
                                                        ↕
                                              Docker dashboard (localhost:3000)
                                              lists all reports + runs on cron
```

- The **Docker dashboard** runs on your machine or server at `localhost:3000`
- A built-in **cron job** generates a fresh report every weekday morning at 8 AM
- Reports are saved as self-contained HTML files — no database, no cloud, no SaaS
- Every report has **clickable links** that open the relevant Jira ticket or GitHub PR

---

## Quick Start (Docker)

### 1. Install Docker Desktop

Download from https://www.docker.com/products/docker-desktop

### 2. Clone the repo

```bash
git clone https://github.com/EladZoarets/rd-pulse.git
cd rd-pulse
```

### 3. Create your `.env` file

```bash
cp .env.example .env
```

Fill in `.env`:

```env
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx

# Jira
JIRA_DOMAIN=https://your-org.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_TOKEN=your-jira-api-token
JIRA_BOARD=42

# Schedule (default: 8 AM Mon-Fri)
CRON_SCHEDULE=0 8 * * 1-5
DAYS=1
```

**Where to get each key:**

| Key | Where |
|-----|-------|
| `GITHUB_TOKEN` | https://github.com/settings/tokens → New token (classic) → `repo` scope |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `JIRA_TOKEN` | https://id.atlassian.com/manage-profile/security/api-tokens |
| `JIRA_DOMAIN` | Your Atlassian URL, e.g. `https://acme.atlassian.net` |
| `JIRA_BOARD` | Open Jira → your board → the number in the URL (`.../boards/42`) |

### 4. Start the dashboard

```bash
docker compose up -d
```

Open **http://localhost:3000** in your browser.

Click **Generate Report Now** to run the first report immediately, or wait for the cron schedule.

---

## What You Get

### Dashboard (localhost:3000)

- List of all generated reports with timestamps
- **Generate Report Now** button for on-demand runs
- Status indicator: Idle / Generating / Error
- Auto-refreshes every 30 seconds

### HTML Report

Each report is a self-contained interactive dashboard:

| Section | What it shows |
|---------|--------------|
| **Health Banner** | 🟢 ON TRACK / 🟡 NEEDS ATTENTION / 🔴 AT RISK |
| **Sprint Progress** | SVG donut chart — done % with KPI strip (done · WIP · to do) |
| **Danger Zone** | Risk cards colour-coded by severity with clickable Jira/GitHub links |
| **Personal Pulse** | Per-developer bar charts with OVERLOADED and UNASSIGNED badges |
| **Topic Breakdown** | Stacked progress bars per Jira epic / label |
| **GitHub Activity** | Timeline: ✅ merged · 👁 in review · 👻 ghost work · ⚡ direct commit |
| **Manager's Note** | LLM-generated narrative for non-technical stakeholders |

**Clickable links in reports:**
- Risk cards show `↗ PR #42` and `↗ PROJ-123` badges — click to open the PR or Jira ticket directly
- GitHub activity refs (e.g. `PR #12`) link to the GitHub pull request

---

## Trial & Licensing

rd-pulse includes a **14-day free trial** — no sign-up required.

- Full features during the trial
- A `🟢 rd-pulse trial — N days remaining` message prints in the terminal on every run
- After 14 days: a sticky banner appears at the top of generated HTML reports with a link to purchase a license

Trial state is stored in `/reports/.rdpulse-trial.json` (inside the Docker volume) so it persists across container restarts.

To purchase a license: **https://rdpulse.io/license**

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | ✅ | — | GitHub personal access token (`repo` scope) |
| `GITHUB_OWNER` | ✅ | — | GitHub organisation or username |
| `GITHUB_REPO` | ✅ | — | Repository name |
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key (GPT-4o, paid plan) |
| `JIRA_DOMAIN` | ✅ | — | Atlassian URL, e.g. `https://acme.atlassian.net` |
| `JIRA_EMAIL` | ✅ | — | Your Atlassian account email |
| `JIRA_TOKEN` | ✅ | — | Jira API token |
| `JIRA_BOARD` | ✅ | — | Jira board ID (number from the board URL) |
| `CRON_SCHEDULE` | | `0 8 * * 1-5` | Cron expression for automatic report generation |
| `DAYS` | | `1` | Days of GitHub history to include |
| `MODEL` | | `gpt-4o` | OpenAI model override |

### Customising the cron schedule

Edit `CRON_SCHEDULE` in `.env`:

```env
CRON_SCHEDULE=0 7 * * 1-5   # 7 AM weekdays
CRON_SCHEDULE=0 9 * * 1     # 9 AM Mondays only
CRON_SCHEDULE=0 8 * * *     # 8 AM every day
```

---

## Running Without Docker (CLI only)

If you want to generate reports without the dashboard:

```bash
npm install -g rdpulse-connector

rdpulse-connector pulse \
  --owner your-org \
  --repo  your-repo \
  --board 42 \
  --format html \
  --output report.html

open report.html
```

**Prerequisites:** Node.js 18+, `.env` file in the current directory with all required variables.

---

## Customising the AI Prompt

The AI instructions live in prompt files at the project root. Edit them freely:

| File | Used by |
|------|---------|
| `prompt.md` | `analyze` command (GitHub only) |
| `prompt-unified.md` | `pulse` command (GitHub + Jira) |

Things you can customise:
- **Risk thresholds** — e.g. flag PRs stale for >3 days instead of 7
- **Team context** — add your team members' names and roles
- **Custom sections** — e.g. "highlight any PRs missing a Jira ticket"
- **Output language** — translate the report to any language

> The JSON schema block at the top of each prompt file must stay intact.

---

## Project Structure

```
rd-pulse/
├── docker/
│   ├── Dockerfile              # Installs rdpulse-connector + Express dashboard
│   ├── server.js               # Express server + cron job + report serving
│   ├── public/
│   │   └── index.html          # Dashboard UI (generate, list, poll status)
│   └── package.json
├── docker-compose.yml          # Wires env vars + volume for report persistence
├── prompt.md                   # LLM instructions for analyze command
├── prompt-unified.md           # LLM instructions for pulse command
├── .env.example                # Template — copy to .env and fill in
├── LICENSE                     # Commercial license terms
└── src/                        # Connector CLI source (TypeScript)
    ├── index.ts                # CLI entry — analyze + pulse commands
    ├── types.ts                # All shared TypeScript interfaces
    └── services/
        ├── GitHubService.ts        # GitHub API — PRs, commits, ghost work detection
        ├── JiraService.ts          # Jira Agile API — sprint context, issue buckets
        ├── IntelligenceService.ts  # OpenAI — unified analysis
        ├── FormatterService.ts     # Markdown renderer
        ├── HtmlFormatterService.ts # HTML dashboard renderer (clickable links, charts)
        ├── LicenseService.ts       # Trial tracking + watermark injection
        └── ReportSenderService.ts  # (optional) push reports to remote server
```

---

## Troubleshooting

**`connection refused` on localhost:3000** — Docker container isn't running. Run `docker compose up -d` and check `docker compose logs`.

**`prompt.md not found`** — Happens if the connector can't locate its prompt files. Make sure you're using `rdpulse-connector@0.2.5+` which resolves files relative to the npm package directory automatically.

**`401 Incorrect API key`** — Check `OPENAI_API_KEY` in `.env`. Verify at https://platform.openai.com/api-keys.

**`Bad credentials` from GitHub** — `GITHUB_TOKEN` is expired or missing `repo` scope. Regenerate at https://github.com/settings/tokens.

**`Jira 401 Unauthorized`** — Check `JIRA_EMAIL` and `JIRA_TOKEN`. The token is your Atlassian API token, not your password.

**`No active sprint found`** — The board has no active sprint. Start a sprint in Jira first, or verify `JIRA_BOARD` is the correct board ID.

**Report generates but links don't open Jira** — Make sure `JIRA_DOMAIN` in `.env` is the full URL including `https://`, e.g. `https://acme.atlassian.net`.

---

## Roadmap

### Done
- [x] GitHub daily digest (PRs, commits, large PR detection, ghost work flagging)
- [x] Jira sprint context (issue buckets, story points, epic grouping)
- [x] Unified LLM analysis combining GitHub + Jira signals
- [x] Self-contained HTML report with donut chart, risk cards, pulse bars, topic breakdown
- [x] Clickable Jira and GitHub links in risk cards and activity timeline
- [x] Docker dashboard with built-in cron, on-demand generation, report listing
- [x] 14-day trial with terminal banner + post-expiry watermark
- [x] Proprietary commercial LICENSE

### Planned
- [ ] SMTP email delivery — send report to manager's inbox on cron schedule
- [ ] Slack integration — fetch channel messages and correlate with PRs/tickets
- [ ] License key validation — online key check tied to purchase
- [ ] Multi-repo support — aggregate reports across multiple repositories
- [ ] AI assist tracking — detect and report AI-assisted PRs per developer
