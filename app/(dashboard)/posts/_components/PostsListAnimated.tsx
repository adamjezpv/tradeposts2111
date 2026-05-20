'use client'

import { motion, type Variants } from 'framer-motion'
import PostActions from './PostActions'

type Post = {
  id: string
  content: string
  scheduled_at: string
  status: string
  locations: { business_name: string; business_type: string | null }[] | null
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  published: { bg: 'bg-emerald-500/10 border border-emerald-500/20', text: 'text-emerald-400', label: 'Published' },
  scheduled: { bg: 'bg-blue-500/10 border border-blue-500/20', text: 'text-blue-400', label: 'Scheduled' },
  failed:    { bg: 'bg-red-500/10 border border-red-500/20', text: 'text-red-400', label: 'Failed' },
  pending:   { bg: 'bg-white/5 border border-white/10', text: 'text-white/40', label: 'Pending' },
}

export default function PostsListAnimated({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="glass rounded-2xl p-16 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <p className="text-white/35 text-sm font-medium mb-1.5">No posts yet</p>
        <p className="text-white/20 text-xs max-w-xs mx-auto leading-relaxed">
          Generate posts from the Dashboard to see them here.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-5"
    >
      {posts.map((post) => {
        const scheduledDate = new Date(post.scheduled_at)
        const dateLabel = scheduledDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })

        const businessName = post.locations?.[0]?.business_name
        const status = STATUS_STYLES[post.status] ?? STATUS_STYLES.pending

        // Content is stored as JSON {google, facebook, linkedin, reddit} — show Google version
        let displayContent = post.content
        try {
          const parsed = JSON.parse(post.content) as Record<string, string>
          displayContent = parsed.google ?? parsed.facebook ?? parsed.linkedin ?? parsed.reddit ?? post.content
        } catch {
          // plain text fallback
        }
        const paragraphs = displayContent.split(/\n+/).filter(Boolean)

        return (
          <motion.article
            key={post.id}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
            } satisfies Variants}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="group glass rounded-2xl overflow-hidden flex flex-col hover:bg-white/[0.04] transition-colors duration-200 border border-white/[0.06] hover:border-white/[0.12]"
          >
            {/* Card top: date + status badge */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="text-white/20 text-[10px] uppercase tracking-widest font-semibold">Schedule for</span>
                <span className="text-white/70 text-xs font-semibold tracking-wide">{dateLabel}</span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>

            {/* Post body */}
            <div className="px-7 py-7 flex-1 space-y-3">
              {paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? 'text-white/90 text-base font-medium leading-relaxed tracking-tight'
                      : 'text-white/55 text-sm leading-relaxed'
                  }
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Card bottom */}
            <div className="flex items-center justify-between px-7 pb-6 pt-3 border-t border-white/[0.06]">
              {businessName ? (
                <p className="text-white/30 text-xs font-medium truncate">{businessName}</p>
              ) : (
                <span />
              )}
              <PostActions postId={post.id} content={post.content} scheduledAt={post.scheduled_at} status={post.status} />
            </div>
          </motion.article>
        )
      })}
    </motion.div>
  )
}
