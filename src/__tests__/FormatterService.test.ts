import { FormatterService } from '../services/FormatterService';
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
    makeContributor({ name: 'bob', prsMerged: 0, prsOpen: 2, commitsCount: 1, highlights: ['PR #42: rate limiting'], risk: 'No merged work despite 2 open PRs' }),
  ],
  featureThemes: [
    { name: 'Auth', commits: ['feat: add OAuth2', 'fix: refresh tokens'], summary: 'OAuth2 login shipped' },
    { name: 'Payments', commits: ['feat: stripe integration'], summary: 'Stripe payments added' },
  ],
  keyAchievements: ['Merged OAuth2 login PR', 'Deployed Stripe integration'],
  workInProgress: ['PR #42: rate limiting (in review)', 'PR #43: dark mode (draft)'],
  risksAndBlockers: ['PR #38 stale for 7 days', 'Direct push to main by bob'],
  largePRs: [],
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

    // ── Contributors ──────────────────────────────────────────────────────────

    it('includes a Team Progress section with contributor names', () => {
      const output = service.format(makeResult());
      expect(output).toContain('Team Progress');
      expect(output).toContain('alice');
      expect(output).toContain('bob');
    });

    it('shows merged/open PR and commit counts per contributor', () => {
      const output = service.format(makeResult());
      expect(output).toContain('**Merged:** 2');
      expect(output).toContain('**Open:** 2');
    });

    it('flags at-risk contributors with ⚠️ AT RISK badge', () => {
      const output = service.format(makeResult());
      expect(output).toContain('bob ⚠️ AT RISK');
      expect(output).toContain('No merged work despite 2 open PRs');
    });

    it('does not flag healthy contributors', () => {
      const output = service.format(makeResult());
      expect(output).not.toContain('alice ⚠️');
    });

    it('lists at-risk contributors before healthy ones', () => {
      const output = service.format(makeResult());
      expect(output.indexOf('bob ⚠️ AT RISK')).toBeLessThan(output.indexOf('### alice'));
    });

    it('omits Team Progress section when contributors is empty', () => {
      const output = service.format(makeResult({ contributors: [] }));
      expect(output).not.toContain('Team Progress');
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

  // ── formatUnified() ──────────────────────────────────────────────────────────

  describe('formatUnified()', () => {
    const makeUnifiedReport = (overrides: Partial<UnifiedReport> = {}): UnifiedReport => ({
      repo: 'acme/backend',
      boardId: '42',
      generatedAt: NOW,
      summary: 'Sprint is on track with auth progressing well.',
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
      managersNote: 'Auth is looking good. Watch ENG-1.',
      rawLLMResponse: '{"summary":"..."}',
      ...overrides,
    });

    it('returns a string', () => {
      expect(typeof service.formatUnified(makeUnifiedReport())).toBe('string');
    });

    it('includes the repo name and board ID in the header', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('acme/backend');
      expect(output).toContain('42');
    });

    it('starts with an h1 heading', () => {
      expect(service.formatUnified(makeUnifiedReport())).toMatch(/^# /);
    });

    it('includes the generatedAt date', () => {
      expect(service.formatUnified(makeUnifiedReport())).toContain('2024-06-15');
    });

    it('includes a Summary section with the summary text', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('## Summary');
      expect(output).toContain('Sprint is on track with auth progressing well.');
    });

    it('includes a Topic Breakdown section with topic names', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('Topic Breakdown');
      expect(output).toContain('Auth');
      expect(output).toContain('Infra');
    });

    it('includes completion percentages in the topic breakdown', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('50%');
      expect(output).toContain('100%');
    });

    it('includes a Danger Zone section when risks exist', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('Danger Zone');
      expect(output).toContain('SPRINT_JEOPARDY');
      expect(output).toContain('ENG-1 not started with 2 days left');
    });

    it('highlights UNASSIGNED risks in the Danger Zone', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('UNASSIGNED');
      expect(output).toContain('ENG-5 in progress with no owner');
    });

    it('includes severity labels for risks', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('high');
      expect(output).toContain('medium');
    });

    it('includes a Personal Pulse section with contributor names', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('Personal Pulse');
      expect(output).toContain('alice');
      expect(output).toContain('bob');
    });

    it('includes done/inProgress/inReview/unassigned counts in Personal Pulse', () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain('In Progress');
      expect(output).toContain('In Review');
    });

    it("includes a Manager's Note section", () => {
      const output = service.formatUnified(makeUnifiedReport());
      expect(output).toContain("Manager's Note");
      expect(output).toContain('Auth is looking good. Watch ENG-1.');
    });

    it('does not include rawLLMResponse in the output', () => {
      expect(service.formatUnified(makeUnifiedReport())).not.toContain('"summary"');
    });

    it('omits Danger Zone section when risks is empty', () => {
      const output = service.formatUnified(makeUnifiedReport({ risks: [] }));
      expect(output).not.toContain('Danger Zone');
    });

    it('omits Topic Breakdown section when topicBreakdown is empty', () => {
      const output = service.formatUnified(makeUnifiedReport({ topicBreakdown: [] }));
      expect(output).not.toContain('Topic Breakdown');
    });

    it('omits Personal Pulse section when personalPulse is empty', () => {
      const output = service.formatUnified(makeUnifiedReport({ personalPulse: [] }));
      expect(output).not.toContain('Personal Pulse');
    });

    it("omits Manager's Note when managersNote is empty", () => {
      const output = service.formatUnified(makeUnifiedReport({ managersNote: '' }));
      expect(output).not.toContain("Manager's Note");
    });

    it('omits Summary section when summary is empty', () => {
      const output = service.formatUnified(makeUnifiedReport({ summary: '' }));
      expect(output).not.toContain('## Summary');
    });

    it('is a pure function — same input produces same output', () => {
      const report = makeUnifiedReport();
      expect(service.formatUnified(report)).toBe(service.formatUnified(report));
    });

    it('sanitizes embedded newlines in summary text', () => {
      const output = service.formatUnified(makeUnifiedReport({ summary: 'Line one\nLine two' }));
      expect(output).toContain('Line one Line two');
    });

    it('does not throw when array fields are null at runtime', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const report = makeUnifiedReport({ risks: null as any, personalPulse: null as any });
      expect(() => service.formatUnified(report)).not.toThrow();
    });
  });
});
