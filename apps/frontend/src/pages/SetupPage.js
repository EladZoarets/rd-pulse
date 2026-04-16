import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { WorkspaceForm } from '../components/setup/WorkspaceForm';
import { ConnectorInstallStep } from '../components/setup/ConnectorInstallStep';
import { WorkspaceActiveStep } from '../components/setup/WorkspaceActiveStep';
import { SetupStepper } from '../components/setup/SetupStepper';
import { useWorkspaceStatus } from '../hooks/useWorkspace';
const STEPS = [
    { label: 'Create workspace' },
    { label: 'Install connector' },
    { label: 'Live' },
];
const STEP_INDEX = {
    form: 0,
    connecting: 1,
    active: 2,
};
// Shows a banner when localStorage already has an active workspace so the
// user can jump to reports without repeating setup — but doesn't block them
// from creating a new workspace if they want.
function ActiveWorkspaceBanner({ workspaceId }) {
    const { data } = useWorkspaceStatus(workspaceId);
    if (data?.status !== 'active')
        return null;
    return (_jsxs("div", { className: "mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-green-700", children: [_jsx(CheckCircle, { className: "h-4 w-4 shrink-0", "aria-hidden": "true" }), _jsx("span", { children: "You already have an active workspace." })] }), _jsx(Link, { to: `/reports?workspaceId=${workspaceId}`, className: "text-sm font-semibold text-green-700 underline underline-offset-2 hover:text-green-900", children: "View Reports \u2192" })] }));
}
export function SetupPage() {
    const [step, setStep] = useState('form');
    const [workspace, setWorkspace] = useState(null);
    const storedWorkspaceId = localStorage.getItem('workspaceId') ?? '';
    function handleWorkspaceCreated(ws) {
        localStorage.setItem('workspaceId', ws.workspaceId);
        setWorkspace(ws);
        setStep('connecting');
    }
    return (_jsx(AppShell, { children: _jsxs(PageContainer, { className: "max-w-2xl py-12", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Set up your workspace" }), _jsx("p", { className: "mt-1.5 text-sm text-slate-500", children: "Connect rd-pulse to your GitHub org in a few steps." })] }), step === 'form' && storedWorkspaceId && (_jsx(ActiveWorkspaceBanner, { workspaceId: storedWorkspaceId })), _jsx(SetupStepper, { steps: STEPS, current: STEP_INDEX[step] }), step === 'form' && (_jsx(WorkspaceForm, { onSuccess: handleWorkspaceCreated })), step === 'connecting' && workspace && (_jsx(ConnectorInstallStep, { workspace: workspace, onActive: () => setStep('active') })), step === 'active' && (_jsx(WorkspaceActiveStep, {}))] }) }));
}
