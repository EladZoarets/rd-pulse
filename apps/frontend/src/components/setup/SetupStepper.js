import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle } from 'lucide-react';
export function SetupStepper({ steps, current }) {
    return (_jsx("nav", { "aria-label": "Setup progress", className: "mb-10", children: _jsx("ol", { role: "list", className: "flex items-center gap-0", children: steps.map((step, index) => {
                const isDone = index < current;
                const isActive = index === current;
                const isLast = index === steps.length - 1;
                return (_jsxs("li", { role: "listitem", className: "flex flex-1 items-center", children: [_jsxs("div", { className: "flex flex-col items-center gap-1.5 flex-shrink-0", children: [_jsx("div", { "aria-current": isActive ? 'step' : undefined, className: [
                                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                                        isDone
                                            ? 'bg-blue-600 text-white'
                                            : isActive
                                                ? 'border-2 border-blue-600 bg-white text-blue-600'
                                                : 'border-2 border-slate-200 bg-white text-slate-400',
                                    ].join(' '), children: isDone ? (_jsx(CheckCircle, { className: "h-4.5 w-4.5", "aria-hidden": "true" })) : (_jsx("span", { children: index + 1 })) }), _jsx("span", { className: [
                                        'text-xs font-medium whitespace-nowrap',
                                        isActive ? 'text-blue-600' : isDone ? 'text-slate-600' : 'text-slate-400',
                                    ].join(' '), children: step.label })] }), !isLast && (_jsx("div", { className: [
                                'mx-2 h-0.5 flex-1 mb-4 transition-colors',
                                isDone ? 'bg-blue-600' : 'bg-slate-200',
                            ].join(' '), "aria-hidden": "true" }))] }, step.label));
            }) }) }));
}
