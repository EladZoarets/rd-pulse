import { AnalysisResult, ContributorSummary, FeatureTheme } from '../types';

// ── Pure helpers ──────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tag(el: string, content: string, attrs: Record<string, string> = {}): string {
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
  return `<${el}${attrStr}>${content}</${el}>`;
}

function section(title: string, content: string, id?: string): string {
  const attrs: Record<string, string> = id ? { id } : {};
  return tag('section', tag('h2', esc(title)) + content, attrs);
}

function bulletList(items: string[]): string {
  const nonEmpty = items.filter((i) => i.trim());
  if (!nonEmpty.length) return '';
  return tag('ul', nonEmpty.map((i) => tag('li', esc(i))).join(''));
}

function renderContributor(c: ContributorSummary): string {
  const isAtRisk = c.risk !== null;
  const badge = isAtRisk
    ? tag('span', 'AT RISK', { class: 'badge risk' })
    : '';
  const stats = tag(
    'p',
    `${tag('strong', 'Merged:')} ${c.prsMerged} · ${tag('strong', 'Open:')} ${c.prsOpen} · ${tag('strong', 'Commits:')} ${c.commitsCount}`,
    { class: 'stats' }
  );
  const highlights = c.highlights.length
    ? tag('ul', c.highlights.map((h) => tag('li', esc(h))).join(''))
    : '';
  const riskNote = isAtRisk
    ? tag('p', `⚠️ ${esc(c.risk!)}`, { class: 'risk-note' })
    : '';
  return tag(
    'div',
    tag('h3', esc(c.name) + ' ' + badge) + stats + highlights + riskNote,
    { class: `contributor${isAtRisk ? ' at-risk' : ''}` }
  );
}

function renderTheme(theme: FeatureTheme): string {
  const commits = theme.commits.length
    ? tag('ul', theme.commits.map((c) => tag('li', tag('code', esc(c)))).join(''))
    : '';
  return tag('div', tag('h3', esc(theme.name)) + tag('p', esc(theme.summary)) + commits, {
    class: 'theme',
  });
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #222; line-height: 1.6; }
  header { background: #1a1a2e; color: #fff; padding: 2rem; }
  header h1 { font-size: 1.6rem; font-weight: 700; }
  header p { opacity: .7; font-size: .85rem; margin-top: .25rem; }
  main { max-width: 900px; margin: 2rem auto; padding: 0 1rem; display: grid; gap: 1.5rem; }
  section { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h2 { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: .05em; font-size: .85rem; }
  h3 { font-size: 1rem; font-weight: 600; margin-bottom: .4rem; display: flex; align-items: center; gap: .5rem; }
  p { font-size: .95rem; color: #444; }
  ul { padding-left: 1.25rem; margin-top: .4rem; }
  li { font-size: .9rem; margin-bottom: .2rem; color: #444; }
  code { background: #f0f0f0; padding: .1em .35em; border-radius: 3px; font-size: .85em; font-family: 'SF Mono', 'Fira Mono', monospace; }
  .badge { display: inline-block; padding: .15em .6em; border-radius: 20px; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
  .badge.risk { background: #fee2e2; color: #b91c1c; }
  .contributor { border-top: 1px solid #f0f0f0; padding-top: 1rem; margin-top: 1rem; }
  .contributor:first-child { border-top: none; padding-top: 0; margin-top: 0; }
  .contributor.at-risk { border-left: 3px solid #ef4444; padding-left: .75rem; }
  .stats { font-size: .85rem; color: #666; margin-bottom: .4rem; }
  .risk-note { color: #b91c1c; font-size: .85rem; margin-top: .4rem; }
  .theme { border-top: 1px solid #f0f0f0; padding-top: 1rem; margin-top: 1rem; }
  .theme:first-child { border-top: none; padding-top: 0; margin-top: 0; }
  #managers-note p { font-size: 1rem; font-style: italic; color: #333; }
`.trim();

// ── Service ───────────────────────────────────────────────────────────────────

export class HtmlFormatterService {
  format(result: AnalysisResult): string {
    const contributors = result.contributors ?? [];
    const featureThemes = result.featureThemes ?? [];
    const keyAchievements = result.keyAchievements ?? [];
    const workInProgress = result.workInProgress ?? [];
    const risksAndBlockers = result.risksAndBlockers ?? [];
    const largePRs = result.largePRs ?? [];

    const sections: string[] = [];

    if (result.managersNote.trim())
      sections.push(section("Manager's Note", tag('p', esc(result.managersNote)), 'managers-note'));

    if (contributors.length) {
      const atRisk = contributors.filter((c) => c.risk !== null);
      const healthy = contributors.filter((c) => c.risk === null);
      sections.push(
        section('Team Progress', [...atRisk, ...healthy].map(renderContributor).join(''))
      );
    }

    if (featureThemes.length)
      sections.push(section('Feature Themes', featureThemes.map(renderTheme).join('')));

    if (keyAchievements.filter((i) => i.trim()).length)
      sections.push(section('Key Achievements', bulletList(keyAchievements)));

    if (workInProgress.filter((i) => i.trim()).length)
      sections.push(section('Work in Progress', bulletList(workInProgress)));

    if (risksAndBlockers.filter((i) => i.trim()).length)
      sections.push(section('Risks & Blockers', bulletList(risksAndBlockers)));

    if (largePRs.filter((i) => i.trim()).length)
      sections.push(section('Large PRs', bulletList(largePRs)));

    const repo = result.repo || '(unknown repo)';
    const header = tag(
      'header',
      tag('h1', `Daily Pulse — ${esc(repo)}`) +
        tag('p', `Generated: ${esc(result.generatedAt.toISOString())}`)
    );

    const body = tag('body', header + tag('main', sections.join('')));
    const head = tag('head',
      tag('meta', '', { charset: 'utf-8' }) +
      tag('meta', '', { name: 'viewport', content: 'width=device-width, initial-scale=1' }) +
      tag('title', `Daily Pulse — ${esc(repo)}`) +
      tag('style', CSS)
    );

    return `<!DOCTYPE html>\n${tag('html', head + body, { lang: 'en' })}`;
  }
}
