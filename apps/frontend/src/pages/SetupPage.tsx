import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

// If the user already completed setup in a previous session (workspaceId is in
// localStorage and the backend already shows it as active), redirect straight
// to /reports. Only runs on the 'form' step to avoid interfering with an
// active setup flow.
function useResumeActiveWorkspace(step: Step) {
  const storedId = step === 'form' ? (localStorage.getItem('workspaceId') ?? '') : ''
  const navigate = useNavigate()
  const { data } = useWorkspaceStatus(storedId)

  useEffect(() => {
    if (step === 'form' && data?.status === 'active' && storedId) {
      navigate(`/reports?workspaceId=${storedId}`, { replace: true })
    }
  }, [data, navigate, step])
}

export function SetupPage() {
  const [step, setStep] = useState<Step>('form')
  const [workspace, setWorkspace] = useState<WorkspaceCreateResponse | null>(null)

  useResumeActiveWorkspace(step)

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
