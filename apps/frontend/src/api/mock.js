import { mockReportById, mockReports } from '../mocks/reports';
import { mockWorkspace, mockWorkspaceActive } from '../mocks/workspace';
const MOCK_LATENCY_MS = 300;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// Per-workspaceId call counter for polling simulation
const statusCallCounters = new Map();
export function resetMockState() {
    statusCallCounters.clear();
}
export const mockApi = {
    async createWorkspace(_req) {
        await delay(MOCK_LATENCY_MS);
        return mockWorkspace;
    },
    async getWorkspaceStatus(workspaceId) {
        await delay(MOCK_LATENCY_MS);
        const count = (statusCallCounters.get(workspaceId) ?? 0) + 1;
        statusCallCounters.set(workspaceId, count);
        if (count >= 4) {
            return mockWorkspaceActive;
        }
        return {
            workspaceId,
            status: 'pending_connection',
            lastHeartbeatAt: null,
        };
    },
    async getReports(_workspaceId) {
        await delay(MOCK_LATENCY_MS);
        const items = mockReports.map((r) => ({
            id: r.id,
            generatedAt: r.generatedAt,
            health: r.summary.health,
            headline: r.summary.headline,
            url: r.url,
            slug: r.slug,
        }));
        return { reports: items, nextCursor: null };
    },
    async getReport(id) {
        const report = mockReportById[id];
        if (!report) {
            throw new Error(`Report not found: ${id}`);
        }
        await delay(MOCK_LATENCY_MS);
        return report;
    },
};
