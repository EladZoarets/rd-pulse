import type { RiskPayload } from '@rdpulse/types'
import { Users } from 'lucide-react'
import { RiskCard } from './RiskCard'
import { SectionHeading } from './SectionHeading'
import { teamSignalRisks } from '../../utils/riskFilters'

interface Props {
  risks: RiskPayload[]
}

export function TeamSignalsSection({ risks }: Props) {
  const filtered = teamSignalRisks(risks)
  if (!filtered.length) return null

  return (
    <section data-testid="team-signals-section" className="mb-6">
      <SectionHeading icon={<Users className="h-4 w-4" />}>Team Signals</SectionHeading>
      <div className="grid gap-3">
        {filtered.map((r, i) => <RiskCard key={i} risk={r} />)}
      </div>
    </section>
  )
}
