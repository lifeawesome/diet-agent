'use client'

import { useState } from 'react'

const MCP_URL =
  process.env.NEXT_PUBLIC_MCP_URL?.trim() ||
  `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'https://api.dietagent.com'}/mcp`

export function ConnectorUrl() {
  const [copied, setCopied] = useState(false)

  function copy() {
    void navigator.clipboard.writeText(MCP_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={() => copy()}
      className="w-full break-all rounded-2xl border-2 border-dashed border-[#2F5944]/40 bg-white px-4 py-4 text-left font-mono text-sm text-sage-900 shadow-sm transition hover:border-[#2F5944] hover:bg-sage-50/50 sm:text-base"
    >
      <span className="block text-xs font-body font-normal text-sage-500">
        MCP server URL {copied ? '· copied' : '· tap to copy'}
      </span>
      {MCP_URL}
    </button>
  )
}

export const mcpServerUrl = MCP_URL
