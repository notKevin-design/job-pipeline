import { execSync } from 'child_process'
import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicKey } from '@/lib/getAnthropicKey'

function stripKeyring(s: string): string {
  return s
    .split('\n')
    .filter((l) => !l.startsWith('Using keyring'))
    .join('\n')
}

function runGws(cmd: string, env: NodeJS.ProcessEnv): string {
  let raw: string
  try {
    raw = execSync(cmd, { timeout: 15000, stdio: 'pipe', env }).toString()
  } catch (execErr: unknown) {
    const e = execErr as { stdout?: Buffer | string }
    if (e.stdout) {
      raw = e.stdout.toString()
    } else {
      throw execErr
    }
  }
  return stripKeyring(raw).trim()
}

// Column index → letter (0 → A, 25 → Z, 26 → AA)
function colLetter(i: number): string {
  let n = i
  let s = ''
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}

export async function POST(request: Request) {
  let sheetsId: string
  try {
    const body = await request.json()
    sheetsId = (body.sheets_id ?? '').toString().trim()
    if (!sheetsId) throw new Error('missing sheets_id')
  } catch {
    return Response.json({ error: 'sheets_id is required' }, { status: 400 })
  }

  const env = { ...process.env, PATH: `/usr/local/bin:${process.env.PATH ?? ''}` }

  // 1. List tabs
  let tabs: string[]
  try {
    const cleaned = runGws(
      `gws sheets spreadsheets get --params '${JSON.stringify({ spreadsheetId: sheetsId })}'`,
      env
    )
    if (!cleaned) {
      return Response.json(
        { error: 'gws returned an empty response. Make sure gws is authenticated and the Sheet ID is correct.' },
        { status: 500 }
      )
    }
    const parsed = JSON.parse(cleaned)
    const result = parsed?.result ?? parsed
    if (result?.error) {
      return Response.json({ error: `gws error: ${JSON.stringify(result.error)}` }, { status: 500 })
    }
    const sheets = (result?.sheets ?? []) as { properties?: { title?: string } }[]
    tabs = sheets.map((s) => s.properties?.title ?? '').filter(Boolean)
    if (tabs.length === 0) {
      return Response.json({ error: 'No tabs found in this sheet.' }, { status: 500 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Failed to list sheet tabs: ${msg}` }, { status: 500 })
  }

  // 2. Read header row from the first tab (user can edit tab name in UI)
  const targetTab = tabs[0]
  let headers: string[] = []
  try {
    const cleaned = runGws(
      `gws sheets spreadsheets values get --params '${JSON.stringify({ spreadsheetId: sheetsId, range: `${targetTab}!1:1` })}'`,
      env
    )
    const parsed = JSON.parse(cleaned)
    const result = parsed?.result ?? parsed
    const values = (result?.values ?? []) as string[][]
    headers = values[0] ?? []
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Failed to read header row: ${msg}` }, { status: 500 })
  }

  if (headers.filter((c) => c && c.trim()).length === 0) {
    return Response.json(
      { error: "Couldn't detect any headers in the first tab. Please map columns manually." },
      { status: 500 }
    )
  }

  // 3. Build indexed header list + send to Claude
  const headerList = headers
    .map((h, i) => `${colLetter(i)}: ${h || '(empty)'}`)
    .join('\n')

  const prompt = `You are mapping spreadsheet columns to a job-tracker schema. Below is the header row of a Google Sheet, labeled by column letter.

Return ONLY valid JSON — no explanation, no markdown. For each field, return the column letter (e.g. "C") that best matches, or "none" if no reasonable match exists.

Schema fields:
- col_company: company name
- col_role: job title / role
- col_compensation: salary / compensation / pay
- col_date_posted: date the job was posted
- col_url: link to the job post
- col_tier: priority tier / rating / score bucket
- col_reason: score summary / reason / brief rationale
- col_breakdown: full score breakdown / detailed analysis / notes
- col_inmail: LinkedIn InMail draft
- col_connection_note: LinkedIn connection request note

Return exactly this JSON shape:
{"col_company":"C","col_role":"D","col_compensation":"E","col_date_posted":"F","col_url":"G","col_tier":"H","col_reason":"I","col_breakdown":"J","col_inmail":"K","col_connection_note":"L"}

Headers:
${headerList}`

  let mapping: Record<string, string>
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
    mapping = JSON.parse(text)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Claude detection failed: ${msg}` }, { status: 500 })
  }

  return Response.json({
    success: true,
    sheet_tab: targetTab,
    headers,
    ...mapping,
  })
}
