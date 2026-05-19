'use client'

import { useState } from 'react'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        throw new Error(`Server error ${res.status}`)
      }
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || data.error) {
        alert(data.error ?? 'Checkout failed. Check console for details.')
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('[UpgradeButton]', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="w-3 h-3 rounded-full border border-black/30 border-t-black animate-spin" />
          Redirecting…
        </>
      ) : (
        <>Upgrade to Premium — $49/mo →</>
      )}
    </button>
  )
}
