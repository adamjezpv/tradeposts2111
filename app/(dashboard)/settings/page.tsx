import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SettingsContainer, SettingsCard, SettingsHeader } from './_components/SettingsAnimated'
import ManageBillingButton from './_components/ManageBillingButton'
import RestorePlanButton from './_components/RestorePlanButton'

export const runtime = 'edge'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('plan, trial_ends, stripe_customer_id')
    .eq('id', user!.id)
    .maybeSingle()

  const plan = profile?.plan ?? 'trial'
  const hasBilling = plan === 'solo' || plan === 'agency'

  return (
    <div className="min-h-full p-8">
      <div className="max-w-2xl">
        <SettingsHeader title="Settings" subtitle="Manage your account and subscription." />

        <SettingsContainer>
          {/* Account info */}
          <SettingsCard className="glass-bright rounded-2xl p-6">
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-5">Account</p>
            <div className="space-y-4">
              <div>
                <p className="text-white/30 text-xs mb-1">Email</p>
                <p className="text-white/70 text-sm">{user?.email}</p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">Plan</p>
                <p className="text-white/70 text-sm capitalize">{plan === 'trial' ? 'Free Trial' : plan}</p>
              </div>
              {profile?.trial_ends && plan === 'trial' && (
                <div>
                  <p className="text-white/30 text-xs mb-1">Trial ends</p>
                  <p className="text-white/70 text-sm">
                    {new Date(profile.trial_ends).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </SettingsCard>

          {/* Billing management for paying users */}
          {hasBilling && (
            <SettingsCard className="glass-bright rounded-2xl p-6">
              <p className="text-white/25 text-[10px] uppercase tracking-widest mb-4">Billing</p>
              <p className="text-white/30 text-xs leading-relaxed mb-5">
                Manage your subscription, update payment methods, download invoices, or cancel your plan.
              </p>
              <ManageBillingButton />
            </SettingsCard>
          )}

          {/* Upgrade card for trial users */}
          {plan === 'trial' && (
            <SettingsCard className="glass-bright rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.04),transparent_60%)] pointer-events-none" />
              <div className="relative z-10">
                <p className="text-white/25 text-[10px] uppercase tracking-widest mb-4">Subscription</p>
                <h3 className="text-white text-sm font-semibold mb-2">Ready to go live?</h3>
                <p className="text-white/30 text-xs leading-relaxed mb-5">
                  Choose a plan that fits your business — from a single location to a full agency setup.
                </p>
                <Link
                  href="/upgrade"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all active:scale-[0.98]"
                >
                  View plans →
                </Link>
                <RestorePlanButton />
              </div>
            </SettingsCard>
          )}

          {/* Danger zone */}
          <SettingsCard className="glass rounded-2xl p-6">
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-5">Danger Zone</p>
            <p className="text-white/30 text-xs leading-relaxed mb-4">
              Deleting your account will permanently remove all your data, locations, and scheduled posts.
            </p>
            <button
              disabled
              className="text-xs text-red-500/30 hover:text-red-500/50 transition-colors cursor-not-allowed"
            >
              Delete account (coming soon)
            </button>
          </SettingsCard>
        </SettingsContainer>
      </div>
    </div>
  )
}
