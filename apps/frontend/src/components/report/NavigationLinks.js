import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ExternalLink, Link2 } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { collectAllLinks } from '../../utils/riskFilters';
export function NavigationLinks({ risks, insights }) {
    const links = collectAllLinks(risks, insights);
    if (!links.length)
        return null;
    return (_jsxs("section", { "data-testid": "navigation-links", className: "mb-6 rounded-xl bg-slate-50 p-4", children: [_jsx(SectionHeading, { icon: _jsx(Link2, { className: "h-4 w-4" }), children: "Quick Links" }), _jsx("div", { className: "flex flex-wrap gap-2", children: links.map((link, i) => (_jsxs("a", { href: link.url, target: "_blank", rel: "noreferrer", "data-testid": "nav-link", className: "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors", children: [_jsx(ExternalLink, { className: "h-3.5 w-3.5" }), link.label] }, i))) })] }));
}
