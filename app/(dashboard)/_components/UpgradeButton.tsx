'use client'

import { useRouter } from 'next/navigation'

export function UpgradeButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/upgrade')}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all active:scale-[0.98]"
    >
      View plans — from $19/mo →
    </button>
  )
}
