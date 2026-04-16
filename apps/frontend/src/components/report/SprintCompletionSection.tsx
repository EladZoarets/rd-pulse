import type { SprintData, TopicBreakdown } from '@rdpulse/types'

interface Props {
  sprintData: SprintData
}

/** Returns a CSS color string interpolating green→amber→red as pct drops 100→0 */
function pctColor(pct: number): string {
  // green  at 100%:  #22c55e
  // amber  at  50%:  #f59e0b
  // red    at   0%:  #ef4444
  if (pct >= 70) return '#22c55e'
  if (pct >= 50) return '#84cc16'
  if (pct >= 35) return '#f59e0b'
  if (pct >= 20) return '#f97316'
  return '#ef4444'
}

function pctLabel(pct: number): string {
  if (pct >= 70) return 'On track'
  if (pct >= 50) return 'At risk'
  if (pct >= 35) return 'Behind'
  return 'Critical'
}

function pctTextColor(pct: number): string {
  if (pct >= 70) return 'text-green-700'
  if (pct >= 50) return 'text-lime-700'
  if (pct >= 35) return 'text-amber-700'
  if (pct >= 20) return 'text-orange-700'
  return 'text-red-700'
}

interface BarProps {
  pct: number
  label?: string
  subLabel?: string
  height?: string
}

function CompletionBar({ pct, label, subLabel, height = 'h-4' }: BarProps) {
  const color = pctColor(pct)
  const clampedPct = Math.max(0, Math.min(100, pct))

  return (
    <div>
      {(label || subLabel) && (
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {label && <span className="text-sm font-medium text-slate-800">{label}</span>}
            {subLabel && <span className="text-xs text-slate-400">{subLabel}</span>}
          </div>
          <span
            className={`text-sm font-bold tabular-nums ${pctTextColor(pct)}`}
            aria-label={`${clampedPct}% complete`}
          >
            {clampedPct}%
          </span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}
        role="progressbar"
        aria-valuenow={clampedPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedPct}%`, backgroundColor: color }}
        />
      </div>
      {!label && (
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>{pctLabel(pct)}</span>
          <span>{clampedPct}%</span>
        </div>
      )}
    </div>
  )
}

export function SprintCompletionSection({ sprintData }: Props) {
  const { overallPercent, users, topics } = sprintData

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-800">Sprint Completion</h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Estimated probability of finishing the sprint on time
        </p>
      </div>

      {/* Overall bar — larger */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Overall</span>
          <span className={`text-lg font-bold tabular-nums ${pctTextColor(overallPercent)}`}>
            {overallPercent}%
          </span>
        </div>
        <CompletionBar pct={overallPercent} height="h-5" />
        <p className={`mt-1.5 text-xs font-medium ${pctTextColor(overallPercent)}`}>
          {pctLabel(overallPercent)}
        </p>
      </div>

      {/* Per-user breakdown */}
      {users.length > 0 && (
        <>
          <div className="mb-3 h-px bg-slate-100" />
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            By Team Member
          </h3>
          <div className="space-y-4">
            {users.map((u) => {
              const userPct = u.total > 0 ? Math.round((u.done / u.total) * 100) : 0
              return (
                <CompletionBar
                  key={u.user}
                  pct={userPct}
                  label={u.user}
                  subLabel={`${u.done} done · ${u.inProgress} in progress · ${u.total - u.done - u.inProgress} to do`}
                  height="h-3"
                />
              )
            })}
          </div>
        </>
      )}

      {/* Per-topic breakdown */}
      {topics && topics.length > 0 && (
        <>
          <div className="mb-3 mt-6 h-px bg-slate-100" />
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            By Topic
          </h3>
          <div className="space-y-4">
            {topics.map((t: TopicBreakdown) => (
              <CompletionBar
                key={t.topic}
                pct={t.completionPercent}
                label={t.topic}
                subLabel={`${t.doneCount} done · ${t.inProgressCount} in progress · ${t.todoCount} to do`}
                height="h-3"
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
