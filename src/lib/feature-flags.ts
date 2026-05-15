// Single source of truth for client launch state.
// Driven by NEXT_PUBLIC_* env vars so flags can be flipped without code changes.

export type ClientStatus = 'active' | 'coming_soon' | 'hidden'

export interface FeatureFlags {
  claude: ClientStatus // expected: 'active'
  chatgpt: ClientStatus // 'coming_soon' for Wave 1; 'active' from Wave 2+
}

function readStatus(envValue: string | undefined, fallback: ClientStatus): ClientStatus {
  if (envValue === 'active' || envValue === 'coming_soon' || envValue === 'hidden') {
    return envValue
  }
  return fallback
}

export const featureFlags: FeatureFlags = {
  claude:  readStatus(process.env.NEXT_PUBLIC_CLAUDE_STATUS, 'active'),
  chatgpt: readStatus(process.env.NEXT_PUBLIC_CHATGPT_STATUS, 'coming_soon'),
}
