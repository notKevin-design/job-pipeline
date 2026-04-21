/**
 * Attempt to extract a Google resource ID from a URL.
 * If the input doesn't look like a URL, returns it unchanged.
 */
export function extractGoogleId(
  input: string,
  type: 'doc' | 'sheet' | 'folder'
): { id: string; extracted: boolean } {
  const trimmed = input.trim()
  if (!trimmed.includes('google.com') && !trimmed.includes('drive.google')) {
    return { id: trimmed, extracted: false }
  }

  const patterns: Record<string, RegExp> = {
    doc: /\/document\/d\/([a-zA-Z0-9_-]+)/,
    sheet: /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    folder: /\/folders\/([a-zA-Z0-9_-]+)/,
  }

  const match = trimmed.match(patterns[type])
  if (match) {
    return { id: match[1], extracted: true }
  }

  return { id: trimmed, extracted: false }
}
