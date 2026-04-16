import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RiskSeverityChart } from './RiskSeverityChart';
import { RiskTypeChart } from './RiskTypeChart';
export function ChartsRow({ risks, activeFilter, onFilterChange }) {
    if (!risks.length)
        return null;
    return (_jsxs("div", { className: "mb-6 grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-800", children: "Risk Severity" }), _jsx("p", { className: "mb-4 mt-0.5 text-xs text-slate-400", children: "How urgent are the open issues?" }), _jsx(RiskSeverityChart, { risks: risks, activeFilter: activeFilter, onFilterChange: onFilterChange })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-800", children: "Issues by Source" }), _jsx("p", { className: "mb-4 mt-0.5 text-xs text-slate-400", children: "Where are issues coming from?" }), _jsx(RiskTypeChart, { risks: risks, activeFilter: activeFilter, onFilterChange: onFilterChange })] })] }));
}
