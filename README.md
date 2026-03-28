# rd-pulse

AI-powered R&D intelligence agent that transforms engineering activity into a daily briefing for managers.

Instead of context-switching between GitHub, Slack, and Jira, you get one summary — delivered to your inbox — that tells you exactly what shipped, what's stuck, and what needs your attention.

---

## How It Works

rd-pulse runs in two stages:

### Stage 1 — GitHub Daily Digest *(current)*

Aggregates 24 hours of GitHub activity from a repository and uses an LLM to generate a structured `DAILY_PULSE.md` report.

```
rd-pulse analyze --owner <owner> --repo <repo>
```

The report covers:
- **Key Achievements** — what was merged and shipped
- **Work in Progress** — active feature streams, clustered by theme
- **Risks & Blockers** — stale PRs, heated debates, direct commits to main
- **Manager's Note** — 2-sentence strategic advice

### Stage 2 — Full Daily Email Digest *(planned)*

Pulls from GitHub + Slack + Jira, cross-correlates signals across all three, and delivers a single daily email to the manager.

No tool-hopping. One email. Full picture.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A GitHub personal access token with `repo` scope
- An OpenAI API key

### Installation

```bash
git clone https://github.com/EladZoarets/rd-pulse.git
cd rd-pulse
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Usage

```bash
npm start -- analyze --owner <owner> --repo <repo>

# Options:
#   --days <number>    Days of history to fetch (default: 1)
#   --output <path>    Output file path (default: DAILY_PULSE.md)
#   --model <model>    OpenAI model (default: gpt-4o)
```

The report is written to `DAILY_PULSE.md` in your current directory.

---

## Project Structure

```
src/
├── index.ts                      # CLI entry point (commander)
├── types.ts                      # Shared TypeScript interfaces
├── services/
│   ├── GitHubService.ts          # GitHub API integration
│   ├── IntelligenceService.ts    # LLM prompt engineering
│   └── FormatterService.ts       # Markdown report builder
└── utils/
    ├── logger.ts                 # Console output helpers
    └── tokenCounter.ts           # Context window management
```

---

## Roadmap

- [x] Project scaffold and type definitions
- [ ] GitHubService — fetch PRs, commits, comments
- [ ] IntelligenceService — LLM analysis with context window management
- [ ] FormatterService — structured Markdown output
- [ ] CLI orchestration and error handling
- [ ] Stage 2: Slack integration
- [ ] Stage 2: Jira integration
- [ ] Stage 2: Email delivery
