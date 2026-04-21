'use client'

import { useState } from 'react'
import { useWizard } from '@/context/WizardContext'
import StepNav from '@/components/wizard/StepNav'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import RevealSection from '@/components/ui/RevealSection'
import { inputClass } from '@/components/ui/Input'

export default function Step2Identity() {
  const { state, updateConfig, nextStep } = useWizard()
  const c = state.config

  const [fullName, setFullName] = useState(c.full_name ?? '')
  const [firstName, setFirstName] = useState(c.first_name ?? '')
  const [portfolio, setPortfolio] = useState(c.portfolio_url === 'none' ? '' : (c.portfolio_url ?? ''))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const autoFirstName = () => {
    const first = fullName.trim().split(/\s+/)[0] ?? ''
    setFirstName(first)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Full name is required.'
    if (!firstName.trim()) e.firstName = 'Sign-off name is required.'
    return e
  }

  const handleNext = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    updateConfig({ full_name: fullName.trim(), first_name: firstName.trim(), portfolio_url: portfolio.trim() || 'none' })
    nextStep()
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wide text-stone-400 mb-3 uppercase">Step 2</p>
        <h1 className="text-4xl font-semibold text-stone-900 mb-3">Your information</h1>
        <p className="text-base text-stone-500 leading-relaxed">
          Used in resume filenames and LinkedIn messages.
        </p>
      </div>

      <div className="space-y-0">
        <FormField
          label="Full name"
          hint='Used in resume filenames — e.g. "Jane Smith_Resume_Google_Designer"'
          error={errors.fullName}
        >
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className={inputClass}
          />
        </FormField>

        <RevealSection show={fullName.trim().length > 0}>
          <div className="mt-6">
          <FormField
            label="Message sign-off name"
            hint="Your first name at the end of LinkedIn messages."
            error={errors.firstName}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className={inputClass}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={autoFirstName}
                disabled={!fullName.trim()}
                className="whitespace-nowrap"
              >
                Auto-fill ↑
              </Button>
            </div>
          </FormField>
          </div>
        </RevealSection>

        <RevealSection show={firstName.trim().length > 0}>
          <div className="mt-6">
          <FormField
            label="Portfolio URL"
            hint="Included in every LinkedIn message."
            optional
          >
            <input
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="https://yourportfolio.com"
              className={inputClass}
            />
          </FormField>
          </div>
        </RevealSection>
      </div>

      <StepNav onNext={handleNext} />
    </div>
  )
}
