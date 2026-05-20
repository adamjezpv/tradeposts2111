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

  // Ensure a users row exists — use ignoreDuplicates so we NEVER overwrite an existing user's plan
  await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      plan: 'trial',
      trial_ends: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // Enforce plan-based location limits
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  const plan = profile?.plan ?? 'trial'
  const locationLimit = plan === 'agency' ? 10 : 1

  const { count } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= locationLimit) {
    const upgradeHint = plan === 'agency' ? 'agency_limit' : 'solo_limit'
    return NextResponse.redirect(`${origin}/locations?error=${upgradeHint}`)
  }

  // Create a unique mock location using a timestamp-based ID
  const mockId = `mock_${Date.now()}`
  const MOCK_BUSINESSES = [
    { name: 'Tomek Plumbing Services LLC', type: 'Plumber', services: ['pipe repair', 'drain cleaning', 'water heater installation'] },
    { name: 'Tomek Electrical LLC', type: 'Electrician', services: ['wiring', 'panel upgrade', 'outlet installation'] },
    { name: 'Tomek HVAC Services', type: 'HVAC Technician', services: ['AC repair', 'heating', 'duct cleaning'] },
    { name: 'Tomek Roofing Co', type: 'Roofer', services: ['roof repair', 'gutter cleaning', 'inspections'] },
    { name: 'Tomek Landscaping', type: 'Landscaper', services: ['lawn care', 'planting', 'irrigation'] },
  ]
  const bizIndex = (count ?? 0) % MOCK_BUSINESSES.length
  const biz = MOCK_BUSINESSES[bizIndex]

  await supabase.from('locations').insert({
    user_id: user.id,
    gbp_account_id: 'mock_account_123',
    gbp_location_id: mockId,
    business_name: biz.name,
    business_type: biz.type,
    services: biz.services,
    tone: 'professional',
    active: true,
  })

  const locationsRedirect = NextResponse.redirect(`${origin}/locations`)
  redirectToDashboard.cookies.getAll().forEach(({ name, value, ...rest }) => {
    locationsRedirect.cookies.set(name, value, rest as Parameters<typeof locationsRedirect.cookies.set>[2])
  })
  return locationsRedirect
}
