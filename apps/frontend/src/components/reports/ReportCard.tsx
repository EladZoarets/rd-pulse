import { Link } from 'react-router-dom'
import type { ReportListItem } from '@rdpulse/types'
import { HealthBadge } from '../ui/HealthBadge'
import { formatRelative } from '../../utils/formatDate'

interface Props {
  report: ReportListItem
}

export function ReportCard({ report }: Props) {
  return (
    <Link
      data-testid="report-card"
      to={`/report/${report.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{report.headline}</p>
          <p className="mt-1 text-xs text-slate-400">{formatRelative(report.generatedAt)}</p>
        </div>
        <HealthBadge health={report.health} size="sm" />
      </div>
    </Link>
  )
}
