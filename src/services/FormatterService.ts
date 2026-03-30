import { AnalysisResult, FeatureTheme } from '../types';

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Collapses embedded newlines so LLM content never breaks a single-line markdown element. */
function sanitizeLine(s: string): string {
  return s.replace(/\n/g, ' ').trim();
}

function renderHeader(result: AnalysisResult): string {
  const repo = result.repo || '(unknown repo)';
  return `# Daily Pulse — ${repo}\n_Generated: ${result.generatedAt.toISOString()}_`;
}

function renderManagersNote(note: string): string {
  return `## Manager's Note\n\n${note}`;
}

function renderFeatureTheme(theme: FeatureTheme): string {
  const lines = [`### ${sanitizeLine(theme.name)}`, theme.summary];
  if (theme.commits.length > 0) {
    lines.push(...theme.commits.map((c) => `  - ${sanitizeLine(c)}`));
  }
  return lines.join('\n');
}

function renderFeatureThemes(themes: FeatureTheme[]): string {
  return ['## Feature Themes', ...themes.map(renderFeatureTheme)].join('\n\n');
}

function renderBulletList(heading: string, items: string[]): string {
  const bullets = items
    .filter((i) => i.trim().length > 0)
    .map((i) => `- ${sanitizeLine(i)}`)
    .join('\n');
  return `## ${heading}\n\n${bullets}`;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class FormatterService {
  format(result: AnalysisResult): string {
    const featureThemes = result.featureThemes ?? [];
    const keyAchievements = result.keyAchievements ?? [];
    const workInProgress = result.workInProgress ?? [];
    const risksAndBlockers = result.risksAndBlockers ?? [];

    const sections: string[] = [renderHeader(result)];

    if (result.managersNote.trim())
      sections.push(renderManagersNote(result.managersNote));
    if (featureThemes.length > 0)
      sections.push(renderFeatureThemes(featureThemes));
    if (keyAchievements.filter((i) => i.trim()).length > 0)
      sections.push(renderBulletList('Key Achievements', keyAchievements));
    if (workInProgress.filter((i) => i.trim()).length > 0)
      sections.push(renderBulletList('Work in Progress', workInProgress));
    if (risksAndBlockers.filter((i) => i.trim()).length > 0)
      sections.push(renderBulletList('Risks & Blockers', risksAndBlockers));

    return sections.join('\n\n');
  }
}
