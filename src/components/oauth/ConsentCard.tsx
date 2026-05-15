'use client'

import { useState } from 'react'
import { ClientNameBadge } from '@/components/oauth/ClientNameBadge'
import { Button } from '@/components/ui/Button'

export type ConsentPreview = {
  client_name: string
  scopes_requested: { scope: string; description: string }[]
}

type Props = {
  preview: ConsentPreview
  /** All OAuth query params from the consent redirect */
  oauthParams: Record<string, string>
  userEmail: string | null
}

export function ConsentCard({ preview, oauthParams, userEmail }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(decision: 'allow' | 'deny') {
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/oauth/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, params: oauthParams }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        redirectUrl?: string
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }
      setError(data.error ?? 'Something went wrong. Please try again.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-sand-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-600 font-display text-lg text-white">
            DA
          </div>
          <span className="font-body text-xs text-sage-700">DietAgent</span>
        </div>
        <span className="text-lg text-sand-400" aria-hidden>
          ↔
        </span>
        <div className="flex flex-col items-center gap-2">
          <ClientNameBadge name={preview.client_name} />
        </div>
      </div>

      <h1 className="mb-2 text-center font-display text-2xl text-sage-950 sm:text-[1.65rem]">
        {preview.client_name} is requesting access to your DietAgent account
      </h1>

      <p className="mb-6 text-center font-body text-sm text-sage-700">
        This will allow {preview.client_name} to:
      </p>

      <ul className="mb-8 space-y-3 font-body text-sm leading-relaxed text-sage-800">
        {preview.scopes_requested.map(s => (
          <li key={s.scope} className="flex gap-2">
            <span className="text-sage-500" aria-hidden>
              ✓
            </span>
            <span>{s.description}</span>
          </li>
        ))}
      </ul>

      <p className="mb-8 rounded-xl bg-sand-50 px-4 py-3 text-center font-body text-sm text-sage-700">
        Signed in as:{' '}
        <strong className="text-sage-900">{userEmail ?? 'your account'}</strong>
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center font-body text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          className="w-full justify-center py-3 text-base"
          disabled={pending}
          onClick={() => void submit('allow')}
        >
          {pending ? 'Working…' : 'Allow access'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-center py-3"
          disabled={pending}
          onClick={() => void submit('deny')}
        >
          Cancel
        </Button>
      </div>

      <p className="mt-8 text-center font-body text-xs leading-relaxed text-sage-600">
        You can revoke this access anytime in{' '}
        <a href="/connections" className="text-sage-700 underline underline-offset-2">
          Connected AI clients
        </a>
        .
      </p>
    </div>
  )
}
