export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

interface Location {
  id: string
  user_id: string
  business_name: string
  business_type: string | null
  services: string[] | null
  tone: string | null
  generation_interval_days: number | null
  posting_days_of_week: number[] | null
  posting_hour: number | null
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
  }
}

interface GeneratedPosts {
  posts: string[]
}

// Curated Unsplash photo IDs per trade type (direct CDN — no API key needed)
const BUSINESS_TYPE_PHOTOS: Record<string, string[]> = {
  plumbing:    ['1558618666-fcd25c85cd64', '1504328345606-18bbc8c9d7d1', '1607472586893-edb57bdc0e39', '1585771724684-38269d6639fd'],
  hvac:        ['1571055107559-3e67626fa8be', '1585771724684-38269d6639fd', '1614023342667-6f060e9d1e04', '1580894742597-87bc8789db3d'],
  electrical:  ['1621905252507-b35492cc74b4', '1473341304170-971dccb5ac1e', '1504328345606-18bbc8c9d7d1', '1541888946425-d81bb19240f5'],
  roofing:     ['1600585154340-be6161a56a0c', '1503387762-592deb58ef4e', '1558618666-fcd25c85cd64', '1481253127861-534498168948'],
  landscaping: ['1416879595882-3373a0480b5b', '1558618147-83a300615cf1', '1500382017468-9049fed747ef', '1585771724684-38269d6639fd'],
  contractor:  ['1504328345606-18bbc8c9d7d1', '1581578731548-c64695cc6952', '1530124566582-a618bc2615dc', '1541888946425-d81bb19240f5'],
}

const FALLBACK_PHOTOS = [
  '1504328345606-18bbc8c9d7d1',
  '1581578731548-c64695cc6952',
  '1518780664697-55e3ad937233',
  '1541888946425-d81bb19240f5',
]

function getImageUrl(businessType: string, topicIndex: number): string {
  const normalized = (businessType ?? 'contractor').toLowerCase()
  const key = Object.keys(BUSINESS_TYPE_PHOTOS).find(k => normalized.includes(k)) ?? 'contractor'
  const photos = BUSINESS_TYPE_PHOTOS[key] ?? FALLBACK_PHOTOS
  const photoId = photos[topicIndex % photos.length]
  return `https://images.unsplash.com/photo-${photoId}?w=800&h=600&fit=crop&auto=format&q=80`
}

function buildSystemPrompt(location: Location): string {
  const services = location.services?.join(', ') ?? 'general services'
  const businessType = location.business_type ?? 'trade service'

  return `You are a battle-tested American copywriter who writes for local trade businesses — plumbing, HVAC, electrical, roofing, landscaping. Your job: turn service descriptions into posts that make homeowners pick up the phone.

Write exactly 4 Google Business Profile posts for ${location.business_name} (${businessType}).
Services: ${services}

FORMAT each post exactly like this:
[Emoji + punchy hook — max 8 words, stops the scroll]
[2–3 sentences: a REAL scenario, specific tip, or concrete proof — zero vague fluff]
[Urgent CTA — e.g. "Call us today!", "Book online — openings this week!", "Get your free estimate now."]

WRITE 4 POSTS, ONE PER TOPIC (in this order):
1. EMERGENCY — "Your [system] failed. Here's what's really happening and what to do RIGHT NOW." Urgent, visceral, direct.
2. MAINTENANCE TIP — One specific, money-saving action the homeowner should take this season. Name the problem it prevents.
3. SEASONAL WARNING — A real, current-season threat to their home. Be specific: "When temps drop below 20°F..." or "Summer heat above 95°F..."
4. TRUST/PROOF — Licensed, insured, X years of experience, response time, or a specific result. Make it concrete.

ABSOLUTELY BANNED:
- Phrases: "We understand", "In today's world", "It's important to", "comprehensive solutions", "quality service", "needs of our customers", "look no further"
- Hashtags, generic praise, filler sentences that say nothing
- Anything that sounds like it came from a template

Write tight, direct American English. Talk to homeowners like a trusted neighbor who happens to be an expert.
80–120 words per post.

Return ONLY this JSON object, nothing else:
{"posts":["post1 full text","post2 full text","post3 full text","post4 full text"]}`
}

/**
 * Compute the scheduled_at date for a post at position `slotIndex` (0-based),
 * based on the location's schedule configuration.
 *
 * - If posting_days_of_week is set: find the (slotIndex+1)-th future occurrence
 *   of any of the specified weekdays, at posting_hour:00 UTC.
 * - Otherwise: start from tomorrow, add generation_interval_days * slotIndex.
 */
function computeScheduleDate(location: Location, slotIndex: number): string {
  const hour = location.posting_hour ?? 9
  const now = new Date()

  if (location.posting_days_of_week && location.posting_days_of_week.length > 0) {
    const days = [...location.posting_days_of_week].sort()
    // Walk forward from tomorrow until we've collected slotIndex+1 matches
    let found = 0
    const cursor = new Date(now)
    cursor.setDate(cursor.getDate() + 1)
    cursor.setHours(hour, 0, 0, 0)

    while (true) {
      if (days.includes(cursor.getDay())) {
        if (found === slotIndex) return cursor.toISOString()
        found++
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  // Interval-based: first post is intervalDays from now, each subsequent adds another interval
  const intervalDays = location.generation_interval_days ?? 7
  const date = new Date(now)
  date.setDate(date.getDate() + intervalDays * (slotIndex + 1))
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export async function POST(request: NextRequest) {
  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 503 })
  }

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

  let locationId: string | undefined
  try {
    const body = await request.json() as { location_id?: string }
    locationId = body.location_id
  } catch {
    // no body or invalid JSON — will generate for first active location
  }

  let locationQuery = supabase
    .from('locations')
    .select('id, user_id, business_name, business_type, services, tone, generation_interval_days, posting_days_of_week, posting_hour')
    .eq('user_id', user.id)
    .eq('active', true)

  if (locationId) {
    locationQuery = locationQuery.eq('id', locationId)
  }

  const { data: locations, error: locationError } = await locationQuery.limit(1).single()

  if (locationError || !locations) {
    return NextResponse.json(
      { error: 'No active location found. Connect a Google Business Profile first.' },
      { status: 404 }
    )
  }

  const location = locations as Location
  const systemPrompt = buildSystemPrompt(location)

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Generate 4 Google Business Profile posts for ${location.business_name}. Return valid JSON only.`,
    },
  ]

  let groqData: GroqResponse
  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.85,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqResponse.ok) {
      const errText = await groqResponse.text()
      return NextResponse.json(
        { error: `Groq API error: ${groqResponse.status}`, detail: errText },
        { status: 502 }
      )
    }

    groqData = await groqResponse.json() as GroqResponse
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach Groq API', detail: String(err) },
      { status: 502 }
    )
  }

  const rawContent = groqData.choices?.[0]?.message?.content ?? ''

  let parsed: GeneratedPosts
  try {
    parsed = JSON.parse(rawContent) as GeneratedPosts
    if (!Array.isArray(parsed.posts) || parsed.posts.length !== 4) {
      throw new Error('Response did not contain exactly 4 posts')
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to parse AI response', detail: String(err), raw: rawContent },
      { status: 422 }
    )
  }

  const postsToInsert = parsed.posts.map((content, index) => ({
    location_id: location.id,
    content: content.trim(),
    scheduled_at: computeScheduleDate(location, index),
    status: 'scheduled',
    call_to_action: JSON.stringify({ type: 'CALL', url: null }),
    ai_prompt_hash: btoa(unescape(encodeURIComponent(systemPrompt))).slice(0, 64),
    image_url: getImageUrl(location.business_type ?? 'contractor', index),
  }))

  // Try inserting with image_url; if column doesn't exist yet, fall back gracefully
  let insertedPosts
  let insertError

  const result = await supabase
    .from('post_queue')
    .insert(postsToInsert)
    .select('id, content, scheduled_at, status, image_url')

  insertedPosts = result.data
  insertError = result.error

  if (insertError?.message?.includes('image_url')) {
    const fallback = await supabase
      .from('post_queue')
      .insert(postsToInsert.map(({ image_url: _dropped, ...rest }) => rest))
      .select('id, content, scheduled_at, status')

    insertedPosts = fallback.data
    insertError = fallback.error
  }

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to save posts to database', detail: insertError.message },
      { status: 500 }
    )
  }

  // Log AI usage
  await supabase.from('ai_usage_log').insert({
    user_id: user.id,
    location_id: location.id,
    model: 'groq/llama-3.3-70b-versatile',
    input_tokens: groqData.usage?.prompt_tokens ?? null,
    output_tokens: groqData.usage?.completion_tokens ?? null,
    cost_usd: 0,
  })

  return NextResponse.json({
    success: true,
    location: location.business_name,
    posts: insertedPosts,
    count: insertedPosts?.length ?? 0,
  })
}
