import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { ReportListResponse } from '@rdpulse/types'

export function useReports(workspaceId: string) {
  return useQuery<ReportListResponse, Error>({
    queryKey: ['reports', workspaceId],
    queryFn: () => api.getReports(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 30_000,
  })
}
