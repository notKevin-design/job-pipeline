'use client'

import { useEffect, useState } from 'react'
import { useWizard } from '@/context/WizardContext'
import { track, markWizardStart } from '@/lib/analytics'
import StepNav from '@/components/wizard/StepNav'
import RevealSection from '@/components/ui/RevealSection'
import GoogleIdInput from '@/components/ui/GoogleIdInput'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Input'

type ApiKeyStatus = 'checking' | 'missing' | 'saving' | 'validating' | 'valid' | 'saved' | 'invalid' | 'error'

function ApiKeySection({
  status,
  keyHint,
  apiKeyInput,
  setApiKeyInput,
  onSave,
  onChangeKey,
  onCancel,
  error,
}: {
  status: ApiKeyStatus
  keyHint: string
  apiKeyInput: string
  setApiKeyInput: (v: string) => void
  onSave: () => void
  onChangeKey: () => void
  onCancel?: () => void
  error: string | null
}) {
  const isBusy = status === 'saving' || status === 'validating'

  // Green badge when key is configured
  if (status === 'saved' || status === 'valid') {
    return (
      <div className="mb-6 px-4 py-3 rounded-xl border border-green-200 bg-green-50 flex items-center justify-between gap-3">
        <div className="flex gap-2.5 items-center min-w-0">
          <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs text-green-700 font-medium">
            API key configured <span className="text-green-500 font-normal">({keyHint})</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onChangeKey}
          className="shrink-0 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
        >
          Change
        </button>
      </div>
    )
  }

  if (status === 'checking') {
    return (
      <div className="mb-6 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 flex gap-2.5 items-center">
        <svg className="animate-spin w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-xs text-stone-500">Checking API key…</p>
      </div>
    )
  }

  // Input form
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-stone-700 mb-1">Anthropic API Key</p>
      <p className="text-sm text-stone-500 leading-relaxed mb-3">
        Powers all AI features in job scoring, resume analysis, and outreach drafts. API key is stored locally on your computer, and is never uploaded or shared. Watch this{' '}
        <a
          href="https://www.youtube.com/watch?v=2w75E9cQPUM"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:text-brand-700 transition-colors"
        >
          YouTube tutorial
        </a>
        {' '}to set up yours.
      </p>
      <div className="flex items-center gap-3 mb-2">
        <a
          href="https://console.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center font-semibold rounded-lg transition-all font-mono uppercase tracking-wide border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 hover:border-brand-300 px-3 py-1.5 text-xs gap-1.5"
        >
          Get your key →
        </a>
        <span className="text-xs text-stone-400">then paste it below</span>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder="sk-ant-..."
          className={inputClass}
          disabled={isBusy}
        />
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isBusy}
            className="whitespace-nowrap"
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={onSave}
          disabled={isBusy || !apiKeyInput.trim()}
          className="whitespace-nowrap"
        >
          {isBusy ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {status === 'validating' ? 'Validating…' : 'Saving…'}
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
    </div>
  )
}

function TierBadge({ tier }: { tier: 1 | 2 | 3 }) {
  const config = {
    1: { emoji: '🟢', label: 'Tier 1', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
    2: { emoji: '🟡', label: 'Tier 2', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
    3: { emoji: '🔴', label: 'Tier 3', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
  }[tier]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${config.bg} ${config.border} ${config.text}`}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  )
}

interface BreakdownItem {
  dimension: string
  score: string
  note: string
}

interface PreviewResult {
  tier: 1 | 2 | 3
  tier_label: string
  gaps: string[]
  breakdown: BreakdownItem[]
  total_score: number
}

function scoreColor(score: number): string {
  if (score >= 3) return 'text-green-600'
  if (score >= 2) return 'text-amber-600'
  return 'text-red-600'
}

function ScoreBar({ score }: { score: string }) {
  const num = Math.min(parseInt(score, 10) || 0, 3)
  const pct = Math.round((num / 3) * 100)
  const fill = num >= 3 ? 'bg-green-500' : num >= 2 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${scoreColor(num)}`}>{score}</span>
    </div>
  )
}

export default function Step0Welcome() {
  const { nextStep, goToStep, dispatch, state, updateConfig, triggerAnchorDetection, triggerIdentityExtraction } = useWizard()
  const [resumeStep, setResumeStep] = useState<number | null>(null)
  const [configBannerDismissed, setConfigBannerDismissed] = useState(false)

  // API key state
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('checking')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const [apiKeyHint, setApiKeyHint] = useState('')
  const [prevApiKeyHint, setPrevApiKeyHint] = useState('')

  // Resume doc input
  const [docId, setDocId] = useState(state.config.resume_doc_id ?? '')

  // Job preview
  const [jobUrl, setJobUrl] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Check for existing config
  useEffect(() => {
    fetch('/api/check-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.exists) dispatch({ type: 'SET_EXISTING_CONFIG', found: true })
      })
      .catch(() => {})
  }, [dispatch])

  // Background gws check — silent, just populates prereqStatus for preview gate
  useEffect(() => {
    if (state.prereqStatus.gwsInstalled !== null) return
    fetch('/api/check-prerequisites')
      .then((r) => r.json())
      .then((data) => {
        dispatch({
          type: 'SET_PREREQ',
          status: { gwsInstalled: data.gwsInstalled, gwsAuthenticated: data.gwsAuthenticated, gwsPath: data.gwsPath },
        })
      })
      .catch(() => {
        dispatch({ type: 'SET_PREREQ', status: { gwsInstalled: false, gwsAuthenticated: false } })
      })
  }, [dispatch, state.prereqStatus.gwsInstalled])

  // Check API key on mount
  useEffect(() => {
    setApiKeyStatus('checking')
    fetch('/api/check-api-key')
      .then((r) => r.json())
      .then((data) => {
        if (data.hasKey) {
          setApiKeyStatus('saved')
          setApiKeyHint(data.keyHint ?? '')
        } else {
          setApiKeyStatus('missing')
        }
      })
      .catch(() => setApiKeyStatus('missing'))
  }, [])

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return
    setApiKeyError(null)
    setApiKeyStatus('saving')
    try {
      const saveRes = await fetch('/api/save-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      })
      const saveData = await saveRes.json()
      if (!saveData.success) {
        track('api_key_save_failed', { error_type: 'save_error', error_message: saveData.error })
        setApiKeyError(saveData.error || 'Failed to save key')
        setApiKeyStatus('error')
        return
      }

      setApiKeyStatus('validating')
      const checkRes = await fetch('/api/check-api-key?validate=true')
      const checkData = await checkRes.json()
      if (checkData.valid === true) {
        track('api_key_save_succeeded', { validation_result: 'valid' })
        setApiKeyStatus('valid')
        setApiKeyHint(checkData.keyHint ?? '')
        setApiKeyInput('')
      } else if (checkData.valid === false) {
        track('api_key_save_failed', { error_type: 'invalid_key', error_message: checkData.error })
        setApiKeyError(checkData.error || 'Invalid API key')
        setApiKeyStatus('invalid')
      } else {
        // Validation inconclusive (e.g. rate limit) — treat as saved
        track('api_key_save_succeeded', { validation_result: 'saved_unvalidated' })
        setApiKeyStatus('saved')
        setApiKeyHint(checkData.keyHint ?? '')
        setApiKeyInput('')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      track('api_key_save_failed', { error_type: 'network', error_message: message })
      setApiKeyError(message)
      setApiKeyStatus('error')
    }
  }

  const handleChangeApiKey = () => {
    track('api_key_changed')
    setPrevApiKeyHint(apiKeyHint)
    setApiKeyStatus('missing')
    setApiKeyHint('')
    setApiKeyError(null)
  }

  const handleCancelApiKeyChange = () => {
    setApiKeyStatus('saved')
    setApiKeyHint(prevApiKeyHint)
    setApiKeyInput('')
    setApiKeyError(null)
    setPrevApiKeyHint('')
  }

  // Check localStorage for in-progress session; fire wizard_started or wizard_resumed
  useEffect(() => {
    try {
      const saved = localStorage.getItem('job-pipeline-wizard-state')
      if (saved) {
        const parsed = JSON.parse(saved)
        const cfg = parsed.config ?? {}
        const hasData = cfg.full_name || cfg.resume_doc_id || cfg.sheets_id
        if (parsed.currentStep && parsed.currentStep > 0 && hasData) {
          setResumeStep(parsed.currentStep)
          track('wizard_resumed', { is_returning_user: true })
          return
        }
      }
    } catch {}
    // Fresh session
    markWizardStart()
    track('wizard_started', { is_returning_user: false })
  }, [])

  // When resume doc id is committed, fire background extraction + anchor detection
  const handleDocIdChange = (id: string) => {
    setDocId(id)
    if (id.trim() && id.trim() !== state.config.resume_doc_id) {
      updateConfig({ resume_doc_id: id.trim() })
      triggerAnchorDetection(id.trim())
      triggerIdentityExtraction(id.trim())
    }
  }

  const hasDocId = docId.trim().length > 0
  const { gwsInstalled, gwsAuthenticated } = state.prereqStatus
  const gwsReady = gwsInstalled === true && gwsAuthenticated === true

  const recheckGws = () => {
    track('prereq_recheck_clicked', { gws_installed: gwsInstalled, gws_authenticated: gwsAuthenticated })
    dispatch({ type: 'SET_PREREQ', status: { gwsInstalled: null, gwsAuthenticated: null } })
  }

  const handlePreview = async () => {
    if (!jobUrl.trim() || !hasDocId) return
    setPreviewing(true)
    setPreviewError(null)
    setPreviewResult(null)
    track('job_preview_attempted')
    try {
      const res = await fetch('/api/job-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_doc_id: docId.trim(), job_url: jobUrl.trim() }),
      })
      const data = await res.json()
      if (data.error) {
        track('job_preview_failed', { error_message: data.error })
        setPreviewError(data.error)
      } else {
        track('job_preview_succeeded', { tier: data.tier, total_score: data.total_score })
        setPreviewResult({ tier: data.tier, tier_label: data.tier_label, gaps: data.gaps, breakdown: data.breakdown ?? [], total_score: data.total_score })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      track('job_preview_failed', { error_message: message })
      setPreviewError(message)
    } finally {
      setPreviewing(false)
    }
  }

  const handleContinue = () => {
    if (!hasDocId) return
    nextStep()
  }

  return (
    <div>
      <div className="mb-2">
        <p className="text-xs font-medium tracking-wide text-stone-400 mb-3 uppercase">Start here</p>
        <h1 className="text-4xl font-semibold text-stone-900 mb-3">
          Set up your job agent
        </h1>
        <p className="text-stone-500 text-base leading-relaxed">
          Analyze jobs, tailor your resume, and draft outreach in one run — all logged to Google Sheets so you can track every application end-to-end.
        </p>
      </div>

      {/* Resume session banner */}
      {resumeStep !== null && (
        <div className="my-6 px-4 py-3 rounded-xl border border-brand-200 bg-brand-50 flex items-center justify-between gap-3">
          <div className="flex gap-2.5 items-center min-w-0">
            <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-brand-700 font-medium">You have a setup in progress.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              track('wizard_resumed', { resumed_from_step: resumeStep })
              goToStep(resumeStep)
            }}
            className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors whitespace-nowrap"
          >
            Continue →
          </button>
        </div>
      )}

      {state.existingConfigFound && !configBannerDismissed && (
        <div className="my-6 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="flex-1 text-xs text-amber-700">
            <span className="font-semibold">Setup done — </span>
            Continue editing if you want to update information about your job application source materials.
          </p>
          <button
            type="button"
            onClick={() => setConfigBannerDismissed(true)}
            className="shrink-0 p-1 rounded hover:bg-amber-100 text-amber-400 hover:text-amber-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* API key setup */}
      <div className="mt-8">
        <ApiKeySection
          status={apiKeyStatus}
          keyHint={apiKeyHint}
          apiKeyInput={apiKeyInput}
          setApiKeyInput={setApiKeyInput}
          onSave={handleSaveApiKey}
          onChangeKey={handleChangeApiKey}
          onCancel={prevApiKeyHint ? handleCancelApiKeyChange : undefined}
          error={apiKeyError}
        />
      </div>

      {/* gws check — revealed once API key is saved */}
      <RevealSection show={apiKeyStatus === 'saved' || apiKeyStatus === 'valid'}>
        <div className="mb-8 space-y-2.5">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-subtle divide-y divide-stone-100 overflow-hidden">
            <StatusBadge row status={gwsInstalled} label="gws CLI installed" failLabel="gws CLI not found" />
            <StatusBadge row status={gwsAuthenticated} label="Google account connected" failLabel="Google account not connected" />
          </div>

          {gwsInstalled === false && (
            <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2 shadow-subtle">
              <p className="text-xs font-semibold text-stone-700">How to install gws</p>
              <ol className="text-sm text-stone-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Open your terminal</li>
                <li>Visit: <a href="https://github.com/googleworkspace/cli" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline font-medium">github.com/googleworkspace/cli</a></li>
                <li>Follow the install instructions for your OS</li>
                <li>Run <code className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded-md">gws auth login</code></li>
                <li>Click Re-check below</li>
              </ol>
            </div>
          )}

          {gwsInstalled === true && gwsAuthenticated === false && (
            <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2 shadow-subtle">
              <p className="text-xs font-semibold text-stone-700">Authenticate gws</p>
              <ol className="text-sm text-stone-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Open your terminal</li>
                <li>Run: <code className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded-md">gws auth login</code></li>
                <li>Sign in with your Google account</li>
                <li>Click Re-check below</li>
              </ol>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button variant="secondary" onClick={recheckGws} disabled={gwsInstalled === null}>
              <svg className={`w-3.5 h-3.5 ${gwsInstalled === null ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-check
            </Button>
            {gwsReady && (
              <span className="text-xs font-semibold text-green-600 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                All good
              </span>
            )}
          </div>
        </div>

        {/* Resume doc input — revealed once gws is ready */}
        <RevealSection show={gwsReady}>
          <div className="mb-8">
            <GoogleIdInput
              label="Start with your resume"
              hint="Your resume in Google Doc powers everything. The agent reads it to score jobs and tailor your applications."
              value={docId}
              onChange={handleDocIdChange}
              type="doc"
            />
          </div>

          {/* Job preview — revealed once resume doc provided */}
          <RevealSection show={hasDocId}>
            <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-subtle">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900 mb-1">See it on a real job</p>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Paste any job URL to see how the agent scores it against your resume. Takes 5-10 seconds.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://jobs.example.com/posting/123"
                  className={inputClass}
                  disabled={previewing}
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handlePreview}
                  disabled={previewing || !jobUrl.trim()}
                  className="whitespace-nowrap"
                >
                  {previewing ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Scoring…
                    </>
                  ) : (
                    'Preview'
                  )}
                </Button>
              </div>

              {previewError && (
                <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  {previewError}
                </div>
              )}

              {previewResult && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TierBadge tier={previewResult.tier} />
                      <span className="text-sm font-medium text-stone-700">{previewResult.tier_label}</span>
                    </div>
                    {previewResult.total_score != null && (
                      <span className="text-xs font-mono text-stone-400">{previewResult.total_score}/15</span>
                    )}
                  </div>

                  {previewResult.breakdown?.length > 0 && (
                    <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
                      {previewResult.breakdown.map((item, i) => (
                        <div key={i} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-stone-700">{item.dimension}</span>
                          </div>
                          <ScoreBar score={item.score} />
                          <p className="text-xs text-stone-500 mt-1.5">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Top gaps</p>
                    <ul className="space-y-1.5">
                      {previewResult.gaps.map((gap, i) => (
                        <li key={i} className="flex gap-2 text-sm text-stone-700">
                          <span className="text-stone-400">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </RevealSection>
        </RevealSection>
      </RevealSection>

      <StepNav
        onNext={handleContinue}
        nextLabel="Continue to setup"
        hideBack
        nextDisabled={!hasDocId}
      />
    </div>
  )
}
