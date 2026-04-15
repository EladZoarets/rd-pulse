import type { ReportDetail } from '@rdpulse/types'
import { formatDate, formatRelative } from '../../utils/formatDate'
import { RefreshCw } from 'lucide-react'

interface Props {
  report: ReportDetail
}

// Left border accent color per health status
const BORDER_COLOR: Record<string, string> = {
  critical: 'border-red-500',
  at_risk: 'border-amber-400',
  good: 'border-green-500',
}

// Pill styles — always readable, never white-on-color
const PILL_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  at_risk: 'bg-amber-100 text-amber-700',
  good: 'bg-green-100 text-green-700',
}

const HEALTH_LABEL: Record<string, string> = {
  critical: 'Critical',
  at_risk: 'At Risk',
  good: 'Good',
}

export function HealthBanner({ report }: Props) {
  const { health } = report.summary
  const border = BORDER_COLOR[health] ?? BORDER_COLOR.good
  const pill = PILL_STYLES[health] ?? PILL_STYLES.good

  return (
    <div
      data-testid="health-banner"
      className={`mb-6 rounded-2xl border-l-4 border border-slate-200 bg-white p-6 shadow-sm ${border}`}
    >
      {/* Top row: workspace + date range */}
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <span>{report.workspaceId}</span>
        <span>{formatDate(report.windowStart)} → {formatDate(report.windowEnd)}</span>
      </div>

      {/* Health pill */}
      <div className="mb-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${pill}`}>
          {HEALTH_LABEL[health] ?? health}
        </span>
      </div>

      {/* Headline — always dark text, always readable */}
      <h1 className="mb-4 text-2xl font-bold leading-snug text-slate-900">
        {report.summary.headline}
      </h1>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span>Generated {formatDate(report.generatedAt)}</span>
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Synced {formatRelative(report.lastSyncedAt)}
        </span>
        <span>Run #{report.runCount}</span>
      </div>
    </div>
  )
}
