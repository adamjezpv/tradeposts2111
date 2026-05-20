import { createClient } from '@/lib/supabase/server'
import { UpgradeButton } from '../_components/UpgradeButton'
import PremiumDashboard from '../_components/PremiumDashboard'

export const runtime = 'edge'

type PostWithLocation = {
  id: string
  content: string
  scheduled_at: string
  status: string
  locations: { business_name: string }[] | null
}

export default async function DashboardPage() {
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
      .select('id, content, scheduled_at, status, locations(business_name)')
      .in('status', ['pending', 'scheduled'])
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
  const isPremium = plan !== 'trial'

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'there'

  // Route premium users to the advanced command center
  if (isPremium) {
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

  // Trial view
  const trialEnds = profile?.trial_ends
    ? new Date(profile.trial_ends)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const trialDaysLeft = Math.max(
    0,
    Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )
  const trialProgress = Math.min(100, ((14 - trialDaysLeft) / 14) * 100)

  return (
    <div className="min-h-full p-8">
      <div className="max-w-5xl">

        {/* Page header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gradient tracking-tight mb-1">
              Welcome back, {firstName}
            </h1>
            <p className="text-white/30 text-sm">Your Google Business posts, at a glance.</p>
          </div>
          <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            <span className="text-white/50 text-xs font-medium">
              Trial · {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
            </span>
          </div>
        </div>

        {/* Upgrade banner */}
        <div className="glass-bright rounded-2xl p-7 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-sm bg-white/60" />
                </div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Trial Period</p>
              </div>
              <h2 className="text-white text-lg font-bold mb-2 leading-snug">
                {trialDaysLeft > 0
                  ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining on your free trial`
                  : 'Your trial has ended'}
              </h2>
              <p className="text-white/35 text-sm leading-relaxed mb-5 max-w-lg">
                Upgrade to unlock auto-publishing, unlimited scheduled posts, and the full command center dashboard with calendar view.
              </p>

              {/* Trial progress */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/25 text-[10px]">Trial used</span>
                  <span className="text-white/25 text-[10px]">{14 - trialDaysLeft} / 14 days</span>
                </div>
                <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/25 rounded-full transition-all duration-700"
                    style={{ width: `${trialProgress}%` }}
                  />
                </div>
              </div>

              {/* Features comparison */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6">
                {[
                  { label: '1 location (preview only)', active: true },
                  { label: '4 AI posts per month', active: true },
                  { label: 'Auto-publish to Google Business', active: false },
                  { label: 'Calendar command center', active: false },
                  { label: 'Queue management', active: false },
                  { label: 'Full post history', active: false },
                ].map(({ label, active }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`text-xs ${active ? 'text-white/20' : 'text-white/10'}`}>
                      {active ? '✓' : '○'}
                    </span>
                    <span className={`text-xs ${active ? 'text-white/35' : 'text-white/20'}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <UpgradeButton />
            </div>
          </div>
        </div>

        {/* Upcoming posts (limited preview) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/60 text-sm font-medium">Upcoming Posts</h2>
            <a
              href="/posts"
              className="text-white/25 text-xs hover:text-white/50 transition-colors"
            >
              View all →
            </a>
          </div>

          {posts.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="1" y="1" width="18" height="18" rx="3" stroke="white" strokeOpacity="0.2" />
                  <line x1="5" y1="7" x2="15" y2="7" stroke="white" strokeOpacity="0.2" strokeLinecap="round" />
                  <line x1="5" y1="10.5" x2="15" y2="10.5" stroke="white" strokeOpacity="0.2" strokeLinecap="round" />
                  <line x1="5" y1="14" x2="10" y2="14" stroke="white" strokeOpacity="0.2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-white/35 text-sm font-medium mb-1.5">No posts scheduled yet</p>
              <p className="text-white/20 text-xs max-w-xs mx-auto leading-relaxed">
                Connect your Google Business Profile to generate your first batch of posts automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {posts.slice(0, 8).map((post) => {
                const scheduledDate = new Date(post.scheduled_at)
                const dateStr = scheduledDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
                const words = post.content.split(' ')
                const preview = words.slice(0, 14).join(' ') + (words.length > 14 ? '...' : '')

                return (
                  <div
                    key={post.id}
                    className="glass rounded-xl p-4 hover:bg-white/[0.06] transition-all duration-150 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/25 text-[10px] font-medium">{dateStr}</span>
                      <span className="text-[9px] text-white/20 px-1.5 py-0.5 rounded-full border border-white/[0.08]">
                        pending
                      </span>
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-4">{preview}</p>
                    {post.locations?.[0]?.business_name && (
                      <p className="text-white/20 text-[10px] mt-3 truncate border-t border-white/[0.05] pt-2.5">
                        {post.locations[0].business_name}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
