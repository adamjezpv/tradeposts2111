export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the post belongs to this user
  const { data: existing, error: fetchError } = await supabase
    .from('post_queue')
    .select('id, status, location_id, locations!inner(user_id)')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const loc = existing.locations as { user_id: string } | { user_id: string }[]
  const ownerId = Array.isArray(loc) ? loc[0]?.user_id : loc?.user_id
  if (ownerId !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  if (existing.status === 'published') {
    return NextResponse.json({ error: 'Post is already published' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('post_queue')
    .update({ status: 'published' })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to publish post', detail: error?.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, post: data })
}
