import type { RiskPayload } from '@rdpulse/types'
import { RiskSeverityChart } from './RiskSeverityChart'
import { RiskTypeChart } from './RiskTypeChart'

interface Props {
  risks: RiskPayload[]
}

export function ChartsRow({ risks }: Props) {
  if (!risks.length) return null

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Risk Severity</h2>
          <p className="mt-0.5 text-xs text-slate-400">How urgent are the open issues?</p>
        </div>
        <RiskSeverityChart risks={risks} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Issues by Source</h2>
          <p className="mt-0.5 text-xs text-slate-400">Where are issues coming from?</p>
        </div>
        <RiskTypeChart risks={risks} />
      </div>
    </div>
  )
}
