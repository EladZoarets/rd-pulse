import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SetupPage } from '../pages/SetupPage';
import { api } from '../api';
vi.mock('../api', () => ({
    api: { createWorkspace: vi.fn() },
}));
vi.mock('../hooks/useWorkspace', () => ({
    useWorkspaceStatus: vi.fn(),
}));
import { useWorkspaceStatus } from '../hooks/useWorkspace';
const mockWorkspace = {
    workspaceId: 'ws-abc',
    name: 'Test Team',
    status: 'pending_connection',
    licenseJwt: 'jwt-xyz',
};
const pendingStatus = {
    workspaceId: 'ws-abc',
    status: 'pending_connection',
    lastHeartbeatAt: null,
};
const activeStatus = {
    workspaceId: 'ws-abc',
    status: 'active',
    lastHeartbeatAt: '2026-04-13T10:00:00Z',
};
function renderSetupPage() {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return render(_jsx(QueryClientProvider, { client: queryClient, children: _jsx(MemoryRouter, { initialEntries: ['/setup'], children: _jsx(SetupPage, {}) }) }));
}
describe('SetupPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useWorkspaceStatus).mockReturnValue({ data: pendingStatus });
    });
    it('renders the workspace form on initial load', () => {
        renderSetupPage();
        expect(screen.getByTestId('setup-form')).toBeInTheDocument();
        expect(screen.queryByTestId('install-command')).not.toBeInTheDocument();
        expect(screen.queryByTestId('workspace-active')).not.toBeInTheDocument();
    });
    it('transitions to connecting step after successful workspace creation', async () => {
        vi.mocked(api.createWorkspace).mockResolvedValue(mockWorkspace);
        const user = userEvent.setup();
        renderSetupPage();
        await user.type(screen.getByTestId('setup-name-input'), 'Test Team');
        await user.click(screen.getByTestId('setup-submit'));
        await waitFor(() => expect(screen.getByTestId('install-command')).toBeInTheDocument());
        expect(screen.queryByTestId('setup-form')).not.toBeInTheDocument();
    });
    it('install command contains workspaceId and licenseJwt', async () => {
        vi.mocked(api.createWorkspace).mockResolvedValue(mockWorkspace);
        const user = userEvent.setup();
        renderSetupPage();
        await user.type(screen.getByTestId('setup-name-input'), 'Test Team');
        await user.click(screen.getByTestId('setup-submit'));
        await waitFor(() => expect(screen.getByTestId('install-command')).toBeInTheDocument());
        const cmd = screen.getByTestId('install-command');
        expect(cmd).toHaveTextContent('ws-abc');
        expect(cmd).toHaveTextContent('jwt-xyz');
    });
    it('transitions to active step when polling returns active status', async () => {
        vi.mocked(api.createWorkspace).mockResolvedValue(mockWorkspace);
        // Return active immediately to simulate heartbeat already received
        vi.mocked(useWorkspaceStatus).mockReturnValue({ data: activeStatus });
        const user = userEvent.setup();
        renderSetupPage();
        await user.type(screen.getByTestId('setup-name-input'), 'Test Team');
        await user.click(screen.getByTestId('setup-submit'));
        await waitFor(() => expect(screen.getByTestId('workspace-active')).toBeInTheDocument());
        expect(screen.queryByTestId('install-command')).not.toBeInTheDocument();
    });
    it('active step contains a link to /reports', async () => {
        vi.mocked(api.createWorkspace).mockResolvedValue(mockWorkspace);
        vi.mocked(useWorkspaceStatus).mockReturnValue({ data: activeStatus });
        const user = userEvent.setup();
        renderSetupPage();
        await user.type(screen.getByTestId('setup-name-input'), 'Test Team');
        await user.click(screen.getByTestId('setup-submit'));
        await waitFor(() => expect(screen.getByTestId('workspace-active')).toBeInTheDocument());
        expect(screen.getByRole('link', { name: /view reports/i })).toHaveAttribute('href', '/reports');
    });
});
