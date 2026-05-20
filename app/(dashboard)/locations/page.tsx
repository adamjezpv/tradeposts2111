export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import GeneratePostsButton from '../_components/GeneratePostsButton'
import LocationScheduleForm from './_components/LocationScheduleForm'
import { LocationCardWrapper, PageHeader, EmptyStateAnimated } from './_components/LocationsAnimated'
import LocationBusinessAgent from './_components/LocationBusinessAgent'

const ERROR_MESSAGES: Record<string, string> = {
  solo_limit: 'You\'ve reached the 1-location limit on your plan. Upgrade to Agency for up to 10 locations.',
  agency_limit: 'You\'ve reached the 10-location limit on the Agency plan.',
  oauth_failed: 'Google connection failed. Please try again.',
  exchange_failed: 'Google authentication failed. Please try again.',
  missing_code: 'Google login returned no code. Please try again.',
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [locationsResult, profileResult] = await Promise.all([
    supabase
      .from('locations')
      .select('id, business_name, business_type, active, created_at, generation_interval_days, posting_days_of_week, posting_hour')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('plan')
      .eq('id', user!.id)
      .maybeSingle(),
  ])

  const locations = locationsResult.data
  const plan = profileResult.data?.plan ?? 'trial'
  const locationLimit = plan === 'agency' ? 10 : 1
  const canAddMore = (locations?.length ?? 0) < locationLimit
  const params = await searchParams
  const errorMessage = params.error ? (ERROR_MESSAGES[params.error] ?? `Error: ${params.error}`) : null

  const agentLocations = (locations ?? []).map((l) => ({
    id: l.id,
    business_name: l.business_name,
    business_type: l.business_type ?? '',
  }))

  return (
    <div className="min-h-full p-8">
      <div className="max-w-5xl">
        <PageHeader
          title="Locations"
          subtitle="Manage your Google Business Profile connections and posting schedule."
        />

        {errorMessage && (
          <div className="mb-6 glass rounded-xl px-5 py-4 flex items-center gap-3 border border-red-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
            <p className="text-red-400/80 text-sm">{errorMessage}</p>
            {errorMessage.includes('Upgrade') && (
              <a
                href="/upgrade"
                className="ml-auto flex-shrink-0 text-[11px] font-semibold text-white/60 hover:text-white border border-white/[0.1] hover:border-white/25 px-3 py-1.5 rounded-lg transition-all"
              >
                Upgrade →
              </a>
            )}
          </div>
        )}

        {locations && locations.length > 0 ? (
          <div className="space-y-3">
            {locations.map((loc, i) => (
              <LocationCardWrapper key={loc.id} index={i}>
                <div className="glass-bright rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        <h3 className="text-white text-sm font-semibold">{loc.business_name}</h3>
                      </div>
                      <p className="text-white/30 text-xs ml-3.5">{loc.business_type}</p>
                    </div>
                    <span className="text-[10px] text-white/25 px-2 py-1 rounded-full border border-white/[0.08]">
                      {loc.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="ml-3.5">
                    <GeneratePostsButton locationId={loc.id} />
                  </div>

                  <LocationScheduleForm
                    locationId={loc.id}
                    initialIntervalDays={loc.generation_interval_days ?? 7}
                    initialDaysOfWeek={loc.posting_days_of_week ?? null}
                    initialHour={loc.posting_hour ?? 9}
                  />
                </div>
              </LocationCardWrapper>
            ))}

            <LocationCardWrapper index={locations.length}>
              <div className="glass rounded-2xl p-6 mt-6 text-center">
                {canAddMore ? (
                  <>
                    <p className="text-white/25 text-xs mb-4">Want to add another location?</p>
                    <a
                      href="/api/auth/google"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all active:scale-[0.98]"
                    >
                      Connect Google Business →
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-white/25 text-xs mb-1">
                      {plan === 'agency'
                        ? `Agency plan limit reached (${locationLimit} locations).`
                        : plan === 'solo'
                        ? 'Solo plan allows 1 location.'
                        : 'Free trial allows 1 location.'}
                    </p>
                    {plan !== 'agency' && (
                      <p className="text-white/20 text-xs mb-4">Upgrade to Agency to manage up to 10 locations.</p>
                    )}
                    {plan !== 'agency' && (
                      <a
                        href="/upgrade"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm font-semibold hover:bg-white/15 border border-white/[0.12] transition-all active:scale-[0.98]"
                      >
                        Upgrade to Agency →
                      </a>
                    )}
                  </>
                )}
              </div>
            </LocationCardWrapper>
          </div>
        ) : (
          <EmptyStateAnimated>
            <div className="glass rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="8" r="3" stroke="white" strokeOpacity="0.2" />
                  <path d="M10 18C10 18 3 13 3 8C3 4.13 6.13 1 10 1C13.87 1 17 4.13 17 8C17 13 10 18 10 18Z" stroke="white" strokeOpacity="0.2" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-white/35 text-sm font-medium mb-1.5">No locations connected</p>
              <p className="text-white/20 text-xs max-w-xs mx-auto leading-relaxed mb-6">
                Connect your Google Business Profile to start auto-publishing posts every week.
              </p>
              <a
                href="/api/auth/google"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all active:scale-[0.98]"
              >
                Connect Google Business Profile →
              </a>
            </div>
          </EmptyStateAnimated>
        )}
      </div>

      <LocationBusinessAgent locations={agentLocations} />
    </div>
  )
}
