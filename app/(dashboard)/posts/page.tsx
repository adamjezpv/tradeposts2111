import { createClient } from '@/lib/supabase/server'
import PostActions from './_components/PostActions'

export const runtime = 'edge'

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

export default async function PostsPage() {
  const supabase = await createClient()

  const { data: rawPosts } = await supabase
    .from('post_queue')
    .select('id, content, scheduled_at, status, locations(business_name, business_type)')
    .in('status', ['pending', 'scheduled', 'published', 'failed'])
    .order('scheduled_at', { ascending: true })
    .limit(50)

  const allPosts = (rawPosts ?? []) as Post[]

  return (
    <div className="min-h-full p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-bold text-gradient tracking-tight mb-1">Posts</h1>
          <p className="text-white/30 text-sm">Your scheduled and published Google Business posts.</p>
        </div>

        {allPosts.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <p className="text-white/35 text-sm font-medium mb-1.5">No posts yet</p>
            <p className="text-white/20 text-xs max-w-xs mx-auto leading-relaxed">
              Generate posts from the Dashboard to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {allPosts.map((post) => {
              const scheduledDate = new Date(post.scheduled_at)
              const dateLabel = scheduledDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })

              const businessName = post.locations?.[0]?.business_name
              const status = STATUS_STYLES[post.status] ?? STATUS_STYLES.pending
              const paragraphs = post.content.split(/\n+/).filter(Boolean)

              return (
                <article
                  key={post.id}
                  className="group glass rounded-2xl overflow-hidden flex flex-col hover:bg-white/[0.04] transition-all duration-200 border border-white/[0.06] hover:border-white/[0.12]"
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

                  {/* Post body — main content */}
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

                  {/* Card bottom: business name + CTA */}
                  <div className="flex items-center justify-between px-7 pb-6 pt-3 border-t border-white/[0.06]">
                    {businessName ? (
                      <p className="text-white/30 text-xs font-medium truncate">{businessName}</p>
                    ) : (
                      <span />
                    )}
                    <PostActions postId={post.id} content={post.content} scheduledAt={post.scheduled_at} />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
