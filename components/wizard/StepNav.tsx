'use client'

import { useWizard } from '@/context/WizardContext'
import Button from '@/components/ui/Button'
import { track } from '@/lib/analytics'

interface StepNavProps {
  onNext?: () => void
  onBack?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?: boolean
}

export default function StepNav({
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled = false,
  hideBack = false,
}: StepNavProps) {
  const { state, prevStep } = useWizard()

  const handleBack = () => {
    track('step_back', { step: state.currentStep })
    if (onBack) onBack()
    else prevStep()
  }
  const isFirstStep = state.currentStep === 0

  return (
    <div className="flex items-center justify-between pt-6 border-t border-stone-200 mt-8">
      <div>
        {!hideBack && !isFirstStep && (
          <Button variant="secondary" onClick={handleBack}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        )}
      </div>
      {onNext && (
        <Button
          variant="primary"
          onClick={() => {
            if (!nextDisabled) track('step_completed', { step: state.currentStep })
            onNext()
          }}
          disabled={nextDisabled}
        >
          {nextLabel}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      )}
    </div>
  )
}
