import Anthropic from '@anthropic-ai/sdk'
import { fetchDocParagraphs } from '@/lib/gws-docs'
import { getAnthropicKey } from '@/lib/getAnthropicKey'

export async function POST(request: Request) {
  let resume_doc_id: string
  try {
    const body = await request.json()
    resume_doc_id = body.resume_doc_id
    if (!resume_doc_id) throw new Error('missing resume_doc_id')
  } catch {
    return Response.json({ error: 'resume_doc_id is required' }, { status: 400 })
  }

  const result = fetchDocParagraphs(resume_doc_id)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status })
  }

  // Contact info always lives in the first ~15 paragraphs of a resume
  const topParas = result.paragraphs
    .slice(0, 15)
    .map((p, i) => `${i + 1}. ${p.text.slice(0, 200)}`)
    .join('\n')

  const prompt = `You are extracting contact info from the top of a resume. Below is a numbered list of the first paragraphs from a Google Doc.

Return ONLY valid JSON — no explanation, no markdown — with these four fields:

1. full_name — the candidate's full name as written on the resume. Return "none" if you can't find it.
2. first_name — just the first name (for sign-offs). Derive from full_name.
3. email — the candidate's email address. Return "none" if there isn't one.
4. portfolio_url — a personal website / portfolio URL (not LinkedIn, not GitHub). Return "none" if there isn't one.

Return exactly this JSON shape:
{"full_name":"...","first_name":"...","email":"...","portfolio_url":"..."}

Paragraphs:
${topParas}`

  let identity: { full_name: string; first_name: string; email: string; portfolio_url: string }
  try {
    const apiKey = getAnthropicKey()
    if (!apiKey) throw new Error('Anthropic API key not configured')
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })
    let text = (message.content[0] as { type: string; text: string }).text.trim()
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    identity = JSON.parse(text)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Claude extraction failed: ${msg}` }, { status: 500 })
  }

  return Response.json({ success: true, ...identity })
}
