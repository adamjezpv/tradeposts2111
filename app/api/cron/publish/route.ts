import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const BATCH_LIMIT = 50

interface PostRecord {
  id: string
  location_id: string
  content: string
  call_to_action: Record<string, unknown> | null
  scheduled_at: string
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

async function mockPublishFacebook(location: Location, content: string): Promise<void> {
  console.log(`[MOCK:Facebook] ${location.business_name} — ${content.slice(0, 80)}`)
}

async function mockPublishLinkedIn(location: Location, content: string): Promise<void> {
  console.log(`[MOCK:LinkedIn] ${location.business_name} — ${content.slice(0, 80)}`)
}

async function mockPublishReddit(location: Location, content: string): Promise<void> {
  console.log(`[MOCK:Reddit] ${location.business_name} — ${content.slice(0, 80)}`)
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()

  const { data: duePosts, error: fetchError } = await supabase
    .from('post_queue')
    .select('id, location_id, content, call_to_action, scheduled_at')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(BATCH_LIMIT)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ published: 0, failed: 0 })
  }

  let publishedCount = 0
  let failedCount = 0

  for (const rawPost of duePosts) {
    const post = rawPost as PostRecord
    try {
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id, user_id, gbp_account_id, gbp_location_id, business_name')
        .eq('id', post.location_id)
        .single()

      if (locationError || !location) {
        throw new Error(`Location not found for post ${post.id}: ${locationError?.message ?? 'null'}`)
      }

      const { data: tokenRecord, error: tokenError } = await supabase
        .from('google_tokens')
        .select('id, user_id, access_token, refresh_token, expires_at')
        .eq('user_id', (location as Location).user_id)
        .single()

      if (tokenError || !tokenRecord) {
        throw new Error(`No Google token for user ${(location as Location).user_id}: ${tokenError?.message ?? 'null'}`)
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
          gbpPostName = await publishToGoogle(
            accessToken,
            location as Location,
            platformContent.google,
            post.call_to_action
          )
          publishedPlatforms.push('google')
        } catch (err) {
          errors.push(`google: ${String(err)}`)
        }
      }

      if (platformContent.facebook) {
        try {
          await mockPublishFacebook(location as Location, platformContent.facebook)
          publishedPlatforms.push('facebook')
        } catch (err) {
          errors.push(`facebook: ${String(err)}`)
        }
      }

      if (platformContent.linkedin) {
        try {
          await mockPublishLinkedIn(location as Location, platformContent.linkedin)
          publishedPlatforms.push('linkedin')
        } catch (err) {
          errors.push(`linkedin: ${String(err)}`)
        }
      }

      if (platformContent.reddit) {
        try {
          await mockPublishReddit(location as Location, platformContent.reddit)
          publishedPlatforms.push('reddit')
        } catch (err) {
          errors.push(`reddit: ${String(err)}`)
        }
      }

      if (publishedPlatforms.length > 0) {
        await supabase
          .from('post_queue')
          .update({
            status: 'published',
            published_at: now,
            gbp_post_name: gbpPostName ?? null,
            published_platforms: publishedPlatforms,
            error_message: errors.length > 0 ? errors.join('; ') : null,
          })
          .eq('id', post.id)

        publishedCount++
      } else {
        throw new Error(`All platforms failed: ${errors.join('; ')}`)
      }
    } catch (err) {
      failedCount++
      console.error(`[CRON] Post ${post.id} failed:`, err)

      await supabase
        .from('post_queue')
        .update({
          status: 'failed',
          error_message: String(err),
        })
        .eq('id', post.id)
    }
  }

  return NextResponse.json({
    published: publishedCount,
    failed: failedCount,
    total: duePosts.length,
  })
}
