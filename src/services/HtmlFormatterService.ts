import {
  AnalysisResult,
  ContributorSummary,
  FeatureTheme,
  GitHubHighlight,
  PersonalPulse,
  RiskItem,
  TopicBreakdown,
  UnifiedReport,
} from '../types';

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

// ── Unified dashboard renderers ───────────────────────────────────────────────

function sprintHealth(risks: RiskItem[]): { label: string; color: string; bg: string } {
  if (risks.some((r) => r.severity === 'high'))
    return { label: 'AT RISK', color: '#ef4444', bg: '#fef2f2' };
  if (risks.some((r) => r.severity === 'medium'))
    return { label: 'NEEDS ATTENTION', color: '#f59e0b', bg: '#fffbeb' };
  return { label: 'ON TRACK', color: '#10b981', bg: '#f0fdf4' };
}

function sprintStats(topics: TopicBreakdown[]): { total: number; done: number; wip: number; todo: number; donePercent: number; wipPercent: number } {
  const total = topics.reduce((s, t) => s + t.totalIssues, 0);
  const done  = topics.reduce((s, t) => s + t.doneCount, 0);
  const wip   = topics.reduce((s, t) => s + t.inProgressCount, 0);
  const todo  = topics.reduce((s, t) => s + t.todoCount, 0);
  return {
    total, done, wip, todo,
    donePercent: total ? Math.round((done / total) * 100) : 0,
    wipPercent:  total ? Math.round((wip  / total) * 100) : 0,
  };
}

function renderDonut(donePercent: number, wipPercent: number): string {
  // SVG donut: r=15.9, circumference ≈ 100; start at 12 o'clock (offset=25)
  const doneOffset = 25;
  const wipOffset  = doneOffset - donePercent;
  return `<svg viewBox="0 0 36 36" width="100" height="100" style="display:block;margin:0 auto">
    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" stroke-width="3.5"/>
    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" stroke-width="3.5"
      stroke-dasharray="${wipPercent} ${100 - wipPercent}"
      stroke-dashoffset="${wipOffset}" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" stroke-width="3.5"
      stroke-dasharray="${donePercent} ${100 - donePercent}"
      stroke-dashoffset="${doneOffset}" stroke-linecap="round"/>
    <text x="18" y="19.5" text-anchor="middle" font-size="6" font-weight="700" fill="#1e293b">${donePercent}%</text>
    <text x="18" y="25" text-anchor="middle" font-size="3.5" fill="#64748b">done</text>
  </svg>`;
}

function renderDangerZoneCards(risks: RiskItem[]): string {
  const severityStyle: Record<string, string> = {
    high:   'border-left:4px solid #ef4444;background:#fef2f2',
    medium: 'border-left:4px solid #f59e0b;background:#fffbeb',
    low:    'border-left:4px solid #10b981;background:#f0fdf4',
  };
  const severityIcon: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };

  return risks.map((r) => `
    <div style="padding:.85rem 1rem;border-radius:8px;margin-bottom:.65rem;${severityStyle[r.severity] ?? ''}">
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
        <span>${severityIcon[r.severity] ?? '⚪'}</span>
        <span style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#475569">${esc(r.type)}</span>
        <span class="badge badge-${r.severity}" style="margin-left:auto">${esc(r.severity)}</span>
      </div>
      <p style="font-size:.875rem;color:#1e293b;margin:0">${esc(r.description)}</p>
    </div>`).join('');
}

function renderPersonalPulseCards(pulse: PersonalPulse[], risks: RiskItem[]): string {
  const riskText = risks.map((r) => r.description.toLowerCase()).join(' ');
  const maxWork = Math.max(...pulse.map((p) => p.done + p.inProgress + p.inReview), 1);

  return pulse.map((p) => {
    const total = p.done + p.inProgress + p.inReview;
    const doneW = Math.round((p.done / maxWork) * 100);
    const wipW  = Math.round((p.inProgress / maxWork) * 100);
    const revW  = Math.round((p.inReview / maxWork) * 100);
    const isOverloaded = riskText.includes(p.user.toLowerCase()) && p.inProgress > 3;
    const hasUnassigned = p.unassignedCount > 0;

    const warnings = [
      isOverloaded  ? `<span style="font-size:.65rem;background:#fee2e2;color:#ef4444;padding:.1rem .4rem;border-radius:4px;font-weight:700">OVERLOADED</span>` : '',
      hasUnassigned ? `<span style="font-size:.65rem;background:#fef3c7;color:#92400e;padding:.1rem .4rem;border-radius:4px;font-weight:700">${p.unassignedCount} UNASSIGNED</span>` : '',
    ].filter(Boolean).join(' ');

    return `<div style="padding:.75rem 0;border-bottom:1px solid #e2e8f0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">
        <span style="font-weight:600;font-size:.9rem">${esc(p.user)}</span>
        <div style="display:flex;gap:.3rem;align-items:center">${warnings}</div>
      </div>
      <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:#f1f5f9;margin-bottom:.3rem">
        <div style="width:${doneW}%;background:#10b981"></div>
        <div style="width:${wipW}%;background:#f59e0b"></div>
        <div style="width:${revW}%;background:#60a5fa"></div>
      </div>
      <div style="font-size:.72rem;color:#64748b">
        ✅ ${p.done} done &nbsp;·&nbsp; 🔄 ${p.inProgress} in progress &nbsp;·&nbsp; 👁 ${p.inReview} in review &nbsp;·&nbsp; ${total} total
      </div>
    </div>`;
  }).join('');
}

function renderTopicBars(topics: TopicBreakdown[]): string {
  return topics.map((t) => {
    const doneW = t.totalIssues ? Math.round((t.doneCount / t.totalIssues) * 100) : 0;
    const wipW  = t.totalIssues ? Math.round((t.inProgressCount / t.totalIssues) * 100) : 0;
    const todoW = t.totalIssues ? Math.round((t.todoCount / t.totalIssues) * 100) : 0;
    const pct   = t.completionPercent;
    const color = pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

    return `<div style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.35rem">
        <span style="font-weight:600;font-size:.875rem">${esc(t.topic)}</span>
        <span style="font-size:.75rem;color:#64748b">${t.doneCount}/${t.totalIssues} done &nbsp;·&nbsp; ${t.inProgressCount} WIP &nbsp;·&nbsp; ${t.todoCount} todo</span>
      </div>
      <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:#f1f5f9">
        <div style="width:${doneW}%;background:#10b981"></div>
        <div style="width:${wipW}%;background:#f59e0b"></div>
        <div style="width:${todoW}%;background:#cbd5e1"></div>
      </div>
      <div style="text-align:right;font-size:.72rem;font-weight:700;color:${color};margin-top:.2rem">${pct}%</div>
    </div>`;
  }).join('');
}

function renderGitHubTimeline(highlights: GitHubHighlight[]): string {
  const typeStyle: Record<string, { icon: string; color: string; bg: string }> = {
    PR_MERGED:    { icon: '✅', color: '#059669', bg: '#ecfdf5' },
    PR_IN_REVIEW: { icon: '👁', color: '#2563eb', bg: '#eff6ff' },
    GHOST_WORK:   { icon: '👻', color: '#dc2626', bg: '#fef2f2' },
    DIRECT_COMMIT:{ icon: '⚡', color: '#d97706', bg: '#fffbeb' },
  };

  return highlights.map((h) => {
    const s = typeStyle[h.type] ?? { icon: '•', color: '#475569', bg: '#f8fafc' };
    return `<div style="display:flex;gap:.75rem;align-items:flex-start;padding:.6rem .75rem;border-radius:8px;background:${s.bg};margin-bottom:.5rem">
      <span style="font-size:1rem;line-height:1.4">${s.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
          <span style="font-weight:600;font-size:.85rem;color:${s.color}">${esc(h.ref)}</span>
          <span style="font-size:.75rem;color:#64748b">by ${esc(h.author)}</span>
          <span style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${s.color};margin-left:auto">${esc(h.type.replace(/_/g, ' '))}</span>
        </div>
        <p style="font-size:.8rem;color:#475569;margin:.15rem 0 0">${esc(h.description)}</p>
      </div>
    </div>`;
  }).join('');
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
  .pulse-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .pulse-table th, .pulse-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
  .pulse-table th { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
  .pulse-table tbody tr:last-child td { border-bottom: none; }
  .unified-risk { align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem; }
  .badge-high { background: #fee2e2; color: var(--danger); }
  .badge-medium { background: #fef3c7; color: #92400e; }
  .badge-low { background: #f0fdf4; color: #166534; }
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

  formatUnified(report: UnifiedReport): string {
    const repo = report.repo || '(unknown repo)';
    const githubHighlights = report.githubHighlights ?? [];
    const topicBreakdown = report.topicBreakdown ?? [];
    const risks = report.risks ?? [];
    const personalPulse = report.personalPulse ?? [];

    const health = sprintHealth(risks);
    const stats  = sprintStats(topicBreakdown);

    // ── Health banner ─────────────────────────────────────────────────────────
    const banner = `<div style="grid-column:1/-1;background:${health.bg};border:1.5px solid ${health.color};border-radius:10px;padding:1rem 1.5rem;display:flex;align-items:center;gap:1rem">
      <span style="font-size:1.75rem">${health.label === 'AT RISK' ? '🔴' : health.label === 'NEEDS ATTENTION' ? '🟡' : '🟢'}</span>
      <div>
        <div style="font-size:1rem;font-weight:700;color:${health.color}">${health.label}</div>
        <div style="font-size:.8rem;color:#475569">${risks.length} risk${risks.length !== 1 ? 's' : ''} · ${stats.done}/${stats.total} issues done</div>
      </div>
    </div>`;

    // ── KPI strip + donut ─────────────────────────────────────────────────────
    const kpi = topicBreakdown.length > 0 ? `<section class="full-width" style="padding:1.25rem 1.5rem">
      <div style="display:flex;align-items:center;gap:2.5rem;flex-wrap:wrap">
        ${renderDonut(stats.donePercent, stats.wipPercent)}
        <div style="display:grid;grid-template-columns:repeat(3,auto);gap:.5rem 2rem">
          <div><div style="font-size:1.5rem;font-weight:700;color:#10b981">${stats.done}</div><div style="font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Done</div></div>
          <div><div style="font-size:1.5rem;font-weight:700;color:#f59e0b">${stats.wip}</div><div style="font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">In Progress</div></div>
          <div><div style="font-size:1.5rem;font-weight:700;color:#94a3b8">${stats.todo}</div><div style="font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">To Do</div></div>
        </div>
      </div>
    </section>` : '';

    // ── Summary ───────────────────────────────────────────────────────────────
    const summarySection = report.summary?.trim() ? `<section class="full-width">
      <h2>Summary</h2>
      <p style="font-size:.9rem;line-height:1.6;color:var(--text-main)">${esc(report.summary)}</p>
    </section>` : '';

    // ── Danger Zone ───────────────────────────────────────────────────────────
    const dangerSection = risks.length > 0 ? `<section>
      <h2>Danger Zone ⚠️</h2>
      ${renderDangerZoneCards(risks)}
    </section>` : '';

    // ── Personal Pulse ────────────────────────────────────────────────────────
    const pulseSection = personalPulse.length > 0 ? `<section>
      <h2>Personal Pulse</h2>
      ${renderPersonalPulseCards(personalPulse, risks)}
    </section>` : '';

    // ── Topic Breakdown ───────────────────────────────────────────────────────
    const topicSection = topicBreakdown.length > 0 ? `<section class="full-width">
      <h2>Topic Breakdown</h2>
      ${renderTopicBars(topicBreakdown)}
    </section>` : '';

    // ── GitHub Activity ───────────────────────────────────────────────────────
    const githubSection = githubHighlights.length > 0 ? `<section class="full-width">
      <h2>GitHub Activity</h2>
      ${renderGitHubTimeline(githubHighlights)}
    </section>` : '';

    // ── Manager's Note ────────────────────────────────────────────────────────
    const noteSection = renderManagersNote(report.managersNote ?? '');

    const header = `<header>
      <h1>SPRINT-PULSE / ${esc(repo.toUpperCase())} · Board ${esc(report.boardId)}</h1>
      <p>Snapshot: ${esc(formatSnapshotDate(report.generatedAt))}</p>
    </header>`;

    const main = `<main>
      ${banner}
      ${kpi}
      ${summarySection}
      ${dangerSection}
      ${pulseSection}
      ${topicSection}
      ${githubSection}
      ${noteSection}
    </main>`;

    const head = `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sprint Pulse — ${esc(repo)}</title>
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
