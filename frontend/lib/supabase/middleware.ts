import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/', '/auth/callback',
  '/api/trpc', '/api/inngest',
  '/exam', '/learn', '/about', '/faq', '/contact', '/privacy', '/terms',
  '/blog', '/coach', '/dashboard', '/leaderboard',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
}

function isAuthPage(pathname: string): boolean {
  return pathname === '/auth/login' || pathname === '/auth/register';
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check entirely for static assets
  if (pathname.startsWith('/_next')) {
    return NextResponse.next({ request });
  }

  // Public routes (except login/register) — skip Supabase call entirely
  if (isPublicRoute(pathname) && !isAuthPage(pathname)) {
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

  // Auth pages: let them through (login/register should always render)
  if (isAuthPage(pathname)) {
    return supabaseResponse;
  }

  // Protected route + no user → redirect to login
  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
