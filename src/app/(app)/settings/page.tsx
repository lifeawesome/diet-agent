'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { CoachingSettings } from '@/components/CoachingSettings'
import { api } from '@/lib/api'
import {
  PREFERENCE_KEY_LABELS,
  UNIT_LABELS,
  effectiveUnitPreferences,
} from '@/lib/unit-preferences'

export default function SettingsPage() {
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)
  const [available, setAvailable]   = useState<Record<string, readonly string[]>>({})
  const [form, setForm]             = useState<Record<string, string>>({})

  const load = useCallback(() => {
    setError(null)
    setSuccess(null)
    return api
      .getPreferences()
      .then(data => {
        setAvailable(data.availableDisplayUnits)
        setForm(
          effectiveUnitPreferences(
            data.unitPreferences,
            data.availableDisplayUnits
          )
        )
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const keys = Object.keys(available).sort()

  function setUnit(key: string, unit: string) {
    setForm(prev => ({ ...prev, [key]: unit }))
    setSuccess(null)
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await api.patchPreferences(form)
      setForm(
        effectiveUnitPreferences(
          data.unitPreferences,
          data.availableDisplayUnits
        )
      )
      setSuccess('Preferences saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function resetToDefaults() {
    const defaults = effectiveUnitPreferences({}, available)
    setForm(defaults)
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await api.patchPreferences(defaults)
      setForm(
        effectiveUnitPreferences(
          data.unitPreferences,
          data.availableDisplayUnits
        )
      )
      setSuccess('Reset to defaults.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Settings</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: '1.5rem' }}>
        Diet context, goals, and how measurements are displayed.{' '}
        <Link href="/billing" style={{ color: 'var(--accent)' }}>
          Billing &amp; subscription
        </Link>
      </p>

      <CoachingSettings />

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.35rem',
        marginBottom: '0.5rem',
      }}>
        Units
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: '1.25rem' }}>
        Values are stored in canonical units; the API converts for display and when you log.
      </p>

      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      )}

      {error && (
        <div
          className="card"
          style={{
            color: 'var(--down)',
            marginBottom: '1rem',
            maxWidth: 480,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="card"
          style={{
            color: 'var(--accent-dark)',
            marginBottom: '1rem',
            maxWidth: 480,
            fontSize: 14,
          }}
        >
          {success}
        </div>
      )}

      {!loading && keys.length === 0 && !error && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          No unit preferences are available from the API yet.
        </p>
      )}

      {!loading &&
        keys.map(key => {
          const options = available[key] ?? []
          const title =
            PREFERENCE_KEY_LABELS[key] ??
            key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          return (
            <div
              key={key}
              className="card"
              style={{ marginBottom: '1rem' }}
            >
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
                {title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {options.map(unit => {
                  const id = `${key}-${unit}`
                  const label = UNIT_LABELS[unit] ?? unit
                  return (
                    <label
                      key={unit}
                      htmlFor={id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        cursor: 'pointer',
                        fontSize: 15,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <input
                        id={id}
                        type="radio"
                        name={key}
                        checked={form[key] === unit}
                        onChange={() => setUnit(key, unit)}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      {label}
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}

      {!loading && keys.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginTop: '0.5rem',
          }}
        >
          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={saving}
            onClick={() => void resetToDefaults()}
          >
            Use defaults
          </button>
        </div>
      )}

      {!loading && keys.length > 0 && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: '1.25rem',
            lineHeight: 1.5,
          }}
        >
          Defaults match each measurement’s first listed unit (metric) until you save something else.
        </p>
      )}
    </div>
  )
}
