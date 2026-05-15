import { ConnectorUrl, mcpServerUrl } from '@/components/connect/ConnectorUrl'
import { ConnectStepImage } from '@/components/connect/ConnectStepImage'

export function ClaudeInstructions() {
  return (
    <>
      <ConnectorUrl />

      <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm sm:p-8">
        <ol className="space-y-8 font-body text-sage-800">
          <li className="space-y-3">
            <p className="font-medium text-sage-950">Step 1 — Open Claude</p>
            <p>Go to Settings → Connectors → &quot;Add custom connector&quot;.</p>
            <ConnectStepImage step="claude-1" alt="Claude connector settings" />
          </li>
          <li className="space-y-3">
            <p className="font-medium text-sage-950">Step 2 — Paste the URL</p>
            <p>
              Paste <code className="rounded bg-sand-100 px-1 font-mono text-sm">{mcpServerUrl}</code> and click Add.
            </p>
            <ConnectStepImage step="claude-2" alt="Paste MCP URL" />
          </li>
          <li className="space-y-3">
            <p className="font-medium text-sage-950">Step 3 — Authorize</p>
            <p>You&apos;ll be sent to DietAgent to allow access. Sign in if needed, then click Allow.</p>
            <ConnectStepImage step="claude-3" alt="Authorize DietAgent" />
          </li>
          <li className="space-y-3">
            <p className="font-medium text-sage-950">Step 4 — Try it</p>
            <p>
              Back in Claude, ask: &quot;What&apos;s my DietAgent dashboard look like today?&quot; If you see a real answer
              with your numbers, you&apos;re connected.
            </p>
          </li>
        </ol>
      </div>
    </>
  )
}
