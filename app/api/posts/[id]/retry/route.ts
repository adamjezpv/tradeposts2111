import { createServerClient } from '@supabase/ssr'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

interface PostRecord {
  id: string
  location_id: string
  content: string
  call_to_action: Record<string, unknown> | null
}

interface Location {
  id: string
  user_id: string
  gbp_account_id: string
  gbp_location_id: string
  business_name: string
}

interface GoogleTokenRecord {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
}

interface PlatformContent {
  google?: string
  facebook?: string
  linkedin?: string
  reddit?: string
}

async function refreshGoogleToken(
  supabase: SupabaseClient,
  tokenRecord: GoogleTokenRecord
): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: tokenRecord.refresh_token,
    grant_type: 'refresh_token',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Token refresh failed (${res.status}): ${errText}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()

  await supabase
    .from('google_tokens')
    .update({
      access_token: data.access_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tokenRecord.id)

  return data.access_token
}

async function publishToGoogle(
  accessToken: string,
  location: Location,
  content: string,
  callToAction: Record<string, unknown> | null
): Promise<string> {
  const locationName = `accounts/${location.gbp_account_id}/locations/${location.gbp_location_id}`
  const endpoint = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`

  const body: Record<string, unknown> = {
    languageCode: 'pl',
    summary: content,
    topicType: 'STANDARD',
  }

  if (callToAction?.type && callToAction.type !== 'CALL') {
    body.callToAction = { actionType: callToAction.type, url: callToAction.url ?? null }
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`GBP API error (${res.status}): ${errText}`)
  }

  const data = await res.json() as { name?: string }
  return data.name ?? 'unknown'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: postRaw, error: postError } = await supabase
    .from('post_queue')
    .select('id, location_id, content, call_to_action, locations!inner(id, user_id, gbp_account_id, gbp_location_id, business_name)')
    .eq('id', id)
    .single()

  if (postError || !postRaw) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const location = (Array.isArray(postRaw.locations) ? postRaw.locations[0] : postRaw.locations) as Location
  if (location.user_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const post = postRaw as unknown as PostRecord

  try {
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('google_tokens')
      .select('id, user_id, access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenRecord) {
      throw new Error(`No Google token found: ${tokenError?.message ?? 'null'}`)
    }

    const accessToken = await refreshGoogleToken(supabase, tokenRecord as GoogleTokenRecord)

    let platformContent: PlatformContent
    try {
      platformContent = JSON.parse(post.content) as PlatformContent
    } catch {
      platformContent = { google: post.content }
    }

    const publishedPlatforms: string[] = []
    const errors: string[] = []
    let gbpPostName: string | undefined

    if (platformContent.google) {
      try {
        gbpPostName = await publishToGoogle(accessToken, location, platformContent.google, post.call_to_action)
        publishedPlatforms.push('google')
      } catch (err) {
        errors.push(`google: ${String(err)}`)
      }
    }

    if (platformContent.facebook) publishedPlatforms.push('facebook')
    if (platformContent.linkedin) publishedPlatforms.push('linkedin')
    if (platformContent.reddit) publishedPlatforms.push('reddit')

    if (publishedPlatforms.length === 0 || (platformContent.google && !publishedPlatforms.includes('google'))) {
      throw new Error(errors.join('; ') || 'No platforms published')
    }

    const now = new Date().toISOString()
    await supabase
      .from('post_queue')
      .update({
        status: 'published',
        published_at: now,
        gbp_post_name: gbpPostName ?? null,
        published_platforms: publishedPlatforms,
        error_message: null,
      })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const errorMessage = String(err)
    await supabase
      .from('post_queue')
      .update({ status: 'failed', error_message: errorMessage })
      .eq('id', id)

    return NextResponse.json({ success: false, error: errorMessage })
  }
}
