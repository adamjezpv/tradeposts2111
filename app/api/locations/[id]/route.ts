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

  let body: {
    generation_interval_days?: number
    posting_days_of_week?: number[]
    posting_hour?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate
  if (
    body.generation_interval_days !== undefined &&
    (typeof body.generation_interval_days !== 'number' || body.generation_interval_days < 1 || body.generation_interval_days > 365)
  ) {
    return NextResponse.json({ error: 'generation_interval_days must be 1–365' }, { status: 400 })
  }
  if (
    body.posting_days_of_week !== undefined &&
    body.posting_days_of_week !== null &&
    (!Array.isArray(body.posting_days_of_week) || body.posting_days_of_week.some(d => d < 0 || d > 6))
  ) {
    return NextResponse.json({ error: 'posting_days_of_week must be array of 0–6' }, { status: 400 })
  }
  if (
    body.posting_hour !== undefined &&
    (typeof body.posting_hour !== 'number' || body.posting_hour < 0 || body.posting_hour > 23)
  ) {
    return NextResponse.json({ error: 'posting_hour must be 0–23' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = {}
  if (body.generation_interval_days !== undefined) updatePayload.generation_interval_days = body.generation_interval_days
  if (body.posting_days_of_week !== undefined) updatePayload.posting_days_of_week = body.posting_days_of_week
  if (body.posting_hour !== undefined) updatePayload.posting_hour = body.posting_hour

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('locations')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, generation_interval_days, posting_days_of_week, posting_hour')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Location not found or access denied' }, { status: 404 })
  }

  return NextResponse.json({ success: true, location: data })
}
