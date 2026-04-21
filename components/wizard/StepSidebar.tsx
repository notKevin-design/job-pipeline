'use client'

import { useWizard } from '@/context/WizardContext'
import { STEP_LABELS } from '@/lib/types'
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper'
import { Check } from 'lucide-react'

interface StepSidebarProps {
  onClose?: () => void
}

export default function StepSidebar({ onClose }: StepSidebarProps) {
  const { state, goToStep } = useWizard()
  const { currentStep } = state

  return (
    <aside className="w-60 shrink-0 bg-stone-50 flex flex-col border-r border-stone-200 h-full">
      {onClose && (
        <div className="px-4 pt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors focus:outline-none"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stepper nav */}
      <div className="flex-1 px-4 py-5 overflow-y-auto">
        <Stepper
          value={currentStep + 1}
          onValueChange={(v) => goToStep(v - 1)}
          orientation="vertical"
          indicators={{ completed: <Check className="size-3" /> }}
        >
          <StepperNav className="w-full">
            {STEP_LABELS.map((label, index) => (
              <StepperItem
                key={index}
                step={index + 1}
                className="relative items-start not-last:flex-1"
              >
                <StepperTrigger className="items-center gap-2.5 rounded-xl px-2 pt-1.5 pb-8 last:pb-0 w-full hover:bg-stone-100 transition-colors">
                  <StepperIndicator
                    className="
                      shrink-0
                      data-[state=completed]:bg-brand-500 data-[state=completed]:text-white
                      data-[state=active]:bg-stone-900 data-[state=active]:text-white
                      data-[state=inactive]:bg-stone-100 data-[state=inactive]:text-stone-400
                    "
                  >
                    {index}
                  </StepperIndicator>
                  <StepperTitle
                    className="text-xs font-mono uppercase tracking-wide leading-none text-stone-900"
                  >
                    {label}
                  </StepperTitle>
                </StepperTrigger>
                {index < STEP_LABELS.length - 1 && (
                  <StepperSeparator
                    className="
                      absolute top-8 left-[1.35rem] -order-1 m-0 -translate-x-1/2
                      group-data-[orientation=vertical]/stepper-nav:h-[calc(100%-1rem)]
                      group-data-[orientation=vertical]/stepper-nav:w-0.5
                      bg-stone-200
                      data-[state=completed]:bg-brand-500
                    "
                  />
                )}
              </StepperItem>
            ))}
          </StepperNav>
        </Stepper>
      </div>

      {/* Progress footer */}
      <div className="px-6 py-4 border-t border-stone-200">
        <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
          Step {currentStep} / {STEP_LABELS.length - 1}
        </div>
        <div className="w-full bg-stone-200 rounded-full h-0.5">
          <div
            className="bg-brand-500 h-0.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (STEP_LABELS.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </aside>
  )
}
