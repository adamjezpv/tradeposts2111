import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Routes that require an active paid plan (solo or agency)
const PREMIUM_ROUTES = ['/posts', '/locations']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase misconfigured — treat as unauthenticated
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For premium-only routes, verify plan from DB — never from URL params
  const pathname = request.nextUrl.pathname
  const isPremiumRoute = PREMIUM_ROUTES.some((r) => pathname.startsWith(r))

  if (isPremiumRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle()

    const plan = profile?.plan ?? 'trial'
    if (plan !== 'solo' && plan !== 'agency') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard(.*)', '/locations(.*)', '/posts(.*)', '/settings(.*)', '/upgrade(.*)'],
}
