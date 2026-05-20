'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UpgradeButton } from './UpgradeButton'

export default function TrialExpiredBlock() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('upgraded') === '1') {
      router.replace('/dashboard')
      router.refresh()
    }
  }, [router, searchParams])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
      <div className="glass-bright rounded-3xl p-10 max-w-md w-full mx-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_60%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
              <line x1="12" y1="7" x2="12" y2="13" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1" fill="white" fillOpacity="0.5" />
            </svg>
          </div>

          <h2 className="text-white text-xl font-bold mb-2 tracking-tight">
            Your trial has ended
          </h2>
          <p className="text-white/35 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            Upgrade to continue using TradePosts. Unlock auto-publishing, unlimited scheduled posts, and the full command center dashboard.
          </p>

          <UpgradeButton />

          <p className="text-white/20 text-xs mt-5">
            Questions? <a href="mailto:support@tradeposts.io" className="text-white/35 hover:text-white/55 transition-colors">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  )
}
