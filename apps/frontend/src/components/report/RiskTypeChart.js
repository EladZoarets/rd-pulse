import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const TYPE_LABELS = {
    sprint_jeopardy: 'Sprint Risk',
    review_bottleneck: 'Review',
    ghost_work: 'Ghost Work',
    unassigned_risk: 'Unassigned',
    stall: 'Stalled',
    overload: 'Overload',
};
const COLORS = [
    '#3b82f6',
    '#ef4444',
    '#f59e0b',
    '#8b5cf6',
    '#22c55e',
    '#ec4899',
];
export function RiskTypeChart({ risks, onSelectType }) {
    const countMap = {};
    for (const r of risks) {
        const label = TYPE_LABELS[r.type] ?? r.type;
        countMap[r.type] = (countMap[r.type] ?? 0) + 1;
    }
    const data = Object.entries(countMap).map(([type, value]) => ({
        type,
        name: TYPE_LABELS[type] ?? type,
        value,
    }));
    if (data.length === 0) {
        return (_jsx("div", { className: "flex h-full items-center justify-center text-sm text-slate-400", children: "No issues detected" }));
    }
    const isInteractive = typeof onSelectType === 'function';
    return (_jsx("div", { role: "img", "aria-label": "Risk type distribution pie chart", className: `h-[220px] w-full ${isInteractive ? 'cursor-pointer' : ''}`, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data, cx: "50%", cy: "50%", innerRadius: 55, outerRadius: 80, paddingAngle: 3, dataKey: "value", onClick: isInteractive ? (payload) => {
                        const type = payload?.type;
                        if (type)
                            onSelectType(type);
                    } : undefined, children: data.map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, entry.type))) }), _jsx(Tooltip, {}), _jsx(Legend, { iconType: "circle", iconSize: 8, wrapperStyle: { fontSize: '12px' } })] }) }) }));
}
