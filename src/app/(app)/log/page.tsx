'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { effectiveUnitPreferences } from '@/lib/unit-preferences'
import {
  CANONICAL_UNIT_BY_SLUG,
  displayUnitForMetric,
  formatUnitForUi,
  inputUnitForLogging,
  isConvertibleMetricSlug,
} from '@/lib/units-display'

const STATIC_METRIC_LABELS: Record<string, string> = {
  bp_systolic:     'Systolic BP (mmHg)',
  bp_diastolic:    'Diastolic BP (mmHg)',
  heart_rate:      'Resting heart rate (bpm)',
  steps:           'Steps',
  active_min:      'Active minutes',
  calories_burned: 'Calories burned',
  sleep_hrs:       'Sleep (hours)',
  sodium_mg:       'Sodium (mg)',
  calories_in:     'Calories consumed',
  protein_g:       'Protein (g)',
  mood:            'Mood (1–10)',
  hunger:          'Hunger (1–10)',
  adherence:       'Plan adherence (%)',
}

const CONVERTIBLE_BASE: Record<string, string> = {
  weight_kg: 'Weight',
  waist_cm:  'Waist',
  water_ml:  'Water',
}

const METRIC_SLUGS_ORDER = [
  'weight_kg',
  'waist_cm',
  'bp_systolic',
  'bp_diastolic',
  'heart_rate',
  'steps',
  'active_min',
  'calories_burned',
  'sleep_hrs',
  'sodium_mg',
  'water_ml',
  'calories_in',
  'protein_g',
  'mood',
  'hunger',
  'adherence',
] as const

function metricOptionLabel(
  slug: string,
  prefs: Record<string, string>,
  available: Record<string, readonly string[]>
): string {
  const fixed = STATIC_METRIC_LABELS[slug]
  if (fixed) return fixed
  const base = CONVERTIBLE_BASE[slug]
  const canon = CANONICAL_UNIT_BY_SLUG[slug]
  if (base && canon) {
    const eff = effectiveUnitPreferences(prefs, available)
    const du = displayUnitForMetric(slug, canon, eff)
    return `${base} (${formatUnitForUi(du)})`
  }
  return slug
}

type Tab = 'metrics' | 'meals'

export default function LogPage() {
  const [tab, setTab] = useState<Tab>('metrics')

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Log</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: '2rem' }}>
        Record a measurement or meal
      </p>

      {/* Tab switcher */}
      <div style={{
        display:      'flex',
        gap:          '0.25rem',
        background:   'var(--bg-subtle)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding:      '3px',
        marginBottom: '1.75rem',
        width:        'fit-content',
      }}>
        {(['metrics', 'meals'] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            padding:        '0.4rem 1.25rem',
            borderRadius:   'calc(var(--radius-md) - 2px)',
            border:         'none',
            cursor:         'pointer',
            fontSize:       14,
            fontFamily:     'var(--font-body)',
            fontWeight:     tab === t ? 500 : 400,
            background:     tab === t ? 'var(--bg-card)' : 'transparent',
            color:          tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow:      tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition:     'all 0.15s',
            textTransform:  'capitalize',
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'metrics' ? <MetricForm /> : <MealForm />}
    </div>
  )
}

function MetricForm() {
  const [slug, setSlug]       = useState<string>(METRIC_SLUGS_ORDER[0])
  const [value, setValue]      = useState('')
  const [datetime, setDatetime] = useState('')
  const [loading, setLoading]  = useState(false)
  const [success, setSuccess]  = useState<string | null>(null)
  const [error, setError]      = useState<string | null>(null)
  const [prefs, setPrefs]      = useState<Record<string, string>>({})
  const [available, setAvailable] = useState<Record<string, readonly string[]>>({})

  const loadPrefs = useCallback(() => {
    api
      .getPreferences()
      .then(d => {
        setPrefs(d.unitPreferences)
        setAvailable(d.availableDisplayUnits)
      })
      .catch(() => {
        setPrefs({})
        setAvailable({})
      })
  }, [])

  useEffect(() => {
    loadPrefs()
  }, [loadPrefs])

  const options = useMemo(
    () =>
      METRIC_SLUGS_ORDER.map(s => ({
        slug:  s,
        label: metricOptionLabel(s, prefs, available),
      })),
    [prefs, available]
  )

  const eff = useMemo(
    () => effectiveUnitPreferences(prefs, available),
    [prefs, available]
  )

  const valueUnitHint = useMemo(() => {
    if (!isConvertibleMetricSlug(slug)) return null
    const canon = CANONICAL_UNIT_BY_SLUG[slug]
    if (!canon) return null
    return formatUnitForUi(displayUnitForMetric(slug, canon, eff))
  }, [slug, eff])

  async function submit() {
    if (!value) return
    setLoading(true)
    setSuccess(null)
    setError(null)
    try {
      const num = parseFloat(value)
      if (Number.isNaN(num)) {
        setError('Enter a valid number')
        return
      }
      const canon = CANONICAL_UNIT_BY_SLUG[slug]
      const inputUnit = canon
        ? inputUnitForLogging(slug, canon, prefs, available)
        : undefined
      await api.logMetric(slug, num, datetime || undefined, inputUnit)
      const label = options.find(m => m.slug === slug)?.label ?? slug
      setSuccess(`Logged: ${label} = ${value}`)
      setValue('')
      setDatetime('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label className="label" htmlFor="log-metric" style={{ display: 'block', marginBottom: 6 }}>Metric</label>
        <select
          id="log-metric"
          className="input"
          value={slug}
          onChange={e => setSlug(e.target.value)}
        >
          {options.map(m => (
            <option key={m.slug} value={m.slug}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="log-metric-value" style={{ display: 'block', marginBottom: 6 }}>
          Value
          {valueUnitHint && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              {' '}({valueUnitHint})
            </span>
          )}
        </label>
        <input
          id="log-metric-value"
          className="input"
          type="number"
          step="any"
          placeholder="Enter value"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Values are converted to the app’s storage units automatically.{' '}
          <Link href="/settings" style={{ color: 'var(--accent)' }}>Unit preferences</Link>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="log-metric-datetime" style={{ display: 'block', marginBottom: 6 }}>
          Date & time <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional, defaults to now)</span>
        </label>
        <input
          id="log-metric-datetime"
          className="input"
          type="datetime-local"
          value={datetime}
          onChange={e => setDatetime(e.target.value)}
        />
      </div>

      {success && (
        <div style={{
          padding: '0.625rem 0.875rem',
          background: '#e8f5e9',
          borderRadius: 'var(--radius-md)',
          color: '#2e7d32',
          fontSize: 14,
        }}>
          ✓ {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.625rem 0.875rem',
          background: '#ffebee',
          borderRadius: 'var(--radius-md)',
          color: '#c62828',
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <button
        type="button"
        className="btn-primary"
        onClick={() => void submit()}
        disabled={loading || !value}
        style={{ alignSelf: 'flex-start', opacity: loading || !value ? 0.6 : 1 }}
      >
        {loading ? 'Saving…' : 'Save measurement'}
      </button>
    </div>
  )
}

function MealForm() {
  const [description, setDescription] = useState('')
  const [mealType,    setMealType]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  async function submit() {
    if (!description.trim()) return
    setLoading(true)
    setSuccess(null)
    setError(null)
    try {
      await api.logMeal(description.trim(), mealType || undefined)
      setSuccess('Meal logged successfully')
      setDescription('')
      setMealType('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label className="label" htmlFor="log-meal-type" style={{ display: 'block', marginBottom: 6 }}>Meal type</label>
        <select
          id="log-meal-type"
          className="input"
          value={mealType}
          onChange={e => setMealType(e.target.value)}
        >
          <option value="">— Select (optional)</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="log-meal-desc" style={{ display: 'block', marginBottom: 6 }}>What did you eat?</label>
        <textarea
          id="log-meal-desc"
          className="input"
          rows={4}
          placeholder="e.g. Grilled salmon with steamed broccoli and brown rice, water to drink"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ resize: 'vertical', lineHeight: 1.5 }}
        />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Be descriptive — the AI will estimate sodium, calories, and plan adherence
        </div>
      </div>

      {success && (
        <div style={{
          padding: '0.625rem 0.875rem',
          background: '#e8f5e9',
          borderRadius: 'var(--radius-md)',
          color: '#2e7d32',
          fontSize: 14,
        }}>
          ✓ {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.625rem 0.875rem',
          background: '#ffebee',
          borderRadius: 'var(--radius-md)',
          color: '#c62828',
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <button
        type="button"
        className="btn-primary"
        onClick={submit}
        disabled={loading || !description.trim()}
        style={{ alignSelf: 'flex-start', opacity: loading || !description.trim() ? 0.6 : 1 }}
      >
        {loading ? 'Saving…' : 'Log meal'}
      </button>
    </div>
  )
}
