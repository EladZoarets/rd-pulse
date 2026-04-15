import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { RiskPayload } from '@rdpulse/types'

interface Props {
  risks: RiskPayload[]
}

const TYPE_LABELS: Record<string, string> = {
  sprint_jeopardy: 'Sprint Risk',
  review_bottleneck: 'Review',
  ghost_work: 'Ghost Work',
  unassigned_risk: 'Unassigned',
  stall: 'Stalled',
  overload: 'Overload',
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#22c55e',
  '#ec4899',
]

export function RiskTypeChart({ risks }: Props) {
  const countMap: Record<string, number> = {}
  for (const r of risks) {
    const label = TYPE_LABELS[r.type] ?? r.type
    countMap[label] = (countMap[label] ?? 0) + 1
  }

  const data = Object.entries(countMap).map(([name, value]) => ({ name, value }))

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        No issues detected
      </div>
    )
  }

  return (
    <div
      role="img"
      aria-label="Risk type distribution pie chart"
      className="h-[220px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
