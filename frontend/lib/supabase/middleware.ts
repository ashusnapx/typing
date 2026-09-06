import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isPrivateRoute, isAuthPage } from '@/lib/route-access'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and API routes never need a session lookup here.
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/')) {
    return NextResponse.next({ request });
  }

  // Open routes skip the Supabase round-trip entirely. This is the common
  // case — every exam, lesson and marketing page — so it stays off the
  // critical path.
  if (!isPrivateRoute(pathname) && !isAuthPage(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getUser()
  const user = data?.user

  // Login and register always render, signed in or not.
  if (isAuthPage(pathname)) return supabaseResponse;

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
