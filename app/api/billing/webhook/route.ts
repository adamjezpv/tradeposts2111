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

  if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
    const obj = event.data.object as { customer_email?: string | null }
    const customerEmail = obj.customer_email

    if (customerEmail) {
      const { error } = await supabase
        .from('users')
        .update({ subscription_status: 'active', plan: 'premium' })
        .eq('email', customerEmail)

      if (error) {
        console.error('Supabase update error:', error)
        return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 })
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
