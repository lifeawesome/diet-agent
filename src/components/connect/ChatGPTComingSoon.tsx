import { WaitlistForm } from '@/components/connect/WaitlistForm'

function ConnectorConceptArt() {
  return (
    <div
      className="relative mx-auto flex max-w-lg justify-center rounded-2xl border border-sage-900/10 bg-gradient-to-br from-[#eaf3ee] via-sand-50 to-amber-50/60 px-12 py-11"
      aria-hidden
    >
      <svg viewBox="0 0 220 132" className="h-auto w-full max-w-[17rem]" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="36" width="72" height="60" rx="12" stroke="#2F5944" strokeOpacity="0.35" strokeWidth="2" />
        <rect x="134" y="36" width="72" height="60" rx="12" stroke="#2F5944" strokeOpacity="0.35" strokeWidth="2" />
        <path d="M86 62h46" stroke="#2F5944" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" />
        <circle cx="50" cy="66" r="6" fill="#2F5944" fillOpacity="0.12" stroke="#2F5944" strokeOpacity="0.4" strokeWidth="1.2" />
        <circle cx="170" cy="66" r="6" fill="#2F5944" fillOpacity="0.12" stroke="#2F5944" strokeOpacity="0.4" strokeWidth="1.2" />
      </svg>
    </div>
  )
}

type Props = {
  /** Switch UI back to the Claude instructions tab */
  onGoToClaude: () => void
}

export function ChatGPTComingSoon({ onGoToClaude }: Props) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="mb-9">
        <ConnectorConceptArt />
      </div>

      <h2 className="text-center font-display text-2xl text-sage-950 sm:text-3xl">
        ChatGPT support is coming soon
      </h2>

      <div className="mx-auto mt-5 max-w-lg space-y-4 text-center font-body text-[15px] leading-relaxed text-sage-800">
        <p>
          We&apos;re preparing DietAgent for the ChatGPT app directory so Plus users get the full experience —
          including logging meals and measurements right from chat.
        </p>
        <p>
          Business and Enterprise workspaces will get earlier access through ChatGPT&apos;s Developer Mode.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <WaitlistForm />
      </div>

      <div className="mt-12 text-center">
        <button
          type="button"
          onClick={onGoToClaude}
          className="font-body text-sm font-medium text-[#2F5944] underline decoration-sage-400 underline-offset-[5px] transition hover:text-sage-900"
        >
          In the meantime, DietAgent works beautifully with Claude →
        </button>
      </div>
    </div>
  )
}
