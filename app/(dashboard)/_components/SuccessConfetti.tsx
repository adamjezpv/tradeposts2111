'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'

export default function SuccessConfetti() {
  const router = useRouter()

  useEffect(() => {
    const end = Date.now() + 3500
    const colors = ['#ffffff', '#d4d4d4', '#a3a3a3']
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)

    const timer = setTimeout(() => router.replace('/dashboard'), 4000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center mx-auto mb-6">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 11L9 16L18 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Subscription active</h1>
        <p className="text-white/35 text-sm">Redirecting to your dashboard…</p>
      </motion.div>
    </div>
  )
}
