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
  google: string
  facebook: string
  linkedin: string
  reddit: string
}

function buildSystemPrompt(businessType: string, topic: string): string {
  return `Jesteś elitarnym dyrektorem ds. marketingu, psychologiem biznesu i ekspertem od copywritingu wieloplatformowego. Twoim zadaniem jest wygenerowanie paczki postów na temat: ${topic} dla biznesu o profilu: ${businessType}.

Przed napisaniem choćby jednego słowa, przeprowadź wewnętrzną, autonomiczną analizę profilu biznesu ${businessType}:
1. Określ profil psychograficzny klienta docelowego (Czy działa pod wpływem impulsu, stresu, szuka luksusu, czy optymalizacji kosztów?).
2. Ustal pożądany poziom formalności (Tone of Voice) oraz słownictwo, które buduje najwyższą konwersję w tej konkretnej branży.

Następnie, aplikując wnioski z tej analizy, wygeneruj czysty obiekt JSON zawierający cztery zróżnicowane posty:
- 'google': Skrajnie konkretny wpis lokalny (maksymalnie 120-150 słów). Musi zawierać zwroty kluczowe dla lokalnego wyszukiwania, bezpośrednie korzyści oferty oraz jasne wezwanie do akcji (CTA) dostosowane do tego biznesu (np. zarezerwuj, zadzwoń, sprawdź dojazd).
- 'facebook': Wpis społecznościowy, budujący zaangażowanie i relację. Użyj emoji adekwatnych dla branży określonej w analizie. Zakończ pytaniem lub wezwaniem do interakcji, które naturalnie pasuje do klientów tego biznesu.
- 'linkedin': Profesjonalna interpretacja biznesowa (Case Study, insight, perspektywa B2B). Skup się na procesach, jakości, niezawodności lub zwrocie z inwestycji, używając terminologii branżowej na wysokim poziomie.
- 'reddit': Post czysto merytoryczny, sformatowany jako bezinteresowna porada ekspercka na forum. Całkowity zakaz stosowania haseł reklamowych, sprzedażowych, linków i sztucznych upiększaczy. Styl ma być organiczny, surowy i pomocny.

Zwróć WYŁĄCZNIE poprawny, surowy obiekt JSON. Nie dodawaj żadnych wstępów, komentarzy ani podsumowań poza strukturą JSON:
{"google":"...","facebook":"...","linkedin":"...","reddit":"..."}`
}

function computeScheduleDate(location: Location): string {
  const hour = location.posting_hour ?? 9
  const intervalDays = location.generation_interval_days ?? 7
  const date = new Date()
  date.setDate(date.getDate() + intervalDays)
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
  let topicFromBody: string | undefined
  try {
    const body = await request.json() as { location_id?: string; topic?: string }
    locationId = body.location_id
    topicFromBody = body.topic?.trim() || undefined
  } catch {
    // no body or invalid JSON
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
  const businessType = location.business_type ?? location.business_name ?? 'usługi lokalne'
  const topic = topicFromBody ?? location.services?.[0] ?? businessType

  const systemPrompt = buildSystemPrompt(businessType, topic)

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Wygeneruj paczkę postów dla biznesu: ${location.business_name}. Zwróć wyłącznie poprawny obiekt JSON.`,
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
    const obj = JSON.parse(rawContent) as Record<string, unknown>
    if (
      typeof obj.google !== 'string' ||
      typeof obj.facebook !== 'string' ||
      typeof obj.linkedin !== 'string' ||
      typeof obj.reddit !== 'string'
    ) {
      throw new Error('Response missing required platform keys: google, facebook, linkedin, reddit')
    }
    parsed = {
      google: obj.google.trim(),
      facebook: obj.facebook.trim(),
      linkedin: obj.linkedin.trim(),
      reddit: obj.reddit.trim(),
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to parse AI response', detail: String(err), raw: rawContent },
      { status: 422 }
    )
  }

  const postRecord = {
    location_id: location.id,
    content: JSON.stringify(parsed),
    scheduled_at: computeScheduleDate(location),
    status: 'scheduled',
    call_to_action: JSON.stringify({ type: 'CALL', url: null }),
    ai_prompt_hash: btoa(unescape(encodeURIComponent(systemPrompt))).slice(0, 64),
  }

  const { data: insertedPost, error: insertError } = await supabase
    .from('post_queue')
    .insert(postRecord)
    .select('id, content, scheduled_at, status')
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to save posts to database', detail: insertError.message },
      { status: 500 }
    )
  }

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
    topic,
    count: 4,
    post: insertedPost,
    platforms: ['google', 'facebook', 'linkedin', 'reddit'],
  })
}
