import React from 'react'

export const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all'

export const inputClassError =
  'w-full px-3 py-2.5 rounded-xl border border-red-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export default function Input({ hasError, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={hasError ? inputClassError : (className ?? inputClass)}
    />
  )
}
