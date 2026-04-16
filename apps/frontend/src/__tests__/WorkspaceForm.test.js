import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { WorkspaceForm } from '../components/setup/WorkspaceForm';
import { api } from '../api';
vi.mock('../api', () => ({
    api: {
        createWorkspace: vi.fn(),
    },
}));
function renderForm(onSuccess = vi.fn()) {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return render(createElement(QueryClientProvider, { client: queryClient }, createElement(WorkspaceForm, { onSuccess })));
}
describe('WorkspaceForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('renders form with input and disabled submit button when blank', () => {
        renderForm();
        expect(screen.getByTestId('setup-form')).toBeInTheDocument();
        expect(screen.getByTestId('setup-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('setup-submit')).toBeDisabled();
    });
    it('enables submit button when name is non-empty', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByTestId('setup-name-input'), 'My Team');
        expect(screen.getByTestId('setup-submit')).toBeEnabled();
    });
    it('keeps submit disabled when input is only whitespace', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByTestId('setup-name-input'), '   ');
        expect(screen.getByTestId('setup-submit')).toBeDisabled();
    });
    it('calls api.createWorkspace with trimmed name on submit', async () => {
        const mockWorkspace = { workspaceId: 'ws-1', name: 'My Team', status: 'pending_connection', licenseJwt: 'jwt' };
        vi.mocked(api.createWorkspace).mockResolvedValue(mockWorkspace);
        const user = userEvent.setup();
        const onSuccess = vi.fn();
        renderForm(onSuccess);
        await user.type(screen.getByTestId('setup-name-input'), 'My Team');
        await user.click(screen.getByTestId('setup-submit'));
        await waitFor(() => expect(api.createWorkspace).toHaveBeenCalledWith({ name: 'My Team' }));
    });
    it('calls onSuccess with workspace data after successful creation', async () => {
        const mockWorkspace = { workspaceId: 'ws-1', name: 'My Team', status: 'pending_connection', licenseJwt: 'jwt' };
        vi.mocked(api.createWorkspace).mockResolvedValue(mockWorkspace);
        const user = userEvent.setup();
        const onSuccess = vi.fn();
        renderForm(onSuccess);
        await user.type(screen.getByTestId('setup-name-input'), 'My Team');
        await user.click(screen.getByTestId('setup-submit'));
        await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(mockWorkspace));
    });
    it('shows setup-submitting testid while pending', async () => {
        let resolve;
        vi.mocked(api.createWorkspace).mockReturnValue(new Promise((r) => { resolve = r; }));
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByTestId('setup-name-input'), 'My Team');
        await user.click(screen.getByTestId('setup-submit'));
        await waitFor(() => expect(screen.getByTestId('setup-submitting')).toBeInTheDocument());
        resolve({ workspaceId: 'ws-1', name: 'My Team', status: 'pending_connection', licenseJwt: 'jwt' });
    });
    it('shows error message when api.createWorkspace rejects', async () => {
        vi.mocked(api.createWorkspace).mockRejectedValue(new Error('Server error'));
        const user = userEvent.setup();
        renderForm();
        await user.type(screen.getByTestId('setup-name-input'), 'My Team');
        await user.click(screen.getByTestId('setup-submit'));
        await waitFor(() => expect(screen.getByTestId('setup-error')).toBeInTheDocument());
        expect(screen.getByTestId('setup-error')).toHaveTextContent('Server error');
    });
});
