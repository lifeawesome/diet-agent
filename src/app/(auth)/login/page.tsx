'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { navigateAfterAuth } from '@/lib/navigate-after-auth'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo =
    searchParams.get('return_to') ??
    searchParams.get('redirect') ??
    '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message)
        return
      }
      navigateAfterAuth(redirectTo)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '3rem auto', padding: '0 1.5rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          marginBottom: '0.5rem',
        }}
      >
        Log in
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: '1.5rem' }}>
        Use the email and password for your DietAgent account.
      </p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="label">Email</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <div style={{ color: 'var(--down)', fontSize: 14 }} role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem', fontSize: 14, color: 'var(--text-muted)' }}>
        No account?{' '}
        <Link href="/signup" style={{ color: 'var(--accent)' }}>
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', color: 'var(--text-muted)' }}>Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}
