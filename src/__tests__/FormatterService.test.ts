import { FormatterService } from '../services/FormatterService';
import { AnalysisResult } from '../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date('2024-06-15T12:00:00Z');

const makeResult = (overrides: Partial<AnalysisResult> = {}): AnalysisResult => ({
  repo: 'acme/backend',
  generatedAt: NOW,
  featureThemes: [
    { name: 'Auth', commits: ['feat: add OAuth2', 'fix: refresh tokens'], summary: 'OAuth2 login shipped' },
    { name: 'Payments', commits: ['feat: stripe integration'], summary: 'Stripe payments added' },
  ],
  keyAchievements: ['Merged OAuth2 login PR', 'Deployed Stripe integration'],
  workInProgress: ['PR #42: rate limiting (in review)', 'PR #43: dark mode (draft)'],
  risksAndBlockers: ['PR #38 stale for 7 days', 'Direct push to main by bob'],
  managersNote: 'Strong week. Auth shipped and payments unblocked the mobile team.',
  rawLLMResponse: '{"featureThemes":[]}',
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FormatterService', () => {
  let service: FormatterService;

  beforeEach(() => {
    service = new FormatterService();
  });

  describe('format()', () => {
    it('returns a string', () => {
      expect(typeof service.format(makeResult())).toBe('string');
    });

    it('includes the repo name in the output', () => {
      expect(service.format(makeResult())).toContain('acme/backend');
    });

    it('includes the generatedAt date', () => {
      expect(service.format(makeResult())).toContain('2024-06-15');
    });

    it('starts with an h1 heading', () => {
      expect(service.format(makeResult())).toMatch(/^# /);
    });

    it("includes Manager's Note section with the note text", () => {
      const output = service.format(makeResult());
      expect(output).toContain("Manager's Note");
      expect(output).toContain('Strong week. Auth shipped and payments unblocked the mobile team.');
    });

    it('includes all feature theme names and summaries', () => {
      const output = service.format(makeResult());
      expect(output).toContain('Auth');
      expect(output).toContain('OAuth2 login shipped');
      expect(output).toContain('Payments');
      expect(output).toContain('Stripe payments added');
    });

    it('includes each commit under its feature theme', () => {
      const output = service.format(makeResult());
      expect(output).toContain('feat: add OAuth2');
      expect(output).toContain('fix: refresh tokens');
      expect(output).toContain('feat: stripe integration');
    });

    it('includes all key achievements as bullet points', () => {
      const output = service.format(makeResult());
      expect(output).toContain('Key Achievements');
      expect(output).toContain('Merged OAuth2 login PR');
      expect(output).toContain('Deployed Stripe integration');
    });

    it('includes all work in progress items', () => {
      const output = service.format(makeResult());
      expect(output).toContain('Work in Progress');
      expect(output).toContain('PR #42: rate limiting (in review)');
      expect(output).toContain('PR #43: dark mode (draft)');
    });

    it('includes all risks and blockers', () => {
      const output = service.format(makeResult());
      expect(output).toContain('Risks');
      expect(output).toContain('PR #38 stale for 7 days');
      expect(output).toContain('Direct push to main by bob');
    });

    it('does not include rawLLMResponse in the output', () => {
      expect(service.format(makeResult())).not.toContain('"featureThemes"');
    });

    it('is a pure function — same input produces same output', () => {
      const result = makeResult();
      expect(service.format(result)).toBe(service.format(result));
    });

    // ── Omit empty sections ───────────────────────────────────────────────────

    it('omits Risks section when risksAndBlockers is empty', () => {
      expect(service.format(makeResult({ risksAndBlockers: [] }))).not.toContain('Risks');
    });

    it('omits Work in Progress section when workInProgress is empty', () => {
      expect(service.format(makeResult({ workInProgress: [] }))).not.toContain('Work in Progress');
    });

    it('omits Feature Themes section when featureThemes is empty', () => {
      expect(service.format(makeResult({ featureThemes: [] }))).not.toContain('Feature Themes');
    });

    it('omits Key Achievements section when keyAchievements is empty', () => {
      expect(service.format(makeResult({ keyAchievements: [] }))).not.toContain('Key Achievements');
    });

    it("omits Manager's Note section when managersNote is empty string", () => {
      expect(service.format(makeResult({ managersNote: '' }))).not.toContain("Manager's Note");
    });

    it("omits Manager's Note section when managersNote is whitespace only", () => {
      expect(service.format(makeResult({ managersNote: '   ' }))).not.toContain("Manager's Note");
    });

    // ── Edge cases: empty/whitespace items ────────────────────────────────────

    it('filters out empty-string items from bullet lists', () => {
      const output = service.format(makeResult({ keyAchievements: ['', 'Real achievement', ''] }));
      expect(output).toContain('Real achievement');
      // Empty bullets should not appear
      expect(output).not.toMatch(/^- $/m);
    });

    it('renders FeatureTheme without commit list when commits is empty', () => {
      const output = service.format(
        makeResult({ featureThemes: [{ name: 'Auth', commits: [], summary: 'Auth shipped' }] })
      );
      expect(output).toContain('Auth');
      expect(output).toContain('Auth shipped');
      // No dangling "  - " bullet lines
      expect(output).not.toContain('  - ');
    });

    it('uses a fallback repo label when repo is empty string', () => {
      const output = service.format(makeResult({ repo: '' }));
      expect(output).toContain('unknown repo');
    });

    // ── Newline sanitization ──────────────────────────────────────────────────

    it('collapses embedded newlines in bullet items to a space', () => {
      const output = service.format(
        makeResult({ keyAchievements: ['Merged PR\nwith extra line'] })
      );
      expect(output).toContain('Merged PR with extra line');
      expect(output).not.toContain('Merged PR\nwith extra line');
    });

    it('collapses embedded newlines in feature theme names', () => {
      const output = service.format(
        makeResult({
          featureThemes: [{ name: 'Auth\n## Injected', commits: [], summary: 'ok' }],
        })
      );
      expect(output).toContain('Auth ## Injected');
      // Newline stripped so "## Injected" is not rendered as a standalone heading
      expect(output).not.toMatch(/^\s*## Injected/m);
    });

    // ── Non-mutation ──────────────────────────────────────────────────────────

    it('does not mutate the input AnalysisResult', () => {
      const result = makeResult();
      const originalThemesLength = result.featureThemes.length;
      const originalAchievements = [...result.keyAchievements];

      service.format(result);

      expect(result.featureThemes.length).toBe(originalThemesLength);
      expect(result.keyAchievements).toEqual(originalAchievements);
    });

    // ── Defensive null handling ───────────────────────────────────────────────

    it('does not throw when array fields are null at runtime', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = makeResult({ featureThemes: null as any, keyAchievements: null as any });
      expect(() => service.format(result)).not.toThrow();
    });
  });
});
