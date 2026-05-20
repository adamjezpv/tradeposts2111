export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

interface GBPAccount {
  name: string
  accountName: string
  type?: string
}

interface GBPLocation {
  name: string
  title: string
  categories?: {
    primaryCategory?: {
      displayName?: string
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const sessionResponse = NextResponse.redirect(`${origin}/locations`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: Parameters<typeof sessionResponse.cookies.set>[2] }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            sessionResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  const { user, session } = data
  const providerToken = session?.provider_token ?? null
  const providerRefreshToken = session?.provider_refresh_token ?? null

  // Ensure user row exists — ignoreDuplicates so we never overwrite an existing plan
  await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      plan: 'trial',
      trial_ends: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // Check plan-based location limits
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  const plan = profile?.plan ?? 'trial'
  const locationLimit = plan === 'agency' ? 10 : 1

  const { count: locationCount } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((locationCount ?? 0) >= locationLimit) {
    const upgradeHint = plan === 'agency' ? 'agency_limit' : 'solo_limit'
    return NextResponse.redirect(`${origin}/locations?error=${upgradeHint}`)
  }

  // Save Google OAuth tokens for use by the cron publisher
  if (providerToken) {
    await supabase.from('google_tokens').upsert(
      {
        user_id: user.id,
        access_token: providerToken,
        refresh_token: providerRefreshToken ?? '',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    // Fetch Google Business Profile accounts and import locations
    try {
      const accountsRes = await fetch(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        { headers: { Authorization: `Bearer ${providerToken}` } }
      )

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json() as { accounts?: GBPAccount[] }
        const accounts = accountsData.accounts ?? []

        for (const account of accounts) {
          const accountId = account.name.split('/').pop() ?? ''

          const locRes = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name%2Ctitle%2Ccategories`,
            { headers: { Authorization: `Bearer ${providerToken}` } }
          )

          if (!locRes.ok) continue

          const locData = await locRes.json() as { locations?: GBPLocation[] }
          const gbpLocations = locData.locations ?? []

          for (const loc of gbpLocations) {
            const locationId = loc.name.split('/').pop() ?? ''

            const { count: existing } = await supabase
              .from('locations')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('gbp_location_id', locationId)

            if ((existing ?? 0) > 0) continue

            const { count: total } = await supabase
              .from('locations')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)

            if ((total ?? 0) >= locationLimit) break

            await supabase.from('locations').insert({
              user_id: user.id,
              gbp_account_id: accountId,
              gbp_location_id: locationId,
              business_name: loc.title,
              business_type: loc.categories?.primaryCategory?.displayName ?? null,
              tone: 'professional',
              active: true,
            })
          }
        }
      }
    } catch {
      // GBP fetch failed — user can see locations page and retry connection
    }
  }

  return sessionResponse
}
