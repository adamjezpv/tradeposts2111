'use client'

import { useState } from 'react'
import EditPostModal from './EditPostModal'

interface PostActionsProps {
  postId: string
  content: string
  scheduledAt: string
}

export default function PostActions({ postId, content, scheduledAt }: PostActionsProps) {
  const [editing, setEditing] = useState(false)

  return (
    <>
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
        <button
          type="button"
          className="flex items-center gap-2 bg-white text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-white/90 active:scale-[0.97] transition-all duration-150 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
          Publish Now
        </button>
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
