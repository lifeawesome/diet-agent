'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const Recharts = dynamic(
  () =>
    import('recharts').then(m => {
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = m
      return function Chart({
        data,
      }: {
        data: { t: string; v: number }[]
      }) {
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6deca" />
              <XAxis
                dataKey="t"
                tick={{ fontSize: 11 }}
                stroke="#7a967a"
                tickFormatter={t => t.slice(5, 10)}
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#7a967a" />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="#2F5944" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )
      }
    }),
  { ssr: false },
)

type Props = {
  metricSlug: string
}

export function TrendChart({ metricSlug }: Props) {
  const [points, setPoints] = useState<{ t: string; v: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    setLoading(true)
    setErr(null)
    api
      .getMeTrend(metricSlug, 30)
      .then(d => {
        if (cancel) return
        setPoints(
          d.points.map(p => ({
            t: p.at.slice(0, 10),
            v: p.value,
          })),
        )
      })
      .catch(e => {
        if (!cancel) setErr(e instanceof Error ? e.message : 'Failed to load trend')
      })
      .finally(() => {
        if (!cancel) setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [metricSlug])

  if (loading) {
    return <div className="py-12 text-center text-sm text-sage-500">Loading chart…</div>
  }
  if (err) {
    return <div className="py-8 text-center text-sm text-red-700">{err}</div>
  }
  if (points.length < 2) {
    return (
      <div className="py-8 text-center text-sm text-sage-600">
        Not enough data points for this metric in the last 30 days.
      </div>
    )
  }

  return <Recharts data={points} />
}
