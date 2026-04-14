import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import type { WorkspaceCreateResponse } from '@rdpulse/types'
import { AppShell } from '../components/layout/AppShell'
import { PageContainer } from '../components/layout/PageContainer'
import { WorkspaceForm } from '../components/setup/WorkspaceForm'
import { ConnectorInstallStep } from '../components/setup/ConnectorInstallStep'
import { WorkspaceActiveStep } from '../components/setup/WorkspaceActiveStep'
import { SetupStepper } from '../components/setup/SetupStepper'
import { useWorkspaceStatus } from '../hooks/useWorkspace'

type Step = 'form' | 'connecting' | 'active'

const STEPS = [
  { label: 'Create workspace' },
  { label: 'Install connector' },
  { label: 'Live' },
]

const STEP_INDEX: Record<Step, number> = {
  form: 0,
  connecting: 1,
  active: 2,
}

// Shows a banner when localStorage already has an active workspace so the
// user can jump to reports without repeating setup — but doesn't block them
// from creating a new workspace if they want.
function ActiveWorkspaceBanner({ workspaceId }: { workspaceId: string }) {
  const { data } = useWorkspaceStatus(workspaceId)
  if (data?.status !== 'active') return null
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>You already have an active workspace.</span>
      </div>
      <Link
        to={`/reports?workspaceId=${workspaceId}`}
        className="text-sm font-semibold text-green-700 underline underline-offset-2 hover:text-green-900"
      >
        View Reports →
      </Link>
    </div>
  )
}

export function SetupPage() {
  const [step, setStep] = useState<Step>('form')
  const [workspace, setWorkspace] = useState<WorkspaceCreateResponse | null>(null)
  const storedWorkspaceId = localStorage.getItem('workspaceId') ?? ''

  function handleWorkspaceCreated(ws: WorkspaceCreateResponse) {
    localStorage.setItem('workspaceId', ws.workspaceId)
    setWorkspace(ws)
    setStep('connecting')
  }

  return (
    <AppShell>
      <PageContainer className="max-w-2xl py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Set up your workspace</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Connect rd-pulse to your GitHub org in a few steps.
          </p>
        </div>

        {step === 'form' && storedWorkspaceId && (
          <ActiveWorkspaceBanner workspaceId={storedWorkspaceId} />
        )}

        <SetupStepper steps={STEPS} current={STEP_INDEX[step]} />

        {step === 'form' && (
          <WorkspaceForm onSuccess={handleWorkspaceCreated} />
        )}

        {step === 'connecting' && workspace && (
          <ConnectorInstallStep
            workspace={workspace}
            onActive={() => setStep('active')}
          />
        )}

        {step === 'active' && (
          <WorkspaceActiveStep />
        )}
      </PageContainer>
    </AppShell>
  )
}
