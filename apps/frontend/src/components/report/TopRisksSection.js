import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle } from 'lucide-react';
import { RiskCard } from './RiskCard';
import { SectionHeading } from './SectionHeading';
import { topRisks } from '../../utils/riskFilters';
export function TopRisksSection({ risks }) {
    const top = topRisks(risks, 5);
    if (!top.length)
        return null;
    return (_jsxs("section", { "data-testid": "top-risks-section", className: "mb-6", children: [_jsx(SectionHeading, { icon: _jsx(AlertTriangle, { className: "h-4 w-4" }), children: "Top Risks" }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: top.map((r, i) => _jsx(RiskCard, { risk: r }, i)) })] }));
}
