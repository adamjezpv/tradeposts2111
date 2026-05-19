import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are an elite American copywriter specializing in local service businesses — plumbing, HVAC, electrical, roofing, landscaping, and other trades. You have 20 years of experience writing direct-response copy that makes homeowners pick up the phone.

Your job: take the current post content and rewrite or improve it based on the user's specific instruction.

Rules:
- Return ONLY the improved post text — no explanations, no preamble, no "here's the revised version:"
- Keep the same general message and intent unless the user explicitly says to change it
- Write tight, direct American English — like a trusted neighbor who's also an expert
- Include the changes the user asked for (added phone numbers, emojis, CTAs, etc.)
- Never use: "We understand", "comprehensive solutions", "quality service", "In today's world", "look no further"
- No hashtags unless asked
- Keep it 80–120 words unless the user asks for a specific length`

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 503 })
  }

  let currentContent: string
  let instruction: string
  try {
    const body = await request.json() as { currentContent?: string; instruction?: string }
    if (typeof body.currentContent !== 'string' || typeof body.instruction !== 'string') {
      return NextResponse.json({ error: 'currentContent and instruction are required' }, { status: 400 })
    }
    currentContent = body.currentContent
    instruction = body.instruction.trim()
    if (!instruction) {
      return NextResponse.json({ error: 'instruction cannot be empty' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey })

  const userMessage = `Current post:\n"""\n${currentContent}\n"""\n\nInstruction: ${instruction}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.8,
        maxOutputTokens: 512,
      },
      contents: userMessage,
    })

    const text = response.text ?? ''
    if (!text) {
      return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 502 })
    }

    return NextResponse.json({ success: true, content: text.trim() })
  } catch (err) {
    return NextResponse.json({ error: 'Gemini API error', detail: String(err) }, { status: 502 })
  }
}
