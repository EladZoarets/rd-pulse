import { useEffect, useState } from 'react'
import { CheckCircle, Copy, Loader2, ExternalLink } from 'lucide-react'
import type { WorkspaceCreateResponse } from '@rdpulse/types'
import { useWorkspaceStatus } from '../../hooks/useWorkspace'

interface Props {
  workspace: WorkspaceCreateResponse
  onActive: () => void
}

function CopyBlock({
  label,
  text,
  testId,
  buttonTestId,
}: {
  label: string
  text: string
  testId?: string
  buttonTestId?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
        <span className="text-xs font-medium text-slate-400 tracking-wide">{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          data-testid={buttonTestId}
          aria-label={`Copy ${label} to clipboard`}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {copied ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-green-400" aria-hidden="true" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre
        data-testid={testId}
        className="overflow-x-auto px-4 py-4 text-sm text-slate-100 font-mono whitespace-pre leading-relaxed"
      >
        {text}
      </pre>
    </div>
  )
}

interface StepCardProps {
  number: number
  title: string
  description: string
  children: React.ReactNode
  done?: boolean
}

function StepCard({ number, title, description, children, done = false }: StepCardProps) {
  return (
    <div
      className={[
        'rounded-2xl border p-6 transition-colors',
        done
          ? 'border-green-200 bg-green-50/50'
          : 'border-slate-200 bg-white shadow-sm',
      ].join(' ')}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={[
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
            done
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white',
          ].join(' ')}
          aria-hidden="true"
        >
          {done ? <CheckCircle className="h-4.5 w-4.5" /> : number}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 leading-snug">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="ml-12 space-y-3">
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

  const runCommand = `npx rdpulse-connector pulse --owner your-org --repo your-repo --board 42`

  return (
    <div className="space-y-4">
      <StepCard
        number={1}
        title="Create a .env file in your project directory"
        description="Place this file in the same directory where you'll run the connector command. The top three lines are pre-filled with your workspace credentials."
      >
        <CopyBlock label=".env" text={envBlock} testId="install-command" />
        <div className="grid grid-cols-1 gap-1.5 pt-1">
          {[
            {
              key: 'GITHUB_TOKEN',
              label: 'github.com/settings/tokens → New classic token → repo scope',
              href: 'https://github.com/settings/tokens',
            },
            {
              key: 'OPENAI_API_KEY',
              label: 'platform.openai.com/api-keys',
              href: 'https://platform.openai.com/api-keys',
            },
            {
              key: 'JIRA_TOKEN',
              label: 'id.atlassian.com → Security → API tokens',
              href: 'https://id.atlassian.com/manage-profile/security/api-tokens',
            },
          ].map(({ key, label, href }) => (
            <div key={key} className="flex items-start gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 shrink-0">{key}</span>
              <span>—</span>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 hover:text-blue-600 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                {label}
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
            </div>
          ))}
        </div>
      </StepCard>

      <StepCard
        number={2}
        title="Run the connector from that same machine"
        description="Replace the placeholders with your GitHub org, repo name, and Jira board ID. The connector fetches activity, runs AI analysis, and pushes the report here."
      >
        <CopyBlock label="Terminal" text={runCommand} buttonTestId="copy-button" />
      </StepCard>

      <StepCard
        number={3}
        title="Waiting for your first connection"
        description="The connector will check in automatically once it runs successfully."
        done={isActive}
      >
        <div
          data-testid="polling-status"
          className={[
            'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
            isActive
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-slate-200 bg-slate-50 text-slate-600',
          ].join(' ')}
          role="status"
          aria-live="polite"
        >
          {isActive ? (
            <>
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" aria-hidden="true" />
              <span className="text-sm font-medium">Connector connected! Your reports are ready.</span>
            </>
          ) : (
            <>
              <Loader2
                className="h-5 w-5 flex-shrink-0 animate-spin text-blue-500"
                aria-label="Waiting for first report"
                aria-hidden="true"
              />
              <span className="text-sm">Waiting for connector to run…</span>
            </>
          )}
        </div>
      </StepCard>
    </div>
  )
}
