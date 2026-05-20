import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// Service-role client — bypasses RLS for server-side writes
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${String(err)}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const planType = (session.metadata?.plan_type as string) ?? 'solo'
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

    let dbError = null
    if (customerId) {
      const { error } = await supabase
        .from('users')
        .update({ subscription_status: 'active', plan: planType })
        .eq('stripe_customer_id', customerId)
      dbError = error
    } else if (session.customer_email) {
      const { error } = await supabase
        .from('users')
        .update({ subscription_status: 'active', plan: planType })
        .eq('email', session.customer_email)
      dbError = error
    }

    if (dbError) {
      console.error('[webhook] checkout.session.completed db error:', dbError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

    if (customerId) {
      const { error } = await supabase
        .from('users')
        .update({ subscription_status: 'active' })
        .eq('stripe_customer_id', customerId)
      if (error) {
        console.error('[webhook] invoice.paid db error:', error)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

    const { error } = await supabase
      .from('users')
      .update({ subscription_status: 'free', plan: 'trial' })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('Supabase update error:', error)
    }
  }

  return NextResponse.json({ received: true })
}
