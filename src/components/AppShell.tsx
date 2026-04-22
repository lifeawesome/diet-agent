'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api'
import { Sidebar } from '@/components/Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [state, setState] = useState<'loading' | 'paid' | 'unpaid' | 'error'>('loading')
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setState('loading')
    setErrMsg(null)
    api
      .getEntitlement()
      .then(e => setState(e.hasAccess ? 'paid' : 'unpaid'))
      .catch(e => {
        const msg = e instanceof Error ? e.message : 'Could not verify subscription'
        setErrMsg(msg)
        setState('error')
      })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** Billing page can refresh after Stripe redirect without blocking the whole app */
  useEffect(() => {
    if (path?.startsWith('/billing') && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('success') === '1') refresh()
    }
  }, [path, refresh])

  async function signOut() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      localStorage.removeItem('dietagent_token')
    }
    window.location.href = '/'
  }

  if (state === 'loading') {
    return (
      <div style={{ padding: '3rem 2rem', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div style={{ maxWidth: 480, margin: '3rem auto', padding: '0 1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Could not load account</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {errMsg}
          </div>
          <button type="button" className="btn-primary" onClick={() => refresh()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (state === 'unpaid') {
    return (
      <div style={{ maxWidth: 520, margin: '3rem auto', padding: '0 1.5rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            Subscription required
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            DietAgent is available with an active subscription (web via Stripe, or the iOS app via the App Store).
            Choose a plan to continue.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href="/billing" className="btn-primary" style={{ textDecoration: 'none' }}>
              View plans &amp; subscribe
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onSignOut={() => void signOut()} />
      <main
        style={{
          flex: 1,
          padding: '2rem 2.5rem',
          maxWidth: '1200px',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  )
}
