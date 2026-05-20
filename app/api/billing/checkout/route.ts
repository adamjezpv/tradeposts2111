import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let priceId = process.env.STRIPE_PRICE_ID!
    try {
      const body = await request.json() as { priceId?: string }
      if (body.priceId) priceId = body.priceId
    } catch {
      // no body — use default price
    }

    const agencyPriceIds = [
      process.env.STRIPE_PRICE_ID_AGENCY_MONTHLY,
      process.env.STRIPE_PRICE_ID_AGENCY_ANNUAL,
    ].filter(Boolean)
    const planType = agencyPriceIds.includes(priceId) ? 'agency' : 'solo'

    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    let customerId = profile?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const host = request.headers.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?upgraded=1`,
      cancel_url: `${baseUrl}/upgrade`,
      customer_update: {
        address: 'auto',
      },
      metadata: { supabase_user_id: user.id, plan_type: planType },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan_type: planType },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
