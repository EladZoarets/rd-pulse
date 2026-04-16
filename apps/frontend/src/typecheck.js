// Compile-time check only — never executed
const _check = {
    id: 'r1',
    workspaceId: 'ws1',
    reportType: 'daily',
    windowStart: '2024-01-01T00:00:00Z',
    windowEnd: '2024-01-01T23:59:59Z',
    generatedAt: '2024-01-02T00:00:00Z',
    summary: { health: 'good', headline: 'All clear' },
    risks: [],
    insights: [],
    url: 'https://example.com/reports/r1',
    lastSyncedAt: '2024-01-02T00:00:00Z',
    runCount: 1,
};
export { _check };
