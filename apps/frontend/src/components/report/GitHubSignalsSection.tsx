import type { RiskPayload } from '@rdpulse/types'
import { GitPullRequest } from 'lucide-react'
import { RiskCard } from './RiskCard'
import { SectionHeading } from './SectionHeading'
import { githubSignalRisks } from '../../utils/riskFilters'

interface Props {
  risks: RiskPayload[]
}

export function GitHubSignalsSection({ risks }: Props) {
  const filtered = githubSignalRisks(risks)
  if (!filtered.length) return null

  return (
    <section data-testid="github-signals-section" className="mb-6">
      <SectionHeading icon={<GitPullRequest className="h-4 w-4" />}>GitHub Signals</SectionHeading>
      <div className="grid gap-3">
        {filtered.map((r, i) => <RiskCard key={i} risk={r} />)}
      </div>
    </section>
  )
}
