import { createClient } from '@/lib/supabase/server'
import TrialExpiredBlock from '../_components/TrialExpiredBlock'
import TrialDashboard from '../_components/TrialDashboard'
import PremiumDashboard from '../_components/PremiumDashboard'
import VerifyPaymentBanner from '../_components/VerifyPaymentBanner'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PostWithLocation = {
  id: string
  content: string
  scheduled_at: string
  status: string
  error_message: string | null
  locations: { business_name: string }[] | null
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileResult, postsResult, locationsResult] = await Promise.all([
    supabase
      .from('users')
      .select('plan, trial_ends')
      .eq('id', user!.id)
      .maybeSingle(),
    supabase
      .from('post_queue')
      .select('id, content, scheduled_at, status, error_message, locations(business_name)')
      .in('status', ['pending', 'scheduled', 'failed'])
      .order('scheduled_at', { ascending: true })
      .limit(120),
    supabase
      .from('locations')
      .select('id, business_name, business_type, active')
      .order('created_at', { ascending: true }),
  ])

  const profile = profileResult.data
  const posts = (postsResult.data ?? []) as PostWithLocation[]
  const locations = locationsResult.data ?? []
  const locationCount = locations.length
  const firstLocation = locations[0] ?? null

  const plan = profile?.plan ?? 'trial'
  const params = await searchParams
  const showVerifyBanner = plan === 'trial' && params.verify === '1'

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'there'

  if (plan === 'solo' || plan === 'agency') {
    return (
      <PremiumDashboard
        firstName={firstName}
        plan={plan}
        posts={posts}
        locationCount={locationCount}
        industry={firstLocation?.business_type ?? null}
        firstLocationName={firstLocation?.business_name ?? null}
      />
    )
  }

  const trialEnds = profile?.trial_ends
    ? new Date(profile.trial_ends)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const trialDaysLeft = Math.max(
    0,
    Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  if (trialDaysLeft <= 0 && !showVerifyBanner) {
    return <TrialExpiredBlock />
  }

  const trialProgress = Math.min(100, ((14 - trialDaysLeft) / 14) * 100)

  return (
    <>
      {showVerifyBanner && <VerifyPaymentBanner />}
      <TrialDashboard
        firstName={firstName}
        trialDaysLeft={trialDaysLeft}
        trialProgress={trialProgress}
        posts={posts}
      />
    </>
  )
}
