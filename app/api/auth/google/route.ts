export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)

  // Temporary response used only to capture cookies set by Supabase (PKCE verifier, etc.)
  const tempResponse = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: (cookiesToSet: { name: string; value: string; options: Parameters<typeof tempResponse.cookies.set>[2] }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            tempResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/google/callback`,
      scopes: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/business.manage',
      ].join(' '),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  const oauthRedirect = NextResponse.redirect(data.url)

  // Forward PKCE cookies to the redirect response
  tempResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
    oauthRedirect.cookies.set(name, value, rest as Parameters<typeof oauthRedirect.cookies.set>[2])
  })

  return oauthRedirect
}
