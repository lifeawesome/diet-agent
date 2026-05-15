'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Sparkline } from '@/components/dashboard/Sparkline'

const trendClass = (t: string) => {
  if (t === 'up') return 'text-emerald-700'
  if (t === 'down') return 'text-red-700'
  if (t === 'flat') return 'text-sage-600'
  return 'text-sage-500'
}

const trendLabel = (t: string) => {
  if (t === 'up') return '▲ vs prior window'
  if (t === 'down') return '▼ vs prior window'
  if (t === 'flat') return '→ flat'
  return '—'
}

type Props = {
  title: string
  subtitle: string
  displayValue: string
  unit: string
  trend: 'up' | 'down' | 'flat' | 'insufficient_data'
  metricSlug: string
}

export function DashboardMetricCard({
  title,
  subtitle,
  displayValue,
  unit,
  trend,
  metricSlug,
}: Props) {
  const [pts, setPts] = useState<{ at: string; value: number }[]>([])

  useEffect(() => {
    let cancel = false
    api
      .getMeTrend(metricSlug, 14)
      .then(d => {
        if (!cancel) setPts(d.points.map(p => ({ at: p.at, value: p.value })))
      })
      .catch(() => {
        if (!cancel) setPts([])
      })
    return () => {
      cancel = true
    }
  }, [metricSlug])

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-sage-500">{title}</p>
      <p className="text-[11px] text-sage-500">{subtitle}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <span className="font-display text-3xl text-sage-950">{displayValue}</span>
          {unit ? (
            <span className="ml-1 font-body text-sm text-sage-600">{unit}</span>
          ) : null}
        </div>
      </div>
      <div className="mt-2 h-10 w-full">
        {pts.length > 1 ? <Sparkline data={pts} /> : null}
      </div>
      <p className={`mt-2 text-xs ${trendClass(trend)}`}>{trendLabel(trend)}</p>
    </div>
  )
}
