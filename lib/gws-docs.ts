import { execSync } from 'child_process'

function stripKeyring(s: string): string {
  return s
    .split('\n')
    .filter((l) => !l.startsWith('Using keyring'))
    .join('\n')
}

export interface DocParagraph {
  text: string
  start: number
  end: number
}

export function extractParagraphs(doc: Record<string, unknown>): DocParagraph[] {
  const body = doc.body as { content: unknown[] }
  const paras: DocParagraph[] = []
  for (const elem of body.content) {
    const el = elem as Record<string, unknown>
    if (!el.paragraph) continue
    const para = el.paragraph as { elements?: { textRun?: { content?: string } }[] }
    const text = (para.elements ?? [])
      .map((e) => e.textRun?.content ?? '')
      .join('')
      .replace(/\n$/, '')
    if (text.trim()) {
      paras.push({ text, start: el.startIndex as number, end: el.endIndex as number })
    }
  }
  return paras
}

export interface FetchDocResult {
  ok: true
  paragraphs: DocParagraph[]
}

export interface FetchDocError {
  ok: false
  error: string
  status: number
}

/**
 * Fetches a Google Doc via gws CLI and returns its paragraphs.
 * Returns a typed discriminated union: either paragraphs or a shaped error.
 */
export function fetchDocParagraphs(docId: string): FetchDocResult | FetchDocError {
  let raw: string
  const env = { ...process.env, PATH: `/usr/local/bin:${process.env.PATH ?? ''}` }
  try {
    raw = execSync(
      `gws docs documents get --params '{"documentId":"${docId}"}'`,
      { timeout: 15000, stdio: 'pipe', env }
    ).toString()
  } catch (execErr: unknown) {
    // gws may exit non-zero due to keyring stderr noise but still write valid JSON to stdout
    const e = execErr as { stdout?: Buffer | string }
    if (e.stdout) {
      raw = e.stdout.toString()
    } else {
      const msg = execErr instanceof Error ? execErr.message : String(execErr)
      return { ok: false, error: `Failed to fetch resume doc: ${msg}`, status: 500 }
    }
  }

  const cleaned = stripKeyring(raw).trim()
  if (!cleaned) {
    return {
      ok: false,
      error:
        'gws returned an empty response. Make sure gws is installed and authenticated, and your Resume Doc ID is correct.',
      status: 500,
    }
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to parse gws response: ${msg}`, status: 500 }
  }

  const doc = ((parsed as { result?: unknown }).result ?? parsed) as Record<string, unknown>
  if ((doc as { error?: unknown }).error) {
    return {
      ok: false,
      error: `gws error: ${JSON.stringify((doc as { error: unknown }).error)}`,
      status: 500,
    }
  }
  const body = (doc as { body?: { content?: unknown[] } }).body
  if (!body?.content) {
    const topKeys = Object.keys(doc).join(', ')
    const bodyKeys = body ? Object.keys(body).join(', ') : ''
    return {
      ok: false,
      error: `Unexpected gws response shape. Top-level keys: [${topKeys}]${
        body ? ` body keys: [${bodyKeys}]` : ' (no body)'
      }`,
      status: 500,
    }
  }

  return { ok: true, paragraphs: extractParagraphs(doc) }
}
