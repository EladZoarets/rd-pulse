import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SectionHeading({ children, icon }) {
    return (_jsxs("div", { className: "mb-4 flex items-center gap-2", children: [icon && _jsx("span", { className: "text-slate-500", children: icon }), _jsx("h2", { className: "text-xs font-bold uppercase tracking-widest text-slate-400", children: children }), _jsx("div", { className: "h-px flex-1 bg-slate-200" })] }));
}
