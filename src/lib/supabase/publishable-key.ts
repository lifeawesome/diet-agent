/**
 * Supabase publishable key (`sb_publishable_…`) preferred over legacy JWT anon key.
 * @see https://supabase.com/docs/guides/api/api-keys
 */
export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ''
  )
}
