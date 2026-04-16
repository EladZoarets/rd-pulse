import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { CheckCircle, Copy, Loader2, ExternalLink } from 'lucide-react';
import { useWorkspaceStatus } from '../../hooks/useWorkspace';
function CopyBlock({ label, text, testId, buttonTestId, }) {
    const [copied, setCopied] = useState(false);
    async function handleCopy() {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    return (_jsxs("div", { className: "overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-2.5 border-b border-slate-800", children: [_jsx("span", { className: "text-xs font-medium text-slate-400 tracking-wide", children: label }), _jsx("button", { type: "button", onClick: handleCopy, "data-testid": buttonTestId, "aria-label": `Copy ${label} to clipboard`, className: "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", children: copied ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "h-3.5 w-3.5 text-green-400", "aria-hidden": "true" }), _jsx("span", { className: "text-green-400", children: "Copied!" })] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: "h-3.5 w-3.5", "aria-hidden": "true" }), "Copy"] })) })] }), _jsx("pre", { "data-testid": testId, className: "overflow-x-auto px-4 py-4 text-sm text-slate-100 font-mono whitespace-pre leading-relaxed", children: text })] }));
}
function StepCard({ number, title, description, children, done = false }) {
    return (_jsxs("div", { className: [
            'rounded-2xl border p-6 transition-colors',
            done
                ? 'border-green-200 bg-green-50/50'
                : 'border-slate-200 bg-white shadow-sm',
        ].join(' '), children: [_jsxs("div", { className: "flex items-start gap-4 mb-4", children: [_jsx("div", { className: [
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
                            done
                                ? 'bg-green-500 text-white'
                                : 'bg-blue-600 text-white',
                        ].join(' '), "aria-hidden": "true", children: done ? _jsx(CheckCircle, { className: "h-4.5 w-4.5" }) : number }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 leading-snug", children: title }), _jsx("p", { className: "mt-0.5 text-sm text-slate-500", children: description })] })] }), _jsx("div", { className: "ml-12 space-y-3", children: children })] }));
}
export function ConnectorInstallStep({ workspace, onActive }) {
    const { data: status } = useWorkspaceStatus(workspace.workspaceId);
    const isActive = status?.status === 'active';
    useEffect(() => {
        if (isActive)
            onActive();
    }, [isActive, onActive]);
    const envBlock = `# rd-pulse credentials (pre-filled)
RDPULSE_SERVER=https://rdpulse-backend-production.up.railway.app
WORKSPACE_ID=${workspace.workspaceId}
RDPULSE_JWT=${workspace.licenseJwt}

# Your API keys
GITHUB_TOKEN=ghp_...
OPENAI_API_KEY=sk-proj-...
JIRA_DOMAIN=https://your-org.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_TOKEN=...`;
    const runCommand = `npx rdpulse-connector pulse --owner your-org --repo your-repo --board 42`;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(StepCard, { number: 1, title: "Create a .env file in your project directory", description: "Place this file in the same directory where you'll run the connector command. The top three lines are pre-filled with your workspace credentials.", children: [_jsx(CopyBlock, { label: ".env", text: envBlock, testId: "install-command" }), _jsx("div", { className: "grid grid-cols-1 gap-1.5 pt-1", children: [
                            {
                                key: 'GITHUB_TOKEN',
                                label: 'github.com/settings/tokens → New classic token → repo scope',
                                href: 'https://github.com/settings/tokens',
                            },
                            {
                                key: 'OPENAI_API_KEY',
                                label: 'platform.openai.com/api-keys',
                                href: 'https://platform.openai.com/api-keys',
                            },
                            {
                                key: 'JIRA_TOKEN',
                                label: 'id.atlassian.com → Security → API tokens',
                                href: 'https://id.atlassian.com/manage-profile/security/api-tokens',
                            },
                        ].map(({ key, label, href }) => (_jsxs("div", { className: "flex items-start gap-1.5 text-xs text-slate-500", children: [_jsx("span", { className: "font-semibold text-slate-700 shrink-0", children: key }), _jsx("span", { children: "\u2014" }), _jsxs("a", { href: href, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-0.5 hover:text-blue-600 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded", children: [label, _jsx(ExternalLink, { className: "h-3 w-3 shrink-0", "aria-hidden": "true" })] })] }, key))) })] }), _jsx(StepCard, { number: 2, title: "Run the connector from that same machine", description: "Replace the placeholders with your GitHub org, repo name, and Jira board ID. The connector fetches activity, runs AI analysis, and pushes the report here.", children: _jsx(CopyBlock, { label: "Terminal", text: runCommand, buttonTestId: "copy-button" }) }), _jsx(StepCard, { number: 3, title: "Waiting for your first connection", description: "The connector will check in automatically once it runs successfully.", done: isActive, children: _jsx("div", { "data-testid": "polling-status", className: [
                        'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                        isActive
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600',
                    ].join(' '), role: "status", "aria-live": "polite", children: isActive ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "h-5 w-5 flex-shrink-0 text-green-500", "aria-hidden": "true" }), _jsx("span", { className: "text-sm font-medium", children: "Connector connected! Your reports are ready." })] })) : (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-5 w-5 flex-shrink-0 animate-spin text-blue-500", "aria-label": "Waiting for first report", "aria-hidden": "true" }), _jsx("span", { className: "text-sm", children: "Waiting for connector to run\u2026" })] })) }) })] }));
}
