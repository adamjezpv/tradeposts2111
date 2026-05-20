'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

type Platform = 'google' | 'facebook' | 'linkedin' | 'reddit'

type PlatformContent = {
  google: string
  facebook: string
  linkedin: string
  reddit: string
}

export const CHAR_LIMITS: Record<Platform, number> = {
  google: 1500,
  facebook: 63206,
  linkedin: 3000,
  reddit: 40000,
}

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'reddit', label: 'Reddit' },
]

export function parsePostContent(raw: string): PlatformContent {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        google: String(parsed.google ?? ''),
        facebook: String(parsed.facebook ?? ''),
        linkedin: String(parsed.linkedin ?? ''),
        reddit: String(parsed.reddit ?? ''),
      }
    }
  } catch {
    // plain string fallback
  }
  return { google: raw, facebook: raw, linkedin: raw, reddit: raw }
}

function toDateLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function PlatformIcon({ platform }: { platform: Platform }) {
  if (platform === 'google') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032 0-3.331 2.701-6.032 6.033-6.032 1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12c0 5.523 4.478 10 10.002 10 8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
      </svg>
    )
  }
  if (platform === 'facebook') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  }
  if (platform === 'linkedin') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  }
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  )
}

interface Props {
  post: {
    id: string
    content: string
    scheduled_at: string
    status: string
    error_message?: string | null
  }
  onClose: () => void
}

export default function CalendarPostModal({ post, onClose }: Props) {
  const router = useRouter()
  const [activePlatform, setActivePlatform] = useState<Platform>('google')
  const [contents, setContents] = useState<PlatformContent>(() => parsePostContent(post.content))
  const [date, setDate] = useState(() => toDateLocal(post.scheduled_at))
  const [time, setTime] = useState(() => toTimeLocal(post.scheduled_at))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(post.error_message ?? null)
  const [toastVisible, setToastVisible] = useState(false)

  const handleClose = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleClose])

  const currentText = contents[activePlatform]
  const charLimit = CHAR_LIMITS[activePlatform]
  const charCount = currentText.length
  const isOverLimit = charCount > charLimit
  const isAnyOverLimit = (Object.keys(CHAR_LIMITS) as Platform[]).some(
    p => contents[p].length > CHAR_LIMITS[p]
  )
  const activeLabel = PLATFORMS.find(p => p.id === activePlatform)?.label ?? activePlatform

  function handleTextChange(text: string) {
    setContents(prev => ({ ...prev, [activePlatform]: text }))
  }

  async function handleRetry() {
    if (retrying) return
    setRetrying(true)
    setRetryError(null)
    try {
      const res = await fetch(`/api/posts/${post.id}/retry`, { method: 'POST' })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        setToastVisible(true)
        setTimeout(() => {
          setToastVisible(false)
          router.refresh()
          onClose()
        }, 2000)
      } else {
        setRetryError(data.error ?? 'Nieznany blad. Sprobuj ponownie.')
      }
    } catch {
      setRetryError('Blad polaczenia. Sprobuj ponownie.')
    } finally {
      setRetrying(false)
    }
  }

  async function handleSave() {
    if (saving || isAnyOverLimit) return
    setSaving(true)
    setError(null)
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString()
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(contents),
          scheduled_at: scheduledAt,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to save')
      }
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  const statusColors: Record<string, string> = {
    published: 'bg-green-400',
    scheduled: 'bg-orange-400',
    failed: 'bg-red-500',
  }
  const statusColor = statusColors[post.status] ?? 'bg-white/40'

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-2xl bg-zinc-950 border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white/80 tracking-tight">Edit Post</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
              <span className="text-[10px] text-white/30 capitalize">{post.status}</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/30 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 overflow-y-auto px-6 py-5 gap-5">

          {/* Success toast */}
          <AnimatePresence>
            {toastVisible && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20"
              >
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400 text-xs font-medium">Post opublikowany pomyslnie</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Failed post error banner */}
          {post.status === 'failed' && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-red-400 text-xs font-semibold mb-0.5">Publikacja nie powiodla sie</p>
                <p className="text-red-400/70 text-[11px] leading-relaxed break-words">
                  {retryError ?? 'Nieznany blad'}
                </p>
              </div>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-1.5 flex-shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {retrying ? 'Ponawianie…' : 'Sprobuj ponownie'}
              </button>
            </div>
          )}

          {/* Platform Tabs */}
          <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl">
            {PLATFORMS.map(({ id, label }) => {
              const over = contents[id].length > CHAR_LIMITS[id]
              return (
                <button
                  key={id}
                  onClick={() => setActivePlatform(id)}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    activePlatform === id
                      ? 'bg-white/[0.1] text-white'
                      : over
                      ? 'text-red-400/70 hover:text-red-400'
                      : 'text-white/35 hover:text-white/55'
                  }`}
                >
                  <PlatformIcon platform={id} />
                  <span>{label}</span>
                  {over && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Textarea */}
          <div>
            <textarea
              value={currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={9}
              className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-white/80 text-sm leading-relaxed resize-none focus:outline-none transition-all placeholder:text-white/20 whitespace-pre-wrap ${
                isOverLimit
                  ? 'border-red-500/70 focus:border-red-500'
                  : 'border-white/[0.08] focus:border-white/20 focus:bg-white/[0.05]'
              }`}
              placeholder={`${activeLabel} post content…`}
            />
            <div className="flex items-center justify-between mt-1.5 min-h-[1.25rem]">
              <div>
                {isOverLimit && (
                  <p className="text-[11px] text-red-400">
                    Exceeds {activeLabel} limit by {(charCount - charLimit).toLocaleString()} characters
                  </p>
                )}
              </div>
              <span className={`text-[11px] tabular-nums font-medium ${
                isOverLimit ? 'text-red-400' : charCount > charLimit * 0.9 ? 'text-orange-400' : 'text-white/25'
              }`}>
                {charCount.toLocaleString()} / {charLimit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Reschedule */}
          <div>
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
              Reschedule
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white/70 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all [color-scheme:dark]"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-32 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white/70 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
          <button
            onClick={handleClose}
            className="text-white/40 text-xs font-medium hover:text-white/60 transition-colors px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isAnyOverLimit}
            title={isAnyOverLimit ? 'One or more platforms exceed the character limit' : undefined}
            className="flex items-center gap-2 bg-white text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-white/90 active:scale-[0.97] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
