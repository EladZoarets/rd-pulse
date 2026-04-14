import { useEffect, useState } from 'react'
import type { WorkspaceCreateResponse } from '@rdpulse/types'
import { useCreateWorkspace } from '../../hooks/useCreateWorkspace'
import { AlertCircle } from 'lucide-react'

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
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Name your workspace</h2>
      <p className="text-sm text-slate-500 mb-6">
        Usually your team or org name — e.g. "Acme Backend" or "Platform Team".
      </p>

      <form data-testid="setup-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="workspace-name"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Workspace name
          </label>
          <input
            id="workspace-name"
            data-testid="setup-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Backend"
            autoFocus
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {isError && (
          <div
            data-testid="setup-error"
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            {error?.message ?? 'Something went wrong. Please try again.'}
          </div>
        )}

        <button
          data-testid={isPending ? 'setup-submitting' : 'setup-submit'}
          type="submit"
          disabled={!name.trim() || isPending}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {isPending ? 'Creating…' : 'Create Workspace →'}
        </button>
      </form>
    </div>
  )
}
