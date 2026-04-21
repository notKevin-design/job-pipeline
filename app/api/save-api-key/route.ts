import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: Request) {
  let apiKey: string
  try {
    const body = await request.json()
    apiKey = body.apiKey
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return Response.json({ error: 'apiKey is required' }, { status: 400 })
    }
    apiKey = apiKey.trim()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const envPath = join(process.cwd(), '.env.local')

  try {
    // Read existing .env.local if it exists
    let lines: string[] = []
    try {
      const existing = readFileSync(envPath, 'utf-8')
      lines = existing.split('\n')
    } catch {
      // File doesn't exist yet — start fresh
    }

    // Replace or append ANTHROPIC_API_KEY
    const keyLine = `ANTHROPIC_API_KEY=${apiKey}`
    const idx = lines.findIndex((l) => l.startsWith('ANTHROPIC_API_KEY='))
    if (idx >= 0) {
      lines[idx] = keyLine
    } else {
      lines.push(keyLine)
    }

    // Remove trailing empty lines, ensure final newline
    const content = lines.filter((l, i) => i < lines.length - 1 || l.trim()).join('\n') + '\n'
    writeFileSync(envPath, content, 'utf-8')

    // Set at runtime so it's available immediately without restart
    process.env.ANTHROPIC_API_KEY = apiKey

    return Response.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Failed to write .env.local: ${msg}` }, { status: 500 })
  }
}
