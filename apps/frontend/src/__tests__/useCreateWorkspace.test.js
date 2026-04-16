import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useCreateWorkspace } from '../hooks/useCreateWorkspace';
import { api } from '../api';
vi.mock('../api', () => ({
    api: {
        createWorkspace: vi.fn(),
    },
}));
function makeWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children);
}
describe('useCreateWorkspace', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('calls api.createWorkspace with the provided payload', async () => {
        const mockResponse = {
            workspaceId: 'ws-123',
            name: 'My Team',
            status: 'pending_connection',
            licenseJwt: 'jwt-abc',
        };
        vi.mocked(api.createWorkspace).mockResolvedValue(mockResponse);
        const { result } = renderHook(() => useCreateWorkspace(), { wrapper: makeWrapper() });
        act(() => {
            result.current.mutate({ name: 'My Team' });
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(api.createWorkspace).toHaveBeenCalledOnce();
        expect(api.createWorkspace).toHaveBeenCalledWith({ name: 'My Team' });
        expect(result.current.data).toEqual(mockResponse);
    });
    it('exposes error when api.createWorkspace rejects', async () => {
        vi.mocked(api.createWorkspace).mockRejectedValue(new Error('Network error'));
        const { result } = renderHook(() => useCreateWorkspace(), { wrapper: makeWrapper() });
        act(() => {
            result.current.mutate({ name: 'My Team' });
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toBe('Network error');
    });
    it('isPending is true while mutation is in flight', async () => {
        let resolve;
        vi.mocked(api.createWorkspace).mockReturnValue(new Promise((r) => { resolve = r; }));
        const { result } = renderHook(() => useCreateWorkspace(), { wrapper: makeWrapper() });
        act(() => {
            result.current.mutate({ name: 'My Team' });
        });
        await waitFor(() => expect(result.current.isPending).toBe(true));
        act(() => {
            resolve({ workspaceId: 'ws-1', name: 'My Team', status: 'pending_connection', licenseJwt: 'jwt' });
        });
        await waitFor(() => expect(result.current.isPending).toBe(false));
    });
});
