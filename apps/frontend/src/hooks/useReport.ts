import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { ReportDetail } from '@rdpulse/types'

export function useReport(id: string) {
  return useQuery<ReportDetail, Error>({
    queryKey: ['report', id],
    queryFn: () => api.getReport(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  })
}
