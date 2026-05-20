import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a smart business assistant embedded in TradePosts.io — a platform that auto-publishes Google Business Profile posts for local businesses.

Your capabilities on the Locations page:
1. RESEARCH: When a user mentions a business name or address, use Google Search proactively to find and verify it. Gather: business name, category/type, address, phone, hours, website, and key services offered.
2. INTERVIEW: After researching, ask 1-2 targeted follow-up questions to fill gaps. Focus on: unique services, target customers, special offers, tone preferences.
3. SUMMARIZE: Present a clear, concise business profile after gathering info.
4. MANAGE: Help update posting schedules and trigger post generation for their locations.

Rules:
- Be concise and friendly — like a sharp assistant, not a chatbot
- Always search the web before asking questions (show you've done your homework)
- Ask only 1-2 questions at a time, never a long list
- When proposing page actions, explain what you'll do and wait for confirmation
- If you cannot automate something, give clear step-by-step manual instructions
- Write in the same language the user writes in (English or Polish)

ACTIONS SYSTEM:
When you need to perform an action on the page, include this JSON block at the very end of your message (after all text). Only include it when actually performing an action, not when asking questions:
<ACTIONS>[{"type":"action_type","locationId":"id_here","payload":{}}]</ACTIONS>

Available actions and their payload shapes:
- update_schedule: update posting schedule
  {"type":"update_schedule","locationId":"ID","payload":{"generation_interval_days":7,"posting_days_of_week":[1,3,5],"posting_hour":9}}
  (posting_days_of_week is an array of day numbers: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  (include only the fields the user wants to change, not all three)
- generate_posts: trigger AI post generation for a location
  {"type":"generate_posts","locationId":"ID"}
- navigate: go to a different page
  {"type":"navigate","url":"/posts"}

Example: if the user says "set my schedule to Monday and Friday at 10am", output:
<ACTIONS>[{"type":"update_schedule","locationId":"THE_LOCATION_ID","payload":{"posting_days_of_week":[1,5],"posting_hour":10}}]</ACTIONS>`

interface ChatMessage {
  role: string
  content: string
}

interface PageAction {
  type: 'update_schedule' | 'generate_posts' | 'navigate'
  locationId?: string
  payload?: Record<string, unknown>
  url?: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 })
  }

  let body: { messages?: ChatMessage[]; context?: string }
  try {
    body = await request.json() as { messages?: ChatMessage[]; context?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { messages, context } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey })

  // Build contents array for multi-turn conversation
  // Inject context into the last user message
  const contents = messages.map((m, i) => {
    const isLast = i === messages.length - 1
    const isUser = m.role === 'user'
    let text = m.content
    if (isLast && isUser && context) {
      text = `[Page context: ${context}]\n\n${m.content}`
    }
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text }],
    }
  })

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 1024,
        tools: [{ googleSearch: {} }],
      },
      contents,
    })

    const text = response.text ?? ''
    if (!text) {
      return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 502 })
    }

    // Parse <ACTIONS>...</ACTIONS> block
    const actionsMatch = text.match(/<ACTIONS>([\s\S]*?)<\/ACTIONS>/)
    let actions: PageAction[] = []
    let cleanMessage = text

    if (actionsMatch) {
      try {
        const parsed = JSON.parse(actionsMatch[1]) as unknown
        if (Array.isArray(parsed)) {
          actions = parsed as PageAction[]
        }
      } catch {
        // ignore parse errors — bad JSON in actions block
      }
      cleanMessage = text.replace(/<ACTIONS>[\s\S]*?<\/ACTIONS>/, '').trim()
    }

    return NextResponse.json({ success: true, message: cleanMessage, actions })
  } catch (err) {
    return NextResponse.json({ error: 'Gemini API error', detail: String(err) }, { status: 502 })
  }
}
