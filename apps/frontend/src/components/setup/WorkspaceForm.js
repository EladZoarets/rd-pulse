import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useCreateWorkspace } from '../../hooks/useCreateWorkspace';
import { AlertCircle } from 'lucide-react';
export function WorkspaceForm({ onSuccess }) {
    const [name, setName] = useState('');
    const { mutate, isPending, isError, error, isSuccess, data } = useCreateWorkspace();
    useEffect(() => {
        if (isSuccess && data) {
            onSuccess(data);
        }
    }, [isSuccess, data, onSuccess]);
    function handleSubmit(e) {
        e.preventDefault();
        mutate({ name });
    }
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-8 shadow-sm", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900 mb-1", children: "Name your workspace" }), _jsx("p", { className: "text-sm text-slate-500 mb-6", children: "Usually your team or org name \u2014 e.g. \"Acme Backend\" or \"Platform Team\"." }), _jsxs("form", { "data-testid": "setup-form", onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "workspace-name", className: "mb-1.5 block text-sm font-medium text-slate-700", children: "Workspace name" }), _jsx("input", { id: "workspace-name", "data-testid": "setup-name-input", type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Acme Backend", autoFocus: true, className: "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" })] }), isError && (_jsxs("div", { "data-testid": "setup-error", role: "alert", className: "flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700", children: [_jsx(AlertCircle, { className: "h-4 w-4 flex-shrink-0 mt-0.5", "aria-hidden": "true" }), error?.message ?? 'Something went wrong. Please try again.'] })), _jsx("button", { "data-testid": isPending ? 'setup-submitting' : 'setup-submit', type: "submit", disabled: !name.trim() || isPending, className: "w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", children: isPending ? 'Creating…' : 'Create Workspace →' })] })] }));
}
