import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
export function useReports(workspaceId) {
    return useQuery({
        queryKey: ['reports', workspaceId],
        queryFn: () => api.getReports(workspaceId),
        enabled: Boolean(workspaceId),
        staleTime: 30000,
    });
}
