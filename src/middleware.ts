import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/log',
  '/meals',
  '/trends',
  '/chat',
  '/progress',
  '/settings',
  '/billing',
]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    p => pathname === p || pathname.startsWith(`${p}/`)
  )
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return response
}

/** Refresh Supabase cookies on navigations; protect app routes below. */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
