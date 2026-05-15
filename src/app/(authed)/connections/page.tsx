'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { api, type McpConnection } from '@/lib/api'
import { ConnectionRow } from '@/components/connections/ConnectionRow'
import { getAssistantListForConnectEmptyState } from '@/lib/clients'

export default function ConnectionsPage() {
  const [rows, setRows] = useState<McpConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setErr(null)
    return api
      .getMcpConnections()
      .then(r => setRows(r.connections))
      .catch(e => setErr(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <header>
        <h1 className="font-display text-3xl text-sage-950 sm:text-4xl">Connected AI clients</h1>
        <p className="mt-2 font-body text-sage-700">
          Every assistant that uses DietAgent through MCP appears here. Revoke a client anytime.
        </p>
      </header>

      {loading && <p className="text-sage-600">Loading…</p>}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{err}</div>
      )}
      {!loading && !err && rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-sand-300 bg-sand-50 p-8 text-center font-body text-sage-700">
          No connections yet.{' '}
          <Link href="/connect" className="text-[#2F5944] underline underline-offset-2">
            Connect {getAssistantListForConnectEmptyState()}
          </Link>
          .
        </p>
      )}
      <div className="space-y-4">
        {rows.map(r => (
          <ConnectionRow key={r.clientId} row={r} onRevoked={() => void load()} />
        ))}
      </div>
    </div>
  )
}
