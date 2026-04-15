import type { ReportDetail } from '@rdpulse/types'
import { formatDate, formatRelative } from '../../utils/formatDate'
import { RefreshCw } from 'lucide-react'

interface Props {
  report: ReportDetail
}

const HEALTH_STYLES: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  at_risk: 'bg-amber-500 text-white',
  good: 'bg-green-50 border border-green-200 text-green-900',
}

const HEALTH_LABEL: Record<string, string> = {
  critical: 'Critical',
  at_risk: 'At Risk',
  good: 'Good',
}

const HEALTH_DOT: Record<string, string> = {
  critical: 'bg-red-200',
  at_risk: 'bg-amber-200',
  good: 'bg-green-400',
}

export function HealthBanner({ report }: Props) {
  const { health } = report.summary
  const bannerStyle = HEALTH_STYLES[health] ?? HEALTH_STYLES.good

  return (
    <div
      data-testid="health-banner"
      className={`mb-6 rounded-2xl p-6 ${bannerStyle}`}
    >
      {/* Top row: workspace + date range */}
      <div className="mb-3 flex items-center justify-between text-xs opacity-70">
        <span>{report.workspaceId}</span>
        <span>{formatDate(report.windowStart)} → {formatDate(report.windowEnd)}</span>
      </div>

      {/* Health pill */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            health === 'good'
              ? 'bg-green-100 text-green-800'
              : 'bg-white/20 text-inherit'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${HEALTH_DOT[health] ?? 'bg-white'}`} aria-hidden="true" />
          {HEALTH_LABEL[health] ?? health}
        </span>
      </div>

      {/* Headline */}
      <h1 className="mb-4 text-2xl font-bold leading-snug">{report.summary.headline}</h1>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 text-xs opacity-60">
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
