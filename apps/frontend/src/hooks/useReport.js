import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
export function useReport(id) {
    return useQuery({
        queryKey: ['report', id],
        queryFn: () => api.getReport(id),
        enabled: Boolean(id),
        staleTime: 60000,
    });
}
