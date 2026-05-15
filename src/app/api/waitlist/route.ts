import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ?? 'https://api.dietagent.com'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await fetch(`${API_URL}/me/waitlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const text = await res.text().catch(() => '')
    let body: unknown = {}
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        body = { error: text }
      }
    }
    return NextResponse.json(body, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  let authHeader = ''
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) authHeader = `Bearer ${session.access_token}`
  } catch {
    /* anonymous waitlist signup */
  }

  const incoming = await req.json().catch(() => null)
  if (
    incoming == null ||
    typeof incoming !== 'object' ||
    typeof (incoming as { email?: unknown }).email !== 'string' ||
    typeof (incoming as { client_interest?: unknown }).client_interest !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const hdrs: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authHeader) hdrs.Authorization = authHeader

  const res = await fetch(`${API_URL}/me/waitlist`, {
    method:  'POST',
    headers: hdrs,
    body:    JSON.stringify(incoming),
  })
  const text = await res.text().catch(() => '')
  let body: unknown = {}
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { error: text || `Upstream returned ${res.status}` }
    }
  }
  return NextResponse.json(body, { status: res.status })
}
