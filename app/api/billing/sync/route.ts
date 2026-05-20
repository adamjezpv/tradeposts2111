import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  })
}

function mapPriceIdToPlan(priceId: string): 'solo' | 'agency' {
  const agencyPriceIds = [
    process.env.STRIPE_PRICE_ID_AGENCY_MONTHLY,
    process.env.STRIPE_PRICE_ID_AGENCY_ANNUAL,
  ].filter(Boolean)
  return agencyPriceIds.includes(priceId) ? 'agency' : 'solo'
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('plan, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    const stripe = getStripe()
    let customerId = profile?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 })
      customerId = customers.data[0]?.id
    }

    if (!customerId) {
      return NextResponse.json({ synced: false, plan: profile?.plan ?? 'trial', message: 'No Stripe customer found' })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // Also check trialing subscriptions
      const trialingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'trialing',
        limit: 1,
      })
      if (trialingSubs.data.length === 0) {
        return NextResponse.json({ synced: false, plan: profile?.plan ?? 'trial', message: 'No active subscription found' })
      }
      subscriptions.data.push(...trialingSubs.data)
    }

    const sub = subscriptions.data[0]
    const priceId = sub.items.data[0]?.price.id
    const plan = priceId ? mapPriceIdToPlan(priceId) : 'solo'

    await supabase
      .from('users')
      .update({
        plan,
        stripe_customer_id: customerId,
        trial_ends: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({ synced: true, plan })
  } catch (err) {
    console.error('[billing/sync] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
