import { sortBySeverity, topRisks, jiraRisks, teamSignalRisks, githubSignalRisks } from '../utils/riskFilters'
import type { RiskPayload } from '@rdpulse/types'

const makeRisk = (type: string, severity: 'low' | 'medium' | 'high'): RiskPayload => ({
  type,
  severity,
  title: `${type} risk`,
  description: 'desc',
  links: [],
})

describe('riskFilters', () => {
  it('sortBySeverity puts high before medium before low', () => {
    const risks = [makeRisk('stall', 'low'), makeRisk('overload', 'high'), makeRisk('ghost_work', 'medium')]
    const sorted = sortBySeverity(risks)
    expect(sorted[0].severity).toBe('high')
    expect(sorted[1].severity).toBe('medium')
    expect(sorted[2].severity).toBe('low')
  })

  it('topRisks returns at most 5 risks sorted by severity', () => {
    const risks = Array.from({ length: 8 }, (_, i) => makeRisk('stall', i < 3 ? 'high' : 'low'))
    expect(topRisks(risks)).toHaveLength(5)
    expect(topRisks(risks)[0].severity).toBe('high')
  })

  it('jiraRisks filters to stall, sprint_jeopardy, unassigned_risk', () => {
    const risks = [makeRisk('stall', 'low'), makeRisk('review_bottleneck', 'high'), makeRisk('sprint_jeopardy', 'medium')]
    const result = jiraRisks(risks)
    expect(result.map((r) => r.type)).not.toContain('review_bottleneck')
    expect(result.map((r) => r.type)).toContain('stall')
  })

  it('githubSignalRisks filters to review_bottleneck and ghost_work', () => {
    const risks = [makeRisk('review_bottleneck', 'high'), makeRisk('sprint_jeopardy', 'medium'), makeRisk('ghost_work', 'low')]
    const result = githubSignalRisks(risks)
    expect(result.map((r) => r.type)).not.toContain('sprint_jeopardy')
    expect(result.map((r) => r.type)).toContain('review_bottleneck')
    expect(result.map((r) => r.type)).toContain('ghost_work')
  })

  it('sortBySeverity does not mutate the original array', () => {
    const risks = [makeRisk('stall', 'low'), makeRisk('overload', 'high')]
    const original = [...risks]
    sortBySeverity(risks)
    expect(risks).toEqual(original)
  })

  it('teamSignalRisks filters to overload, unassigned_risk, ghost_work', () => {
    const risks = [makeRisk('overload', 'high'), makeRisk('review_bottleneck', 'medium'), makeRisk('ghost_work', 'low'), makeRisk('unassigned_risk', 'low')]
    const result = teamSignalRisks(risks)
    expect(result.map((r) => r.type)).not.toContain('review_bottleneck')
    expect(result.map((r) => r.type)).toContain('overload')
    expect(result.map((r) => r.type)).toContain('ghost_work')
    expect(result.map((r) => r.type)).toContain('unassigned_risk')
  })
})
