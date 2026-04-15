import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { RiskPayload } from '@rdpulse/types'

interface Props {
  risks: RiskPayload[]
}

const BUCKETS = [
  { key: 'high',   label: 'High',   color: '#ef4444', bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
  { key: 'medium', label: 'Medium', color: '#f59e0b', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  { key: 'low',    label: 'Low',    color: '#94a3b8', bg: 'bg-slate-50',  text: 'text-slate-600',  dot: 'bg-slate-400' },
]

export function RiskSeverityChart({ risks }: Props) {
  const counts: Record<string, number> = { high: 0, medium: 0, low: 0 }
  for (const r of risks) {
    if (r.severity in counts) counts[r.severity]++
  }
  const total = risks.length

  const chartData = BUCKETS
    .filter(b => counts[b.key] > 0)
    .map(b => ({ name: b.label, value: counts[b.key], color: b.color }))

  return (
    <div>
      {/* Stat tiles — the primary readable summary */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {BUCKETS.map(b => (
          <div key={b.key} className={`rounded-xl p-3 text-center ${b.bg}`}>
            <div className={`text-2xl font-bold ${b.text}`}>{counts[b.key]}</div>
            <div className={`mt-0.5 text-xs font-medium ${b.text}`}>{b.label}</div>
          </div>
        ))}
      </div>

      {/* Donut — visual proportion, secondary */}
      {total > 0 && (
        <div role="img" aria-label={`Risk severity: ${counts.high} high, ${counts.medium} medium, ${counts.low} low`} className="h-[140px]">
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
