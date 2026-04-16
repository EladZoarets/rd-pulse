import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
export function useWorkspaceStatus(workspaceId, enabled = true) {
    return useQuery({
        queryKey: ['workspace-status', workspaceId],
        queryFn: () => api.getWorkspaceStatus(workspaceId),
        enabled: Boolean(workspaceId) && enabled,
        staleTime: 0,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'active' ? false : 3000;
        },
    });
}
