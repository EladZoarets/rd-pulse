import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { ReportCard } from '../components/reports/ReportCard';
import { useReports } from '../hooks/useReports';
export function ReportsPage() {
    const [searchParams] = useSearchParams();
    const workspaceId = searchParams.get('workspaceId') ??
        localStorage.getItem('workspaceId') ??
        '';
    // Keep localStorage in sync with the URL param so subsequent navigations work
    if (searchParams.get('workspaceId') && workspaceId) {
        localStorage.setItem('workspaceId', workspaceId);
    }
    const { data, isLoading, isError, error } = useReports(workspaceId);
    return (_jsx(AppShell, { children: _jsxs(PageContainer, { children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Reports" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Daily R&D pulse reports for your workspace." })] }), isLoading && (_jsx("div", { "data-testid": "reports-loading", className: "py-20 text-center text-slate-400", children: "Loading reports\u2026" })), isError && (_jsxs("div", { "data-testid": "reports-error", className: "py-20 text-center", children: [_jsx("p", { className: "text-lg font-semibold text-slate-700", children: "Failed to load reports" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: error?.message })] })), data && data.reports.length === 0 && (_jsx("div", { "data-testid": "reports-empty", className: "py-20 text-center text-slate-400", children: "No reports yet. Run the connector to generate your first report." })), data && data.reports.length > 0 && (_jsx("ul", { "data-testid": "reports-list", className: "space-y-3", children: data.reports.map((report) => (_jsx("li", { children: _jsx(ReportCard, { report: report }) }, report.id))) }))] }) }));
}
