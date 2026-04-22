'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  api,
  type CoachingGoalInput,
  type CoachingSnapshot,
  type DietPlanRow,
  type MetricTypeRow,
} from '@/lib/api'

type GoalDraft = {
  metricSlug: string
  targetValue: string
  startsOn: string
  endsOn: string
}

function emptyGoalDraft(metricTypes: MetricTypeRow[]): GoalDraft {
  const first = metricTypes[0]?.slug ?? 'weight'
  return {
    metricSlug:  first,
    targetValue: '',
    startsOn:    '',
    endsOn:      '',
  }
}

export function CoachingSettings() {
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [dietPlans, setDietPlans]     = useState<DietPlanRow[]>([])
  const [metricTypes, setMetricTypes] = useState<MetricTypeRow[]>([])
  const [coaching, setCoaching]       = useState<CoachingSnapshot | null>(null)

  const [dietSlug, setDietSlug]       = useState('')
  const [objectives, setObjectives]   = useState('')
  const [goalRows, setGoalRows]       = useState<GoalDraft[]>([])

  const load = useCallback(() => {
    setError(null)
    return Promise.all([
      api.getDietPlans(),
      api.getMetricTypes(),
      api.getCoaching(),
    ])
      .then(([plans, metrics, snap]) => {
        setDietPlans(plans)
        setMetricTypes(metrics)
        setCoaching(snap)
        setDietSlug(snap.activeDietPlan?.slug ?? '')
        setObjectives(snap.objectivesText ?? '')
        setGoalRows(
          snap.goals.length > 0
            ? snap.goals.map(g => ({
                metricSlug:  g.metricSlug,
                targetValue: String(g.targetValue),
                startsOn:    g.startsOn,
                endsOn:      g.endsOn ?? '',
              }))
            : metrics.length > 0
              ? [emptyGoalDraft(metrics)]
              : []
        )
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load coaching'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function addGoalRow() {
    setGoalRows(prev => [...prev, emptyGoalDraft(metricTypes)])
  }

  function removeGoalRow(index: number) {
    setGoalRows(prev => prev.filter((_, i) => i !== index))
  }

  function updateGoalRow(index: number, patch: Partial<GoalDraft>) {
    setGoalRows(prev =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    )
  }

  async function saveDiet() {
    if (!dietSlug) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const snap = await api.putActiveDiet(dietSlug)
      setCoaching(snap)
      setSuccess('Diet plan updated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function saveObjectives() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const snap = await api.patchCoachingObjectives(
        objectives.trim() === '' ? null : objectives.trim()
      )
      setCoaching(snap)
      setSuccess('Goals narrative saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function saveStructuredGoals() {
    const inputs: CoachingGoalInput[] = []
    for (const row of goalRows) {
      const tv = parseFloat(row.targetValue)
      if (row.metricSlug.trim() === '' || Number.isNaN(tv)) continue
      const g: CoachingGoalInput = {
        metricSlug:  row.metricSlug.trim(),
        targetValue: tv,
      }
      if (row.startsOn.trim()) g.startsOn = row.startsOn
      if (row.endsOn.trim()) g.endsOn = row.endsOn.trim()
      else g.endsOn = null
      inputs.push(g)
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const snap = await api.putCoachingGoals(inputs)
      setCoaching(snap)
      setGoalRows(
        snap.goals.length > 0
          ? snap.goals.map(g => ({
              metricSlug:  g.metricSlug,
              targetValue: String(g.targetValue),
              startsOn:    g.startsOn,
              endsOn:      g.endsOn ?? '',
            }))
          : metricTypes.length > 0
            ? [emptyGoalDraft(metricTypes)]
            : []
      )
      setSuccess('Structured goals saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: '2rem' }}>
        Loading coaching…
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.35rem',
        marginBottom: '0.5rem',
      }}>
        Diet & goals
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: '1.25rem' }}>
        Your coach uses this context for chat and recommendations — not limited to one diet type.
      </p>

      {error && (
        <div className="card" style={{ color: 'var(--down)', marginBottom: '1rem', maxWidth: 560 }}>
          {error}
        </div>
      )}
      {success && (
        <div className="card" style={{ color: 'var(--accent-dark)', marginBottom: '1rem', fontSize: 14 }}>
          {success}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          Active diet type
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <label htmlFor="diet-plan" className="label" style={{ marginBottom: 0 }}>
            Plan
          </label>
          <select
            id="diet-plan"
            className="input"
            style={{ maxWidth: 320, flex: '1 1 200px' }}
            value={dietSlug}
            onChange={e => {
              setDietSlug(e.target.value)
              setSuccess(null)
            }}
          >
            <option value="">— Select —</option>
            {dietPlans.map(p => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary"
            disabled={saving || !dietSlug}
            onClick={() => void saveDiet()}
          >
            Save diet
          </button>
        </div>
        {coaching?.activeDietPlan && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            {coaching.activeDietPlan.description ?? ''}
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          Coaching goals (narrative)
        </div>
        <label htmlFor="coaching-objectives" className="label" style={{ display: 'block', marginBottom: 6 }}>
          What you’re working toward (free text)
        </label>
        <textarea
          id="coaching-objectives"
          className="input"
          rows={4}
          placeholder="e.g. More energy for hiking; feel confident at my next check-in…"
          value={objectives}
          onChange={e => {
            setObjectives(e.target.value)
            setSuccess(null)
          }}
          style={{ width: '100%', resize: 'vertical', marginBottom: '0.75rem' }}
        />
        <button
          type="button"
          className="btn-primary"
          disabled={saving}
          onClick={() => void saveObjectives()}
        >
          Save narrative
        </button>
      </div>

      <div className="card">
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem',
          }}
        >
          Structured metric goals
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Targets tied to metrics (replaces your previous list on save).
        </p>

        {goalRows.length === 0 && metricTypes.length > 0 && (
          <button type="button" className="btn-ghost" onClick={addGoalRow} style={{ marginBottom: '1rem' }}>
            + Add goal
          </button>
        )}

        {goalRows.map((row, index) => (
          <div
            key={index}
            style={{
              display:       'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) auto',
              gap:           '0.5rem',
              alignItems:    'end',
              marginBottom:  '0.75rem',
            }}
          >
            <div>
              <label className="label" htmlFor={`goal-metric-${index}`} style={{ display: 'block', marginBottom: 4 }}>
                Metric
              </label>
              <select
                id={`goal-metric-${index}`}
                className="input"
                value={row.metricSlug}
                onChange={e => updateGoalRow(index, { metricSlug: e.target.value })}
              >
                {metricTypes.map(m => (
                  <option key={m.slug} value={m.slug}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor={`goal-target-${index}`} style={{ display: 'block', marginBottom: 4 }}>
                Target
              </label>
              <input
                id={`goal-target-${index}`}
                className="input"
                type="number"
                step="any"
                placeholder="0"
                value={row.targetValue}
                onChange={e => updateGoalRow(index, { targetValue: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor={`goal-start-${index}`} style={{ display: 'block', marginBottom: 4 }}>
                Start
              </label>
              <input
                id={`goal-start-${index}`}
                className="input"
                type="date"
                value={row.startsOn}
                onChange={e => updateGoalRow(index, { startsOn: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor={`goal-end-${index}`} style={{ display: 'block', marginBottom: 4 }}>
                End
              </label>
              <input
                id={`goal-end-${index}`}
                className="input"
                type="date"
                value={row.endsOn}
                onChange={e => updateGoalRow(index, { endsOn: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => removeGoalRow(index)}
              style={{ padding: '0.35rem 0.5rem' }}
            >
              Remove
            </button>
          </div>
        ))}

        {goalRows.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-ghost" onClick={addGoalRow}>
              + Add goal
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={saving}
              onClick={() => void saveStructuredGoals()}
            >
              Save structured goals
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
