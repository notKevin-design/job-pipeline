'use client'

import { useEffect, useState } from 'react'
import { useWizard } from '@/context/WizardContext'
import type { WizardConfig } from '@/lib/types'
import Button from '@/components/ui/Button'
import ResumeAnchorsForm from '@/components/ui/ResumeAnchorsForm'
import { track, getWizardElapsedMs, clearWizardStart } from '@/lib/analytics'

// ─── Review sections (step refs updated for 4-step flow) ────────────────────

const SECTIONS: {
  title: string
  step: number
  rows: { label: string; key: keyof WizardConfig }[]
}[] = [
  {
    title: 'About you',
    step: 1,
    rows: [
      { label: 'Full name', key: 'full_name' },
      { label: 'Sign-off', key: 'first_name' },
      { label: 'Email', key: 'email' },
      { label: 'Portfolio', key: 'portfolio_url' },
      { label: 'Resume Doc', key: 'resume_doc_id' },
    ],
  },
  {
    title: 'Sheet & Drive',
    step: 2,
    rows: [
      { label: 'Sheets', key: 'sheets_id' },
      { label: 'Drive Folder', key: 'drive_folder_id' },
      { label: 'Tab', key: 'sheet_tab' },
      { label: 'Start col', key: 'col_company' },
    ],
  },
]

// ─── Anchor summary row ──────────────────────────────────────────────────────

const REQUIRED_ANCHOR_KEYS = ['summary_anchor', 'experience_anchor', 'key_skills_anchor'] as const

function isAnchorSet(v: string | undefined | null) {
  return !!v && v !== 'none'
}

function missingRequiredAnchors(config: Partial<WizardConfig>) {
  return REQUIRED_ANCHOR_KEYS.some((k) => !isAnchorSet(config[k] as string | undefined))
}

function anchorStatus(config: Partial<WizardConfig>): { label: string; tone: 'amber' | 'green' } {
  const requiredSet = REQUIRED_ANCHOR_KEYS.filter((k) => isAnchorSet(config[k] as string | undefined)).length
  if (requiredSet < REQUIRED_ANCHOR_KEYS.length) {
    return {
      label: requiredSet === 0 ? 'Required' : `${requiredSet} of ${REQUIRED_ANCHOR_KEYS.length} required`,
      tone: 'amber',
    }
  }
  const totalSet = requiredSet + (isAnchorSet(config.key_skills_label) ? 1 : 0)
  return { label: `${totalSet} of 4 set`, tone: 'green' }
}

// ─── Copy prompt button ──────────────────────────────────────────────────────

function CopyPromptButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium mt-0.5"
      title="Copy to clipboard"
    >
      {copied ? (
        <span className="text-green-600">Copied!</span>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

// ─── Main Review step ────────────────────────────────────────────────────────

function generateUserId(): string {
  return 'usr_' + Math.random().toString(36).slice(2, 14)
}

export default function Step6Review() {
  const { state, dispatch, updateConfig, triggerAnchorDetection } = useWizard()
  const { config, anchorDetection } = state
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [clipboardCopied, setClipboardCopied] = useState(false)
  const [telemetryOptIn, setTelemetryOptIn] = useState(config.telemetry_opt_in ?? true)

  // Auto-populate anchors from background detection when done and unset
  useEffect(() => {
    if (anchorDetection.status === 'done' && anchorDetection.data) {
      const d = anchorDetection.data
      const anchors_auto_detected = [d.summary_anchor, d.experience_anchor, d.key_skills_anchor, d.key_skills_label].filter((v) => v && v !== 'none').length
      track('anchor_detection_completed', { anchors_auto_detected })
      const needsPatch =
        (!config.summary_anchor || config.summary_anchor === 'none') ||
        (!config.experience_anchor || config.experience_anchor === 'none') ||
        (!config.key_skills_anchor || config.key_skills_anchor === 'none') ||
        (!config.key_skills_label || config.key_skills_label === 'none')
      if (needsPatch) {
        updateConfig({
          summary_anchor: (!config.summary_anchor || config.summary_anchor === 'none') ? d.summary_anchor : config.summary_anchor,
          experience_anchor: (!config.experience_anchor || config.experience_anchor === 'none') ? d.experience_anchor : config.experience_anchor,
          key_skills_anchor: (!config.key_skills_anchor || config.key_skills_anchor === 'none') ? d.key_skills_anchor : config.key_skills_anchor,
          key_skills_label: (!config.key_skills_label || config.key_skills_label === 'none') ? d.key_skills_label : config.key_skills_label,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDetection.status])

  // Safety net: if we reached Review without detection running, kick it off
  useEffect(() => {
    if (config.resume_doc_id && anchorDetection.status === 'idle') {
      triggerAnchorDetection(config.resume_doc_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const anchorsMissing = missingRequiredAnchors(config)
  const status = anchorStatus(config)

  const handleSave = async () => {
    if (anchorsMissing) {
      setErrorMsg('Configure Resume sections to continue.')
      return
    }
    const anchors_count = REQUIRED_ANCHOR_KEYS.filter((k) => isAnchorSet(config[k] as string | undefined)).length
      + (isAnchorSet(config.key_skills_label) ? 1 : 0)
    // Generate anonymous user ID if opt-in and not already set
    const userId = telemetryOptIn ? (config.anonymous_user_id || generateUserId()) : 'none'
    const configWithTelemetry = { ...config, telemetry_opt_in: telemetryOptIn, anonymous_user_id: userId }
    updateConfig({ telemetry_opt_in: telemetryOptIn, anonymous_user_id: userId })

    track('save_config_attempted', { anchors_missing: false })
    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configWithTelemetry }),
      })
      const data = await res.json()
      if (data.success) {
        const total_time_ms = getWizardElapsedMs()
        track('save_config_succeeded', { sheet_path: config.sheet_setup_mode, anchors_count })
        track('wizard_completed', { total_time_ms, sheet_path: config.sheet_setup_mode, anchors_count })
        clearWizardStart()
        dispatch({ type: 'SET_SHOW_SUCCESS', value: true })
        try { localStorage.removeItem('job-pipeline-wizard-state') } catch {}
      } else {
        track('save_config_failed', { error_message: data.error ?? 'Unknown error' })
        setErrorMsg(data.error ?? 'Unknown error')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      track('save_config_failed', { error_message: message })
      setErrorMsg(message)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyConfig = async () => {
    // Build a minimal config text for clipboard fallback
    const lines = [
      '# USER_CONFIG — copy this into USER_CONFIG.md in your project root',
      '',
      `full_name: ${config.full_name ?? ''}`,
      `first_name: ${config.first_name ?? ''}`,
      `email: ${config.email ?? ''}`,
      `portfolio_url: ${config.portfolio_url ?? 'none'}`,
      `resume_doc_id: ${config.resume_doc_id ?? ''}`,
      `sheets_id: ${config.sheets_id ?? ''}`,
      `drive_folder_id: ${config.drive_folder_id ?? ''}`,
      `sheet_tab: ${config.sheet_tab ?? ''}`,
      `col_company: ${config.col_company ?? ''}`,
      `col_role: ${config.col_role ?? ''}`,
      `col_compensation: ${config.col_compensation ?? ''}`,
      `col_date_posted: ${config.col_date_posted ?? ''}`,
      `col_url: ${config.col_url ?? ''}`,
      `col_tier: ${config.col_tier ?? ''}`,
      `col_reason: ${config.col_reason ?? ''}`,
      `col_breakdown: ${config.col_breakdown ?? ''}`,
      `col_inmail: ${config.col_inmail ?? ''}`,
      `col_connection_note: ${config.col_connection_note ?? ''}`,
      `summary_anchor: ${config.summary_anchor ?? 'none'}`,
      `experience_anchor: ${config.experience_anchor ?? 'none'}`,
      `key_skills_anchor: ${config.key_skills_anchor ?? 'none'}`,
      `key_skills_label: ${config.key_skills_label ?? 'none'}`,
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      track('config_copied_to_clipboard')
      setClipboardCopied(true)
      setTimeout(() => setClipboardCopied(false), 3000)
    } catch {}
  }

  const handleBackFromSuccess = () => {
    dispatch({ type: 'SET_SHOW_SUCCESS', value: false })
  }

  if (state.showSuccess) return <SuccessScreen onBack={handleBackFromSuccess} />

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wide text-stone-400 mb-3 uppercase">Step 3</p>
        <h1 className="text-4xl font-semibold text-stone-900 mb-3">Review & save</h1>
        <p className="text-base text-stone-500 leading-relaxed">
          Everything look right? Click "Save Configuration" to write your settings file.
        </p>
      </div>

      {/* Main review sections */}
      <div className="space-y-3 mb-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-subtle">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <p className="text-sm font-semibold text-stone-800">{section.title}</p>
              <button
                type="button"
                onClick={() => {
                  track('edit_section_clicked', { section: section.title.toLowerCase().replace(/\s+/g, '_') })
                  dispatch({ type: 'SET_STEP', step: section.step })
                }}
                className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors focus:outline-none"
              >
                Edit
              </button>
            </div>
            <table className="w-full">
              <tbody>
                {section.rows.map(({ label, key }) => {
                  const val = config[key] ?? '—'
                  const isMono = ['resume_doc_id', 'sheets_id', 'drive_folder_id'].includes(key)
                  return (
                    <tr key={key} className="border-b border-stone-50 last:border-0">
                      <td className="px-4 py-2.5 text-xs font-medium text-stone-400 w-36">{label}</td>
                      <td className={`px-4 py-2.5 text-sm break-all ${isMono ? 'font-mono text-xs text-stone-600' : 'text-stone-800'}`}>
                        {val === 'none' ? (
                          <span className="text-stone-300 italic text-xs">not set</span>
                        ) : val}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Resume Sections — always expanded */}
      <div className="mb-8 rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-subtle">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-800">Resume sections</p>
          {anchorDetection.status === 'running' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Detecting from your resume…
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                status.tone === 'green' ? 'text-green-600' : 'text-amber-600'
              }`}
            >
              {status.tone === 'green' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
              {anchorDetection.status === 'done' && status.tone === 'green'
                ? `Auto-detected · ${status.label}`
                : status.label}
            </span>
          )}
        </div>
        <div className="px-4 pt-4 pb-5">
          <ResumeAnchorsForm />
        </div>
      </div>

      {/* Analytics consent card */}
      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-stone-800 mb-1">Help improve this tool</p>
            <p className="text-xs text-stone-500 leading-relaxed">
              Helps improve this tool by sharing analytics data such as how long each step takes and which steps succeed or fail. Your resume, job listings, and personal info are not collected or shared by this tool.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={telemetryOptIn}
            onClick={() => setTelemetryOptIn(!telemetryOptIn)}
            className={`mt-0.5 relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 ${telemetryOptIn ? 'bg-brand-500' : 'bg-stone-300'}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${telemetryOptIn ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
        {!telemetryOptIn && (
          <p className="mt-2 text-xs text-stone-400">Analytics disabled — no data will be shared.</p>
        )}
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-white space-y-2">
          <p className="text-xs font-mono text-red-600">Error: {errorMsg}</p>
          <button
            type="button"
            onClick={handleCopyConfig}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {clipboardCopied ? 'Copied to clipboard!' : 'Copy config to clipboard'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-stone-200">
        <Button variant="secondary" onClick={() => dispatch({ type: 'SET_STEP', step: 2 })}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving || anchorsMissing}>
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Success screen ──────────────────────────────────────────────────────────

const STANDALONE_COMMANDS = [
  { code: '/1-rate-and-add-jobs', label: 'Score and log jobs to your Sheet' },
  { code: '/2-analyze-resume', label: 'Gap analysis for one job' },
  { code: '/3-customize-resume', label: 'Tailor your resume' },
  { code: '/4-linkedin-outreach', label: 'Draft LinkedIn messages' },
]

const CONFETTI_PARTICLES = [
  { tx: '-18px', ty: '-22px', color: 'bg-brand-500' },
  { tx: '20px',  ty: '-20px', color: 'bg-amber-400' },
  { tx: '-24px', ty: '6px',   color: 'bg-green-400' },
  { tx: '22px',  ty: '8px',   color: 'bg-brand-400' },
  { tx: '0px',   ty: '-28px', color: 'bg-amber-300' },
  { tx: '-10px', ty: '18px',  color: 'bg-green-300' },
  { tx: '14px',  ty: '16px',  color: 'bg-brand-100' },
  { tx: '-22px', ty: '-6px',  color: 'bg-amber-500' },
]

function SuccessScreen({ onBack }: { onBack: () => void }) {
  const [projectPath, setProjectPath] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/project-path')
      .then((r) => r.json())
      .then((d) => setProjectPath(d.path ?? null))
      .catch(() => {})
  }, [])

  const vscodeHref = projectPath ? `vscode://file/${projectPath}` : undefined

  return (
    <div className="flex flex-col items-center text-center py-10">
      {/* Animated checkmark badge with ring burst + confetti */}
      <div className="relative mb-8">
        {/* Ring burst */}
        <div className="absolute inset-0 rounded-2xl border-2 border-brand-400 animate-ring-burst" />

        {/* Confetti particles */}
        {CONFETTI_PARTICLES.map((p, i) => (
          <div
            key={i}
            className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full ${p.color} animate-confetti-pop`}
            style={{
              '--tx': p.tx,
              '--ty': p.ty,
              animationDelay: `${0.3 + i * 0.04}s`,
            } as React.CSSProperties}
          />
        ))}

        {/* Badge */}
        <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center animate-scale-in">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
            <path
              className="animate-check-draw"
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <p
        className="text-xs font-medium tracking-wide text-brand-500 mb-2 uppercase animate-fade-up"
        style={{ animationDelay: '0.5s' }}
      >
        Setup complete
      </p>
      <h1
        className="text-4xl font-semibold text-stone-900 mb-3 animate-fade-up"
        style={{ animationDelay: '0.6s' }}
      >
        You&rsquo;re all set
      </h1>
      <p
        className="text-sm text-stone-500 max-w-sm leading-relaxed mb-10 animate-fade-up"
        style={{ animationDelay: '0.7s' }}
      >
        Your settings have been saved. The agent will load it automatically at the start of each session.
      </p>

      <div
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-subtle text-left animate-fade-up"
        style={{ animationDelay: '0.85s' }}
      >
        <div className="px-4 py-3 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-700">1. Open Claude Code</p>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-stone-500 leading-relaxed">
            Navigate to this project folder in your terminal or Claude Code.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-sm text-stone-800 font-medium shrink-0">VS Code</span>
              <span className="text-sm text-stone-500">
                —{' '}
                {vscodeHref ? (
                  <a
                    href={vscodeHref}
                    className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600 font-medium transition-colors"
                  >
                    open here
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0-7L10 14m-4-4H3v11h11v-3" />
                    </svg>
                  </a>
                ) : (
                  <>open this folder</>
                )}
                , then access Claude Code.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm text-stone-800 font-medium shrink-0">Terminal</span>
              <span className="text-sm text-stone-500">— open this folder and type{' '}
                <code className="font-mono text-xs bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded-md">claude</code>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm text-stone-800 font-medium shrink-0">Desktop app</span>
              <span className="text-sm text-stone-500">— drag this folder onto the chat window.</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="w-full max-w-md mt-4 rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-subtle text-left animate-fade-up"
        style={{ animationDelay: '0.95s' }}
      >
        <div className="px-4 py-3 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-700">2. Run your first batch of jobs</p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-stone-500 mb-2">
              Paste this command, then add your job links. Claude will score, tailor your resume, and draft outreach for each one.
            </p>
            <div className="flex items-start gap-2">
              <code className="flex-1 text-xs font-mono bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg block text-stone-600 min-w-0">
                /0-run-pipeline
              </code>
              <CopyPromptButton text="/0-run-pipeline" />
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3">
            <p className="text-sm text-stone-400 mb-2">You can also run individual steps:</p>
            <div className="space-y-1.5">
              {STANDALONE_COMMANDS.map((cmd) => (
                <div key={cmd.code} className="flex items-center gap-2">
                  <code className="text-xs font-mono text-stone-500 shrink-0">{cmd.code}</code>
                  <span className="text-sm text-stone-400">— {cmd.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="w-full max-w-md mt-4 rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-subtle text-left animate-fade-up"
        style={{ animationDelay: '1.05s' }}
      >
        <div className="px-4 py-3 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-700">Need to change your setup?</p>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-stone-500 leading-relaxed">
            Type{' '}
            <code className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded-md">/setup</code>{' '}
            in Claude Code, or reopen this page in your browser.
          </p>
        </div>
      </div>

      <div className="mt-8 animate-fade-up" style={{ animationDelay: '1.15s' }}>
        <Button variant="secondary" onClick={onBack}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to edit
        </Button>
      </div>
    </div>
  )
}
