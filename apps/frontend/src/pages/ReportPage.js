import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { HealthBanner } from '../components/report/HealthBanner';
import { ChartsRow } from '../components/report/ChartsRow';
import { IssuesSection } from '../components/report/IssuesSection';
import { NavigationLinks } from '../components/report/NavigationLinks';
import { TopRisksSection } from '../components/report/TopRisksSection';
import { JiraRisksSection } from '../components/report/JiraRisksSection';
import { GitHubSignalsSection } from '../components/report/GitHubSignalsSection';
import { TeamSignalsSection } from '../components/report/TeamSignalsSection';
import { useReport } from '../hooks/useReport';
export function ReportPage() {
    const { id } = useParams();
    const { data: report, isLoading, isError, error } = useReport(id ?? '');
    const [searchParams, setSearchParams] = useSearchParams();
    const severity = searchParams.get('severity') ?? '';
    const type = searchParams.get('type') ?? '';
    const focus = searchParams.get('focus') ?? '';
    const allRisks = report?.risks ?? [];
    const filteredRisks = useMemo(() => {
        return allRisks.filter((r) => {
            if (severity && r.severity !== severity)
                return false;
            if (type && r.type !== type)
                return false;
            return true;
        });
    }, [allRisks, severity, type]);
    useEffect(() => {
        if (focus !== 'issues')
            return;
        const el = document.getElementById('issues');
        if (el)
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [focus]);
    const hasFilters = Boolean(severity || type);
    function clearFilters() {
        setSearchParams({});
    }
    function applyFilters(next) {
        const nextParams = new URLSearchParams(searchParams);
        if (next.severity)
            nextParams.set('severity', next.severity);
        if (next.type)
            nextParams.set('type', next.type);
        nextParams.delete('focus');
        nextParams.set('focus', 'issues');
        setSearchParams(nextParams);
    }
    if (isLoading) {
        return (_jsx(AppShell, { children: _jsx(PageContainer, { children: _jsx("div", { "data-testid": "report-loading", className: "py-20 text-center text-slate-400", children: "Loading report\u2026" }) }) }));
    }
    if (isError || !report) {
        return (_jsx(AppShell, { children: _jsx(PageContainer, { children: _jsxs("div", { "data-testid": "report-error", className: "py-20 text-center", children: [_jsx("p", { className: "text-lg font-semibold text-slate-700", children: "Report not found" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: error?.message ?? 'This report does not exist or has been removed.' })] }) }) }));
    }
    return (_jsx(AppShell, { children: _jsxs(PageContainer, { children: [_jsx(HealthBanner, { report: report }), _jsx(TopRisksSection, { risks: report.risks }), _jsx(ChartsRow, { risks: report.risks, onSelectSeverity: (s) => applyFilters({ severity: s }), onSelectType: (t) => applyFilters({ type: t }) }), hasFilters && (_jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm", children: [_jsxs("div", { className: "text-slate-600", children: [_jsx("span", { className: "font-semibold text-slate-900", children: "Filtered:" }), " ", severity && (_jsxs("span", { className: "mr-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700", children: ["Severity: ", severity] })), type && (_jsxs("span", { className: "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700", children: ["Type: ", type] }))] }), _jsx("button", { type: "button", onClick: clearFilters, className: "text-sm font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2", children: "Clear" })] })), _jsx(JiraRisksSection, { risks: report.risks }), _jsx(GitHubSignalsSection, { risks: report.risks }), _jsx(TeamSignalsSection, { risks: report.risks }), _jsx(IssuesSection, { risks: filteredRisks }), _jsx(NavigationLinks, { risks: report.risks, insights: report.insights })] }) }));
}
