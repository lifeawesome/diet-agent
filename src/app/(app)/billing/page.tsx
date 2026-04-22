'use client'

import { useEffect, useState } from 'react'
import { api, type EntitlementResponse } from '@/lib/api'

export default function BillingPage() {
  const [data, setData] = useState<EntitlementResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  function load() {
    setError(null)
    api
      .getEntitlement()
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function subscribe() {
    setCheckoutLoading(true)
    setError(null)
    try {
      const { url } = await api.createCheckoutSession()
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function manage() {
    setPortalLoading(true)
    setError(null)
    try {
      const { url } = await api.createPortalSession()
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading billing…</div>
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem' }}>
        Billing
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: '1.5rem' }}>
        Web subscriptions use Stripe. iOS subscriptions are managed in the App Store; they sync to your account
        when you use the same sign-in and complete purchase or restore.
      </p>

      {error && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem', color: 'var(--down)', fontSize: 14 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div className="label" style={{ marginBottom: '0.75rem' }}>Status</div>
        <div style={{ fontSize: 15 }}>
          {data?.hasAccess ? (
            <span style={{ color: '#2e7d32' }}>Active subscription</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No active subscription</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
        <button
          type="button"
          className="btn-primary"
          disabled={checkoutLoading}
          onClick={() => void subscribe()}
        >
          {checkoutLoading ? 'Redirecting…' : 'Subscribe with Stripe'}
        </button>
        <button
          type="button"
          disabled={portalLoading}
          onClick={() => void manage()}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'transparent',
            cursor: portalLoading ? 'wait' : 'pointer',
            fontSize: 14,
          }}
        >
          {portalLoading ? 'Opening…' : 'Manage subscription'}
        </button>
      </div>

      {data && data.entitlements.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: '0.75rem' }}>Entitlements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.entitlements.map(row => (
              <div
                key={row.id}
                className="card"
                style={{ padding: '0.75rem 1rem', fontSize: 13 }}
              >
                <strong style={{ textTransform: 'capitalize' }}>{row.provider}</strong>
                {' · '}
                {row.status}
                {row.current_period_end && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {' '}
                    · renews / ends {new Date(row.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
