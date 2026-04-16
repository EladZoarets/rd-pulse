import { jsx as _jsx } from "react/jsx-runtime";
export function PageContainer({ children, className = '' }) {
    return (_jsx("div", { className: `mx-auto max-w-5xl px-6 py-10 ${className}`, children: children }));
}
