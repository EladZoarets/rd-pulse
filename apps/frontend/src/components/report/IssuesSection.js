import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ExternalLink } from 'lucide-react';
import { SeverityBadge } from '../ui/SeverityBadge';
import { SourceChip } from './SourceChip';
import { SectionHeading } from './SectionHeading';
import { AlertTriangle } from 'lucide-react';
import { sortBySeverity } from '../../utils/riskFilters';
const JIRA_TYPES = new Set(['sprint_jeopardy', 'unassigned_risk', 'stall']);
const GITHUB_TYPES = new Set(['review_bottleneck', 'ghost_work']);
function detectSource(type) {
    if (JIRA_TYPES.has(type))
        return 'jira';
    if (GITHUB_TYPES.has(type))
        return 'github';
    return 'team';
}
export function IssuesSection({ risks }) {
    if (!risks.length)
        return null;
    const sorted = sortBySeverity(risks);
    return (_jsxs("section", { id: "issues", "data-testid": "issues-section", className: "mb-6", children: [_jsx(SectionHeading, { icon: _jsx(AlertTriangle, { className: "h-4 w-4" }), children: "Issues & Signals" }), _jsx("div", { className: "space-y-3", children: sorted.map((risk, i) => {
                    const source = detectSource(risk.type);
                    return (_jsxs("div", { "data-testid": "issue-card", className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md", children: [_jsxs("div", { className: "mb-2 flex flex-wrap items-center gap-2", children: [_jsx(SeverityBadge, { severity: risk.severity }), _jsx(SourceChip, { source: source }), _jsx("span", { className: "font-semibold text-slate-900", children: risk.title })] }), _jsx("p", { className: "mb-3 text-sm leading-relaxed text-slate-600", children: risk.description }), risk.links.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: risk.links.map((link, j) => (_jsxs("a", { href: link.url, target: "_blank", rel: "noreferrer", "data-testid": "issue-link", className: "inline-flex items-center gap-1 text-xs text-blue-600 hover:underline", children: [_jsx(ExternalLink, { className: "h-3 w-3", "aria-hidden": "true" }), link.label] }, j))) }))] }, i));
                }) })] }));
}
