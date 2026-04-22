'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { api, type MetricSample } from '@/lib/api'
import { effectiveUnitPreferences } from '@/lib/unit-preferences'
import { displayUnitForMetric, formatUnitForUi } from '@/lib/units-display'

// Recharts must be dynamically imported to avoid SSR hydration errors.
// Recharts class defaultProps are typed loosely (string) vs strict unions; next/dynamic rejects some loaders.
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false })
// @ts-expect-error — Recharts + next/dynamic strict Loader typing
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false })
// @ts-expect-error — Recharts + next/dynamic strict Loader typing
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
// @ts-expect-error — Recharts + next/dynamic strict Loader typing
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
// @ts-expect-error — Recharts + next/dynamic strict Loader typing
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false },
)

type Window = 7 | 14 | 30

const METRICS = [
  { slug: 'weight_kg',    label: 'Weight',        canonicalUnit: 'kg',    displayFallback: 'kg',    dp: 1 },
  { slug: 'bp_systolic',  label: 'Systolic BP',   canonicalUnit: 'mmHg',  displayFallback: 'mmHg',  dp: 0 },
  { slug: 'bp_diastolic', label: 'Diastolic BP',  canonicalUnit: 'mmHg',  displayFallback: 'mmHg',  dp: 0 },
  { slug: 'steps',        label: 'Steps',         canonicalUnit: 'count', displayFallback: 'steps', dp: 0 },
  { slug: 'sleep_hrs',    label: 'Sleep',         canonicalUnit: 'hours', displayFallback: 'hrs',   dp: 1 },
  { slug: 'sodium_mg',    label: 'Sodium',        canonicalUnit: 'mg',    displayFallback: 'mg',    dp: 0 },
  { slug: 'heart_rate',   label: 'Heart rate',    canonicalUnit: 'bpm',   displayFallback: 'bpm',   dp: 0 },
  { slug: 'calories_in',  label: 'Calories in',   canonicalUnit: 'kcal',  displayFallback: 'kcal',  dp: 0 },
  { slug: 'adherence',    label: 'Plan adherence', canonicalUnit: '%',     displayFallback: '%',     dp: 0 },
]

function fmt(val: number, dp: number) {
  return dp === 0 ? Math.round(val).toLocaleString() : val.toFixed(dp)
}

function CustomTooltip({ active, payload, label, unit, dp }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border)',
      borderRadius: 8,
      padding:      '8px 12px',
      fontSize:     13,
      boxShadow:    '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
        {fmt(payload[0].value, dp)} {unit}
      </div>
    </div>
  )
}

function MetricChart({ slug, label, unit, dp, days }: {
  slug: string
  label: string
  /** Display unit string (from preferences where applicable). */
  unit: string
  dp: number
  days: number
}) {
  const [samples, setSamples] = useState<MetricSample[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getMetric(slug, days)
      .then(data => setSamples([...data].reverse()))
      .catch(() => setSamples([]))
      .finally(() => setLoading(false))
  }, [slug, days])

  const latest = samples.at(-1)
  const avg    = samples.length
    ? samples.reduce((s, m) => s + m.value, 0) / samples.length
    : null

  const chartData = samples.map(s => ({
    date:  format(new Date(s.observedAt), 'MMM d'),
    value: parseFloat(s.value.toFixed(dp === 0 ? 0 : 2)),
  }))

  const values = samples.map(s => s.value)
  const yMin   = values.length ? Math.floor(Math.min(...values) * 0.98) : undefined
  const yMax   = values.length ? Math.ceil(Math.max(...values)  * 1.02) : undefined

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div>
          <div className="label">{label}</div>
          {avg !== null && (
            <div style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '1.75rem',
              color:         'var(--text-primary)',
              lineHeight:    1.1,
              marginTop:     4,
              letterSpacing: '-0.02em',
            }}>
              {fmt(avg, dp)}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4, fontFamily: 'var(--font-body)' }}>
                {unit} avg
              </span>
            </div>
          )}
        </div>
        {latest && (
          <div className="metric-pill">
            Latest: {fmt(latest.value, dp)} {unit}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        </div>
      )}

      {!loading && samples.length < 2 && (
        <div style={{ height: 80, display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Not enough data — log at least 2 measurements to see a chart
          </div>
        </div>
      )}

      {!loading && samples.length >= 2 && (
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin!, yMax!]}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              tickCount={4}
              tickFormatter={v => fmt(v, dp)}
            />
            <Tooltip content={<CustomTooltip unit={unit} dp={dp} />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#557a55"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#557a55', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function TrendsPage() {
  const [days, setDays] = useState<Window>(14)
  const [prefState, setPrefState] = useState<{
    prefs: Record<string, string>
    available: Record<string, readonly string[]>
  } | null>(null)

  useEffect(() => {
    api
      .getPreferences()
      .then(d =>
        setPrefState({
          prefs:     d.unitPreferences,
          available: d.availableDisplayUnits,
        })
      )
      .catch(() => setPrefState({ prefs: {}, available: {} }))
  }, [])

  const effPrefs = prefState
    ? effectiveUnitPreferences(prefState.prefs, prefState.available)
    : {}

  function chartUnit(m: (typeof METRICS)[number]): string {
    const u = displayUnitForMetric(m.slug, m.canonicalUnit, effPrefs)
    if (m.slug === 'steps' && u === 'count') return 'steps'
    if (m.slug === 'sleep_hrs' && (u === 'hours' || u === 'hrs')) return 'hrs'
    return formatUnitForUi(u) || m.displayFallback
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Trends</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Time-series view of your key metrics</p>
        </div>

        {/* Window selector */}
        <div style={{
          display:      'flex',
          gap:          '0.25rem',
          background:   'var(--bg-subtle)',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding:      '3px',
        }}>
          {([7, 14, 30] as Window[]).map(w => (
            <button key={w} type="button" onClick={() => setDays(w)} style={{
              padding:      '0.35rem 0.875rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border:       'none',
              cursor:       'pointer',
              fontSize:     13,
              fontFamily:   'var(--font-body)',
              fontWeight:   days === w ? 500 : 400,
              background:   days === w ? 'var(--bg-card)' : 'transparent',
              color:        days === w ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow:    days === w ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition:   'all 0.15s',
            }}>
              {w}d
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap:                 '1rem',
      }}>
        {METRICS.map(m => {
          const displayUnit = chartUnit(m)
          return (
            <MetricChart
              key={m.slug}
              slug={m.slug}
              label={m.label}
              unit={displayUnit}
              dp={m.dp}
              days={days}
            />
          )
        })}
      </div>
    </div>
  )
}
