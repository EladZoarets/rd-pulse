import type { RiskPayload, InsightPayload } from '@rdpulse/types'

const SEVERITY_WEIGHT: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

export function sortBySeverity(risks: RiskPayload[]): RiskPayload[] {
  return [...risks].sort(
    (a, b) => (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0)
  )
}

export function filterByTypes(risks: RiskPayload[], types: string[]): RiskPayload[] {
  return risks.filter((r) => types.includes(r.type))
}

export function topRisks(risks: RiskPayload[], limit = 5): RiskPayload[] {
  return sortBySeverity(risks).slice(0, limit)
}

export function jiraRisks(risks: RiskPayload[]): RiskPayload[] {
  return filterByTypes(risks, ['stall', 'sprint_jeopardy', 'unassigned_risk'])
}

export function teamSignalRisks(risks: RiskPayload[]): RiskPayload[] {
  return filterByTypes(risks, ['overload', 'unassigned_risk', 'ghost_work'])
}

export function githubSignalRisks(risks: RiskPayload[]): RiskPayload[] {
  return filterByTypes(risks, ['review_bottleneck', 'ghost_work'])
}

export function collectAllLinks(risks: RiskPayload[], _insights: InsightPayload[]) {
  return risks.flatMap((r) => r.links)
}
