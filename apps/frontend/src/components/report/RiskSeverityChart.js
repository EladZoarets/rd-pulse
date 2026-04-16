import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const COLORS = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#94a3b8',
};
export function RiskSeverityChart({ risks, onSelectSeverity }) {
    const counts = { High: 0, Medium: 0, Low: 0 };
    for (const r of risks) {
        if (r.severity === 'high')
            counts.High++;
        else if (r.severity === 'medium')
            counts.Medium++;
        else
            counts.Low++;
    }
    const data = Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }));
    if (data.length === 0) {
        return (_jsx("div", { className: "flex h-full items-center justify-center text-sm text-slate-400", children: "No risks detected" }));
    }
    const isInteractive = typeof onSelectSeverity === 'function';
    return (_jsx("div", { role: "img", "aria-label": "Risk severity distribution pie chart", className: `h-[220px] w-full ${isInteractive ? 'cursor-pointer' : ''}`, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data, cx: "50%", cy: "50%", innerRadius: 55, outerRadius: 80, paddingAngle: 3, dataKey: "value", onClick: isInteractive ? (payload) => {
                        const name = payload?.name;
                        if (name === 'High')
                            onSelectSeverity('high');
                        else if (name === 'Medium')
                            onSelectSeverity('medium');
                        else if (name === 'Low')
                            onSelectSeverity('low');
                    } : undefined, children: data.map((entry) => (_jsx(Cell, { fill: COLORS[entry.name] }, entry.name))) }), _jsx(Tooltip, {}), _jsx(Legend, { iconType: "circle", iconSize: 8, wrapperStyle: { fontSize: '12px' } })] }) }) }));
}
