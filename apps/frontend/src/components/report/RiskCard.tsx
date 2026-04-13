import type { RiskPayload } from '@rdpulse/types'
import { SeverityBadge } from '../ui/SeverityBadge'
import { ExternalLink } from 'lucide-react'

interface Props {
  risk: RiskPayload
}

export function RiskCard({ risk }: Props) {
  return (
    <div
      data-testid="risk-card"
      className={`rounded-lg bg-white p-4 shadow-sm border-l-4 ${
        risk.severity === 'high'
          ? 'border-red-500'
          : risk.severity === 'medium'
          ? 'border-amber-500'
          : 'border-blue-500'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <SeverityBadge severity={risk.severity} />
        <span className="font-semibold text-slate-900">{risk.title}</span>
      </div>
      <p className="mb-3 text-sm text-slate-600 line-clamp-2">{risk.description}</p>
      {risk.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {risk.links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              data-testid="risk-link"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
