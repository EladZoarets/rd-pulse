import { jsx as _jsx } from "react/jsx-runtime";
const LABEL = {
    good: 'On Track',
    at_risk: 'At Risk',
    critical: 'Critical',
};
const CLASSES = {
    good: 'bg-green-100 text-green-800 border border-green-200',
    at_risk: 'bg-amber-100 text-amber-800 border border-amber-200',
    critical: 'bg-red-100 text-red-800 border border-red-200',
};
const SIZE = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5 font-semibold',
};
export function HealthBadge({ health, size = 'md' }) {
    return (_jsx("span", { "data-testid": "health-badge", "data-health": health, className: `inline-flex items-center rounded-full font-medium ${CLASSES[health]} ${SIZE[size]}`, children: LABEL[health] }));
}
