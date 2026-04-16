import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatDate, formatRelative } from '../../utils/formatDate';
import { RefreshCw } from 'lucide-react';
const HEALTH_STYLES = {
    critical: 'bg-red-600 text-white',
    at_risk: 'bg-amber-500 text-white',
    good: 'bg-green-50 border border-green-200 text-green-900',
};
const HEALTH_LABEL = {
    critical: 'Critical',
    at_risk: 'At Risk',
    good: 'Good',
};
const HEALTH_DOT = {
    critical: 'bg-red-200',
    at_risk: 'bg-amber-200',
    good: 'bg-green-400',
};
export function HealthBanner({ report }) {
    const { health } = report.summary;
    const bannerStyle = HEALTH_STYLES[health] ?? HEALTH_STYLES.good;
    return (_jsxs("div", { "data-testid": "health-banner", className: `mb-6 rounded-2xl p-6 ${bannerStyle}`, children: [_jsxs("div", { className: "mb-3 flex items-center justify-between text-xs opacity-70", children: [_jsx("span", { children: report.workspaceId }), _jsxs("span", { children: [formatDate(report.windowStart), " \u2192 ", formatDate(report.windowEnd)] })] }), _jsx("div", { className: "mb-3 flex items-center gap-2", children: _jsxs("span", { className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${health === 'good'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-white/20 text-inherit'}`, children: [_jsx("span", { className: `h-2 w-2 rounded-full ${HEALTH_DOT[health] ?? 'bg-white'}`, "aria-hidden": "true" }), HEALTH_LABEL[health] ?? health] }) }), _jsx("h1", { className: "mb-4 text-2xl font-bold leading-snug", children: report.summary.headline }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-xs opacity-60", children: [_jsxs("span", { children: ["Generated ", formatDate(report.generatedAt)] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(RefreshCw, { className: "h-3 w-3", "aria-hidden": "true" }), "Synced ", formatRelative(report.lastSyncedAt)] }), _jsxs("span", { children: ["Run #", report.runCount] })] })] }));
}
