import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { RiskPayload } from '@rdpulse/types'

interface Props {
  risks: RiskPayload[]
}

// Source buckets — maps risk.type → display label + color
const JIRA_TYPES = new Set(['sprint_jeopardy', 'unassigned_risk', 'stall'])
const GITHUB_TYPES = new Set(['review_bottleneck', 'ghost_work'])

function detectSource(type: string): 'Jira' | 'GitHub' | 'Team' {
  if (JIRA_TYPES.has(type)) return 'Jira'
  if (GITHUB_TYPES.has(type)) return 'GitHub'
  return 'Team'
}

const BUCKETS = [
  { key: 'Jira',   color: '#3b82f6', bg: 'bg-blue-50',   text: 'text-blue-700',   desc: 'Sprint & tickets' },
  { key: 'GitHub', color: '#334155', bg: 'bg-slate-100',  text: 'text-slate-700',  desc: 'PRs & reviews' },
  { key: 'Team',   color: '#8b5cf6', bg: 'bg-purple-50',  text: 'text-purple-700', desc: 'Workload signals' },
]

export function RiskTypeChart({ risks }: Props) {
  const counts: Record<string, number> = { Jira: 0, GitHub: 0, Team: 0 }
  for (const r of risks) {
    counts[detectSource(r.type)]++
  }
  const total = risks.length

  const chartData = BUCKETS
    .filter(b => counts[b.key] > 0)
    .map(b => ({ name: b.key, value: counts[b.key], color: b.color }))

  return (
    <div>
      {/* Stat tiles */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {BUCKETS.map(b => (
          <div key={b.key} className={`rounded-xl p-3 text-center ${b.bg}`}>
            <div className={`text-2xl font-bold ${b.text}`}>{counts[b.key]}</div>
            <div className={`mt-0.5 text-xs font-semibold ${b.text}`}>{b.key}</div>
            <div className={`text-[10px] leading-tight mt-0.5 ${b.text} opacity-70`}>{b.desc}</div>
          </div>
        ))}
      </div>

      {/* Donut — visual proportion */}
      {total > 0 && (
        <div role="img" aria-label={`Issues by source: ${counts.Jira} Jira, ${counts.GitHub} GitHub, ${counts.Team} Team`} className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} of ${total}`, undefined]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
