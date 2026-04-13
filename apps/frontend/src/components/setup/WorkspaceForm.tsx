import { useEffect, useState } from 'react'
import type { WorkspaceCreateResponse } from '@rdpulse/types'
import { useCreateWorkspace } from '../../hooks/useCreateWorkspace'

interface Props {
  onSuccess: (workspace: WorkspaceCreateResponse) => void
}

export function WorkspaceForm({ onSuccess }: Props) {
  const [name, setName] = useState('')
  const { mutate, isPending, isError, error, isSuccess, data } = useCreateWorkspace()

  useEffect(() => {
    if (isSuccess && data) {
      onSuccess(data)
    }
  }, [isSuccess, data, onSuccess])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate({ name })
  }

  return (
    <form data-testid="setup-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="workspace-name" className="mb-1.5 block text-sm font-medium text-slate-700">
          Workspace Name
        </label>
        <input
          id="workspace-name"
          data-testid="setup-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Backend"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {isError && (
        <p data-testid="setup-error" className="text-sm text-red-600">
          {error?.message ?? 'Something went wrong. Please try again.'}
        </p>
      )}

      <button
        data-testid={isPending ? 'setup-submitting' : 'setup-submit'}
        type="submit"
        disabled={!name.trim() || isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create Workspace'}
      </button>
    </form>
  )
}
