'use client'

import type { RollingAverage } from '@/lib/api'

const TREND_ICON: Record<string, string> = {
  up:                '↑',
  down:              '↓',
  flat:              '→',
  insufficient_data: '·',
}

// For metrics where "down" is good (weight, BP, sodium)
const DOWN_IS_GOOD = new Set(['weight_kg', 'bp_systolic', 'bp_diastolic', 'sodium_mg', 'heart_rate'])

function trendClass(m: RollingAverage): string {
  if (m.trend === 'insufficient_data' || m.trend === 'flat') return 'trend-flat'
  const good = DOWN_IS_GOOD.has(m.metricSlug) ? m.trend === 'down' : m.trend === 'up'
  return good ? 'trend-up' : 'trend-down'
}

// Display name overrides
const DISPLAY_NAME: Record<string, string> = {
  weight_kg:    'Weight',
  bp_systolic:  'Systolic BP',
  bp_diastolic: 'Diastolic BP',
  heart_rate:   'Heart rate',
  steps:        'Steps',
  sleep_hrs:    'Sleep',
  sodium_mg:    'Sodium',
  calories_in:  'Calories in',
  adherence:    'Plan adherence',
}

function fmt(value: number | null, slug: string): string {
  if (value === null) return '—'
  if (slug === 'sodium_mg' || slug === 'calories_in' || slug === 'steps') {
    return Math.round(value).toLocaleString()
  }
  if (slug === 'weight_kg') return value.toFixed(1)
  if (slug === 'adherence') return `${Math.round(value)}%`
  return value.toFixed(0)
}

interface MetricCardProps {
  metric: RollingAverage
  size?: 'normal' | 'large'
}

export function MetricCard({ metric: m, size = 'normal' }: MetricCardProps) {
  const tc = trendClass(m)
  const isLarge = size === 'large'

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(85,122,85,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
    >
      {/* Label */}
      <div className="label">{DISPLAY_NAME[m.metricSlug] ?? m.metricName}</div>

      {/* Primary value — 3-day rolling avg */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize:   isLarge ? '3rem' : '2.25rem',
        lineHeight: 1,
        color:      'var(--text-primary)',
        letterSpacing: '-0.03em',
      }}>
        {fmt(m.avg3d, m.metricSlug)}
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize:   isLarge ? '1rem' : '0.75rem',
          color:      'var(--text-muted)',
          marginLeft: '4px',
          fontWeight: 300,
        }}>{m.unit}</span>
      </div>

      {/* Trend + latest */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop:  '0.25rem',
      }}>
        <div className={tc} style={{ fontSize: '13px', fontWeight: 500 }}>
          {TREND_ICON[m.trend]} {m.trend.replace('_', ' ')}
        </div>
        {m.latestValue !== null && (
          <div className="metric-pill">
            {fmt(m.latestValue, m.metricSlug)} {m.unit}
          </div>
        )}
      </div>

      {/* Sub-label */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-2px' }}>
        3-day avg
      </div>
    </div>
  )
}
