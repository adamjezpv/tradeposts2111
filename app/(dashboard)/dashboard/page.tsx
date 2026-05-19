import { createClient } from '@/lib/supabase/server'
import { UpgradeButton } from '../_components/UpgradeButton'

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

  const [profileResult, postsResult, locationCountResult] = await Promise.all([
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
      .limit(8),
    supabase
      .from('locations')
      .select('*', { count: 'exact', head: true }),
  ])

  const profile = profileResult.data
  const posts = (postsResult.data ?? []) as PostWithLocation[]
  const locationCount = locationCountResult.count ?? 0

  // Trial days remaining
  let trialDaysLeft = 14
  const plan = profile?.plan ?? 'trial'

  if (plan === 'trial') {
    const trialEnds = profile?.trial_ends
      ? new Date(profile.trial_ends)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    trialDaysLeft = Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }

  const trialProgress = Math.min(100, ((14 - trialDaysLeft) / 14) * 100)
  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? 'there'

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

          {plan === 'trial' ? (
            <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
              <span className="text-white/50 text-xs font-medium">
                Trial · {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
              </span>
            </div>
          ) : (
            <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="text-white/50 text-xs font-medium capitalize">{plan} plan</span>
            </div>
          )}
        </div>

        {/* Top widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

          {/* Account status card */}
          <div className="glass-bright rounded-2xl p-6">
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-5">Account Status</p>

            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-medium">
                {plan === 'trial' ? 'Free Trial' : plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan'}
              </span>
              {plan === 'trial' && (
                <span className="text-white/30 text-xs">{trialDaysLeft} / 14 days</span>
              )}
            </div>

            {plan === 'trial' && (
              <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-white/25 rounded-full transition-all duration-700"
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
            )}

            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2.5 text-white/30 text-xs">
                <span className="text-white/20">✓</span>
                {plan === 'trial' ? '1 location (preview only)' : plan === 'solo' ? '1 location, auto-publish' : 'Up to 5 locations'}
              </div>
              <div className="flex items-center gap-2.5 text-white/30 text-xs">
                <span className="text-white/20">✓</span>
                4 AI posts per month
              </div>
              {plan === 'trial' && (
                <div className="flex items-center gap-2.5 text-white/20 text-xs">
                  <span className="text-white/10">○</span>
                  Auto-publish (upgrade to unlock)
                </div>
              )}
            </div>

            {plan === 'trial' && (
              <div className="flex items-center gap-3">
                <UpgradeButton />
              </div>
            )}
          </div>

          {/* Connect GBP card / location status */}
          {locationCount === 0 ? (
            <div className="glass-bright rounded-2xl p-6 relative overflow-hidden group hover:bg-white/[0.09] transition-all duration-200">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.04),transparent_60%)] pointer-events-none" />
              <div className="relative z-10">
                <p className="text-white/25 text-[10px] uppercase tracking-widest mb-5">Get Started</p>

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-semibold leading-snug">
                      Connect your Google Business Profile
                    </h3>
                    <p className="text-white/30 text-xs mt-0.5">Start auto-posting in 2 minutes</p>
                  </div>
                </div>

                <p className="text-white/25 text-xs leading-relaxed mb-5">
                  Authorize TradePosts to publish on your behalf. We&apos;ll generate 4 posts per month and publish them automatically on schedule.
                </p>

                <a
                  href="/api/locations/mock-connect"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all active:scale-[0.98]"
                >
                  Connect Google Business Profile →
                </a>
              </div>
            </div>
          ) : (
            <div className="glass-bright rounded-2xl p-6">
              <p className="text-white/25 text-[10px] uppercase tracking-widest mb-5">Locations</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                <span className="text-white text-sm font-medium">
                  {locationCount} location{locationCount !== 1 ? 's' : ''} connected
                </span>
              </div>
              <p className="text-white/25 text-xs mb-5">Posts are publishing automatically on schedule.</p>
              <a
                href="/locations"
                className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors group"
              >
                Manage locations
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </a>
            </div>
          )}
        </div>

        {/* Post Queue section */}
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
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              {posts.map((post) => {
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
