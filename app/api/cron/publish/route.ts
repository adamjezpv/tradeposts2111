export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const now = new Date().toISOString()

  const { data: duePosts, error: fetchError } = await supabase
    .from('post_queue')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ published: 0 })
  }

  const ids = duePosts.map((p) => p.id)

  const { error: updateError } = await supabase
    .from('post_queue')
    .update({ status: 'published', published_at: now })
    .in('id', ids)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ published: ids.length })
}
