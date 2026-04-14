import { useState } from 'react'
import type { WorkspaceCreateResponse } from '@rdpulse/types'
import { AppShell } from '../components/layout/AppShell'
import { PageContainer } from '../components/layout/PageContainer'
import { WorkspaceForm } from '../components/setup/WorkspaceForm'
import { ConnectorInstallStep } from '../components/setup/ConnectorInstallStep'
import { WorkspaceActiveStep } from '../components/setup/WorkspaceActiveStep'
import { SetupStepper } from '../components/setup/SetupStepper'

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

export function SetupPage() {
  const [step, setStep] = useState<Step>('form')
  const [workspace, setWorkspace] = useState<WorkspaceCreateResponse | null>(null)

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
