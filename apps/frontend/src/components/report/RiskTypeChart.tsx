import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { RiskPayload } from '@rdpulse/types'
import type { ActiveFilter } from './types'

interface Props {
  risks: RiskPayload[]
  activeFilter: ActiveFilter
  onFilterChange: (f: ActiveFilter) => void
}

const JIRA_TYPES = new Set(['sprint_jeopardy', 'unassigned_risk', 'stall'])
const GITHUB_TYPES = new Set(['review_bottleneck', 'ghost_work'])

function detectSource(type: string): 'jira' | 'github' | 'team' {
  if (JIRA_TYPES.has(type)) return 'jira'
  if (GITHUB_TYPES.has(type)) return 'github'
  return 'team'
}

const BUCKETS = [
  {
    key: 'jira' as const,
    label: 'Jira',
    desc: 'Sprint & tickets',
    color: '#3b82f6',
    bg: 'bg-blue-50 hover:bg-blue-100',
    activeBg: 'bg-blue-100',
    text: 'text-blue-800',
    ring: 'ring-blue-400',
  },
  {
    key: 'github' as const,
    label: 'GitHub',
    desc: 'PRs & reviews',
    color: '#334155',
    bg: 'bg-slate-100 hover:bg-slate-200',
    activeBg: 'bg-slate-200',
    text: 'text-slate-800',
    ring: 'ring-slate-500',
  },
  {
    key: 'team' as const,
    label: 'Team',
    desc: 'Workload signals',
    color: '#8b5cf6',
    bg: 'bg-purple-50 hover:bg-purple-100',
    activeBg: 'bg-purple-100',
    text: 'text-purple-800',
    ring: 'ring-purple-400',
  },
]

export function RiskTypeChart({ risks, activeFilter, onFilterChange }: Props) {
  const counts = { jira: 0, github: 0, team: 0 }
  for (const r of risks) {
    counts[detectSource(r.type)]++
  }
  const total = risks.length

  const chartData = BUCKETS
    .filter(b => counts[b.key] > 0)
    .map(b => ({ name: b.label, value: counts[b.key], color: b.color, key: b.key }))

  function handleTileClick(key: 'jira' | 'github' | 'team') {
    const isActive = activeFilter?.type === 'source' && activeFilter.value === key
    onFilterChange(isActive ? null : { type: 'source', value: key })
    if (!isActive) {
      setTimeout(() => {
        document.getElementById('issues-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  return (
    <div>
      {/* Clickable stat tiles */}
      <div className="mb-4 grid grid-cols-3 gap-2" role="group" aria-label="Filter issues by source">
        {BUCKETS.map(b => {
          const isActive = activeFilter?.type === 'source' && activeFilter.value === b.key
          return (
            <button
              key={b.key}
              onClick={() => handleTileClick(b.key)}
              aria-pressed={isActive}
              aria-label={`Filter by ${b.label}: ${counts[b.key]} issues`}
              className={[
                'rounded-xl p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2',
                isActive
                  ? `${b.activeBg} ring-2 ring-offset-1 ${b.ring} scale-105`
                  : `${b.bg} opacity-80 hover:opacity-100`,
              ].join(' ')}
            >
              <div className={`text-2xl font-bold ${b.text}`}>{counts[b.key]}</div>
              <div className={`mt-0.5 text-xs font-semibold ${b.text}`}>{b.label}</div>
              <div className={`mt-0.5 text-[10px] leading-tight ${b.text} opacity-70`}>{b.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Donut — decorative */}
      {total > 0 && (
        <div aria-hidden="true" className="h-[130px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {chartData.map(entry => {
                  const isActive = activeFilter?.type === 'source' && activeFilter.value === entry.key
                  return (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={activeFilter?.type === 'source' && !isActive ? 0.3 : 1}
                    />
                  )
                })}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} of ${total}`]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
