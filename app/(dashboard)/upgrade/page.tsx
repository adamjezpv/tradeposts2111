'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLANS = {
  solo: {
    monthly: { id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTHLY ?? 'price_solo_monthly', price: 19 },
    annual:  { id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL       ?? 'price_solo_annual',  price: 15 },
  },
  agency: {
    monthly: { id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_MONTHLY ?? 'price_agency_monthly', price: 39 },
    annual:  { id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_ANNUAL   ?? 'price_agency_annual',  price: 31 },
  },
}

const SOLO_FEATURES = [
  '1 Google Business location',
  'Auto-publish posts to Google',
  'AI post generation (unlimited)',
  'Full post queue & calendar',
  'Scheduled publishing',
  'Post history & analytics',
  'Email support',
]

const AGENCY_FEATURES = [
  'Up to 10 Google Business locations',
  'Auto-publish to all locations',
  'AI post generation (unlimited)',
  'Full post queue & calendar',
  'Scheduled publishing',
  'Post history & analytics',
  'Priority support',
  'Multi-location dashboard',
  'Bulk scheduling',
]

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
      <circle cx="7" cy="7" r="6.5" stroke="white" strokeOpacity="0.15" />
      <path d="M4.5 7L6.5 9L9.5 5" stroke="white" strokeOpacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlanCard({
  name,
  price,
  priceId,
  badge,
  features,
  highlighted,
}: {
  name: string
  price: number
  priceId: string
  badge?: string
  features: string[]
  highlighted?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || data.error) {
        alert(data.error ?? 'Checkout failed.')
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`relative rounded-2xl p-7 flex flex-col gap-6 transition-all duration-200 ${
        highlighted
          ? 'bg-white/[0.08] border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.04)]'
          : 'bg-white/[0.03] border border-white/[0.08]'
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-widest uppercase bg-white text-black px-3 py-1 rounded-full">
          {badge}
        </span>
      )}

      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">{name}</p>
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-bold text-white">${price}</span>
          <span className="text-white/30 text-sm mb-1.5">/mo</span>
        </div>
      </div>

      <ul className="space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3">
            <CheckIcon />
            <span className="text-white/55 text-sm">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleStart}
        disabled={loading}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
          highlighted
            ? 'bg-white text-black hover:bg-white/90'
            : 'bg-white/10 text-white hover:bg-white/15 border border-white/[0.12]'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className={`w-3 h-3 rounded-full border border-t-transparent animate-spin ${highlighted ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'}`} />
            Redirecting…
          </span>
        ) : (
          'Get started'
        )}
      </button>
    </div>
  )
}

export default function UpgradePage() {
  const [annual, setAnnual] = useState(false)
  const billing = annual ? 'annual' : 'monthly'

  return (
    <div className="min-h-full relative">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 px-6 py-16 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-[0.25em] mb-6">
            Pricing
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight tracking-tight">
            Less than one service call.
          </h1>
          <p className="text-white/35 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            At $19/mo, TradePosts pays for itself the moment a new customer calls from your profile.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm transition-colors ${!annual ? 'text-white' : 'text-white/35'}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
            style={{ backgroundColor: annual ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }}
            aria-label="Toggle billing period"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                annual ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm transition-colors flex items-center gap-2 ${annual ? 'text-white' : 'text-white/35'}`}>
            Annual
            <span className="text-[10px] font-semibold tracking-wide bg-white/10 text-white/60 px-1.5 py-0.5 rounded">
              -20%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <PlanCard
            name="Solo"
            price={PLANS.solo[billing].price}
            priceId={PLANS.solo[billing].id}
            features={SOLO_FEATURES}
          />
          <PlanCard
            name="Agency"
            price={PLANS.agency[billing].price}
            priceId={PLANS.agency[billing].id}
            badge="Popular"
            features={AGENCY_FEATURES}
            highlighted
          />
        </div>

        {/* Footer note */}
        <p className="text-center text-white/20 text-xs leading-relaxed">
          No credit card required to start · Cancel anytime · Instant setup
        </p>
      </div>
    </div>
  )
}
