import { readFileSync } from 'fs'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'

function getKeyFromEnvFile(): string | null {
  try {
    const content = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
    for (const line of content.split('\n')) {
      if (line.startsWith('ANTHROPIC_API_KEY=')) {
        return line.slice('ANTHROPIC_API_KEY='.length).trim()
      }
    }
  } catch {
    // File doesn't exist
  }
  return null
}

function getKey(): string | null {
  return process.env.ANTHROPIC_API_KEY || getKeyFromEnvFile() || null
}

function hint(key: string): string {
  return key.length > 4 ? '…' + key.slice(-4) : '****'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const validate = searchParams.get('validate') === 'true'

  const key = getKey()
  if (!key) {
    return Response.json({ hasKey: false })
  }

  if (!validate) {
    return Response.json({ hasKey: true, keyHint: hint(key) })
  }

  // Validate with a minimal API call
  try {
    const client = new Anthropic({ apiKey: key })
    await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }],
    })
    return Response.json({ hasKey: true, valid: true, keyHint: hint(key) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('401') || msg.includes('authentication') || msg.includes('invalid')) {
      return Response.json({ hasKey: true, valid: false, error: 'Invalid API key' })
    }
    // Other errors (rate limit, network) — key might be fine
    return Response.json({ hasKey: true, valid: null, error: `Could not validate: ${msg}` })
  }
}
