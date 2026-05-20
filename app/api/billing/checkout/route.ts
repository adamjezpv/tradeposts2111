import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  })
}

function getPriceId(plan: 'solo' | 'agency', billing: 'monthly' | 'annual'): string | undefined {
  const map: Record<string, Record<string, string | undefined>> = {
    solo: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTHLY,
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL,
    },
    agency: {
      monthly: process.env.STRIPE_PRICE_ID_AGENCY_MONTHLY,
      annual: process.env.STRIPE_PRICE_ID_AGENCY_ANNUAL,
    },
  }
  return map[plan][billing]
}

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

    const body = await request.json().catch(() => ({})) as { plan?: string; billing?: string }
    const planType = (body.plan === 'agency' ? 'agency' : 'solo') as 'solo' | 'agency'
    const billing = body.billing === 'annual' ? 'annual' : 'monthly'

    const priceId = getPriceId(planType, billing)
    console.log(`[checkout] plan=${planType} billing=${billing} priceId=${priceId}`)

    if (!priceId) {
      const envKey = planType === 'agency'
        ? (billing === 'annual' ? 'STRIPE_PRICE_ID_AGENCY_ANNUAL' : 'STRIPE_PRICE_ID_AGENCY_MONTHLY')
        : (billing === 'annual' ? 'NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL' : 'NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTHLY')
      return NextResponse.json(
        { error: `Stripe price not configured: env var ${envKey} is missing or empty` },
        { status: 500 }
      )
    }

    if (!priceId.startsWith('price_') || priceId.length < 20) {
      return NextResponse.json(
        { error: `Stripe price ID looks like a placeholder: "${priceId}". Set the real Stripe price ID in your environment variables.` },
        { status: 500 }
      )
    }

    const stripe = getStripe()

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
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
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
