import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
export function useCreateWorkspace() {
    return useMutation({
        mutationFn: (req) => api.createWorkspace(req),
    });
}
