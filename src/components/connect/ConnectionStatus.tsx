'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api, type McpConnection } from '@/lib/api'

export function ConnectionStatus() {
  const [list, setList] = useState<McpConnection[] | null>(null)

  useEffect(() => {
    api
      .getMcpConnections()
      .then(r => setList(r.connections))
      .catch(() => setList([]))
  }, [])

  if (list === null) {
    return <p className="text-sm text-sage-600">Checking connections…</p>
  }
  if (list.length === 0) {
    return (
      <p className="font-body text-sm text-sage-700">
        No AI assistants connected yet. Follow the steps above.
      </p>
    )
  }
  return (
    <p className="font-body text-sm text-sage-800">
      <span className="text-emerald-700">✓</span> Connected:{' '}
      {list
        .map(c => `${c.clientName} (added ${format(new Date(c.connectedAt), 'MMM d')})`)
        .join(', ')}
      .{' '}
      <Link href="/connections" className="text-[#2F5944] underline underline-offset-2">
        Manage connections
      </Link>
    </p>
  )
}
