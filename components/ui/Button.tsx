import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white border border-brand-500 hover:bg-brand-600 hover:border-brand-600 disabled:opacity-40',
  secondary:
    'border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-100 disabled:opacity-40',
  ghost:
    'text-brand-500 hover:text-brand-600 disabled:opacity-40',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-xs gap-1.5',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'inline-flex items-center justify-center font-semibold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed focus:outline-none',
        'font-mono uppercase tracking-wide',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
