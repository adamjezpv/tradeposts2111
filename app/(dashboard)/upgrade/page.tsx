'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const PLANS = {
  solo: {
    monthly: { price: 19 },
    annual:  { price: 15 },
  },
  agency: {
    monthly: { price: 39 },
    annual:  { price: 31 },
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
  plan,
  billing,
  price,
  badge,
  features,
  highlighted,
}: {
  name: string
  plan: 'solo' | 'agency'
  billing: 'monthly' | 'annual'
  price: number
  badge?: string
  features: string[]
  highlighted?: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing }),
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative rounded-2xl p-7 flex flex-col gap-6 transition-colors duration-200 ${
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
          <motion.span
            key={price}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-4xl font-bold text-white"
          >
            ${price}
          </motion.span>
          <span className="text-white/30 text-sm mb-1.5">/mo</span>
        </div>
      </div>

      <ul className="space-y-3 flex-1">
        {features.map((f, i) => (
          <motion.li
            key={f}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            className="flex items-center gap-3"
          >
            <CheckIcon />
            <span className="text-white/55 text-sm">{f}</span>
          </motion.li>
        ))}
      </ul>

      <motion.button
        onClick={handleStart}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
      </motion.button>
    </motion.div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-14 text-center"
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.4em' }}
            animate={{ opacity: 1, letterSpacing: '0.25em' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/25 text-[10px] font-semibold uppercase tracking-[0.25em] mb-6"
          >
            Pricing
          </motion.p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight tracking-tight">
            Less than one service call.
          </h1>
          <p className="text-white/35 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            At $19/mo, TradePosts pays for itself the moment a new customer calls from your profile.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm transition-colors ${!annual ? 'text-white' : 'text-white/35'}`}>
            Monthly
          </span>
          <motion.button
            onClick={() => setAnnual((v) => !v)}
            whileTap={{ scale: 0.95 }}
            className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
            style={{ backgroundColor: annual ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }}
            aria-label="Toggle billing period"
          >
            <motion.span
              animate={{ x: annual ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
            />
          </motion.button>
          <span className={`text-sm transition-colors flex items-center gap-2 ${annual ? 'text-white' : 'text-white/35'}`}>
            Annual
            <span className="text-[10px] font-semibold tracking-wide bg-white/10 text-white/60 px-1.5 py-0.5 rounded">
              -20%
            </span>
          </span>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
        >
          <PlanCard
            name="Solo"
            plan="solo"
            billing={billing}
            price={PLANS.solo[billing].price}
            features={SOLO_FEATURES}
          />
          <PlanCard
            name="Agency"
            plan="agency"
            billing={billing}
            price={PLANS.agency[billing].price}
            badge="Popular"
            features={AGENCY_FEATURES}
            highlighted
          />
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="text-center text-white/20 text-xs leading-relaxed"
        >
          No credit card required to start · Cancel anytime · Instant setup
        </motion.p>
      </div>
    </div>
  )
}
