import { HtmlFormatterService } from '../services/HtmlFormatterService';
import { AnalysisResult, ContributorSummary, UnifiedReport } from '../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date('2024-06-15T12:00:00Z');

const makeContributor = (overrides: Partial<ContributorSummary> = {}): ContributorSummary => ({
  name: 'alice',
  prsMerged: 2,
  prsOpen: 1,
  commitsCount: 5,
  highlights: ['Merged PR #1: add auth', 'Merged PR #2: fix tokens'],
  risk: null,
  ...overrides,
});

const makeResult = (overrides: Partial<AnalysisResult> = {}): AnalysisResult => ({
  repo: 'acme/backend',
  generatedAt: NOW,
  contributors: [
    makeContributor(),
    makeContributor({
      name: 'bob',
      prsMerged: 0,
      prsOpen: 2,
      commitsCount: 1,
      highlights: ['PR #42: rate limiting'],
      risk: 'No merged work despite 2 open PRs',
    }),
  ],
  featureThemes: [
    { name: 'Auth', commits: ['feat: add OAuth2', 'fix: refresh tokens'], summary: 'OAuth2 login shipped' },
  ],
  keyAchievements: ['Merged OAuth2 login PR'],
  workInProgress: ['PR #42: rate limiting (in review)'],
  risksAndBlockers: ['PR #38 stale for 7 days'],
  largePRs: ['PR #99 by alice — refactor: big rewrite (80 files, +2000/-1500 lines)'],
  managersNote: 'Strong week.',
  rawLLMResponse: '{}',
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HtmlFormatterService', () => {
  let service: HtmlFormatterService;

  beforeEach(() => {
    service = new HtmlFormatterService();
  });

  describe('format()', () => {
    it('returns a string', () => {
      expect(typeof service.format(makeResult())).toBe('string');
    });

    it('returns a complete HTML document with doctype and closing tags', () => {
      const output = service.format(makeResult());
      expect(output).toMatch(/<!DOCTYPE html>/i);
      expect(output).toContain('<html');
      expect(output).toContain('</html>');
      expect(output).toContain('<body');
      expect(output).toContain('</body>');
    });

    it('embeds CSS in a <style> tag (no external dependencies)', () => {
      const output = service.format(makeResult());
      expect(output).toContain('<style>');
      expect(output).not.toContain('<link');
      expect(output).not.toContain('cdn');
    });

    it('includes the repo name in the title and heading', () => {
      const output = service.format(makeResult());
      expect(output).toContain('acme/backend');
    });

    it('includes the generated date', () => {
      const output = service.format(makeResult());
      expect(output).toContain('2024-06-15');
    });

    it("includes Manager's Note content", () => {
      const output = service.format(makeResult());
      expect(output).toContain('Strong week.');
    });

    it('includes all contributor names', () => {
      const output = service.format(makeResult());
      expect(output).toContain('alice');
      expect(output).toContain('bob');
    });

    it('marks at-risk contributors visually', () => {
      const output = service.format(makeResult());
      expect(output).toContain('AT RISK');
      expect(output).toContain('No merged work despite 2 open PRs');
    });

    it('does not mark healthy contributors as at risk', () => {
      const result = makeResult({ contributors: [makeContributor()] });
      const output = service.format(result);
      expect(output).not.toContain('AT RISK');
    });

    it('includes feature theme names and summaries', () => {
      const output = service.format(makeResult());
      expect(output).toContain('Auth');
      expect(output).toContain('OAuth2 login shipped');
    });

    it('includes key achievements', () => {
      const output = service.format(makeResult());
      expect(output).toContain('Merged OAuth2 login PR');
    });

    it('includes work in progress items', () => {
      const output = service.format(makeResult());
      expect(output).toContain('PR #42: rate limiting (in review)');
    });

    it('includes risks and blockers', () => {
      const output = service.format(makeResult());
      expect(output).toContain('PR #38 stale for 7 days');
    });

    it('includes large PRs', () => {
      const output = service.format(makeResult());
      expect(output).toContain('PR #99 by alice');
    });

    it('shows empty state when there are no risks', () => {
      const output = service.format(makeResult({ largePRs: [], risksAndBlockers: [] }));
      expect(output).toContain('Critical Risks');
      expect(output).toContain('No critical risks detected');
    });

    it('does not include rawLLMResponse', () => {
      const output = service.format(makeResult());
      expect(output).not.toContain('"featureThemes"');
    });

    it('escapes HTML special characters in LLM content', () => {
      const output = service.format(
        makeResult({ managersNote: 'Score <95% & watch "this"' })
      );
      expect(output).toContain('&lt;95%');
      expect(output).toContain('&amp;');
      expect(output).toContain('&quot;');
      expect(output).not.toContain('<95%');
    });

    it('neutralises <script> injection in managersNote', () => {
      const output = service.format(
        makeResult({ managersNote: '<script>alert(1)</script>' })
      );
      expect(output).not.toContain('<script>');
      expect(output).toContain('&lt;script&gt;');
    });

    it('escapes backtick characters in LLM content', () => {
      const output = service.format(
        makeResult({ managersNote: 'value: `dangerous`' })
      );
      expect(output).toContain('&#96;dangerous&#96;');
      expect(output).not.toContain('`dangerous`');
    });

    it('is a pure function — same input produces same output', () => {
      const result = makeResult();
      expect(service.format(result)).toBe(service.format(result));
    });

    it('does not mutate the input AnalysisResult', () => {
      const result = makeResult();
      const originalContributorsLength = result.contributors.length;
      const originalRisks = [...result.risksAndBlockers];
      service.format(result);
      expect(result.contributors.length).toBe(originalContributorsLength);
      expect(result.risksAndBlockers).toEqual(originalRisks);
    });

    it('does not throw on an invalid Date for generatedAt', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = makeResult({ generatedAt: new Date('invalid') as any });
      expect(() => service.format(result)).not.toThrow();
      expect(service.format(result)).toContain('unknown date');
    });

    it('treats empty-string risk as healthy (not AT RISK)', () => {
      const result = makeResult({
        contributors: [makeContributor({ risk: '' })],
      });
      const output = service.format(result);
      expect(output).not.toContain('AT RISK');
    });

    it('does not throw when featureTheme.commits is null at runtime', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = makeResult({ featureThemes: [{ name: 'Auth', commits: null as any, summary: 'ok' }] });
      expect(() => service.format(result)).not.toThrow();
    });

    it('does not throw when managersNote is null at runtime', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = makeResult({ managersNote: null as any });
      expect(() => service.format(result)).not.toThrow();
    });

    it('does not throw when contributor name is null at runtime', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = makeResult({ contributors: [makeContributor({ name: null as any })] });
      expect(() => service.format(result)).not.toThrow();
    });

    it('shows 0 for PRs Merged stat when prsMerged is undefined at runtime', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = makeResult({ contributors: [makeContributor({ prsMerged: undefined as any })] });
      const output = service.format(result);
      expect(output).not.toContain('NaN');
    });

    it('shows empty state for whitespace-only risk items', () => {
      const result = makeResult({ risksAndBlockers: ['   ', '  '], largePRs: [] });
      const output = service.format(result);
      expect(output).toContain('No critical risks detected');
    });
  });

  // ── formatUnified() ──────────────────────────────────────────────────────────

  describe('formatUnified()', () => {
    const makeUnifiedReport = (overrides: Partial<UnifiedReport> = {}): UnifiedReport => ({
      repo: 'acme/backend',
      boardId: '42',
      generatedAt: NOW,
      summary: 'Sprint is on track.',
      topicBreakdown: [
        { topic: 'Auth', totalIssues: 2, doneCount: 1, inProgressCount: 1, todoCount: 0, completionPercent: 50 },
        { topic: 'Infra', totalIssues: 3, doneCount: 3, inProgressCount: 0, todoCount: 0, completionPercent: 100 },
      ],
      risks: [
        { type: 'SPRINT_JEOPARDY', description: 'ENG-1 not started with 2 days left', severity: 'high' },
        { type: 'UNASSIGNED', description: 'ENG-5 in progress with no owner', severity: 'medium' },
      ],
      personalPulse: [
        { user: 'alice', done: 1, inProgress: 1, inReview: 2, unassignedCount: 0 },
        { user: 'bob', done: 0, inProgress: 3, inReview: 0, unassignedCount: 1 },
      ],
      managersNote: 'Auth is looking good.',
      rawLLMResponse: '{"summary":"..."}',
      ...overrides,
    });

    it('returns a string', () => {
      expect(typeof service.formatUnified(makeUnifiedReport())).toBe('string');
    });

    it('returns a complete HTML document', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toMatch(/<!DOCTYPE html>/i);
      expect(output).toContain('<html');
      expect(output).toContain('</html>');
      expect(output).toContain('<body');
      expect(output).toContain('</body>');
    });

    it('embeds CSS in a <style> tag', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('<style>');
      expect(output).not.toContain('<link');
    });

    it('includes the repo name and board ID', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('acme/backend');
      expect(output).toContain('42');
    });

    it('includes the generated date', () => {
      expect(service.formatUnified(makeUnifiedReport())).toContain('2024-06-15');
    });

    it('includes a Summary section', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('Summary');
      expect(output).toContain('Sprint is on track.');
    });

    it('includes a Topic Breakdown section with topic names and percentages', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('Topic Breakdown');
      expect(output).toContain('Auth');
      expect(output).toContain('Infra');
      expect(output).toContain('50%');
      expect(output).toContain('100%');
    });

    it('includes a Danger Zone section with risk types', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('Danger Zone');
      expect(output).toContain('SPRINT_JEOPARDY');
      expect(output).toContain('ENG-1 not started with 2 days left');
    });

    it('includes UNASSIGNED risks in the Danger Zone', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('UNASSIGNED');
      expect(output).toContain('ENG-5 in progress with no owner');
    });

    it('includes severity labels for each risk', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('high');
      expect(output).toContain('medium');
    });

    it('includes a Personal Pulse section with user names', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('Personal Pulse');
      expect(output).toContain('alice');
      expect(output).toContain('bob');
    });

    it("includes a Manager's Note section", () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain("Manager");
      expect(output).toContain('Auth is looking good.');
    });

    it('does not include rawLLMResponse', () => {
      expect(service.formatUnified(makeUnifiedReport())).not.toContain('"summary"');
    });

    it('omits Danger Zone when risks is empty', () => {
      const output = service.formatUnified(makeUnifiedReport({ risks: [] }));
      expect(output).not.toContain('Danger Zone');
    });

    it('omits Topic Breakdown when topicBreakdown is empty', () => {
      const output = service.formatUnified(makeUnifiedReport({ topicBreakdown: [] }));
      expect(output).not.toContain('Topic Breakdown');
    });

    it('omits Personal Pulse when personalPulse is empty', () => {
      const output = service.formatUnified(makeUnifiedReport({ personalPulse: [] }));
      expect(output).not.toContain('Personal Pulse');
    });

    it("omits Manager's Note when managersNote is empty", () => {
      const output = service.formatUnified(makeUnifiedReport({ managersNote: '' }));
      expect(output).not.toContain('Auth is looking good.');
    });

    it('omits Summary when summary is empty', () => {
      const output = service.formatUnified(makeUnifiedReport({ summary: '' }));
      expect(output).not.toContain('>Summary<');
    });

    it('escapes HTML special characters in risk descriptions', () => {
      const output = service.formatUnified(
        makeUnifiedReport({
          risks: [{ type: 'GHOST_WORK', description: '<script>alert(1)</script>', severity: 'high' }],
        })
      );
      expect(output).not.toContain('<script>');
      expect(output).toContain('&lt;script&gt;');
    });

    it('escapes HTML special characters in topic names', () => {
      const output = service.formatUnified(
        makeUnifiedReport({
          topicBreakdown: [{ topic: '<Auth & Payments>', totalIssues: 1, doneCount: 1, inProgressCount: 0, todoCount: 0, completionPercent: 100 }],
        })
      );
      expect(output).not.toContain('<Auth');
      expect(output).toContain('&lt;Auth');
      expect(output).toContain('&amp;');
    });

    it('escapes HTML special characters in user names', () => {
      const output = service.formatUnified(
        makeUnifiedReport({
          personalPulse: [{ user: '<evil>', done: 0, inProgress: 0, inReview: 0, unassignedCount: 0 }],
        })
      );
      expect(output).not.toContain('<evil>');
      expect(output).toContain('&lt;evil&gt;');
    });

    it('is a pure function', () => {
      const report = makeUnifiedReport();
      expect(service.formatUnified(report)).toBe(service.formatUnified(report));
    });

    it('does not throw when array fields are null at runtime', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const report = makeUnifiedReport({ risks: null as any, personalPulse: null as any, topicBreakdown: null as any });
      expect(() => service.formatUnified(report)).not.toThrow();
    });

    it('does not throw on invalid generatedAt date', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const report = makeUnifiedReport({ generatedAt: new Date('invalid') as any });
      expect(() => service.formatUnified(report)).not.toThrow();
      expect(service.formatUnified(report)).toContain('unknown date');
    });
  });
});
