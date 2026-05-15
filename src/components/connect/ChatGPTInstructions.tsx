import { ConnectorUrl, mcpServerUrl } from '@/components/connect/ConnectorUrl'
import { ConnectStepImage } from '@/components/connect/ConnectStepImage'

/** Full ChatGPT connector walkthrough — shown when `NEXT_PUBLIC_CHATGPT_STATUS=active` only. */
export function ChatGPTInstructions() {
  return (
    <>
      <ConnectorUrl />

      <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm sm:p-8">
        <ol className="space-y-8 font-body text-sage-800">
          <li className="space-y-3">
            <p className="font-medium text-sage-950">Step 1 — Open ChatGPT (Plus, Business, or Enterprise)</p>
            <p>Go to Settings → Connectors → Add.</p>
            <ConnectStepImage step="chatgpt-1" alt="ChatGPT connectors" />
          </li>
          <li className="space-y-3">
            <p className="font-medium text-sage-950">Step 2 — Paste the URL</p>
            <p>
              Paste <code className="rounded bg-sand-100 px-1 font-mono text-sm">{mcpServerUrl}</code>.
            </p>
            <ConnectStepImage step="chatgpt-2" alt="Paste MCP URL in ChatGPT" />
          </li>
          <li className="space-y-3">
            <p className="font-medium text-sage-950">Step 3 — Authorize</p>
            <p>ChatGPT will open DietAgent in a browser to authorize. Sign in if needed, then click Allow.</p>
          </li>
          <li className="space-y-3">
            <p className="font-medium text-sage-950">Step 4 — Try it</p>
            <p>
              Back in ChatGPT, mention something you ate, or ask &quot;How am I doing on my diet plan?&quot;
            </p>
          </li>
        </ol>
      </div>
    </>
  )
}
