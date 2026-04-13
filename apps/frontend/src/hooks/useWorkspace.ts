import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { WorkspaceStatusResponse } from '@rdpulse/types'

export function useWorkspaceStatus(workspaceId: string, enabled = true) {
  return useQuery<WorkspaceStatusResponse, Error>({
    queryKey: ['workspace-status', workspaceId],
    queryFn: () => api.getWorkspaceStatus(workspaceId),
    enabled: Boolean(workspaceId) && enabled,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'active' ? false : 3_000
    },
  })
}
