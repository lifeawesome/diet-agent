import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConsentCard } from '@/components/oauth/ConsentCard'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ?? 'https://api.dietagent.com'

type Search = Record<string, string | string[] | undefined>

function one(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function OAuthConsentPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const sp = await searchParams
  const clientId = one(sp.client_id)?.trim()
  const pathname = '/oauth/consent'
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v)
    if (val != null && val !== '') query.set(k, val)
  }
  const returnTo = `${pathname}?${query.toString()}`

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    redirect(`/login?return_to=${encodeURIComponent(returnTo)}`)
  }

  if (!clientId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 font-body text-sage-800">
        <p className="text-center">Missing OAuth parameters. Please start again from your AI assistant.</p>
      </div>
    )
  }

  const scope = one(sp.scope) ?? ''
  const previewRes = await fetch(
    `${API_URL}/authorize/preview?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scope)}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    },
  )

  if (!previewRes.ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center font-body text-sage-800">
        <p className="mb-4 text-lg font-display text-sage-950">Unknown AI client</p>
        <p className="text-sm leading-relaxed text-sage-700">
          This AI client is not recognized. You may have followed an outdated link. Please restart the connection
          from your AI assistant&apos;s settings.
        </p>
      </div>
    )
  }

  const preview = (await previewRes.json()) as {
    client_name: string
    scopes_requested: { scope: string; description: string }[]
  }

  const oauthParams: Record<string, string> = {}
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v)
    if (val != null) oauthParams[k] = val
  }
  if (!oauthParams.response_type) oauthParams.response_type = 'code'

  const email =
    session.user?.email ??
    (typeof session.user?.user_metadata?.email === 'string'
      ? session.user.user_metadata.email
      : null)

  return (
    <div className="min-h-screen bg-[#faf7f2] px-4 py-10 sm:py-16">
      <ConsentCard preview={preview} oauthParams={oauthParams} userEmail={email} />
    </div>
  )
}
