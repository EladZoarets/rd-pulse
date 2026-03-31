import { AnalysisResult, ContributorSummary, FeatureTheme } from '../types';

// ── Pure helpers ──────────────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

function formatSnapshotDate(d: Date): string {
  if (!d || isNaN(d.getTime())) return '(unknown date)';
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return `${date} | ${time} UTC`;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderStatCards(result: AnalysisResult): string {
  const risks = [...(result.risksAndBlockers ?? []), ...(result.largePRs ?? [])].filter(
    (i) => i.trim()
  ).length;
  const contributors = (result.contributors ?? []).length;
  const merged = (result.contributors ?? []).reduce((sum, c) => sum + (c.prsMerged ?? 0), 0);

  const card = (label: string, value: string, cls = '') =>
    `<div class="stat-card${cls}">
      <span class="stat-label">${label}</span>
      <span class="stat-val">${value}</span>
    </div>`;

  return `<div class="full-width grid-3">
    ${card('Critical Risks', String(risks), risks > 0 ? ' risk' : '')}
    ${card('Active Contributors', String(contributors))}
    ${card('PRs Merged', String(merged))}
  </div>`;
}

function renderActivityItem(
  tag: string,
  tagClass: string,
  ref: string,
  description: string
): string {
  return `<div class="event-item">
    <div class="event-meta">
      <span class="source-tag ${tagClass}">${tag}</span>
      <strong>${esc(ref)}</strong>
    </div>
    <p>${esc(description)}</p>
  </div>`;
}

function renderActivity(result: AnalysisResult): string {
  const items: string[] = [];

  for (const a of (result.keyAchievements ?? []).slice(0, 5)) {
    items.push(renderActivityItem('GitHub', 'tag-git', 'Achievement', a));
  }
  for (const t of (result.featureThemes ?? []).slice(0, 3)) {
    items.push(renderActivityItem('GitHub', 'tag-git', t.name, t.summary));
  }
  for (const w of (result.workInProgress ?? []).slice(0, 4)) {
    items.push(renderActivityItem('GitHub', 'tag-git', 'In Progress', w));
  }
  for (const l of (result.largePRs ?? []).slice(0, 3)) {
    items.push(renderActivityItem('GitHub', 'tag-git', 'Large PR ⚠️', l));
  }

  if (!items.length) return '<p style="color:var(--text-muted);font-size:.85rem">No activity this period.</p>';
  return items.join('');
}

function renderFeatureTheme(theme: FeatureTheme): string {
  const commitList = theme.commits ?? [];
  const commits = commitList.length
    ? `<ul>${commitList.map((c) => `<li><code>${esc(c)}</code></li>`).join('')}</ul>`
    : '';
  return `<div class="event-item">
    <div class="event-meta"><span class="source-tag tag-git">GitHub</span><strong>${esc(theme.name)}</strong></div>
    <p>${esc(theme.summary)}</p>
    ${commits}
  </div>`;
}

function renderRisks(result: AnalysisResult): string {
  const all = [
    ...(result.risksAndBlockers ?? []),
    ...(result.largePRs ?? []),
  ].filter((i) => i.trim());

  if (!all.length) {
    return '<p style="color:var(--text-muted);font-size:.85rem">No critical risks detected.</p>';
  }
  return all
    .map((r) => `<div class="risk-item">⚠️ ${esc(r)}</div>`)
    .join('');
}

function renderContributor(c: ContributorSummary): string {
  const isAtRisk = Boolean(c.risk?.trim());
  const badge = isAtRisk
    ? `<span class="badge badge-risk">AT RISK</span>`
    : `<span style="color:var(--success);font-size:0.7rem;">Stable</span>`;
  const risk = isAtRisk ? `<p class="event-meta" style="color:var(--danger);margin-top:.35rem">⚠️ ${esc(c.risk!)}</p>` : '';
  return `<div class="contributor">
    <div class="contributor-header">
      <span class="name">${esc(c.name)}</span>
      ${badge}
    </div>
    <p class="event-meta">${c.commitsCount} Commits · ${c.prsMerged} Merged · ${c.prsOpen} Open</p>
    ${risk}
  </div>`;
}

function renderManagersNote(note: string): string {
  if (!String(note ?? '').trim()) return '';
  return `<section class="full-width">
    <h2>Manager's Note</h2>
    <p style="font-style:italic;color:var(--text-main)">${esc(note)}</p>
  </section>`;
}

// ── CSS (verbatim from design) ────────────────────────────────────────────────

const CSS = `
  :root {
    --bg: #f8fafc;
    --header-bg: #0f172a;
    --card-bg: #ffffff;
    --text-main: #1e293b;
    --text-muted: #64748b;
    --danger: #ef4444;
    --warning: #f59e0b;
    --success: #10b981;
    --border: #e2e8f0;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text-main); line-height: 1.5; }
  header { background: var(--header-bg); color: #fff; padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; }
  header h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.025em; }
  header p { opacity: 0.7; font-size: 0.75rem; }
  main { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
  section { background: var(--card-bg); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .full-width { grid-column: 1 / -1; }
  h2 { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
  h2::after { content: ""; height: 1px; background: var(--border); flex-grow: 1; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 0; }
  .stat-card { background: var(--card-bg); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); }
  .stat-card.risk { border-left: 4px solid var(--danger); }
  .stat-val { font-size: 1.5rem; font-weight: 700; display: block; }
  .stat-label { font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: .25rem; }
  .contributor { padding: 1rem 0; border-bottom: 1px solid var(--border); }
  .contributor:last-child { border-bottom: none; padding-bottom: 0; }
  .contributor:first-child { padding-top: 0; }
  .contributor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
  .name { font-weight: 600; font-size: 0.95rem; }
  .badge { font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; }
  .badge-risk { background: #fee2e2; color: var(--danger); }
  .source-tag { font-size: 0.65rem; font-weight: 600; padding: 0.1rem 0.4rem; border-radius: 3px; margin-right: 0.5rem; text-transform: uppercase; }
  .tag-jira { background: #e0f2fe; color: #0369a1; }
  .tag-slack { background: #fef3c7; color: #92400e; }
  .tag-git { background: #f1f5f9; color: #475569; }
  .event-item { font-size: 0.85rem; margin-bottom: 0.85rem; }
  .event-item:last-child { margin-bottom: 0; }
  .event-meta { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; margin-bottom: .25rem; }
  .event-item p { color: var(--text-main); font-size: .875rem; }
  .event-item ul { padding-left: 1rem; margin-top: .35rem; }
  .event-item li { font-size: .8rem; color: var(--text-muted); margin-bottom: .15rem; }
  code { background: #f1f5f9; padding: .1em .35em; border-radius: 3px; font-size: .85em; font-family: 'SF Mono', 'Fira Mono', monospace; }
  .risk-item { color: var(--danger); display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; }
  .risk-item:last-child { margin-bottom: 0; }
  aside { display: flex; flex-direction: column; gap: 1.5rem; }
  @media (max-width: 768px) { main { grid-template-columns: 1fr; } .grid-3 { grid-template-columns: 1fr; } }
`.trim();

// ── Service ───────────────────────────────────────────────────────────────────

export class HtmlFormatterService {
  format(result: AnalysisResult): string {
    const repo = result.repo || '(unknown repo)';
    const contributors = [...(result.contributors ?? [])];
    const atRisk = contributors.filter((c) => Boolean(c.risk?.trim()));
    const healthy = contributors.filter((c) => !c.risk?.trim());
    const ordered = [...atRisk, ...healthy];

    const leftCol = `<section>
      <h2>Activity &amp; Friction Points</h2>
      ${renderActivity(result)}
    </section>
    ${(result.featureThemes ?? []).length ? `<section>
      <h2>Feature Themes</h2>
      ${(result.featureThemes ?? []).map(renderFeatureTheme).join('')}
    </section>` : ''}`;

    const rightCol = `<aside>
      <section>
        <h2>Critical Risks</h2>
        ${renderRisks(result)}
      </section>
      ${ordered.length ? `<section>
        <h2>Team Pulse</h2>
        ${ordered.map(renderContributor).join('')}
      </section>` : ''}
    </aside>`;

    const main = `<main>
      ${renderStatCards(result)}
      ${renderManagersNote(result.managersNote)}
      ${leftCol}
      ${rightCol}
    </main>`;

    const header = `<header>
      <h1>RD-PULSE / ${esc(repo.toUpperCase())}</h1>
      <p>Snapshot: ${esc(formatSnapshotDate(result.generatedAt))}</p>
    </header>`;

    const head = `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RD-Pulse — ${esc(repo)}</title>
  <style>${CSS}</style>
</head>`;

    return `<!DOCTYPE html>
<html lang="en">
${head}
<body>
${header}
${main}
</body>
</html>`;
  }
}
