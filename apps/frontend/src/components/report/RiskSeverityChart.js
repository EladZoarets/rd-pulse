import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
const BUCKETS = [
    {
        key: 'high',
        label: 'High',
        color: '#ef4444',
        bg: 'bg-red-50 hover:bg-red-100',
        activeBg: 'bg-red-100',
        text: 'text-red-800',
        ring: 'ring-red-400',
    },
    {
        key: 'medium',
        label: 'Medium',
        color: '#f59e0b',
        bg: 'bg-amber-50 hover:bg-amber-100',
        activeBg: 'bg-amber-100',
        text: 'text-amber-800',
        ring: 'ring-amber-400',
    },
    {
        key: 'low',
        label: 'Low',
        color: '#94a3b8',
        bg: 'bg-slate-50 hover:bg-slate-100',
        activeBg: 'bg-slate-100',
        text: 'text-slate-700',
        ring: 'ring-slate-400',
    },
];
export function RiskSeverityChart({ risks, activeFilter, onFilterChange }) {
    const counts = { high: 0, medium: 0, low: 0 };
    for (const r of risks) {
        if (r.severity in counts)
            counts[r.severity]++;
    }
    const total = risks.length;
    const chartData = BUCKETS
        .filter(b => counts[b.key] > 0)
        .map(b => ({ name: b.label, value: counts[b.key], color: b.color }));
    function handleTileClick(key) {
        const isActive = activeFilter?.type === 'severity' && activeFilter.value === key;
        onFilterChange(isActive ? null : { type: 'severity', value: key });
        if (!isActive) {
            setTimeout(() => {
                document.getElementById('issues-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        }
    }
    return (_jsxs("div", { children: [_jsx("div", { className: "mb-4 grid grid-cols-3 gap-2", role: "group", "aria-label": "Filter issues by severity", children: BUCKETS.map(b => {
                    const isActive = activeFilter?.type === 'severity' && activeFilter.value === b.key;
                    return (_jsxs("button", { onClick: () => handleTileClick(b.key), "aria-pressed": isActive, "aria-label": `Filter by ${b.label} severity: ${counts[b.key]} issues`, className: [
                            'rounded-xl p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2',
                            isActive
                                ? `${b.activeBg} ring-2 ring-offset-1 ${b.ring} scale-105`
                                : `${b.bg} opacity-80 hover:opacity-100`,
                        ].join(' '), children: [_jsx("div", { className: `text-2xl font-bold ${b.text}`, children: counts[b.key] }), _jsx("div", { className: `mt-0.5 text-xs font-medium ${b.text}`, children: b.label })] }, b.key));
                }) }), total > 0 && (_jsx("div", { "aria-hidden": "true", className: "h-[130px]", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: chartData, cx: "50%", cy: "50%", innerRadius: 38, outerRadius: 58, paddingAngle: 3, dataKey: "value", startAngle: 90, endAngle: -270, strokeWidth: 0, children: chartData.map(entry => {
                                    const bucket = BUCKETS.find(b => b.label === entry.name);
                                    const isActive = activeFilter?.type === 'severity' &&
                                        activeFilter.value === bucket?.key;
                                    return (_jsx(Cell, { fill: entry.color, opacity: activeFilter?.type === 'severity' && !isActive ? 0.3 : 1 }, entry.name));
                                }) }), _jsx(Tooltip, { formatter: (value) => [`${value} of ${total}`] })] }) }) }))] }));
}
