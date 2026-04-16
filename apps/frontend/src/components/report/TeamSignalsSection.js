import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Users } from 'lucide-react';
import { RiskCard } from './RiskCard';
import { SectionHeading } from './SectionHeading';
import { teamSignalRisks } from '../../utils/riskFilters';
export function TeamSignalsSection({ risks }) {
    const filtered = teamSignalRisks(risks);
    if (!filtered.length)
        return null;
    return (_jsxs("section", { "data-testid": "team-signals-section", className: "mb-6", children: [_jsx(SectionHeading, { icon: _jsx(Users, { className: "h-4 w-4" }), children: "Team Signals" }), _jsx("div", { className: "grid gap-3", children: filtered.map((r, i) => _jsx(RiskCard, { risk: r }, i)) })] }));
}
