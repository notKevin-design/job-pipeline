import { deriveColumns } from '@/lib/deriveColumns'

const FIELD_LABELS = [
  'Company',
  'Role',
  'Comp.',
  'Date',
  'URL',
  'Tier',
  'Reason',
  'Breakdown',
  'InMail',
  'InNote',
]

interface ColumnPreviewProps {
  startCol: string
  selectedFieldIndex?: number | null
  onFieldSelect?: (index: number | null) => void
  overrides?: {
    col_breakdown?: string
    col_inmail?: string
    col_connection_note?: string
  }
}

export default function ColumnPreview({ startCol, selectedFieldIndex, onFieldSelect, overrides }: ColumnPreviewProps) {
  if (!startCol || !/^[A-Za-z]+$/.test(startCol)) {
    return (
      <div className="text-xs font-mono text-stone-400 italic">
        Enter a valid column letter above to see the preview.
      </div>
    )
  }

  const cols = deriveColumns(startCol)
  const letters = [
    cols.col_company,
    cols.col_role,
    cols.col_compensation,
    cols.col_date_posted,
    cols.col_url,
    cols.col_tier,
    cols.col_reason,
    overrides?.col_breakdown ?? cols.col_breakdown,
    overrides?.col_inmail ?? cols.col_inmail,
    overrides?.col_connection_note ?? cols.col_connection_note,
  ]

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-1.5 min-w-max">
        {letters.map((letter, i) => (
          <button
            type="button"
            key={i}
            onClick={() => onFieldSelect?.(selectedFieldIndex === i ? null : i)}
            className={`flex flex-col items-center justify-between rounded-xl border p-2.5 w-16 text-center cursor-pointer transition-all ${
              selectedFieldIndex === i
                ? 'border-brand-400 bg-brand-50 shadow-md'
                : 'border-stone-200 bg-white hover:shadow-sm'
            }`}
          >
            <span className={`text-xs font-mono font-bold ${
              selectedFieldIndex === i
                ? 'text-brand-600'
                : 'text-stone-600'
            }`}>
              {letter || '?'}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wide text-stone-400 leading-tight mt-1">
              {FIELD_LABELS[i]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
