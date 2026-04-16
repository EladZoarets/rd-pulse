import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatDate, formatRelative } from '../../utils/formatDate';
import { RefreshCw } from 'lucide-react';
const HEALTH_CONFIG = {
    critical: {
        border: 'border-l-red-500',
        pill: 'bg-red-100 text-red-800',
        label: 'Critical',
        icon: '🔴',
    },
    at_risk: {
        border: 'border-l-amber-400',
        pill: 'bg-amber-100 text-amber-800',
        label: 'At Risk',
        icon: '🟡',
    },
    good: {
        border: 'border-l-green-500',
        pill: 'bg-green-100 text-green-800',
        label: 'Good',
        icon: '🟢',
    },
};
export function HealthBanner({ report }) {
    const { health } = report.summary;
    const cfg = HEALTH_CONFIG[health] ?? HEALTH_CONFIG.good;
    return (_jsxs("div", { "data-testid": "health-banner", className: `mb-6 rounded-2xl border border-slate-200 border-l-4 ${cfg.border} bg-white p-6 shadow-sm`, children: [_jsxs("div", { className: "mb-1 flex items-center justify-between text-xs text-slate-400", children: [_jsx("span", { children: report.workspaceId }), _jsxs("span", { children: [formatDate(report.windowStart), " \u2192 ", formatDate(report.windowEnd)] })] }), _jsx("div", { className: "mb-3 mt-2", children: _jsxs("span", { className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${cfg.pill}`, children: [_jsx("span", { "aria-hidden": "true", children: cfg.icon }), cfg.label] }) }), _jsx("h1", { className: "mb-4 text-2xl font-bold leading-snug text-slate-900", children: report.summary.headline }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-xs text-slate-400", children: [_jsxs("span", { children: ["Generated ", formatDate(report.generatedAt)] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(RefreshCw, { className: "h-3 w-3", "aria-hidden": "true" }), "Synced ", formatRelative(report.lastSyncedAt)] }), _jsxs("span", { children: ["Run #", report.runCount] })] })] }));
}
