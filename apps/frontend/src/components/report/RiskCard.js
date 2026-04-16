import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SeverityBadge } from '../ui/SeverityBadge';
import { ExternalLink } from 'lucide-react';
export function RiskCard({ risk }) {
    return (_jsxs("div", { "data-testid": "risk-card", className: `rounded-lg bg-white p-4 shadow-sm border-l-4 ${risk.severity === 'high'
            ? 'border-red-500'
            : risk.severity === 'medium'
                ? 'border-amber-500'
                : 'border-blue-500'}`, children: [_jsxs("div", { className: "mb-2 flex items-center gap-2", children: [_jsx(SeverityBadge, { severity: risk.severity }), _jsx("span", { className: "font-semibold text-slate-900", children: risk.title })] }), _jsx("p", { className: "mb-3 text-sm text-slate-600 line-clamp-2", children: risk.description }), risk.links.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: risk.links.map((link, i) => (_jsxs("a", { href: link.url, target: "_blank", rel: "noreferrer", "data-testid": "risk-link", className: "inline-flex items-center gap-1 text-xs text-blue-600 hover:underline", children: [_jsx(ExternalLink, { className: "h-3 w-3" }), link.label] }, i))) }))] }));
}
