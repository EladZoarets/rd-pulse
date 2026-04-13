import { useMutation } from '@tanstack/react-query'
import { api } from '../api'
import type { WorkspaceCreateRequest, WorkspaceCreateResponse } from '@rdpulse/types'

export function useCreateWorkspace() {
  return useMutation<WorkspaceCreateResponse, Error, WorkspaceCreateRequest>({
    mutationFn: (req) => api.createWorkspace(req),
  })
}
