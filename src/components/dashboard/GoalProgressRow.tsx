'use client'

import type { RollingAverage } from '@/lib/api'
import { formatUnitForUi, toDisplayValue } from '@/lib/units-display'

type Goal = {
  id: string
  metricSlug: string
  metricName: string
  unit: string
  targetValue: number
  startsOn: string
  endsOn: string | null
}

type Props = {
  goal: Goal
  rolling: RollingAverage | undefined
  prefs: Record<string, string>
}

export function GoalProgressRow({ goal, rolling, prefs }: Props) {
  const current = rolling?.avg3d
  const target = goal.targetValue
  const curDisplay =
    current != null
      ? toDisplayValue(goal.metricSlug, current, rolling?.unit ?? goal.unit, prefs)
      : null
  const tgtDisplay = toDisplayValue(
    goal.metricSlug,
    target,
    rolling?.unit ?? goal.unit,
    prefs,
  )

  const pct =
    current != null && target !== 0
      ? Math.min(100, Math.round((current / target) * 100))
      : null

  return (
    <div className="border-b border-sand-100 py-3 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium text-sage-900">{goal.metricName}</span>
        <span className="font-mono text-sm text-sage-700">
          {curDisplay?.value != null ? (
            <>
              {curDisplay.value} {formatUnitForUi(curDisplay.unit)}
            </>
          ) : (
            '—'
          )}{' '}
          <span className="text-sage-500">/ target {tgtDisplay.value != null ? `${tgtDisplay.value} ${formatUnitForUi(tgtDisplay.unit)}` : '—'}</span>
        </span>
      </div>
      {pct != null && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-200">
          <div
            className="h-full rounded-full bg-[#2F5944] transition-all"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
      {pct != null && (
        <p className="mt-1 text-xs text-sage-600">{pct}% of target (rolling 3-day vs goal)</p>
      )}
    </div>
  )
}
