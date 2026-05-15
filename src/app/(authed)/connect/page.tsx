'use client'

import { ConnectTabs } from '@/components/connect/ConnectTabs'
import { ConnectionStatus } from '@/components/connect/ConnectionStatus'
import {
  connectPageConnectorRestrictionsNote,
  getConnectPageHeading,
  getConnectPageIntro,
} from '@/lib/clients'

export default function ConnectPage() {
  const heading = getConnectPageHeading()
  const intro = getConnectPageIntro()

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      <header>
        <h1 className="font-display text-3xl text-sage-950 sm:text-4xl">{heading}</h1>
        <p className="mt-2 max-w-2xl font-body text-sage-700">{intro}</p>
      </header>

      <ConnectTabs />

      <section className="rounded-2xl border border-sand-200 bg-sand-50/50 p-5">
        <h2 className="font-display text-lg text-sage-950">Connection status</h2>
        <div className="mt-3">
          <ConnectionStatus />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-sage-600">
          {connectPageConnectorRestrictionsNote()}
        </p>
      </section>
    </div>
  )
}
