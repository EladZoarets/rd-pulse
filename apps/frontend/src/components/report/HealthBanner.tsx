import type { ReportDetail } from '@rdpulse/types'
import { formatDate, formatRelative } from '../../utils/formatDate'
import { RefreshCw } from 'lucide-react'

interface Props {
  report: ReportDetail
}

const HEALTH_CONFIG: Record<string, { border: string; pill: string; label: string; icon: string }> = {
  critical: {
    border: 'border-l-red-500',
    pill: 'bg-red-100 text-red-800',
    label: 'Critical',
    icon: '🔴',
  },
  at_risk: {
    border: 'border-l-amber-400',
    pill: 'bg-amber-100 text-amber-800',
    label: 'At Risk',
    icon: '🟡',
  },
  good: {
    border: 'border-l-green-500',
    pill: 'bg-green-100 text-green-800',
    label: 'Good',
    icon: '🟢',
  },
}

export function HealthBanner({ report }: Props) {
  const { health } = report.summary
  const cfg = HEALTH_CONFIG[health] ?? HEALTH_CONFIG.good

  return (
    <div
      data-testid="health-banner"
      className={`mb-6 rounded-2xl border border-slate-200 border-l-4 ${cfg.border} bg-white p-6 shadow-sm`}
    >
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>{report.workspaceId}</span>
        <span>{formatDate(report.windowStart)} → {formatDate(report.windowEnd)}</span>
      </div>

      <div className="mb-3 mt-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${cfg.pill}`}>
          <span aria-hidden="true">{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>

      <h1 className="mb-4 text-2xl font-bold leading-snug text-slate-900">
        {report.summary.headline}
      </h1>

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
