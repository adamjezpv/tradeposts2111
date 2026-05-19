'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface EditPostModalProps {
  postId: string
  initialContent: string
  initialScheduledAt: string
  onClose: () => void
}

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditPostModal({ postId, initialContent, initialScheduledAt, onClose }: EditPostModalProps) {
  const [content, setContent] = useState(initialContent)
  const [scheduledAt, setScheduledAt] = useState(() => toDatetimeLocal(initialScheduledAt))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
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

  async function handleChat() {
    const instruction = chatInput.trim()
    if (!instruction || chatLoading) return

    setChatInput('')
    setChatError(null)
    const userMsg: ChatMessage = { role: 'user', text: instruction }
    setMessages(prev => [...prev, userMsg])
    setChatLoading(true)

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentContent: content, instruction }),
      })
      const data = await res.json() as { content?: string; error?: string }
      if (!res.ok || !data.content) {
        throw new Error(data.error ?? 'No response from AI')
      }
      setContent(data.content)
      setMessages(prev => [...prev, { role: 'assistant', text: data.content! }])
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'AI error')
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠ ' + (err instanceof Error ? err.message : 'AI error') }])
    } finally {
      setChatLoading(false)
      chatInputRef.current?.focus()
    }
  }

  function handleChatKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChat()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Modal — two-column layout */}
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <h2 className="text-sm font-semibold text-white/80 tracking-tight">Edit post</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex flex-1 overflow-hidden divide-x divide-white/[0.06]">
          {/* Left: editor */}
          <div className="flex flex-col flex-1 px-6 py-5 gap-4 overflow-y-auto">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 text-sm leading-relaxed resize-none focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all placeholder:text-white/20"
              placeholder="Post content…"
            />

            <div>
              <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
                Scheduled for
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white/70 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all [color-scheme:dark]"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex items-center justify-end gap-3 mt-auto pt-2">
              <button
                onClick={onClose}
                className="text-white/40 text-xs font-medium hover:text-white/60 transition-colors px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || content.trim() === ''}
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
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>

          {/* Right: AI chat console */}
          <div className="flex flex-col w-80 shrink-0 bg-zinc-900/60">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-white/60 tracking-wide uppercase">TradePosts AI Assistant</span>
              </div>
              <p className="text-[10px] text-white/30 mt-0.5">Describe what to change and the AI rewrites the post.</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="text-[11px] text-white/20 text-center pt-6 leading-relaxed">
                  Try: &quot;add phone 555-123 and fire emoji&quot;<br />
                  or &quot;make it more urgent&quot;
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-[12px] leading-relaxed rounded-xl px-3 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-white/[0.07] text-white/70 ml-4'
                      : 'bg-emerald-950/60 text-emerald-200/80 border border-emerald-800/30'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <span className="block text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest mb-1">AI → applied to post</span>
                  )}
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-[11px] text-white/30 px-1">
                  <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Rewriting…
                </div>
              )}
              {chatError && <p className="text-[11px] text-red-400 px-1">{chatError}</p>}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 shrink-0 border-t border-white/[0.06]">
              <div className="flex gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  disabled={chatLoading}
                  placeholder="Describe your change…"
                  className="flex-1 min-w-0 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition-colors shrink-0"
                  title="Send"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
