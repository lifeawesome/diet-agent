import { featureFlags, type ClientStatus } from '@/lib/feature-flags'

/** Product-facing label for MCP integration UIs */
export type ClientId = 'claude' | 'chatgpt'

const LABELS: Record<ClientId, string> = {
  claude:  'Claude',
  chatgpt: 'ChatGPT',
}

export type ActiveClientDescriptor = {
  id: ClientId
  label: string
  status: ClientStatus
}

/**
 * MCP clients surfaced in dashboards and copy flows.
 * `status` reflects feature flags (`active`, `coming_soon`, `hidden`).
 */
export const MCP_CLIENT_ORDER: ActiveClientDescriptor[] = [
  { id: 'claude', label: LABELS.claude, status: featureFlags.claude },
  { id: 'chatgpt', label: LABELS.chatgpt, status: featureFlags.chatgpt },
]

/** Alias for playbook docs / imports that expect this name. */
export const ACTIVE_CLIENTS = MCP_CLIENT_ORDER

export function getClientStatus(client: ClientId): ClientStatus {
  return MCP_CLIENT_ORDER.find(c => c.id === client)?.status ?? 'hidden'
}

/** Clients where the MCP connector flow should be marketed as usable now. */
export function getActiveClientNames(): string[] {
  return MCP_CLIENT_ORDER.filter(c => c.status === 'active').map(c => c.label)
}

/**
 * Grammar for prose: hero, empties …
 * Wave 1: "Claude" · both supported: "Claude and ChatGPT" · fallback: vague assistant copy.
 */
export function getMarketingAssistantsPhrase(): string {
  const active = getActiveClientNames()
  if (active.length === 0) return 'your favorite AI assistant'
  if (active.length === 1) return active[0]!
  return `${LABELS.claude} and ${LABELS.chatgpt}`
}

export function getAssistantListForConnectEmptyState(): string {
  const names = getActiveClientNames()
  if (names.length === 0) return 'Claude'
  if (names.length === 1) return names[0]!
  return `${names[0]} or ${names[1]}`
}

export function getDashboardConnectCtaLabel(): string {
  return featureFlags.chatgpt === 'active' ? 'Connect to your AI' : 'Connect to Claude'
}

export function getConnectPageHeading(): string {
  return featureFlags.chatgpt === 'active' ? 'Connect to your AI' : 'Connect Claude'
}

export function getConnectPageIntro(): string {
  if (featureFlags.chatgpt === 'active') {
    return (
      'Add DietAgent as a custom connector in Claude or ChatGPT so your assistant can read your dashboard ' +
      'and log meals and metrics on your behalf.'
    )
  }
  return (
    'Add DietAgent as a custom connector in Claude so Claude can read your dashboard and log meals ' +
    'and metrics on your behalf. ChatGPT support is coming soon — use the ChatGPT tab to join the waitlist.'
  )
}

export function connectPageConnectorRestrictionsNote(): string {
  if (featureFlags.chatgpt === 'active') {
    return (
      'Free Claude.ai and ChatGPT accounts can’t add custom connectors. You’ll need Claude Pro/Max/Team/Enterprise or ' +
      'ChatGPT Plus/Business/Enterprise.'
    )
  }
  return (
    'Free Claude.ai accounts can’t add custom connectors. You’ll need Claude.ai Pro/Max/Team/Enterprise. ' +
    'ChatGPT support is rolling out soon — join the waitlist from the ChatGPT tab.'
  )
}

export function getDashboardEmptyStateDescription(): string {
  const assistants = getMarketingAssistantsPhrase()
  const base = assistants === 'your favorite AI assistant'
    ? 'your AI assistant'
    : assistants.includes('and')
      ? assistants
      : assistants
  return `Once you connect ${base} and log a few meals, your dashboard fills in here.`
}
