'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RestorePlanButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  async function handleRestore() {
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/billing/sync', { method: 'POST' })
      const data = await res.json() as { synced?: boolean; plan?: string; message?: string; error?: string }
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Could not verify subscription.')
        setState('error')
        return
      }
      if (data.synced && (data.plan === 'solo' || data.plan === 'agency')) {
        router.refresh()
      } else {
        setErrorMsg(data.message ?? 'No active subscription found. Contact support at support@tradeposts.io')
        setState('error')
      }
    } catch {
      setErrorMsg('Network error. Try again.')
      setState('error')
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.05]">
      <button
        onClick={handleRestore}
        disabled={state === 'loading'}
        className="text-xs text-white/30 hover:text-white/55 transition-colors disabled:cursor-not-allowed"
      >
        {state === 'loading' ? 'Checking…' : 'Already subscribed? Restore plan →'}
      </button>
      {state === 'error' && (
        <p className="mt-1.5 text-[11px] text-red-400/70 leading-relaxed">{errorMsg}</p>
      )}
    </div>
  )
}
