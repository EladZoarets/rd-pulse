import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { SeverityBadge } from '../ui/SeverityBadge';
import { SourceChip } from './SourceChip';
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
function filterRisks(risks, filter) {
    if (!filter)
        return sortBySeverity(risks);
    return sortBySeverity(risks.filter(r => filter.type === 'severity'
        ? r.severity === filter.value
        : detectSource(r.type) === filter.value));
}
function filterLabel(filter) {
    if (!filter)
        return '';
    if (filter.type === 'severity') {
        return { high: 'High', medium: 'Medium', low: 'Low' }[filter.value] ?? filter.value;
    }
    return { jira: 'Jira', github: 'GitHub', team: 'Team' }[filter.value] ?? filter.value;
}
export function IssuesSection({ risks, activeFilter, onClearFilter }) {
    const filtered = filterRisks(risks, activeFilter);
    return (_jsxs("section", { id: "issues-section", "data-testid": "issues-section", className: "mb-6", children: [_jsxs("div", { className: "mb-4 flex items-center gap-3", children: [_jsx("h2", { className: "text-xs font-bold uppercase tracking-widest text-slate-400", children: "Issues & Signals" }), _jsx("div", { className: "h-px flex-1 bg-slate-200" }), activeFilter && (_jsxs("span", { role: "status", "aria-live": "polite", className: "inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white", children: ["Filtered: ", filterLabel(activeFilter), _jsx("button", { onClick: onClearFilter, "aria-label": `Remove ${filterLabel(activeFilter)} filter`, className: "ml-0.5 rounded-full p-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white", children: _jsx(X, { className: "h-3 w-3", "aria-hidden": "true" }) })] }))] }), _jsxs("p", { className: "mb-3 text-xs text-slate-400", children: [filtered.length, " ", filtered.length === 1 ? 'issue' : 'issues', activeFilter ? ` matching filter` : ' total'] }), filtered.length === 0 ? (_jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 py-10 text-center", children: [_jsx("p", { className: "text-sm font-medium text-slate-500", children: "No issues match this filter" }), _jsx("button", { onClick: onClearFilter, className: "mt-2 text-xs text-blue-600 hover:underline focus-visible:outline-none", children: "Clear filter to see all issues" })] })) : (_jsx("div", { className: "space-y-3", children: filtered.map((risk, i) => {
                    const source = detectSource(risk.type);
                    return (_jsxs("div", { "data-testid": "issue-card", className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md", children: [_jsxs("div", { className: "mb-2 flex flex-wrap items-center gap-2", children: [_jsx(SeverityBadge, { severity: risk.severity }), _jsx(SourceChip, { source: source }), _jsx("span", { className: "font-semibold text-slate-900", children: risk.title })] }), _jsx("p", { className: "mb-3 text-sm leading-relaxed text-slate-600", children: risk.description }), risk.links.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 pt-1", children: risk.links.map((link, j) => (_jsxs("a", { href: link.url, target: "_blank", rel: "noreferrer", "data-testid": "issue-link", className: "inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", children: [_jsx(ExternalLink, { className: "h-3 w-3 shrink-0", "aria-hidden": "true" }), link.label] }, j))) }))] }, i));
                }) }))] }));
}
