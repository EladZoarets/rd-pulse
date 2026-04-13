import type { RiskPayload, InsightPayload } from '@rdpulse/types'
import { ExternalLink, Link2 } from 'lucide-react'
import { SectionHeading } from './SectionHeading'
import { collectAllLinks } from '../../utils/riskFilters'

interface Props {
  risks: RiskPayload[]
  insights: InsightPayload[]
}

export function NavigationLinks({ risks, insights }: Props) {
  const links = collectAllLinks(risks, insights)
  if (!links.length) return null

  return (
    <section data-testid="navigation-links" className="mb-6 rounded-xl bg-slate-50 p-4">
      <SectionHeading icon={<Link2 className="h-4 w-4" />}>Quick Links</SectionHeading>
      <div className="flex flex-wrap gap-2">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            data-testid="nav-link"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {link.label}
          </a>
        ))}
      </div>
    </section>
  )
}
