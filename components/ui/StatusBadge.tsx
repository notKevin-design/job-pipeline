interface StatusBadgeProps {
  status: boolean | null
  label: string
  failLabel?: string
  row?: boolean
}

export default function StatusBadge({ status, label, failLabel, row }: StatusBadgeProps) {
  const base = row
    ? 'flex items-center gap-3 px-4 py-3'
    : 'flex items-center gap-3 p-4 rounded-xl border bg-white'

  if (status === null) {
    return (
      <div className={`${base} ${row ? '' : 'border-stone-200'}`}>
        <div className="w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-wide text-stone-500">Checking…</span>
      </div>
    )
  }

  if (status) {
    return (
      <div className={`${base} ${row ? '' : 'border-stone-200'}`}>
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-xs font-mono uppercase tracking-wide font-semibold text-stone-700">{label}</span>
      </div>
    )
  }

  return (
    <div className={`${base} ${row ? '' : 'border-red-200'}`}>
      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <span className="text-xs font-mono uppercase tracking-wide font-semibold text-stone-700">{failLabel ?? label}</span>
    </div>
  )
}
