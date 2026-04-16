import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { HealthBadge } from '../ui/HealthBadge';
import { formatRelative } from '../../utils/formatDate';
export function ReportCard({ report }) {
    return (_jsx(Link, { "data-testid": "report-card", to: `/report/${report.id}`, className: "block rounded-lg border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-sm font-medium text-slate-900", children: report.headline }), _jsx("p", { className: "mt-1 text-xs text-slate-400", children: formatRelative(report.generatedAt) })] }), _jsx(HealthBadge, { health: report.health, size: "sm" })] }) }));
}
