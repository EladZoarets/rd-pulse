import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GitPullRequest } from 'lucide-react';
import { RiskCard } from './RiskCard';
import { SectionHeading } from './SectionHeading';
import { githubSignalRisks } from '../../utils/riskFilters';
export function GitHubSignalsSection({ risks }) {
    const filtered = githubSignalRisks(risks);
    if (!filtered.length)
        return null;
    return (_jsxs("section", { "data-testid": "github-signals-section", className: "mb-6", children: [_jsx(SectionHeading, { icon: _jsx(GitPullRequest, { className: "h-4 w-4" }), children: "GitHub Signals" }), _jsx("div", { className: "grid gap-3", children: filtered.map((r, i) => _jsx(RiskCard, { risk: r }, i)) })] }));
}
