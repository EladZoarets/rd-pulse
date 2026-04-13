import type { ReportDetail } from '@rdpulse/types'
import { HealthBadge } from '../ui/HealthBadge'
import { formatDate, formatRelative } from '../../utils/formatDate'
import { RefreshCw } from 'lucide-react'

interface Props {
  report: ReportDetail
}

export function ReportHeader({ report }: Props) {
  return (
    <div
      data-testid="report-header"
      className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span>{report.workspaceId}</span>
        <span>{formatDate(report.windowStart)} → {formatDate(report.windowEnd)}</span>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <HealthBadge health={report.summary.health} size="lg" />
      </div>

      <h1 className="mb-4 text-2xl font-bold text-slate-900">{report.summary.headline}</h1>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>Generated {formatDate(report.generatedAt)}</span>
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Synced {formatRelative(report.lastSyncedAt)}
        </span>
        <span>Run #{report.runCount}</span>
      </div>
    </div>
  )
}
