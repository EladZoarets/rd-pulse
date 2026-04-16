import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ListTodo } from 'lucide-react';
import { RiskCard } from './RiskCard';
import { SectionHeading } from './SectionHeading';
import { jiraRisks } from '../../utils/riskFilters';
export function JiraRisksSection({ risks }) {
    const filtered = jiraRisks(risks);
    if (!filtered.length)
        return null;
    return (_jsxs("section", { "data-testid": "jira-risks-section", className: "mb-6", children: [_jsx(SectionHeading, { icon: _jsx(ListTodo, { className: "h-4 w-4" }), children: "Jira Risks" }), _jsx("div", { className: "grid gap-3", children: filtered.map((r, i) => _jsx(RiskCard, { risk: r }, i)) })] }));
}
