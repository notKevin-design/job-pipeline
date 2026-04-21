'use client'

import { useState } from 'react'

interface ExpandableHelpProps {
  title: string
  children: React.ReactNode
}

export default function ExpandableHelp({ title, children }: ExpandableHelpProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide font-semibold text-stone-600">
          <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {title}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-stone-600 space-y-1.5 border-t border-stone-100">
          {children}
        </div>
      )}
    </div>
  )
}
