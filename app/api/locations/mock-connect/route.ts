export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  const redirectToDashboard = NextResponse.redirect(`${origin}/dashboard`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Parameters<typeof redirectToDashboard.cookies.set>[2] }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectToDashboard.cookies.set(name, value, options ?? {})
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Ensure a users row exists (created on first OAuth sign-in in production)
  await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      plan: 'trial',
      trial_ends: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'id' }
  )

  // Only insert if this mock location doesn't already exist
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('user_id', user.id)
    .eq('gbp_location_id', 'mock_123')
    .maybeSingle()

  if (!existing) {
    await supabase.from('locations').insert({
      user_id: user.id,
      gbp_account_id: 'mock_account_123',
      gbp_location_id: 'mock_123',
      business_name: 'Tomek Plumbing Services LLC',
      business_type: 'Plumber',
      services: ['pipe repair', 'drain cleaning', 'water heater installation'],
      tone: 'professional',
      active: true,
    })
  }

  return redirectToDashboard
}
