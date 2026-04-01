# Project Specification: R&D Pulse CLI (v2.0 - Unified Intelligence)
# Role: Senior Engineering Manager / Tooling Architect
# Objective: Cross-Platform R&D Intelligence (GitHub + Jira)

## 1. Overview
R&D Pulse is a CLI tool designed to eliminate "Context Switching" for engineering leaders. It aggregates 24 hours of GitHub activity and Jira sprint data, using an LLM to generate a high-level strategic summary. It identifies achievements, cross-references code movement with task status, and flags operational risks such as "Ghost Work" or capacity bottlenecks.

## 2. System Architecture
The tool must follow a modular service-oriented architecture:
- **GitHubService**: Fetches PRs, Commits, and Comments via Octokit.
- **JiraService**: Fetches active sprint data, issue statuses, and board metadata.
- **IntelligenceService**: The "Brain". Merges multi-source data, manages context window limits, and handles LLM reasoning.
- **FormatterService**: Orchestrates the final Markdown output and CLI visual feedback.

## 3. Functional Requirements

### A. Jira Data Ingestion (JiraService)
- **Authentication**: Basic Auth (Email + API Token).
- **Core Logic**: `fetchSprintContext(boardId, issueTypes[])`:
  - Identify the current active sprint.
  - Categorize issues by: `TO_DO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`.
  - Extract metadata: Assignee, Story Points (if available), Labels/Epic (for Topic Clustering), and Sprint End Date.

### B. Unified Intelligence (IntelligenceService)
The LLM must process the combined data to identify:
- **Strategic Mapping**: Percentage of completion broken down by **Topic/Theme** (based on Jira labels/epics).
- **Risk Detection**:
  - **Overload**: Users with excessive active PRs or Jira tasks.
  - **Sprint Jeopardy**: Critical stories not started despite the sprint nearing its end.
  - **Ghost Work**: Active GitHub PRs that have no corresponding Jira issue.
  - **Stall Detection**: "In Review" tasks with high GitHub comment velocity but no status change.
- **Normalization**: If context exceeds limits, prioritize PR descriptions and Jira titles/status over raw commit messages.

### C. Output Interface (PULSE_REPORT.md)
The generated report must include:
1. **🚀 Summary**: High-level status of both the Repo and the Jira Board.
2. **🎯 Topic Breakdown**: completion % for major project themes.
3. **🛑 Risk & Danger Zone**: LLM-identified blockers, direct-to-main commits, and stale items.
4. **👥 Personal Pulse**: Table of activity per user (Done | In Progress | Waiting Review).
5. **📈 Manager's Strategic Note**: 2-sentence actionable advice for the team.

## 4. Technical Constraints
- **Runtime**: Node.js (TypeScript).
- **CLI Framework**: `commander`.
- **API Clients**: `@octokit/rest` for GitHub, `axios` for Jira.
- **Environment**: Configuration via `.env` (`GITHUB_TOKEN`, `JIRA_DOMAIN`, `JIRA_EMAIL`, `JIRA_TOKEN`, `OPENAI_API_KEY`).
- **Data Integrity**: Ensure strict typing for `GitHubActivity`, `JiraActivity`, and `UnifiedReport` interfaces.

## 5. Development Instructions
1. Implement a unified command: `pulse --owner <owner> --repo <repo> --board <board_id>`.
2. All logic (Types, Services, and Entry Point) should be provided in a single, continuous code block for architecture review.
3. Include robust error handling for API rate limits and invalid credentials.
4. Use `chalk` and `ora` (spinner) to provide a professional terminal experience during data fetching and AI processing.