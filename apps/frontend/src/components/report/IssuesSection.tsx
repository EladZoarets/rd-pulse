import { X } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import type { RiskPayload } from '@rdpulse/types'
import { SeverityBadge } from '../ui/SeverityBadge'
import { SourceChip } from './SourceChip'
import type { ActiveFilter } from './types'
import { sortBySeverity } from '../../utils/riskFilters'

interface Props {
  risks: RiskPayload[]
  activeFilter: ActiveFilter
  onClearFilter: () => void
}

const JIRA_TYPES = new Set(['sprint_jeopardy', 'unassigned_risk', 'stall'])
const GITHUB_TYPES = new Set(['review_bottleneck', 'ghost_work'])

function detectSource(type: string): 'jira' | 'github' | 'team' {
  if (JIRA_TYPES.has(type)) return 'jira'
  if (GITHUB_TYPES.has(type)) return 'github'
  return 'team'
}

function filterRisks(risks: RiskPayload[], filter: ActiveFilter): RiskPayload[] {
  if (!filter) return sortBySeverity(risks)
  return sortBySeverity(risks.filter(r =>
    filter.type === 'severity'
      ? r.severity === filter.value
      : detectSource(r.type) === filter.value
  ))
}

function filterLabel(filter: ActiveFilter): string {
  if (!filter) return ''
  if (filter.type === 'severity') {
    return { high: 'High', medium: 'Medium', low: 'Low' }[filter.value] ?? filter.value
  }
  return { jira: 'Jira', github: 'GitHub', team: 'Team' }[filter.value] ?? filter.value
}

export function IssuesSection({ risks, activeFilter, onClearFilter }: Props) {
  const filtered = filterRisks(risks, activeFilter)

  return (
    <section id="issues-section" data-testid="issues-section" className="mb-6">
      {/* Heading row with active filter badge */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Issues &amp; Signals
        </h2>
        <div className="h-px flex-1 bg-slate-200" />
        {activeFilter && (
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white"
          >
            Filtered: {filterLabel(activeFilter)}
            <button
              onClick={onClearFilter}
              aria-label={`Remove ${filterLabel(activeFilter)} filter`}
              className="ml-0.5 rounded-full p-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        )}
      </div>

      {/* Issue count */}
      <p className="mb-3 text-xs text-slate-400">
        {filtered.length} {filtered.length === 1 ? 'issue' : 'issues'}
        {activeFilter ? ` matching filter` : ' total'}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 text-center">
          <p className="text-sm font-medium text-slate-500">No issues match this filter</p>
          <button onClick={onClearFilter} className="mt-2 text-xs text-blue-600 hover:underline focus-visible:outline-none">
            Clear filter to see all issues
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((risk, i) => {
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
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
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
      )}
    </section>
  )
}
