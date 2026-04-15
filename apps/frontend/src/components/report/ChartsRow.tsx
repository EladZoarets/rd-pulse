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
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
          Risk Severity
        </h2>
        <RiskSeverityChart risks={risks} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
          Issue Types
        </h2>
        <RiskTypeChart risks={risks} />
      </div>
    </div>
  )
}
