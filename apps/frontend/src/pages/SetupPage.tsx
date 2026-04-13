import { useState } from 'react'
import type { WorkspaceCreateResponse } from '@rdpulse/types'
import { AppShell } from '../components/layout/AppShell'
import { PageContainer } from '../components/layout/PageContainer'
import { WorkspaceForm } from '../components/setup/WorkspaceForm'
import { ConnectorInstallStep } from '../components/setup/ConnectorInstallStep'
import { WorkspaceActiveStep } from '../components/setup/WorkspaceActiveStep'

type Step = 'form' | 'connecting' | 'active'

export function SetupPage() {
  const [step, setStep] = useState<Step>('form')
  const [workspace, setWorkspace] = useState<WorkspaceCreateResponse | null>(null)

  function handleWorkspaceCreated(ws: WorkspaceCreateResponse) {
    setWorkspace(ws)
    setStep('connecting')
  }

  return (
    <AppShell>
      <PageContainer className="max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Set up your workspace</h1>
          <p className="mt-1 text-sm text-slate-500">
            Connect rd-pulse to your GitHub org in a few steps.
          </p>
        </div>

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
