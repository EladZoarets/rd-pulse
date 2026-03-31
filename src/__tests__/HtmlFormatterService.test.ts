import { HtmlFormatterService } from '../services/HtmlFormatterService';
import { AnalysisResult, ContributorSummary } from '../types';

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

    it('omits empty sections', () => {
      const output = service.format(makeResult({ largePRs: [], risksAndBlockers: [] }));
      expect(output).not.toContain('Large PRs');
      expect(output).not.toContain('Risks');
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

    it('is a pure function — same input produces same output', () => {
      const result = makeResult();
      expect(service.format(result)).toBe(service.format(result));
    });
  });
});
