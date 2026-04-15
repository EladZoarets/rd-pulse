import type { RiskPayload } from '@rdpulse/types'
import { ExternalLink } from 'lucide-react'
import { SeverityBadge } from '../ui/SeverityBadge'
import { SourceChip } from './SourceChip'
import { SectionHeading } from './SectionHeading'
import { AlertTriangle } from 'lucide-react'
import { sortBySeverity } from '../../utils/riskFilters'

interface Props {
  risks: RiskPayload[]
}

type Source = 'jira' | 'github' | 'team'

const JIRA_TYPES = new Set(['sprint_jeopardy', 'unassigned_risk', 'stall'])
const GITHUB_TYPES = new Set(['review_bottleneck', 'ghost_work'])

function detectSource(type: string): Source {
  if (JIRA_TYPES.has(type)) return 'jira'
  if (GITHUB_TYPES.has(type)) return 'github'
  return 'team'
}

export function IssuesSection({ risks }: Props) {
  if (!risks.length) return null

  const sorted = sortBySeverity(risks)

  return (
    <section data-testid="issues-section" className="mb-6">
      <SectionHeading icon={<AlertTriangle className="h-4 w-4" />}>
        Issues &amp; Signals
      </SectionHeading>
      <div className="space-y-3">
        {sorted.map((risk, i) => {
          const source = detectSource(risk.type)
          return (
            <div
              key={i}
              data-testid="issue-card"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <SeverityBadge severity={risk.severity} />
                <SourceChip source={source} />
                <span className="font-semibold text-slate-900">{risk.title}</span>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-slate-600">{risk.description}</p>
              {risk.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {risk.links.map((link, j) => (
                    <a
                      key={j}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="issue-link"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
