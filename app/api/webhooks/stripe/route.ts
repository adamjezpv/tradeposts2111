import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Required by Next.js App Router to prevent body parsing — Stripe needs the raw bytes for signature verification
export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  })
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function mapPriceIdToPlan(priceId: string): 'solo' | 'agency' {
  const agencyPriceIds = [
    process.env.STRIPE_PRICE_AGENCY_MONTHLY_ID,
    process.env.STRIPE_PRICE_AGENCY_ANNUAL_ID,
  ].filter(Boolean)
  return agencyPriceIds.includes(priceId) ? 'agency' : 'solo'
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${String(err)}` },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id

        if (!userId) {
          console.error('[stripe-webhook] checkout.session.completed: missing client_reference_id')
          break
        }

        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id

        // Retrieve the subscription to get the price ID for accurate plan mapping
        let plan: 'solo' | 'agency' = 'solo'
        if (session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0]?.price.id
          if (priceId) plan = mapPriceIdToPlan(priceId)
        } else if (session.metadata?.plan_type === 'agency') {
          plan = 'agency'
        }

        const updatePayload: Record<string, unknown> = {
          plan,
          trial_ends: new Date().toISOString(), // zero out trial
        }
        if (customerId) updatePayload.stripe_customer_id = customerId

        const { error } = await supabase
          .from('users')
          .update(updatePayload)
          .eq('id', userId)

        if (error) {
          console.error('[stripe-webhook] checkout.session.completed db error:', error)
          return NextResponse.json({ error: 'Failed to update user plan' }, { status: 500 })
        }
        console.log(`[stripe-webhook] checkout.session.completed: user ${userId} → plan ${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id

        const status = subscription.status
        let plan: 'solo' | 'agency' | 'expired'

        if (status === 'past_due' || status === 'unpaid') {
          plan = 'expired'
        } else if (status === 'active' || status === 'trialing') {
          const priceId = subscription.items.data[0]?.price.id
          plan = priceId ? mapPriceIdToPlan(priceId) : 'solo'
        } else {
          // canceled, incomplete, etc. — no change needed
          break
        }

        const { error } = await supabase
          .from('users')
          .update({ plan })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('[stripe-webhook] customer.subscription.updated db error:', error)
          return NextResponse.json({ error: 'Failed to update subscription plan' }, { status: 500 })
        }
        console.log(`[stripe-webhook] customer.subscription.updated: customer ${customerId} → plan ${plan} (status: ${status})`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id

        const { error } = await supabase
          .from('users')
          .update({
            plan: 'trial',
            trial_ends: new Date().toISOString(), // sets trialDaysLeft to 0
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('[stripe-webhook] customer.subscription.deleted db error:', error)
          return NextResponse.json({ error: 'Failed to downgrade user' }, { status: 500 })
        }
        console.log(`[stripe-webhook] customer.subscription.deleted: customer ${customerId} → trial (expired)`)
        break
      }

      default:
        // Unhandled event type — acknowledge receipt
        break
    }
  } catch (err) {
    console.error('[stripe-webhook] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
