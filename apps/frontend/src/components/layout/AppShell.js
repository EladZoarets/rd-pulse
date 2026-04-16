import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
export function AppShell({ children }) {
    const location = useLocation();
    const isReport = location.pathname.startsWith('/report/');
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("header", { className: "sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm", children: _jsxs("div", { className: "mx-auto flex max-w-5xl items-center justify-between px-6 py-3", children: [_jsxs(Link, { to: "/setup", className: "flex items-center gap-2 font-bold text-slate-900", children: [_jsx(Activity, { className: "h-5 w-5 text-blue-600" }), "RD Pulse"] }), _jsxs("nav", { className: "flex items-center gap-4 text-sm", children: [isReport && (_jsx(Link, { to: "/reports", className: "text-slate-500 hover:text-slate-900", children: "\u2190 All Reports" })), _jsx(Link, { to: "/setup", className: "text-slate-500 hover:text-slate-900", children: "Setup" })] })] }) }), _jsx("main", { children: children })] }));
}
