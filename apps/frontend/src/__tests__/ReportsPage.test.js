import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportsPage } from '../pages/ReportsPage';
import { api } from '../api';
vi.mock('../api', () => ({
    api: { getReports: vi.fn() },
}));
function renderReportsPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(_jsx(QueryClientProvider, { client: queryClient, children: _jsx(MemoryRouter, { initialEntries: ['/reports?workspaceId=ws-test'], children: _jsx(ReportsPage, {}) }) }));
}
const mockReports = {
    reports: [
        { id: 'r-1', generatedAt: '2026-04-13T10:00:00Z', health: 'good', headline: 'Sprint on track', url: '/report/r-1' },
        { id: 'r-2', generatedAt: '2026-04-12T10:00:00Z', health: 'at_risk', headline: 'Review bottleneck detected', url: '/report/r-2' },
        { id: 'r-3', generatedAt: '2026-04-11T10:00:00Z', health: 'critical', headline: 'Sprint in critical state', url: '/report/r-3' },
    ],
    nextCursor: null,
};
describe('ReportsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('shows loading state initially', () => {
        vi.mocked(api.getReports).mockReturnValue(new Promise(() => { }));
        renderReportsPage();
        expect(screen.getByTestId('reports-loading')).toBeInTheDocument();
    });
    it('renders 3 report cards after data loads', async () => {
        vi.mocked(api.getReports).mockResolvedValue(mockReports);
        renderReportsPage();
        await waitFor(() => expect(screen.getByTestId('reports-list')).toBeInTheDocument());
        expect(screen.getAllByTestId('report-card')).toHaveLength(3);
    });
    it('each card links to /report/:id', async () => {
        vi.mocked(api.getReports).mockResolvedValue(mockReports);
        renderReportsPage();
        await waitFor(() => expect(screen.getAllByTestId('report-card')).toHaveLength(3));
        const cards = screen.getAllByTestId('report-card');
        expect(cards[0]).toHaveAttribute('href', '/report/r-1');
        expect(cards[1]).toHaveAttribute('href', '/report/r-2');
        expect(cards[2]).toHaveAttribute('href', '/report/r-3');
    });
    it('each card shows the headline', async () => {
        vi.mocked(api.getReports).mockResolvedValue(mockReports);
        renderReportsPage();
        await waitFor(() => expect(screen.getAllByTestId('report-card')).toHaveLength(3));
        expect(screen.getByText('Sprint on track')).toBeInTheDocument();
        expect(screen.getByText('Review bottleneck detected')).toBeInTheDocument();
        expect(screen.getByText('Sprint in critical state')).toBeInTheDocument();
    });
    it('each card shows a health badge', async () => {
        vi.mocked(api.getReports).mockResolvedValue(mockReports);
        renderReportsPage();
        await waitFor(() => expect(screen.getAllByTestId('report-card')).toHaveLength(3));
        const badges = screen.getAllByTestId('health-badge');
        expect(badges).toHaveLength(3);
        expect(badges[0]).toHaveAttribute('data-health', 'good');
        expect(badges[1]).toHaveAttribute('data-health', 'at_risk');
        expect(badges[2]).toHaveAttribute('data-health', 'critical');
    });
    it('shows empty state when reports list is empty', async () => {
        vi.mocked(api.getReports).mockResolvedValue({ reports: [], nextCursor: null });
        renderReportsPage();
        await waitFor(() => expect(screen.getByTestId('reports-empty')).toBeInTheDocument());
        expect(screen.queryByTestId('reports-list')).not.toBeInTheDocument();
    });
    it('shows error state when fetch fails', async () => {
        vi.mocked(api.getReports).mockRejectedValue(new Error('Network error'));
        renderReportsPage();
        await waitFor(() => expect(screen.getByTestId('reports-error')).toBeInTheDocument());
        expect(screen.getByTestId('reports-error')).toHaveTextContent('Network error');
    });
});
