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
  const paras = result.paragraphs

  // Build a numbered paragraph list (first 80 chars each) for Claude
  const paraList = paras
    .map((p, i) => `${i + 1}. ${p.text.slice(0, 80)}`)
    .join('\n')

  const prompt = `You are analyzing a resume document. Below is a numbered list of paragraphs (first 80 characters each) extracted from the Google Doc.

Your task: identify four things and return ONLY valid JSON — no explanation, no markdown.

1. summary_anchor — the first 6 unique words of the prose summary paragraph (usually near the top, describing the candidate's background and goals). Do NOT pick the candidate's name or contact info.
2. experience_anchor — the first 4–6 unique words of the PROFESSIONAL EXPERIENCE section header (the ALL-CAPS or bold heading that introduces the work history, e.g. "PROFESSIONAL EXPERIENCE" or "WORK EXPERIENCE").
3. key_skills_anchor — the first 5 unique words of the KEY SKILLS line (a line listing tools/technologies, usually pipe- or comma-separated).
4. key_skills_label — if there is a bold label immediately before the skills list (e.g. "Design & Research:" or "Skills:"), return it exactly. Otherwise return "none".

Return exactly this JSON shape:
{"summary_anchor":"...","experience_anchor":"...","key_skills_anchor":"...","key_skills_label":"..."}

Paragraphs:
${paraList}`

  let anchors: { summary_anchor: string; experience_anchor: string; key_skills_anchor: string; key_skills_label: string }
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
    anchors = JSON.parse(text)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Claude detection failed: ${msg}` }, { status: 500 })
  }

  return Response.json({ success: true, ...anchors })
}
