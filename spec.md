# Project Specification: R&D Pulse CLI
# Role: Senior Engineering Manager / Tooling Architect
# Language: TypeScript (Node.js)

## 1. Overview
R&D Pulse is a CLI tool designed to eliminate "Context Switching" for engineering leaders.
It aggregates 24 hours of GitHub activity and uses an LLM to generate a high-level strategic
summary (Daily Pulse), identifying achievements, risks, and blockers.

## 2. System Architecture
The tool must follow a modular service-oriented architecture:
- **GitHubService**: Handles authentication and data fetching from GitHub REST API.
- **IntelligenceService**: Manages prompt engineering and LLM integration (OpenAI/Anthropic).
- **FormatterService**: Converts raw AI analysis into a structured, beautiful Markdown report.

## 3. Detailed Requirements

### A. Data Collection (GitHubService)
- Use `@octokit/rest`.
- Implement `fetchActivity(owner, repo, days = 1)`:
  - Fetch Pull Requests (created, closed, or updated).
  - Fetch Commits on the default branch.
  - Fetch Comments on all active PRs.
- **Normalization**: Transform raw GitHub responses into a clean `ActivityContext` interface.

### B. Intelligence Layer (IntelligenceService)
- Context Window Management: If activity data is too large, prioritize PR descriptions and comments over commit messages.
- **The Prompt**:
  - Act as a Senior EM.
  - Task 1: Cluster commits into "Feature Themes".
  - Task 2: Detect "Heated Debates" (PRs with >10 comments or high velocity).
  - Task 3: Identify "Stale PRs" (Open > 24h with no recent activity).
  - Task 4: Note "Direct Commits" to main/master (Risk).

### C. Output Format (DAILY_PULSE.md)
- **Header**: Repo Name + Date.
- **🚀 Key Achievements**: High-level summary of what was finished.
- **🧱 Work in Progress**: Active streams of work.
- **🛑 Risks & Blockers**: Stale PRs, heated arguments, or lack of reviews.
- **📈 Manager's Note**: A 2-sentence strategic advice for the team.

## 4. Technical Stack & Dev Experience
- **CLI Framework**: `commander`.
- **API Client**: `axios` or `octokit`.
- **Environment**: Use `.env` for `GITHUB_TOKEN` and `OPENAI_API_KEY`.
- **Typing**: Define explicit Interfaces for: `GitHubPR`, `GitHubCommit`, `AnalysisResult`.

## 5. Implementation Instructions for Claude
1. Create a continuous, single code block containing:
   - `package.json` with all necessary dependencies.
   - `types.ts` for all shared interfaces.
   - `GitHubService.ts` for data ingestion.
   - `IntelligenceService.ts` for the AI logic.
   - `index.ts` as the CLI entry point.
2. Ensure proper error handling (e.g., API Rate Limits, Invalid Tokens).
3. Add a professional ASCII art header and clear console logs for the user.
