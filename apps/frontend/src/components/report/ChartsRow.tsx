import type { RiskPayload } from '@rdpulse/types'
import type { ActiveFilter } from './types'
import { RiskSeverityChart } from './RiskSeverityChart'
import { RiskTypeChart } from './RiskTypeChart'

interface Props {
  risks: RiskPayload[]
  activeFilter: ActiveFilter
  onFilterChange: (f: ActiveFilter) => void
}

export function ChartsRow({ risks, activeFilter, onFilterChange }: Props) {
  if (!risks.length) return null

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Risk Severity</h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-400">How urgent are the open issues?</p>
        <RiskSeverityChart
          risks={risks}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Issues by Source</h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-400">Where are issues coming from?</p>
        <RiskTypeChart
          risks={risks}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />
      </div>
    </div>
  )
}
