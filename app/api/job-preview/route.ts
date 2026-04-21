import Anthropic from '@anthropic-ai/sdk'
import { fetchDocParagraphs } from '@/lib/gws-docs'
import { getAnthropicKey } from '@/lib/getAnthropicKey'

// ── HTML → text helpers ─────────────────────────────────────────────────────

function htmlToText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
  text = text.replace(/<\/(p|div|li|h[1-6]|section|article|br)\s*>/gi, '\n')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
  text = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim()
  return text
}

// ── ATS-specific API extractors ─────────────────────────────────────────────

interface AtsResult {
  ok: true
  text: string
}

const FETCH_OPTS = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    Accept: 'application/json, text/html',
  },
  signal: undefined as AbortSignal | undefined,
}

/** Ashby: jobs.ashbyhq.com/{org}/{jobId} */
async function tryAshby(url: string): Promise<AtsResult | null> {
  const match = url.match(/jobs\.ashbyhq\.com\/([^/]+)\/([0-9a-f-]{36})/)
  if (!match) return null
  const [, org, jobId] = match
  try {
    const res = await fetch('https://jobs.ashbyhq.com/api/non-user-graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'ApiJobBoardWithTeams',
        variables: { organizationHostedJobsPageName: org },
        query: `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
          jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
            jobPostings { id title descriptionHtml locationName }
          }
        }`,
      }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    const postings = data?.data?.jobBoard?.jobPostings ?? []
    const posting = postings.find((p: { id: string }) => p.id === jobId)
    if (!posting?.descriptionHtml) return null
    const text = `${posting.title ?? ''}\n${posting.locationName ?? ''}\n\n${htmlToText(posting.descriptionHtml)}`
    return text.length >= 200 ? { ok: true, text: text.slice(0, 8000) } : null
  } catch {
    return null
  }
}

/** Lever: jobs.lever.co/{org}/{jobId} */
async function tryLever(url: string): Promise<AtsResult | null> {
  const match = url.match(/jobs\.lever\.co\/([^/]+)\/([0-9a-f-]{36})/)
  if (!match) return null
  const [, org, jobId] = match
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${org}/${jobId}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const desc = data.descriptionPlain ?? htmlToText(data.description ?? '')
    const lists = (data.lists ?? [])
      .map((l: { text: string; content: string }) => `${l.text}\n${htmlToText(l.content)}`)
      .join('\n\n')
    const text = `${data.text ?? ''}\n${data.categories?.location ?? ''}\n\n${desc}\n\n${lists}`
    return text.length >= 200 ? { ok: true, text: text.slice(0, 8000) } : null
  } catch {
    return null
  }
}

/** Greenhouse: boards.greenhouse.io or job-boards.greenhouse.io/{org}/jobs/{jobId} */
async function tryGreenhouse(url: string): Promise<AtsResult | null> {
  const match = url.match(/(?:job-)?boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/)
  if (!match) return null
  const [, org, jobId] = match
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${org}/jobs/${jobId}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const desc = htmlToText(data.content ?? '')
    const text = `${data.title ?? ''}\n${data.location?.name ?? ''}\n\n${desc}`
    return text.length >= 200 ? { ok: true, text: text.slice(0, 8000) } : null
  } catch {
    return null
  }
}

/** application/ld+json JobPosting schema embedded in HTML */
function tryStructuredData(html: string): AtsResult | null {
  const ldMatches = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  if (!ldMatches) return null
  for (const block of ldMatches) {
    try {
      const jsonStr = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
      const data = JSON.parse(jsonStr)
      if (data['@type'] === 'JobPosting' || data['@type']?.includes?.('JobPosting')) {
        const desc = data.description ? htmlToText(data.description) : ''
        const text = `${data.title ?? ''}\n${data.jobLocation?.address?.addressLocality ?? ''}\n\n${desc}`
        if (text.length >= 200) return { ok: true, text: text.slice(0, 8000) }
      }
    } catch { /* skip invalid JSON */ }
  }
  return null
}

// ── Main JD fetcher with fallbacks ──────────────────────────────────────────

type FetchResult = { ok: true; text: string } | { ok: false; error: string }

async function fetchJobPostText(url: string): Promise<FetchResult> {
  // 1. Try ATS-specific APIs first (they return clean data without JS rendering)
  const atsExtractors = [tryAshby, tryLever, tryGreenhouse]
  for (const extractor of atsExtractors) {
    const result = await extractor(url)
    if (result) return result
  }

  // 2. Fetch raw HTML
  try {
    const res = await fetch(url, {
      ...FETCH_OPTS,
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      return { ok: false, error: `Job post returned ${res.status} ${res.statusText}` }
    }
    const html = await res.text()

    // 2a. Try structured data (application/ld+json) embedded in HTML
    const structured = tryStructuredData(html)
    if (structured) return structured

    // 2b. Fall back to plain text extraction
    const text = htmlToText(html)
    if (text.length >= 500) {
      return { ok: true, text: text.slice(0, 8000) }
    }

    return {
      ok: false,
      error:
        "Couldn't read enough content from this URL — the page may require login (LinkedIn) or use JavaScript rendering. Try a direct job board link (Greenhouse, Lever, or Ashby work best).",
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Couldn't fetch job post: ${msg}` }
  }
}

// ── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let resume_doc_id: string
  let job_url: string
  try {
    const body = await request.json()
    resume_doc_id = body.resume_doc_id
    job_url = body.job_url
    if (!resume_doc_id || !job_url) throw new Error('missing fields')
  } catch {
    return Response.json({ error: 'resume_doc_id and job_url are required' }, { status: 400 })
  }

  // Fetch resume
  const resumeResult = fetchDocParagraphs(resume_doc_id)
  if (!resumeResult.ok) {
    return Response.json({ error: resumeResult.error }, { status: resumeResult.status })
  }
  const resumeText = resumeResult.paragraphs.map((p) => p.text).join('\n').slice(0, 6000)

  // Fetch JD
  const jdResult = await fetchJobPostText(job_url)
  if (!jdResult.ok) {
    return Response.json({ error: jdResult.error }, { status: 200 })
  }

  const prompt = `You're evaluating how well a candidate's resume matches a job posting.

RESUME:
${resumeText}

JOB POSTING:
${jdResult.text}

Return ONLY valid JSON — no explanation, no markdown — with this shape:
{
  "tier": 1 | 2 | 3,
  "tier_label": "...",
  "gaps": ["...", "...", "..."],
  "breakdown": [
    { "dimension": "...", "score": "X/3", "note": "..." },
    ...
  ],
  "total_score": N
}

Score each of these 5 dimensions from 0–3 (max 15 total):

1. "Role Match" — title, responsibilities, seniority
   3: Exact title match, responsibilities mirror past work
   2: Slightly off title, meaningful overlap
   1: Different title, somewhat related
   0: Fundamentally different or missing key specializations

2. "Industry Fit" — product category, user base, business model
   3: Exact same space
   2: Adjacent domain, shared behavior patterns
   1: Different industry but patterns transfer
   0: Steep domain knowledge gap

3. "Company Stage" — headcount, funding, JD language
   3: Same headcount magnitude AND funding stage as where candidate has thrived
   2: One step away
   1: Noticeable but bridgeable
   0: Completely different operating environment

4. "Team Signal" — reporting line, team size, design culture
   3: Reports to Head/VP Design; design systems, research culture mentioned
   2: Reports to a designer; design mentioned meaningfully
   1: Reports to PM or engineer; design feels secondary
   0: First designer hire, no design leadership

5. "Recency" — datePosted / posting freshness
   3: 1–3 days ago
   2: 4–7 days ago
   1: 1–2 weeks ago
   0: 2+ weeks ago, no date, or stale

Tier assignment:
- 11–15 total → tier 1 (High Fit)
- 7–10 total → tier 2 (Stretch Fit)
- 0–6 total → tier 3 (Speculative)

tier_label: a short 3-5 word summary (e.g. "Strong product design fit").
gaps: EXACTLY 3 short bullet strings (max 12 words each) describing what's missing. Be specific — reference actual skills, tools, or domains from the JD.
total_score: the sum of all 5 dimension scores.
Each note should be 8-15 words, specific to the JD and resume.`

  let result: { tier: 1 | 2 | 3; tier_label: string; gaps: string[]; breakdown: { dimension: string; score: string; note: string }[]; total_score: number }
  try {
    const apiKey = getAnthropicKey()
    if (!apiKey) return Response.json({ error: 'Anthropic API key not configured. Save your key on the first step.' }, { status: 500 })
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    let text = (message.content[0] as { type: string; text: string }).text.trim()
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    result = JSON.parse(text)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Claude preview failed: ${msg}` }, { status: 500 })
  }

  return Response.json({ success: true, ...result })
}
