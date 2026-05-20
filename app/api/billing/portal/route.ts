import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  })
}

export async function POST(request: NextRequest) {
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
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    let customerId = profile?.stripe_customer_id as string | undefined

    if (!customerId) {
      const stripe = getStripe()
      const customers = await stripe.customers.list({ email: user.email, limit: 1 })
      customerId = customers.data[0]?.id
    }

    if (!customerId) {
      return NextResponse.json({ error: 'No billing account found. Purchase a plan first.' }, { status: 404 })
    }

    const host = request.headers.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing/portal] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
