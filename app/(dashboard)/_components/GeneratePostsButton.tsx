'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  locationId: string
}

type GenerateResult =
  | { success: true; count: number; location: string }
  | { error: string }

export default function GeneratePostsButton({ locationId }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleGenerate() {
    setState('loading')
    setMessage('')
    try {
      const res = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: locationId }),
      })
      const data = await res.json() as GenerateResult
      if (res.ok && 'success' in data) {
        setState('done')
        setMessage(`Generated ${data.count} posts for ${data.location}`)
      } else {
        setState('error')
        setMessage('error' in data ? data.error : 'Something went wrong')
      }
    } catch {
      setState('error')
      setMessage('Network error — please try again')
    }
  }

  return (
    <div className="mt-4">
      <motion.button
        onClick={handleGenerate}
        disabled={state === 'loading'}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <>
            <span className="w-3 h-3 rounded-full border border-black/30 border-t-black animate-spin" />
            Generating…
          </>
        ) : state === 'done' ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            Done →
          </motion.span>
        ) : (
          'Generate Posts with AI →'
        )}
      </motion.button>
      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`mt-2 text-xs ${state === 'error' ? 'text-red-400/70' : 'text-white/40'}`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
