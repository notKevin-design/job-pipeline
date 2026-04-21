'use client'

import React from 'react'

interface FormFieldProps {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}

export default function FormField({ label, hint, error, optional, children }: FormFieldProps) {
  return (
    <div className={error ? 'pl-3 border-l-2 border-red-400 -ml-3' : ''}>
      <div className="flex items-baseline gap-2 mb-1">
        <label className="block text-sm font-semibold text-stone-700">
          {label}
        </label>
        {optional && (
          <span className="text-xs font-medium text-stone-400">optional</span>
        )}
      </div>
      {hint && <p className="text-sm text-stone-500 leading-relaxed mb-3">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>!</span> {error}
        </p>
      )}
    </div>
  )
}
