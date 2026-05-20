'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  actions?: PageAction[]
  actionStatus?: Record<string, 'pending' | 'success' | 'error'>
}

interface PageAction {
  type: 'update_schedule' | 'generate_posts' | 'navigate'
  locationId?: string
  payload?: Record<string, unknown>
  url?: string
}

interface Location {
  id: string
  business_name: string
  business_type: string
}

interface Props {
  locations: Location[]
}

const WELCOME_MESSAGE = `Hi! I'm your Business Assistant, powered by Gemini.

I can help you:
• Research your business online and build a full profile
• Verify business details (hours, services, contact info)
• Manage your posting schedule
• Generate posts for your locations

Tell me your business name or address to get started, or ask me anything about your locations.`

export default function LocationBusinessAgent({ locations }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id ?? '')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [open, messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  const buildContext = useCallback(() => {
    const parts: string[] = []
    if (locations.length === 0) {
      parts.push('User has no locations connected yet.')
    } else {
      parts.push(
        `User has ${locations.length} location(s): ${locations
          .map((l) => `"${l.business_name}" (type: ${l.business_type}, ID: ${l.id})`)
          .join('; ')}`
      )
    }
    if (selectedLocationId) {
      const sel = locations.find((l) => l.id === selectedLocationId)
      if (sel) parts.push(`Currently focused location: "${sel.business_name}" (ID: ${sel.id})`)
    }
    return parts.join('. ')
  }, [locations, selectedLocationId])

  async function executeAction(action: PageAction, msgIndex: number, actionKey: string) {
    setMessages((prev) =>
      prev.map((m, i) =>
        i !== msgIndex ? m : { ...m, actionStatus: { ...m.actionStatus, [actionKey]: 'pending' } }
      )
    )

    try {
      if (action.type === 'update_schedule' && action.locationId && action.payload) {
        const res = await fetch(`/api/locations/${action.locationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        })
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          throw new Error(data.error ?? 'Failed to update schedule')
        }
        router.refresh()
      } else if (action.type === 'generate_posts' && action.locationId) {
        const res = await fetch('/api/posts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location_id: action.locationId }),
        })
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          throw new Error(data.error ?? 'Failed to generate posts')
        }
        router.refresh()
      } else if (action.type === 'navigate' && action.url) {
        router.push(action.url)
        return
      } else {
        throw new Error('Unknown or incomplete action')
      }

      setMessages((prev) =>
        prev.map((m, i) =>
          i !== msgIndex ? m : { ...m, actionStatus: { ...m.actionStatus, [actionKey]: 'success' } }
        )
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((m, i) =>
          i !== msgIndex ? m : { ...m, actionStatus: { ...m.actionStatus, [actionKey]: 'error' } }
        )
      )
      // Add error feedback in chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Action failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again or do it manually.`,
        },
      ])
    }
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/assistant/business-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: buildContext(),
        }),
      })

      const data = await res.json() as {
        success?: boolean
        message?: string
        actions?: PageAction[]
        error?: string
        detail?: string
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Request failed')
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.message ?? '',
        actions: data.actions && data.actions.length > 0 ? data.actions : undefined,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function autoResize(e: React.FormEvent<HTMLTextAreaElement>) {
    const target = e.currentTarget
    target.style.height = 'auto'
    target.style.height = `${Math.min(target.scrollHeight, 100)}px`
  }

  function getActionLabel(action: PageAction) {
    const loc = locations.find((l) => l.id === action.locationId)
    const name = loc?.business_name ?? 'location'
    switch (action.type) {
      case 'update_schedule':
        return `Update posting schedule for ${name}`
      case 'generate_posts':
        return `Generate new posts for ${name}`
      case 'navigate':
        return `Go to ${action.url}`
      default:
        return 'Execute action'
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Close Business Assistant' : 'Open Business Assistant'}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl glass-bright border border-white/[0.12] flex items-center justify-center hover:bg-white/15 transition-all shadow-xl"
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeOpacity="0.7" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              stroke="white"
              strokeOpacity="0.75"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[390px] flex flex-col glass-bright rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
          style={{ height: '540px' }}>

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-white/80 text-sm font-semibold leading-tight">Business Assistant</p>
              <p className="text-white/25 text-[10px] mt-0.5">Gemini · web research · page control</p>
            </div>
            {locations.length > 1 && (
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="text-[10px] bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white/50 focus:outline-none focus:border-white/20 max-w-[130px] truncate"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id} className="bg-black">
                    {l.business_name}
                  </option>
                ))}
              </select>
            )}
            {locations.length === 1 && (
              <span className="text-[10px] text-white/25 border border-white/[0.06] px-2 py-1 rounded-lg">
                {locations[0].business_name}
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, msgIndex) => (
              <div key={msgIndex} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[88%] space-y-2">
                  <div
                    className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-white/10 text-white/80 rounded-br-sm'
                        : 'bg-white/[0.04] text-white/65 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Action buttons */}
                  {msg.actions?.map((action, actionIndex) => {
                    const key = `${actionIndex}`
                    const status = msg.actionStatus?.[key]
                    return (
                      <button
                        key={actionIndex}
                        onClick={() => executeAction(action, msgIndex, key)}
                        disabled={status === 'pending' || status === 'success'}
                        className={`w-full text-left text-[10px] px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                          status === 'success'
                            ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400/70 cursor-default'
                            : status === 'error'
                            ? 'border-red-500/25 bg-red-500/[0.08] text-red-400/70 cursor-pointer hover:bg-red-500/[0.12]'
                            : status === 'pending'
                            ? 'border-white/[0.07] bg-white/[0.03] text-white/30 cursor-wait'
                            : 'border-white/[0.1] bg-white/[0.05] text-white/60 hover:bg-white/[0.09] hover:text-white/80 cursor-pointer'
                        }`}
                      >
                        <span className="flex-shrink-0">
                          {status === 'success' ? (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : status === 'pending' ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="animate-spin">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">
                          {status === 'success'
                            ? `Done — ${getActionLabel(action)}`
                            : status === 'error'
                            ? `Retry — ${getActionLabel(action)}`
                            : status === 'pending'
                            ? 'Working...'
                            : getActionLabel(action)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] rounded-xl rounded-bl-sm px-3 py-2.5">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce"
                        style={{ animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={autoResize}
                placeholder="Ask anything or describe your business..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white/70 text-xs placeholder-white/20 focus:outline-none focus:border-white/20 resize-none leading-relaxed disabled:opacity-50"
                style={{ minHeight: '36px', maxHeight: '100px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl glass border border-white/[0.1] flex items-center justify-center hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                    stroke="white"
                    strokeOpacity="0.8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="text-white/15 text-[9px] mt-1.5 text-center">
              Enter to send · Shift+Enter for newline · researches the web in real time
            </p>
          </div>
        </div>
      )}
    </>
  )
}
