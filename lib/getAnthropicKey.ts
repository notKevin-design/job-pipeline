import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Resolves the Anthropic API key from process.env first,
 * then falls back to reading .env.local directly.
 * This handles the case where the key was saved via /api/save-api-key
 * after the server started (so process.env wasn't updated in this process).
 */
export function getAnthropicKey(): string | null {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  try {
    const content = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
    for (const line of content.split('\n')) {
      if (line.startsWith('ANTHROPIC_API_KEY=')) {
        const key = line.slice('ANTHROPIC_API_KEY='.length).trim()
        if (key) return key
      }
    }
  } catch {}
  return null
}
