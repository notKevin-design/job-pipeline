'use client'

interface RevealSectionProps {
  show: boolean
  children: React.ReactNode
  className?: string
}

export default function RevealSection({ show, children, className = '' }: RevealSectionProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
        show ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      } ${className}`}
    >
      <div className="overflow-hidden px-1 -mx-1">
        <div className={`transition-opacity duration-150 ease-out pb-1 ${show ? 'opacity-100' : 'opacity-0'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
