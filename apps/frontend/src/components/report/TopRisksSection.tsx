import type { RiskPayload } from '@rdpulse/types'
import { AlertTriangle } from 'lucide-react'
import { RiskCard } from './RiskCard'
import { SectionHeading } from './SectionHeading'
import { topRisks } from '../../utils/riskFilters'

interface Props {
  risks: RiskPayload[]
}

export function TopRisksSection({ risks }: Props) {
  const top = topRisks(risks, 5)
  if (!top.length) return null

  return (
    <section data-testid="top-risks-section" className="mb-6">
      <SectionHeading icon={<AlertTriangle className="h-4 w-4" />}>Top Risks</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-2">
        {top.map((r, i) => <RiskCard key={i} risk={r} />)}
      </div>
    </section>
  )
}
