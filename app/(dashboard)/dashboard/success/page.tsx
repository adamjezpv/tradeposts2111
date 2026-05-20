import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuccessConfetti from '../../_components/SuccessConfetti'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Stripe redirects here after checkout — we verify the plan from DB, never from URL params.
// The session_id in the URL is only for Stripe's idempotency; plan truth lives in Supabase.
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; attempt?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  const plan = profile?.plan ?? 'trial'

  if (plan === 'solo' || plan === 'agency') {
    return <SuccessConfetti />
  }

  // Webhook hasn't fired yet — show processing UI with auto-refresh
  const params = await searchParams
  const attempt = parseInt(params.attempt ?? '1', 10)
  const sessionId = params.session_id ?? ''

  if (attempt > 8) {
    // After ~24 seconds of retries, give up and send to dashboard
    redirect('/dashboard')
  }

  const nextAttemptUrl = sessionId
    ? `/dashboard/success?session_id=${encodeURIComponent(sessionId)}&attempt=${attempt + 1}`
    : `/dashboard/success?attempt=${attempt + 1}`

  return (
    <>
      {/* Auto-refresh every 3 seconds until webhook updates the DB */}
      <meta httpEquiv="refresh" content={`3;url=${nextAttemptUrl}`} />
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 rounded-full border border-white/20 border-t-white/60 animate-spin mx-auto mb-6" />
          <h1 className="text-xl font-bold text-white mb-2 tracking-tight">Processing payment…</h1>
          <p className="text-white/35 text-sm">This usually takes just a moment.</p>
        </div>
      </div>
    </>
  )
}
