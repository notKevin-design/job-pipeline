/** Convert a column letter string (e.g. "J") to a 1-based index. */
function letterToIndex(col: string): number {
  let n = 0
  for (const c of col.toUpperCase()) {
    n = n * 26 + (c.charCodeAt(0) - 64)
  }
  return n
}

/** Convert a 1-based index to a column letter string. */
function indexToLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/** Returns the column letter `offset` positions after `base`. */
export function colAt(base: string, offset: number): string {
  if (!base || !/^[A-Za-z]+$/.test(base)) return ''
  return indexToLetter(letterToIndex(base) + offset)
}

export interface DerivedColumns {
  col_company: string
  col_role: string
  col_compensation: string
  col_date_posted: string
  col_url: string
  col_tier: string
  col_reason: string
  col_breakdown: string
  col_inmail: string
  col_connection_note: string
}

/** Derive all 10 column letters from a start column letter. */
export function deriveColumns(startCol: string): DerivedColumns {
  const s = startCol.toUpperCase().trim()
  return {
    col_company: colAt(s, 0),
    col_role: colAt(s, 1),
    col_compensation: colAt(s, 2),
    col_date_posted: colAt(s, 3),
    col_url: colAt(s, 4),
    col_tier: colAt(s, 5),
    col_reason: colAt(s, 6),
    col_breakdown: colAt(s, 7),
    col_inmail: colAt(s, 8),
    col_connection_note: colAt(s, 9),
  }
}
