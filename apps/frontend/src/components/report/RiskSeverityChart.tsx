import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { RiskPayload } from '@rdpulse/types'

interface Props {
  risks: RiskPayload[]
}

const COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#94a3b8',
}

export function RiskSeverityChart({ risks }: Props) {
  const counts = { High: 0, Medium: 0, Low: 0 }
  for (const r of risks) {
    if (r.severity === 'high') counts.High++
    else if (r.severity === 'medium') counts.Medium++
    else counts.Low++
  }

  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        No risks detected
      </div>
    )
  }

  return (
    <div
      role="img"
      aria-label="Risk severity distribution pie chart"
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
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS]}
              />
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
