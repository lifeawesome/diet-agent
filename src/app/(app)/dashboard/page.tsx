'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api, type DashboardData, type MealLog } from '@/lib/api'
import { formatUnitForUi, toDisplayValue } from '@/lib/units-display'
import { MetricCard } from '@/components/MetricCard'
import { MealRow } from '@/components/MealRow'
import { DashboardSkeleton } from '@/components/Skeleton'

const HERO_SLUGS      = ['weight_kg', 'bp_systolic', 'bp_diastolic', 'adherence']
const SECONDARY_SLUGS = ['steps', 'sleep_hrs', 'sodium_mg', 'heart_rate', 'calories_in']

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null)

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function removeRecentMeal(meal: MealLog) {
    if (!window.confirm('Remove this meal from your log?')) return
    setDeletingMealId(meal.id)
    try {
      await api.deleteMeal(meal.id)
      setData(d =>
        d ? { ...d, recentMeals: d.recentMeals.filter(m => m.id !== meal.id) } : null
      )
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not remove meal')
    } finally {
      setDeletingMealId(null)
    }
  }

  if (loading) return <DashboardSkeleton />

  if (error) return (
    <div className="card" style={{ color: 'var(--down)', maxWidth: 480 }}>
      <div style={{ fontWeight: 500, marginBottom: 4 }}>Could not load dashboard</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{error}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Make sure the API is running at {process.env.NEXT_PUBLIC_API_URL}
      </div>
    </div>
  )

  if (!data) return null

  const heroMetrics      = HERO_SLUGS.map(slug => data.rollingAverages.find(m => m.metricSlug === slug)).filter(Boolean) as typeof data.rollingAverages
  const secondaryMetrics = SECONDARY_SLUGS.map(slug => data.rollingAverages.find(m => m.metricSlug === slug)).filter(Boolean) as typeof data.rollingAverages
  const prefs = data.user.unitPreferences ?? {}

  const weightToday = data.today
    ? toDisplayValue('weight_kg', data.today.weightKg, 'kg', prefs)
    : { value: null as number | null, unit: 'kg' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <div className="label" style={{ marginBottom: 6 }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </div>
        <h1 style={{ fontSize: '2.25rem' }}>
          Good {greeting()},{' '}
          <span style={{ color: 'var(--sage-500)' }}>
            {data.user.displayName ?? 'there'}
          </span>
        </h1>
        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          {data.coaching?.activeDietPlan ? (
            <span style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              padding: '0.25rem 0.65rem',
              background: 'var(--accent-light)',
              borderRadius: 'var(--radius-md)',
            }}>
              Diet: {data.coaching.activeDietPlan.name}
            </span>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              No diet plan selected
            </span>
          )}
          <Link href="/settings" style={{ fontSize: 13, color: 'var(--accent)' }}>
            {data.coaching?.activeDietPlan ? 'Change in settings' : 'Choose in settings'}
          </Link>
        </div>
        {data.today?.aiSummary && (
          <p style={{
            marginTop:  '0.75rem',
            fontSize:   '15px',
            color:      'var(--text-secondary)',
            maxWidth:   '640px',
            lineHeight: 1.6,
          }}>
            {data.today.aiSummary}
          </p>
        )}
      </div>

      {/* ── Hero metrics ───────────────────────────────────────────────── */}
      <div>
        <div className="label" style={{ marginBottom: '0.75rem' }}>Key metrics · 3-day average</div>
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap:                 '1rem',
        }}>
          {heroMetrics.map(m => (
            <MetricCard key={m.metricSlug} metric={m} size="large" />
          ))}
        </div>
      </div>

      {/* ── Secondary metrics ──────────────────────────────────────────── */}
      <div>
        <div className="label" style={{ marginBottom: '0.75rem' }}>Activity & diet</div>
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap:                 '0.75rem',
        }}>
          {secondaryMetrics.map(m => (
            <MetricCard key={m.metricSlug} metric={m} />
          ))}
        </div>
      </div>

      {/* ── Today snapshot + recent meals ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Today snapshot */}
        {data.today && (
          <div className="card">
            <div className="label" style={{ marginBottom: '1rem' }}>Today at a glance</div>
            {[
              { label: 'Weight',    value: weightToday.value != null ? `${weightToday.value.toFixed(1)} ${formatUnitForUi(weightToday.unit)}` : '—' },
              { label: 'Blood pressure', value: data.today.bpSystolic != null ? `${data.today.bpSystolic} / ${data.today.bpDiastolic} mmHg` : '—' },
              { label: 'Steps',     value: data.today.steps       != null ? data.today.steps.toLocaleString() : '—' },
              { label: 'Sleep',     value: data.today.sleepHrs    != null ? `${data.today.sleepHrs} hrs`  : '—' },
              { label: 'Sodium',    value: data.today.sodiumMg    != null ? `${data.today.sodiumMg.toLocaleString()} mg` : '—' },
              { label: 'Plan adherence', value: data.today.adherenceScore != null ? `${Math.round(data.today.adherenceScore)}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display:       'flex',
                justifyContent:'space-between',
                alignItems:    'center',
                padding:       '0.5rem 0',
                borderBottom:  '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent meals */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div className="label">Recent meals</div>
            <a href="/meals" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
          </div>
          {data.recentMeals.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
              No meals logged yet.{' '}
              <a href="/log" style={{ color: 'var(--accent)' }}>Log your first meal →</a>
            </div>
          ) : (
            data.recentMeals.map(meal => (
              <MealRow
                key={meal.id}
                meal={meal}
                onDelete={removeRecentMeal}
                deletePending={deletingMealId === meal.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
