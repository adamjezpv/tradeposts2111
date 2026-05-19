export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
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

  let content: string
  let scheduledAt: string | undefined
  try {
    const body = await request.json() as { content?: string; scheduled_at?: string }
    if (typeof body.content !== 'string' || body.content.trim() === '') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }
    content = body.content.trim()
    if (body.scheduled_at) {
      const parsed = new Date(body.scheduled_at)
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduled_at date' }, { status: 400 })
      }
      scheduledAt = parsed.toISOString()
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Verify the post belongs to this user via location ownership check
  const { data: existing, error: fetchError } = await supabase
    .from('post_queue')
    .select('id, location_id, locations!inner(user_id)')
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

  const updatePayload: Record<string, string> = { content }
  if (scheduledAt) updatePayload.scheduled_at = scheduledAt

  const { data, error } = await supabase
    .from('post_queue')
    .update(updatePayload)
    .eq('id', id)
    .select('id, content, scheduled_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update post', detail: error?.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, post: { id: data.id, content: data.content, scheduled_at: data.scheduled_at } })
}
