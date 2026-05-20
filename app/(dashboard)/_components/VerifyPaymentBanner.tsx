'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyPaymentBanner() {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  async function handleVerify() {
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/billing/sync', { method: 'POST' })
      const data = await res.json() as { synced?: boolean; plan?: string; message?: string; error?: string }

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Verification failed. Try again.')
        setState('error')
        return
      }

      if (data.synced && (data.plan === 'solo' || data.plan === 'agency')) {
        router.refresh()
      } else {
        setErrorMsg(data.message ?? 'No active subscription found. Contact support.')
        setState('error')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setState('error')
    }
  }

  return (
    <div className="mx-8 mb-4 glass rounded-xl px-5 py-4 flex items-center justify-between gap-4 border border-white/[0.1]">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
        <div>
          <p className="text-white/60 text-xs font-medium">Payment processing</p>
          {errorMsg ? (
            <p className="text-red-400/70 text-[11px] mt-0.5">{errorMsg}</p>
          ) : (
            <p className="text-white/30 text-[11px] mt-0.5">Your plan should update shortly. Click verify if it&apos;s taking too long.</p>
          )}
        </div>
      </div>
      <button
        onClick={handleVerify}
        disabled={state === 'loading'}
        className="flex-shrink-0 text-[11px] font-semibold text-white/70 hover:text-white border border-white/[0.12] hover:border-white/25 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white/30 border-t-white animate-spin" />
            Verifying…
          </span>
        ) : 'Verify now'}
      </button>
    </div>
  )
}
