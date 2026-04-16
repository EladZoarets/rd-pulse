import { jsx as _jsx } from "react/jsx-runtime";
const CLASSES = {
    high: 'bg-red-100 text-red-700 border border-red-200',
    medium: 'bg-amber-100 text-amber-700 border border-amber-200',
    low: 'bg-blue-100 text-blue-700 border border-blue-200',
};
export function SeverityBadge({ severity }) {
    return (_jsx("span", { "data-testid": "severity-badge", "data-severity": severity, className: `inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${CLASSES[severity]}`, children: severity }));
}
