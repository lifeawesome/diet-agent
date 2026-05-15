'use client'

import { useId, useMemo, useState } from 'react'
import {
  MCP_CLIENT_ORDER,
  type ActiveClientDescriptor,
} from '@/lib/clients'
import { featureFlags } from '@/lib/feature-flags'
import { ClaudeInstructions } from '@/components/connect/ClaudeInstructions'
import { ChatGPTInstructions } from '@/components/connect/ChatGPTInstructions'
import { ChatGPTComingSoon } from '@/components/connect/ChatGPTComingSoon'

type AiTab = ActiveClientDescriptor['id']

/** Status-aware Claude / ChatGPT tablist for the Connect flow. */
export function ConnectTabs() {
  const tabsId = useId()
  const [tab, setTab] = useState<AiTab>('claude')

  const tabsToShow = useMemo(
    () => MCP_CLIENT_ORDER.filter(c => !(c.id === 'chatgpt' && c.status === 'hidden')),
    [],
  )

  const showChatgptTab = tabsToShow.some(c => c.id === 'chatgpt')

  return (
    <>
      {!showChatgptTab ?
        <ClaudeInstructions />
      : (
        <>
          <div
            role="tablist"
            aria-label="Choose AI assistant connector instructions"
            className="flex flex-wrap gap-2 border-b border-sand-200 pb-px sm:gap-3"
          >
            {tabsToShow.map(c => {
              const selected = tab === c.id
              const chatComing = c.id === 'chatgpt' && c.status === 'coming_soon'
              const isComingSoonChatgpt = chatComing
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${tabsId}-${c.id}-panel`}
                  title={
                    isComingSoonChatgpt ?
                      'Full ChatGPT support is on the way. Click for details.'
                    : undefined
                  }
                  id={`${tabsId}-tab-${c.id}`}
                  onClick={() => setTab(c.id)}
                  className={`flex items-center gap-2 rounded-t-xl px-4 py-2 font-body text-sm font-medium outline-none ring-offset-2 transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#2F5944]/50 ${
                    selected ?
                      'bg-white text-[#2F5944] shadow-sm ring-1 ring-sand-200 opacity-100'
                    : chatComing ?
                      'text-sage-700 opacity-60 hover:opacity-80'
                    : 'text-sage-600 opacity-95 hover:text-sage-950'
                  }`}
                >
                  <span aria-hidden>{c.id === 'claude' ? '⬣' : '⬗'}</span>
                  <span>{c.label}</span>
                  {chatComing ?
                    (
                      <span
                        aria-label="Coming soon"
                        className="rounded-full bg-amber-100/60 px-2 py-0.5 text-xs font-medium text-amber-900"
                      >
                        Coming soon
                      </span>
                    )
                  : null}
                </button>
              )
            })}
          </div>

          <section
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-${tab}`}
            id={`${tabsId}-${tab}-panel`}
            className="mt-6 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2F5944]/40 focus-visible:outline-offset-4"
          >
            {tab === 'claude' ? <ClaudeInstructions /> : null}
            {tab === 'chatgpt' && featureFlags.chatgpt === 'active' ?
              <ChatGPTInstructions />
            : null}
            {tab === 'chatgpt' && featureFlags.chatgpt === 'coming_soon' ?
              <ChatGPTComingSoon onGoToClaude={() => setTab('claude')} />
            : null}
          </section>
        </>
      )}
    </>
  )
}
