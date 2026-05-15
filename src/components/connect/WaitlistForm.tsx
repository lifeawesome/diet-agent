'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const EMAIL_RE = /^\S+@\S+\.\S+$/

async function fetchWaitlistStatus(): Promise<{ entries?: { signed_up_at: string }[] } | null> {
  const res = await fetch('/api/waitlist', { credentials: 'same-origin' })
  if (res.status === 401 || res.status === 403) return null
  if (!res.ok) return null
  return (await res.json()) as { entries: { signed_up_at: string }[] }
}

export type WaitlistInterest = 'plus' | 'business' | 'enterprise' | 'unsure'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [interest, setInterest] = useState<WaitlistInterest | ''>('')
  const [loadingBootstrap, setLoadingBootstrap] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [phase, setPhase] = useState<'form' | 'thanks' | 'error'>('form')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const emailOk = EMAIL_RE.test(email.trim())
  const canSubmit = emailOk && interest !== ''

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const fromSession = typeof user?.email === 'string' ? user.email : ''
        if (!cancelled && fromSession) setEmail(prev => prev || fromSession)

        const data = await fetchWaitlistStatus()
        if (cancelled || !data) return
        if (data.entries && data.entries.length > 0) setPhase('thanks')
      } catch {
        /* show form */
      } finally {
        if (!cancelled) setLoadingBootstrap(false)
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const radios = useMemo(
    () =>
      [
        { value: 'plus' as const, label: 'Plus' },
        { value: 'business' as const, label: 'Business' },
        { value: 'enterprise' as const, label: 'Enterprise' },
        { value: 'unsure' as const, label: 'Not sure yet' },
      ] as const,
    [],
  )

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setErrorMsg(null)
    setPhase('form')
    try {
      const res = await fetch('/api/waitlist', {
        method:         'POST',
        credentials:    'same-origin',
        headers:        { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:            email.trim(),
          client_interest:  interest as WaitlistInterest,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
      if (!res.ok) {
        setPhase('error')
        setErrorMsg(body.message ?? body.error ?? `Request failed (${res.status})`)
        return
      }
      setPhase('thanks')
    } catch {
      setPhase('error')
      setErrorMsg('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, email, interest])

  if (loadingBootstrap) {
    return (
      <p className="text-center font-body text-sm text-sage-500" role="status">
        Loading…
      </p>
    )
  }

  if (phase === 'thanks') {
    return (
      <div className="space-y-5 text-center" aria-live="polite">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[#5a9175]" aria-hidden>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
          <p className="font-body text-base text-sage-900">
            Thanks! We&apos;ll email you the moment ChatGPT support is live.
          </p>
        </div>

        <details className="mx-auto max-w-xs text-center">
          <summary className="cursor-pointer py-2 font-body text-sm font-medium text-[#2F5944] underline decoration-sage-300 underline-offset-[3px]">
            Sign up another email
          </summary>
          <div className="mt-3 rounded-xl border border-sand-200 bg-sand-50/80 px-4 py-3 text-left font-body">
            <p className="text-xs leading-relaxed text-sage-600">
              Separate addresses can each get notified when ChatGPT launches.
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-sm font-medium text-sage-900 ring-1 ring-sand-200 hover:bg-sand-50"
              onClick={() => {
                setInterest('')
                setPhase('form')
                setErrorMsg(null)
              }}
            >
              Start fresh
            </button>
          </div>
        </details>
      </div>
    )
  }

  return (
    <section className="space-y-8">
      <h3 id="waitlist-heading" className="sr-only">
        ChatGPT waitlist signup
      </h3>

      <div aria-hidden className="flex justify-center opacity-75">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-sand-300 to-transparent" />
      </div>
      <p className="text-center font-body text-[13px] font-medium uppercase tracking-[0.08em] text-sage-500">
        Get notified when it&apos;s ready
      </p>

      {phase === 'error' ?
        (
          <div className="rounded-xl border border-red-100 bg-red-50/70 p-4 text-center font-body text-sm text-red-900" role="alert">
            <p>{errorMsg}</p>
            <button type="button" className="mt-3 font-medium underline" onClick={() => setPhase('form')}>
              Try again
            </button>
          </div>
        )
      : null}

      <div className="space-y-5 rounded-2xl border border-sand-200 bg-sand-50/40 px-5 py-6 sm:px-7">
        <label htmlFor="waitlist-email" className="block">
          <span className="sr-only">Email</span>
          <input
            id="waitlist-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={submitting}
            autoComplete="email"
            className="w-full rounded-xl border border-sand-300 bg-white px-4 py-3 font-body text-sage-950 placeholder:text-sage-400 focus:border-[#2F5944] focus:outline-none focus:ring-2 focus:ring-[#2F5944]/20 disabled:opacity-60"
          />
        </label>

        <fieldset className="border-0 p-0 m-0 min-w-0">
          <legend className="font-body text-sm font-medium text-sage-950">
            Which plan are you on?
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {radios.map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-2 rounded-xl border border-sand-200 bg-white px-3 py-3 font-body text-sm text-sage-900 has-[:checked]:border-[#2F5944]/40 has-[:checked]:bg-[#2F5944]/[0.06]"
              >
                <input
                  type="radio"
                  name="chatgpt-plan"
                  value={value}
                  checked={interest === value}
                  onChange={() => setInterest(value)}
                  disabled={submitting}
                  className="mt-0.5 h-4 w-4 shrink-0 border-sand-400 text-[#2F5944] focus:ring-[#2F5944]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={!canSubmit || submitting}
          className="relative w-full rounded-xl bg-[#2F5944] px-4 py-3 font-body text-sm font-medium text-white shadow-sm transition hover:bg-[#264a39] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ?
            (
              <span className="inline-flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting…
              </span>
            )
          : 'Notify me'}
        </button>
      </div>
    </section>
  )
}
