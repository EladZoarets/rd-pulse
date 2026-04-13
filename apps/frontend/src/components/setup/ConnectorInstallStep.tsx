import { useEffect, useState } from 'react'
import { CheckCircle, Copy, Loader2 } from 'lucide-react'
import type { WorkspaceCreateResponse } from '@rdpulse/types'
import { useWorkspaceStatus } from '../../hooks/useWorkspace'

interface Props {
  workspace: WorkspaceCreateResponse
  onActive: () => void
}

function CopyBlock({ label, text, testId }: { label: string; text: string; testId?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <button
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
      <pre data-testid={testId} className="overflow-x-auto px-4 py-3 text-sm text-slate-100 font-mono whitespace-pre">
        {text}
      </pre>
    </div>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center mt-0.5">
        {number}
      </div>
      <div className="flex-1 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {children}
      </div>
    </div>
  )
}

export function ConnectorInstallStep({ workspace, onActive }: Props) {
  const { data: status } = useWorkspaceStatus(workspace.workspaceId)
  const isActive = status?.status === 'active'

  useEffect(() => {
    if (isActive) onActive()
  }, [isActive, onActive])

  const envBlock = `# rd-pulse credentials (pre-filled)
RDPULSE_SERVER=https://rdpulse-backend-production.up.railway.app
WORKSPACE_ID=${workspace.workspaceId}
RDPULSE_JWT=${workspace.licenseJwt}

# Your API keys
GITHUB_TOKEN=ghp_...
OPENAI_API_KEY=sk-proj-...
JIRA_DOMAIN=https://your-org.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_TOKEN=...`

  const runCommand = `npx rdpulse-connector pulse --owner YOUR_ORG --repo YOUR_REPO --board YOUR_BOARD_ID`

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Connect the connector</h2>
        <p className="mt-1 text-sm text-slate-500">
          Three steps to get your first report.
        </p>
      </div>

      <div className="space-y-8">
        <Step number={1} title="Create a .env file in your repo">
          <p className="text-sm text-slate-500">
            The top three lines are pre-filled with your workspace credentials. Fill in the rest with your own API keys.
          </p>
          <CopyBlock label=".env" text={envBlock} testId="install-command" />
          <div className="space-y-1 text-xs text-slate-400">
            <p><span className="font-medium text-slate-600">GITHUB_TOKEN</span> — github.com/settings/tokens → New token (classic) → repo scope</p>
            <p><span className="font-medium text-slate-600">OPENAI_API_KEY</span> — platform.openai.com/api-keys</p>
            <p><span className="font-medium text-slate-600">JIRA_TOKEN</span> — id.atlassian.com/manage-profile/security/api-tokens</p>
          </div>
        </Step>

        <Step number={2} title="Run your first report">
          <p className="text-sm text-slate-500">
            Replace <code className="bg-slate-100 px-1 rounded text-xs">YOUR_ORG</code>, <code className="bg-slate-100 px-1 rounded text-xs">YOUR_REPO</code>, and <code className="bg-slate-100 px-1 rounded text-xs">YOUR_BOARD_ID</code> with your GitHub org, repo name, and Jira board ID.
          </p>
          <CopyBlock label="Terminal" text={runCommand} />
        </Step>

        <Step number={3} title="Waiting for your first connection">
          <div data-testid="polling-status" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            {isActive ? (
              <>
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span className="text-sm font-medium text-green-700">Connector connected! Your reports are ready.</span>
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-blue-500" />
                <span className="text-sm text-slate-600">Waiting for the connector to run…</span>
              </>
            )}
          </div>
        </Step>
      </div>
    </div>
  )
}
