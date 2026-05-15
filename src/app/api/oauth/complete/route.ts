import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ?? 'https://api.dietagent.com'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as {
    decision: 'allow' | 'deny'
    params: Record<string, string>
  }
  const p = body.params
  if (!p?.client_id || !p.redirect_uri || !p.state) {
    return NextResponse.json({ error: 'Invalid consent payload' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {
    decision:                  body.decision,
    approve:                   body.decision === 'allow',
    response_type:             p.response_type ?? 'code',
    client_id:                 p.client_id,
    redirect_uri:              p.redirect_uri,
    code_challenge:            p.code_challenge,
    code_challenge_method:     p.code_challenge_method,
    scope:                     p.scope,
    state:                     p.state,
  }
  if (p.resource) payload.resource = p.resource

  const res = await fetch(`${API_URL}/authorize/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
    redirect: 'manual',
  })

  const loc = res.headers.get('Location')
  if (loc && res.status >= 300 && res.status < 400) {
    return NextResponse.json({ redirectUrl: loc })
  }

  const errText = await res.text().catch(() => '')
  return NextResponse.json(
    { error: errText || 'Authorization could not be completed' },
    { status: res.status >= 400 ? res.status : 502 },
  )
}
