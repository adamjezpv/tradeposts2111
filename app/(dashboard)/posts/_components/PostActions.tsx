'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EditPostModal from './EditPostModal'

interface PostActionsProps {
  postId: string
  content: string
  scheduledAt: string
  status: string
}

export default function PostActions({ postId, content, scheduledAt, status }: PostActionsProps) {
  const [editing, setEditing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const router = useRouter()

  async function handlePublish() {
    if (publishing || status === 'published') return
    setPublishing(true)
    setPublishError(null)
    try {
      const res = await fetch(`/api/posts/${postId}/publish`, { method: 'POST' })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        setPublishError(data.error ?? 'Failed to publish')
        setPublishing(false)
        return
      }
      router.refresh()
    } catch {
      setPublishError('Network error')
      setPublishing(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-white/35 hover:text-white/65 text-xs font-medium px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            Edit
          </button>
          {status !== 'published' && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 bg-white text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-white/90 active:scale-[0.97] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Publishing…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                  Publish Now
                </>
              )}
            </button>
          )}
        </div>
        {publishError && (
          <p className="text-red-400/70 text-[10px]">{publishError}</p>
        )}
      </div>

      {editing && (
        <EditPostModal
          postId={postId}
          initialContent={content}
          initialScheduledAt={scheduledAt}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
