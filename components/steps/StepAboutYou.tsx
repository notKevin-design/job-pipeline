'use client'

import { useEffect, useRef, useState } from 'react'
import { useWizard } from '@/context/WizardContext'
import { track } from '@/lib/analytics'
import StepNav from '@/components/wizard/StepNav'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import RevealSection from '@/components/ui/RevealSection'
import { inputClass } from '@/components/ui/Input'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeUrl = (v: string) => {
  const trimmed = v.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function SkeletonInput() {
  return (
    <div className={`${inputClass} bg-stone-100 border-stone-100 animate-pulse`} style={{ height: '42px' }} />
  )
}

export default function StepAboutYou() {
  const { state, updateConfig, nextStep, triggerAnchorDetection } = useWizard()
  const c = state.config
  const identity = state.identityExtraction

  // Identity fields — seed from config (persisted) first, then overwrite from extraction if present
  const [fullName, setFullName] = useState(c.full_name ?? '')
  const [firstName, setFirstName] = useState(c.first_name ?? '')
  const [email, setEmail] = useState(c.email ?? '')
  const [portfolio, setPortfolio] = useState(c.portfolio_url === 'none' ? '' : (c.portfolio_url ?? ''))

  const [prefillApplied, setPrefillApplied] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // When identity extraction completes, prefill any empty fields
  const lastSeenStatus = useRef<string>('')
  useEffect(() => {
    if (identity.status === 'done' && identity.data && lastSeenStatus.current !== 'done') {
      const d = identity.data
      const unset = (v: string) => !v.trim()
      let applied = false
      if (unset(fullName) && d.full_name && d.full_name !== 'none') {
        setFullName(d.full_name)
        applied = true
      }
      if (unset(firstName) && d.first_name && d.first_name !== 'none') {
        setFirstName(d.first_name)
        applied = true
      }
      if (unset(email) && d.email && d.email !== 'none') {
        setEmail(d.email)
        applied = true
      }
      if (unset(portfolio) && d.portfolio_url && d.portfolio_url !== 'none') {
        setPortfolio(d.portfolio_url)
        applied = true
      }
      if (applied) {
        setPrefillApplied(true)
        track('identity_prefill_applied', { fields_count: [d.full_name, d.first_name, d.email, d.portfolio_url].filter((v) => v && v !== 'none').length })
      }
    }
    lastSeenStatus.current = identity.status
    // Only react to identity status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.status])

  const isExtracting = identity.status === 'running' && !fullName && !firstName && !email

  const autoFirstName = () => {
    const first = fullName.trim().split(/\s+/)[0] ?? ''
    setFirstName(first)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Full name is required.'
    if (!firstName.trim()) e.firstName = 'Sign-off name is required.'
    if (!email.trim()) e.email = 'Email is required.'
    else if (!EMAIL_REGEX.test(email.trim())) e.email = 'Enter a valid email address.'
    if (!portfolio.trim()) e.portfolio = 'Portfolio URL is required.'
    else {
      try { new URL(normalizeUrl(portfolio)) } catch { e.portfolio = 'Enter a valid URL.' }
    }
    return e
  }

  const handleNext = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) {
      track('step_validation_failed', { step: 1, error_fields: Object.keys(e) })
      return
    }
    updateConfig({
      full_name: fullName.trim(),
      first_name: firstName.trim(),
      email: email.trim(),
      portfolio_url: normalizeUrl(portfolio),
    })
    // Safety net: ensure anchor detection is running/done for this resume doc
    if (c.resume_doc_id && state.anchorDetection.status === 'idle') {
      triggerAnchorDetection(c.resume_doc_id)
    }
    nextStep()
  }

  const showBanner = prefillApplied && !bannerDismissed
  const dismissBanner = () => {
    track('identity_prefill_dismissed')
    setBannerDismissed(true)
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wide text-stone-400 mb-3 uppercase">Step 1</p>
        <h1 className="text-4xl font-semibold text-stone-900 mb-3">About you</h1>
        <p className="text-base text-stone-500 leading-relaxed">
          Used in resume filenames, LinkedIn messages, and any emails you ask the agent to draft.
        </p>
      </div>

      {/* Prefill banner */}
      {showBanner && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-brand-200 bg-brand-50 flex items-start gap-3">
          <svg className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-800 mb-0.5">We pulled these from your resume</p>
            <p className="text-xs text-brand-700">Confirm or edit below.</p>
          </div>
          <button
            type="button"
            onClick={dismissBanner}
            className="text-xs font-medium text-brand-500 hover:text-brand-700 transition-colors shrink-0"
          >
            Got it
          </button>
        </div>
      )}

      {/* Extracting state */}
      {isExtracting && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center gap-2">
          <svg className="animate-spin w-3.5 h-3.5 text-stone-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-xs text-stone-500">Reading your resume…</p>
        </div>
      )}

      {/* Extraction failed hint */}
      {identity.status === 'error' && !prefillApplied && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50">
          <p className="text-xs text-stone-500">Couldn&apos;t auto-fill from your resume — enter your details manually.</p>
        </div>
      )}

      <div className="space-y-0">
        <FormField
          label="Full name"
          hint='Used in resume filenames — e.g. "Jane Smith_Resume_Google_Designer"'
          error={errors.fullName}
        >
          {isExtracting ? (
            <SkeletonInput />
          ) : (
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                dismissBanner()
              }}
              placeholder="Jane Smith"
              className={inputClass}
            />
          )}
        </FormField>

        <RevealSection show={fullName.trim().length > 0 || isExtracting}>
          <div className="mt-6">
            <FormField
              label="Sign-off name"
              hint="Your first name used at the end of LinkedIn messages."
              error={errors.firstName}
            >
              {isExtracting ? (
                <SkeletonInput />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value)
                      dismissBanner()
                    }}
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
              )}
            </FormField>
          </div>
        </RevealSection>

        <RevealSection show={firstName.trim().length > 0 || isExtracting}>
          <div className="mt-6">
            <FormField
              label="Portfolio URL"
              hint="Included in every LinkedIn message."
              error={errors.portfolio}
            >
              {isExtracting ? (
                <SkeletonInput />
              ) : (
                <input
                  type="url"
                  value={portfolio}
                  onChange={(e) => {
                    setPortfolio(e.target.value)
                    if (errors.portfolio) setErrors((prev) => ({ ...prev, portfolio: '' }))
                    dismissBanner()
                  }}
                  onBlur={() => setPortfolio(normalizeUrl(portfolio))}
                  placeholder="yourportfolio.com"
                  className={inputClass}
                />
              )}
            </FormField>
          </div>
        </RevealSection>

        <RevealSection show={portfolio.trim().length > 0 || isExtracting}>
          <div className="mt-6">
            <FormField
              label="Email"
              hint="Used as a sign-off when you ask the agent to draft emails."
              error={errors.email}
            >
              {isExtracting ? (
                <SkeletonInput />
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    dismissBanner()
                  }}
                  placeholder="jane@example.com"
                  className={inputClass}
                />
              )}
            </FormField>
          </div>
        </RevealSection>
      </div>

      <StepNav onNext={handleNext} />
    </div>
  )
}
