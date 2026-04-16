import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { HealthBadge } from '../ui/HealthBadge';
import { formatDate, formatRelative } from '../../utils/formatDate';
import { RefreshCw } from 'lucide-react';
export function ReportHeader({ report }) {
    return (_jsxs("div", { "data-testid": "report-header", className: "mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between text-sm text-slate-500", children: [_jsx("span", { children: report.workspaceId }), _jsxs("span", { children: [formatDate(report.windowStart), " \u2192 ", formatDate(report.windowEnd)] })] }), _jsx("div", { className: "mb-3 flex items-center gap-3", children: _jsx(HealthBadge, { health: report.summary.health, size: "lg" }) }), _jsx("h1", { className: "mb-4 text-2xl font-bold text-slate-900", children: report.summary.headline }), _jsxs("div", { className: "flex items-center gap-4 text-xs text-slate-400", children: [_jsxs("span", { children: ["Generated ", formatDate(report.generatedAt)] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(RefreshCw, { className: "h-3 w-3" }), "Synced ", formatRelative(report.lastSyncedAt)] }), _jsxs("span", { children: ["Run #", report.runCount] })] })] }));
}
