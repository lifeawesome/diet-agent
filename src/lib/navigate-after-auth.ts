'use client'

/**
 * After Supabase password / OAuth callback, force a **full navigation** so:
 * - New session cookies + storage are visible to all client code
 * - App shell entitlement (`/me/entitlement`) runs on a fresh load (avoids soft-nav edge cases next to middleware)
 *
 * External URLs (e.g. legacy `return_to` pointing at the API) use the real target origin.
 */
export function navigateAfterAuth(redirectTo: string): void {
  if (typeof window === 'undefined') return

  const trimmed = redirectTo.trim()

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      void new URL(trimmed)
      window.location.assign(trimmed)
    } catch {
      window.location.assign(new URL('/dashboard', window.location.origin).href)
    }
    return
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  window.location.assign(new URL(path, window.location.origin).href)
}
