import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Returns a CSS color string interpolating green→amber→red as pct drops 100→0 */
function pctColor(pct) {
    // green  at 100%:  #22c55e
    // amber  at  50%:  #f59e0b
    // red    at   0%:  #ef4444
    if (pct >= 70)
        return '#22c55e';
    if (pct >= 50)
        return '#84cc16';
    if (pct >= 35)
        return '#f59e0b';
    if (pct >= 20)
        return '#f97316';
    return '#ef4444';
}
function pctLabel(pct) {
    if (pct >= 70)
        return 'On track';
    if (pct >= 50)
        return 'At risk';
    if (pct >= 35)
        return 'Behind';
    return 'Critical';
}
function pctTextColor(pct) {
    if (pct >= 70)
        return 'text-green-700';
    if (pct >= 50)
        return 'text-lime-700';
    if (pct >= 35)
        return 'text-amber-700';
    if (pct >= 20)
        return 'text-orange-700';
    return 'text-red-700';
}
function CompletionBar({ pct, label, subLabel, height = 'h-4' }) {
    const color = pctColor(pct);
    const clampedPct = Math.max(0, Math.min(100, pct));
    return (_jsxs("div", { children: [(label || subLabel) && (_jsxs("div", { className: "mb-1.5 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [label && _jsx("span", { className: "text-sm font-medium text-slate-800", children: label }), subLabel && _jsx("span", { className: "text-xs text-slate-400", children: subLabel })] }), _jsxs("span", { className: `text-sm font-bold tabular-nums ${pctTextColor(pct)}`, "aria-label": `${clampedPct}% complete`, children: [clampedPct, "%"] })] })), _jsx("div", { className: `w-full overflow-hidden rounded-full bg-slate-100 ${height}`, role: "progressbar", "aria-valuenow": clampedPct, "aria-valuemin": 0, "aria-valuemax": 100, children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: { width: `${clampedPct}%`, backgroundColor: color } }) }), !label && (_jsxs("div", { className: "mt-1 flex justify-between text-xs text-slate-400", children: [_jsx("span", { children: pctLabel(pct) }), _jsxs("span", { children: [clampedPct, "%"] })] }))] }));
}
export function SprintCompletionSection({ sprintData }) {
    const { overallPercent, users, topics } = sprintData;
    return (_jsxs("section", { className: "mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: [_jsxs("div", { className: "mb-5", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-800", children: "Sprint Completion" }), _jsx("p", { className: "mt-0.5 text-xs text-slate-400", children: "Estimated probability of finishing the sprint on time" })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-semibold text-slate-700", children: "Overall" }), _jsxs("span", { className: `text-lg font-bold tabular-nums ${pctTextColor(overallPercent)}`, children: [overallPercent, "%"] })] }), _jsx(CompletionBar, { pct: overallPercent, height: "h-5" }), _jsx("p", { className: `mt-1.5 text-xs font-medium ${pctTextColor(overallPercent)}`, children: pctLabel(overallPercent) })] }), users.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-3 h-px bg-slate-100" }), _jsx("h3", { className: "mb-3 text-xs font-bold uppercase tracking-widest text-slate-400", children: "By Team Member" }), _jsx("div", { className: "space-y-4", children: users.map((u) => {
                            const userPct = u.total > 0 ? Math.round((u.done / u.total) * 100) : 0;
                            return (_jsx(CompletionBar, { pct: userPct, label: u.user, subLabel: `${u.done} done · ${u.inProgress} in progress · ${u.total - u.done - u.inProgress} to do`, height: "h-3" }, u.user));
                        }) })] })), topics && topics.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-3 mt-6 h-px bg-slate-100" }), _jsx("h3", { className: "mb-3 text-xs font-bold uppercase tracking-widest text-slate-400", children: "By Topic" }), _jsx("div", { className: "space-y-4", children: topics.map((t) => (_jsx(CompletionBar, { pct: t.completionPercent, label: t.topic, subLabel: `${t.doneCount} done · ${t.inProgressCount} in progress · ${t.todoCount} to do`, height: "h-3" }, t.topic))) })] }))] }));
}
