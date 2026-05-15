'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { api, type McpConnection } from '@/lib/api'

type Props = {
  row: McpConnection
  onRevoked: () => void
}

export function ConnectionRow({ row, onRevoked }: Props) {
  const [dialog, setDialog] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function revoke() {
    setBusy(true)
    setErr(null)
    try {
      await api.revokeMcpConnection(row.clientId)
      setDialog(false)
      onRevoked()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Revoke failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-sand-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg text-sage-950">{row.clientName}</p>
          <p className="mt-1 font-mono text-xs text-sage-500">{row.clientId}</p>
          <dl className="mt-3 grid gap-1 font-body text-sm text-sage-700 sm:grid-cols-2">
            <div>
              <dt className="text-sage-500">Connected</dt>
              <dd>{new Date(row.connectedAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sage-500">Last used</dt>
              <dd>
                {row.lastUsedAt
                  ? formatDistanceToNow(new Date(row.lastUsedAt), { addSuffix: true })
                  : '—'}
              </dd>
            </div>
          </dl>
          {row.scopes.length > 0 && (
            <p className="mt-2 text-xs text-sage-600">
              Scopes: {row.scopes.join(', ')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDialog(true)}
          className="h-fit rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-body text-sm font-medium text-red-900 hover:bg-red-100"
        >
          Revoke
        </button>
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-title"
        >
          <div className="max-w-md rounded-2xl border border-sand-200 bg-white p-6 shadow-xl">
            <h2 id="revoke-title" className="font-display text-xl text-sage-950">
              Revoke {row.clientName}?
            </h2>
            <p className="mt-2 font-body text-sm text-sage-700">
              This revokes all access and refresh tokens for this client. Your AI assistant will need to authorize
              again to use DietAgent.
            </p>
            {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-sand-300 px-4 py-2 font-body text-sm"
                onClick={() => setDialog(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-700 px-4 py-2 font-body text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
                onClick={() => void revoke()}
                disabled={busy}
              >
                {busy ? 'Revoking…' : 'Revoke access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
