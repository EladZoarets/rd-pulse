import type { RiskPayload } from '@rdpulse/types'
import { ListTodo } from 'lucide-react'
import { RiskCard } from './RiskCard'
import { SectionHeading } from './SectionHeading'
import { jiraRisks } from '../../utils/riskFilters'

interface Props {
  risks: RiskPayload[]
}

export function JiraRisksSection({ risks }: Props) {
  const filtered = jiraRisks(risks)
  if (!filtered.length) return null

  return (
    <section data-testid="jira-risks-section" className="mb-6">
      <SectionHeading icon={<ListTodo className="h-4 w-4" />}>Jira Risks</SectionHeading>
      <div className="grid gap-3">
        {filtered.map((r, i) => <RiskCard key={i} risk={r} />)}
      </div>
    </section>
  )
}
