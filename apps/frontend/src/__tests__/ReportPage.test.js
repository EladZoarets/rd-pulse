import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ReportPage } from '../pages/ReportPage';
import { mockReportAtRisk } from '../mocks/reports';
// Replace the exported `api` with the mockApi implementation so that
// useReport resolves against mock data without needing VITE_USE_MOCK.
vi.mock('../api', async () => {
    const { mockApi } = await vi.importActual('../api/mock');
    return { api: mockApi };
});
// Helper: renders /report/:id route inside all required providers
function renderReportPage(id) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(_jsx(QueryClientProvider, { client: queryClient, children: _jsx(MemoryRouter, { initialEntries: [`/report/${id}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/report/:id", element: _jsx(ReportPage, {}) }) }) }) }));
}
describe('ReportPage', () => {
    it('shows loading state initially', () => {
        renderReportPage('report-at-risk');
        expect(screen.getByTestId('report-loading')).toBeInTheDocument();
    });
    it('renders health banner after data loads', async () => {
        renderReportPage('report-at-risk');
        await waitFor(() => expect(screen.getByTestId('health-banner')).toBeInTheDocument(), { timeout: 2000 });
    });
    it('renders health banner with report headline', async () => {
        renderReportPage('report-at-risk');
        await waitFor(() => {
            const banner = screen.getByTestId('health-banner');
            expect(banner).toHaveTextContent(mockReportAtRisk.summary.headline);
        }, { timeout: 2000 });
    });
    it('renders issues section', async () => {
        renderReportPage('report-at-risk');
        await waitFor(() => expect(screen.getByTestId('issues-section')).toBeInTheDocument(), { timeout: 2000 });
    });
    it('renders navigation links with target=_blank', async () => {
        renderReportPage('report-at-risk');
        await waitFor(() => {
            const links = screen.getAllByTestId('nav-link');
            links.forEach((link) => {
                expect(link).toHaveAttribute('target', '_blank');
                expect(link).toHaveAttribute('rel', 'noreferrer');
            });
        }, { timeout: 2000 });
    });
    it('shows error state for unknown report id', async () => {
        renderReportPage('does-not-exist');
        await waitFor(() => expect(screen.getByTestId('report-error')).toBeInTheDocument(), { timeout: 2000 });
    });
});
