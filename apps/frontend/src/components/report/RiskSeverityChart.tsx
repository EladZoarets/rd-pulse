import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { RiskPayload } from '@rdpulse/types'
import type { ActiveFilter } from './types'

interface Props {
  risks: RiskPayload[]
  activeFilter: ActiveFilter
  onFilterChange: (f: ActiveFilter) => void
}

const BUCKETS = [
  {
    key: 'high' as const,
    label: 'High',
    color: '#ef4444',
    bg: 'bg-red-50 hover:bg-red-100',
    activeBg: 'bg-red-100',
    text: 'text-red-800',
    ring: 'ring-red-400',
  },
  {
    key: 'medium' as const,
    label: 'Medium',
    color: '#f59e0b',
    bg: 'bg-amber-50 hover:bg-amber-100',
    activeBg: 'bg-amber-100',
    text: 'text-amber-800',
    ring: 'ring-amber-400',
  },
  {
    key: 'low' as const,
    label: 'Low',
    color: '#94a3b8',
    bg: 'bg-slate-50 hover:bg-slate-100',
    activeBg: 'bg-slate-100',
    text: 'text-slate-700',
    ring: 'ring-slate-400',
  },
]

export function RiskSeverityChart({ risks, activeFilter, onFilterChange }: Props) {
  const counts = { high: 0, medium: 0, low: 0 }
  for (const r of risks) {
    if (r.severity in counts) counts[r.severity as keyof typeof counts]++
  }

  const total = risks.length

  const chartData = BUCKETS
    .filter(b => counts[b.key] > 0)
    .map(b => ({ name: b.label, value: counts[b.key], color: b.color }))

  function handleTileClick(key: 'high' | 'medium' | 'low') {
    const isActive = activeFilter?.type === 'severity' && activeFilter.value === key
    onFilterChange(isActive ? null : { type: 'severity', value: key })
    if (!isActive) {
      setTimeout(() => {
        document.getElementById('issues-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  return (
    <div>
      {/* Clickable stat tiles — primary interaction surface */}
      <div className="mb-4 grid grid-cols-3 gap-2" role="group" aria-label="Filter issues by severity">
        {BUCKETS.map(b => {
          const isActive = activeFilter?.type === 'severity' && activeFilter.value === b.key
          return (
            <button
              key={b.key}
              onClick={() => handleTileClick(b.key)}
              aria-pressed={isActive}
              aria-label={`Filter by ${b.label} severity: ${counts[b.key]} issues`}
              className={[
                'rounded-xl p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2',
                isActive
                  ? `${b.activeBg} ring-2 ring-offset-1 ${b.ring} scale-105`
                  : `${b.bg} opacity-80 hover:opacity-100`,
              ].join(' ')}
            >
              <div className={`text-2xl font-bold ${b.text}`}>{counts[b.key]}</div>
              <div className={`mt-0.5 text-xs font-medium ${b.text}`}>{b.label}</div>
            </button>
          )
        })}
      </div>

      {/* Donut — decorative proportion view */}
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
                  const bucket = BUCKETS.find(b => b.label === entry.name)
                  const isActive = activeFilter?.type === 'severity' &&
                    activeFilter.value === bucket?.key
                  return (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={activeFilter?.type === 'severity' && !isActive ? 0.3 : 1}
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
