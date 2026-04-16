import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RiskSeverityChart } from './RiskSeverityChart';
import { RiskTypeChart } from './RiskTypeChart';
export function ChartsRow({ risks, onSelectSeverity, onSelectType }) {
    if (!risks.length)
        return null;
    return (_jsxs("div", { className: "mb-6 grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: [_jsx("h2", { className: "mb-1 text-xs font-bold uppercase tracking-widest text-slate-400", children: "Risk Severity" }), _jsx(RiskSeverityChart, { risks: risks, onSelectSeverity: onSelectSeverity })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: [_jsx("h2", { className: "mb-1 text-xs font-bold uppercase tracking-widest text-slate-400", children: "Issue Types" }), _jsx(RiskTypeChart, { risks: risks, onSelectType: onSelectType })] })] }));
}
