import { useEffect, useState } from 'react'
import { CheckCircle, Copy, Loader2 } from 'lucide-react'
import type { WorkspaceCreateResponse } from '@rdpulse/types'
import { useWorkspaceStatus } from '../../hooks/useWorkspace'

interface Props {
  workspace: WorkspaceCreateResponse
  onActive: () => void
}

export function ConnectorInstallStep({ workspace, onActive }: Props) {
  const [copied, setCopied] = useState(false)
  const { data: status } = useWorkspaceStatus(workspace.workspaceId)

  const command = `npx rdpulse-connector connect --workspace=${workspace.workspaceId} --jwt=${workspace.licenseJwt}`

  useEffect(() => {
    if (status?.status === 'active') {
      onActive()
    }
  }, [status?.status, onActive])

  async function handleCopy() {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isActive = status?.status === 'active'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Install the connector</h2>
        <p className="mt-1 text-sm text-slate-500">
          Run this command in your CI environment or on a machine with access to your GitHub org.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
          <span className="text-xs font-medium text-slate-400">Terminal</span>
          <button
            data-testid="copy-button"
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre
          data-testid="install-command"
          className="overflow-x-auto px-4 py-3 text-sm text-slate-100 font-mono"
        >
          {command}
        </pre>
      </div>

      <div data-testid="polling-status" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        {isActive ? (
          <>
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
            <span className="text-sm font-medium text-green-700">Connector connected!</span>
          </>
        ) : (
          <>
            <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-blue-500" />
            <span className="text-sm text-slate-600">Waiting for connector…</span>
          </>
        )}
      </div>
    </div>
  )
}
