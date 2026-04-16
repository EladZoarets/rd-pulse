import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { HealthBanner } from '../components/report/HealthBanner';
import { ChartsRow } from '../components/report/ChartsRow';
import { IssuesSection } from '../components/report/IssuesSection';
import { SprintCompletionSection } from '../components/report/SprintCompletionSection';
import { NavigationLinks } from '../components/report/NavigationLinks';
import { useReport } from '../hooks/useReport';
export function ReportPage() {
    const { id } = useParams();
    const { data: report, isLoading, isError, error } = useReport(id ?? '');
    const [activeFilter, setActiveFilter] = useState(null);
    if (isLoading) {
        return (_jsx(AppShell, { children: _jsx(PageContainer, { children: _jsx("div", { "data-testid": "report-loading", className: "py-20 text-center text-slate-400", children: "Loading report\u2026" }) }) }));
    }
    if (isError || !report) {
        return (_jsx(AppShell, { children: _jsx(PageContainer, { children: _jsxs("div", { "data-testid": "report-error", className: "py-20 text-center", children: [_jsx("p", { className: "text-lg font-semibold text-slate-700", children: "Report not found" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: error?.message ?? 'This report does not exist or has been removed.' })] }) }) }));
    }
    return (_jsx(AppShell, { children: _jsxs(PageContainer, { children: [_jsx(HealthBanner, { report: report }), report.sprintData && (_jsx(SprintCompletionSection, { sprintData: report.sprintData })), _jsx(ChartsRow, { risks: report.risks, activeFilter: activeFilter, onFilterChange: setActiveFilter }), _jsx(IssuesSection, { risks: report.risks, activeFilter: activeFilter, onClearFilter: () => setActiveFilter(null) }), _jsx(NavigationLinks, { risks: report.risks, insights: report.insights })] }) }));
}
