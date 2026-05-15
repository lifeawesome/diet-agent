import { getMarketingAssistantsPhrase } from '@/lib/clients'

/**
 * Insert into marketing copy wherever we refer to MCP-capable assistants.
 * Returns "Claude", "Claude and ChatGPT", or a gentle generic when neither is active yet.
 */
export function ClientNamesPhrase() {
  return <>{getMarketingAssistantsPhrase()}</>
}
