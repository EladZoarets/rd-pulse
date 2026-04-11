# R&D Pulse — Product Specification

**Version:** 1.0  
**Date:** 2026-04-09  
**Status:** Draft

---

## 1. Overview

### Product Vision

R&D Pulse is a zero-trust R&D intelligence product for engineering managers. It connects to Jira and GitHub, normalizes activity data on the customer side, runs AI analysis, and delivers a shareable report that surfaces execution risks with direct navigation to the source problems.

### Core Value Proposition

Not "AI insights." Not activity metrics. The single value is: **immediate visibility into execution risks with direct navigation to problems** — in under 30 seconds, without leaving a browser tab.

### Success Criteria

A user is successful when they can:

1. Run the connector against their Jira board and GitHub repo
2. Open a shareable link
3. Understand the top execution risks in under 30 seconds
4. Click directly into the relevant Jira ticket or GitHub PR

---

## 2. Architecture

### Components

| # | Component | Hosting | Responsibility |
|---|-----------|---------|----------------|
| 1 | Connector | Customer side | Fetch, normalize, analyze, send |
| 2 | Backend API | Hosted (rdpulse.ai) | Receive, store, serve reports |
| 3 | AI Execution Layer | Pluggable (customer key or local) | Analyze normalized data |
| 4 | Frontend Web App | Hosted (rdpulse.ai) | Display reports, setup, sharing |

### Data Flow

```
Customer Network                      Hosted
+------------------------------+      +--------------------------------+
|                              |      |                                |
|  Jira API --+                |      |  Backend API                   |
|             +-> Connector    |      |  +------------------------+    |
|  GitHub API-+    |           |      |  |  POST /ingest/report   |    |
|                  |           |      |  |  GET /workspaces/:id/  |    |
|                  | Normalize |      |  |  GET /reports/:id      |    |
|                  v           |      |  +------------------------+    |
|             AI Provider -----+----->|           |                    |
|             (analyze)        |      |           v                    |
|                              |      |       Web UI                   |
+------------------------------+      |  /setup / /reports / /report   |
                                      +--------------------------------+
```

### Security Model

- All credentials (Jira API token, GitHub token, OpenAI key) remain exclusively on the customer side inside the connector's environment
- Raw Jira issues, raw GitHub diffs, and code content are never transmitted
- Only the normalized, AI-generated report payload is sent to the backend
- The backend stores summaries, risks, and insights — never raw data or credentials
- Report URLs are safe to share: they contain only the analyzed output, not the source data
- Design principle: zero trust — the hosted backend never has the means to access customer systems

---

## 3. Connector

### Purpose

The connector is a CLI process that runs on the customer side (locally or in CI). It fetches data, normalizes it, runs AI analysis, and POSTs the result to the backend.

### Environment Variables

```bash
# Required
WORKSPACE_ID=acme-rd
RDPULSE_SERVER=https://app.rdpulse.ai
JIRA_BASE_URL=https://company.atlassian.net
JIRA_EMAIL=user@company.com
JIRA_API_TOKEN=...
GITHUB_TOKEN=...
OPENAI_API_KEY=...

# Optional
OLLAMA=true   # use local Ollama instead of OpenAI
```

### Execution Pipeline

1. **Fetch** — pull active sprint issues from Jira Agile REST API v1; pull PRs, commits, and review activity from GitHub REST API
2. **Normalize** — map raw data into a structured `AnalysisInput` (see AI Provider Layer for schema)
3. **Analyze** — pass `AnalysisInput` to the configured `AIProvider`; receive `AnalysisOutput`
4. **Send** — POST the final report payload to `POST /ingest/report` on the backend

### Normalization Rules

- No raw code, diffs, or file contents are included in `AnalysisInput`
- Jira issues are mapped to: `id`, `title`, `status`, `assignee`, `storyPoints`, `age (days)`, `statusCategory`
- GitHub PRs are mapped to: `number`, `title`, `author`, `reviewers`, `mergeStatus`, `age (days)`, `hasJiraLink` (boolean), `isGhostWork` (boolean — no `[A-Z]+-\d+` pattern in branch or title)
- No PII beyond usernames and handles that already appear in PR titles and Jira assignees

### Output Payload to Backend

```json
{
  "workspaceId": "acme-rd",
  "generatedAt": "2026-04-11T18:00:00Z",
  "summary": {
    "health": "at_risk",
    "headline": "Sprint delivery risk due to review delays"
  },
  "risks": [
    {
      "type": "review_bottleneck",
      "severity": "high",
      "title": "3 PRs blocked on review for 4+ days",
      "description": "PRs #42, #45, #48 have had no review activity since opening. Sprint velocity is at risk.",
      "links": [
        { "label": "PR #42", "url": "https://github.com/org/repo/pull/42" }
      ]
    }
  ],
  "insights": [
    { "type": "ghost_work", "description": "2 merged PRs have no linked Jira ticket." }
  ]
}
```

---

## 4. AI Provider Layer

### Interface

```ts
interface AIProvider {
  analyze(input: AnalysisInput): Promise<AnalysisOutput>
}
```

### Implementations

| Provider | Trigger | Use Case |
|----------|---------|----------|
| `OpenAIProvider` | `OPENAI_API_KEY` is set and `OLLAMA` is not `true` | Default production path |
| `OllamaProvider` | `OLLAMA=true` | Air-gapped or cost-sensitive environments |
| `MockProvider` | Test / demo mode | CI, integration tests, demos without real keys |

### AnalysisInput Schema

The input contains only normalized metadata — no raw code, no diffs.

```ts
interface AnalysisInput {
  sprint: {
    name: string
    goal?: string
    issues: NormalizedJiraIssue[]
  }
  github: {
    prs: NormalizedPR[]
  }
  dateRange: {
    from: string  // ISO 8601
    to: string
  }
}
```

### AnalysisOutput Schema

```json
{
  "summary": {
    "health": "good | at_risk | critical",
    "headline": "string — one sentence, max 15 words"
  },
  "risks": [
    {
      "type": "string",
      "severity": "low | medium | high",
      "title": "string",
      "description": "string — max 2 sentences",
      "links": [
        { "label": "string", "url": "string" }
      ]
    }
  ],
  "insights": [
    {
      "type": "string",
      "description": "string — max 2 sentences"
    }
  ]
}
```

### Risk Types (recognized by prompt)

| Type | Description |
|------|-------------|
| `review_bottleneck` | PRs blocked on review for excessive time |
| `sprint_jeopardy` | High story point work not started near sprint end |
| `ghost_work` | Merged PRs with no Jira link |
| `unassigned_risk` | Unassigned issues in active sprint |
| `stall` | Issues with no status change for N+ days |
| `overload` | Contributor with disproportionate number of open items |

---

## 5. Backend API

### Base URL

`https://app.rdpulse.ai/api/v1`

### Endpoints

#### `POST /ingest/report`

Receives a processed report from the connector.

**Auth:** workspace license JWT in `Authorization: Bearer <token>` header

**Request body:**

```json
{
  "workspaceId": "string",
  "generatedAt": "ISO 8601",
  "summary": { "health": "string", "headline": "string" },
  "risks": [],
  "insights": []
}
```

**Response `201`:**

```json
{ "reportId": "uuid", "url": "https://app.rdpulse.ai/report/{uuid}" }
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid JWT |
| `403` | License expired or plan does not permit ingest |
| `422` | Payload fails schema validation |

---

#### `GET /workspaces/:workspaceId/reports`

Returns a paginated list of reports for a workspace.

**Response `200`:**

```json
{
  "reports": [
    {
      "id": "uuid",
      "generatedAt": "ISO 8601",
      "health": "good | at_risk | critical",
      "headline": "string",
      "url": "string"
    }
  ],
  "nextCursor": "string | null"
}
```

---

#### `GET /reports/:id`

Returns the full report detail.

**Response `200`:** Full report object — same shape as ingest body, plus `id` and `url`.

**Auth:** None required. This endpoint is publicly accessible for any valid report ID. Reports are safe to share by design.

---

### Storage Rules

| Stored | Not Stored |
|--------|------------|
| `workspaceId` | Raw Jira issues |
| `summary`, `risks`, `insights` | Raw GitHub data |
| `generatedAt`, report metadata | Credentials of any kind |
| `health`, `headline` | Code content or diffs |

---

## 6. Frontend

### Pages

#### Page 1 — Setup (`/setup`)

- Create or view workspace (name, ID)
- Display the connector install command pre-filled with workspace ID and server URL
- Show connection status: last report time, health badge
- Show license status and expiry

#### Page 2 — Reports List (`/workspaces/:id/reports`)

- Columns: date generated, health badge (color-coded), headline, link to report
- Sorted newest first, paginated

#### Page 3 — Report Page (`/report/:id`) — Core Experience

Goal: manager understands system health in under 30 seconds.

---

### Report Page Structure

**Section 1 — Header**

- Workspace name
- Date range covered
- Health status: color badge (Red / Amber / Green) and headline sentence

**Section 2 — Top Risks**

- 3 to 5 highest-priority risks from the `risks` array
- Each risk card: severity badge, title, 1–2 sentence description, direct links (PR, Jira)
- Sorted by severity descending

**Section 3 — Jira Risks**

- Filtered subset of risks where `type` is Jira-origin: `stall`, `sprint_jeopardy`, `unassigned_risk`
- Each item: icon, title, description, direct Jira link

**Section 4 — Team Signals**

- Risks and insights related to people: `overload`, `unassigned_risk`, `ghost_work`
- Workload imbalance, contributors with no activity, ghost work counts

**Section 5 — GitHub Signals**

- Risks related to code flow: `review_bottleneck`, `ghost_work` (PRs without Jira link)
- Each item links directly to the PR

**Section 6 — Navigation Links**

Every risk and insight item must include at minimum:

- A direct PR link (if GitHub-origin)
- A direct Jira issue link (if Jira-origin)
- Optional: a filtered Jira board or GitHub PR list URL for broader context

---

### UX Rules

- No long text — max 2 sentences per item, strictly enforced
- Every item is clickable — links to source (Jira or GitHub)
- Focus on problems, not activity — no vanity metrics
- Color coding: Red (High) / Amber (Medium) / Green (Good / Low)
- Report must be readable without logging in (publicly shareable by URL)

---

## 7. Shareable Reports

### URL Scheme

```
https://app.rdpulse.ai/report/{reportId}
```

`reportId` is a UUID assigned at ingest time. There is no auth wall on this route.

### Data Safety

Shareable reports are safe because:

- They contain only AI-generated summaries, risk titles, and descriptions
- All links point to external systems (GitHub, Jira) — not to raw data stored in R&D Pulse
- No Jira or GitHub credentials, no raw issue data, and no code are ever stored by the backend
- The backend cannot reconstruct source data from a stored report

---

## 8. Licensing and Monetization

### License Token (JWT)

Each workspace has a JWT license token with the following claims:

```json
{
  "workspaceId": "acme-rd",
  "plan": "free | pro | team",
  "expiresAt": "ISO 8601"
}
```

The connector sends this token as a Bearer token on `POST /ingest/report`. The backend validates it before accepting the payload.

### Trial Behavior

- Trial = full Pro access for the trial period
- After `expiresAt`: ingest still accepted, but the report is returned with a reduced insight set and a warning banner is shown on the report page

### Tiers

| Tier | History | Sharing | Automation | Multi-source |
|------|---------|---------|------------|--------------|
| Free | No — local output only, no backend storage | No | No | No |
| Pro | Yes — full history, hosted reports | Yes — shareable URLs | No | No |
| Team | Yes | Yes | Yes — scheduled runs, alerts | Yes — multiple repos and boards |

---

## 9. MVP Scope

### In Scope

| Component | Deliverable |
|-----------|-------------|
| Connector | Basic CLI: fetch Jira and GitHub, normalize, analyze with OpenAI, POST to backend |
| AI Analysis | Working `OpenAIProvider`, `OllamaProvider`, `MockProvider` |
| Backend | `POST /ingest/report`, `GET /workspaces/:id/reports`, `GET /reports/:id` |
| Report Page | Full page with all 6 sections, color coding, direct links |
| Shareable URL | `/report/:id` publicly accessible, no auth wall |

### Out of Scope for MVP

- Billing and payment integration
- Advanced dashboards or historical trend charts
- Enterprise RBAC or team-level access controls
- OAuth flows for Jira or GitHub — credentials via env vars only
- Slack integration
- Email digest delivery
- Webhook or event-driven trigger mode
- Multi-repo support in a single run

---

## 10. Open Questions

The following decisions are unresolved and must be made before implementation begins.

| # | Question | Impact |
|---|----------|--------|
| 1 | What is the report retention policy? How long are reports stored before deletion? | Storage costs, compliance, user expectations |
| 2 | Is the Free tier fully local (connector only, no backend involved), or does it POST to the backend with a restricted plan? | Backend architecture, auth flow |
| 3 | How is a workspace ID first issued? Is there a registration step via the web app before the connector can POST, or does the backend auto-create on first ingest? | Setup UX, security model |
| 4 | What authentication protects `GET /workspaces/:id/reports`? If reports are public by URL, should the list endpoint still require the workspace JWT? | Access control |
| 5 | After license expiry, what exactly is the "reduced insight set"? Is it defined by count (e.g. top 1 risk only), by type, or by a flag in the AI response? | Backend logic, frontend rendering |
| 6 | For `OllamaProvider`, what is the minimum required model capability and the supported model name (e.g. `llama3`, `mistral`)? | Connector reliability, documentation |
| 7 | Are workspace IDs user-chosen (e.g. `acme-rd`) or system-generated UUIDs? User-chosen IDs risk collision and enumeration attacks on the list endpoint. | Security, onboarding |
| 8 | What is the connector's behavior if the backend is unreachable — silent fail, retry with backoff, or local fallback output? | Reliability, UX |
| 9 | Should `POST /ingest/report` be idempotent? If the connector runs twice in the same day, does it create two reports or overwrite the most recent? | Data model, UX |
| 10 | Who owns the AI prompt — is it bundled in the connector (customer controls it) or fetched from the backend (platform controls it)? | Security model, ability to iterate on prompt quality post-deploy |
