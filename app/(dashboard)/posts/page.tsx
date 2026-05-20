import { createClient } from '@/lib/supabase/server'
import PostsListAnimated from './_components/PostsListAnimated'

export const runtime = 'edge'

type Post = {
  id: string
  content: string
  scheduled_at: string
  status: string
  locations: { business_name: string; business_type: string | null }[] | null
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

        <PostsListAnimated posts={allPosts} />
      </div>
    </div>
  )
}
