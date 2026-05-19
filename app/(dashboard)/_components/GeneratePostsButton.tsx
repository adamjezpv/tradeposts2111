'use client'

import { useState } from 'react'

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
      <button
        onClick={handleGenerate}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <>
            <span className="w-3 h-3 rounded-full border border-black/30 border-t-black animate-spin" />
            Generating…
          </>
        ) : (
          'Generate Posts with AI →'
        )}
      </button>
      {message && (
        <p className={`mt-2 text-xs ${state === 'error' ? 'text-red-400/70' : 'text-white/40'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
