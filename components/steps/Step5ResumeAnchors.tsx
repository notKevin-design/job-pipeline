'use client'

import { useState } from 'react'
import { useWizard } from '@/context/WizardContext'
import StepNav from '@/components/wizard/StepNav'
import FormField from '@/components/ui/FormField'
import ExpandableHelp from '@/components/ui/ExpandableHelp'
import { inputClass } from '@/components/ui/Input'

interface DetectedAnchors {
  summary_anchor: string
  experience_anchor: string
  key_skills_anchor: string
  key_skills_label: string
}

function DetectedCard({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-white">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-stone-500 mb-0.5">{label}</p>
        <p className="text-sm text-stone-800 font-mono truncate">{value === 'none' ? <span className="text-stone-400 italic">none</span> : value}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs text-stone-400 hover:text-stone-700 transition-colors font-medium mt-0.5"
      >
        Edit
      </button>
    </div>
  )
}

export default function Step5ResumeAnchors() {
  const { state, updateConfig, nextStep } = useWizard()
  const c = state.config

  const existingAnchors: DetectedAnchors | null =
    c.summary_anchor && c.summary_anchor !== 'none'
      ? {
          summary_anchor: c.summary_anchor ?? '',
          experience_anchor: c.experience_anchor ?? 'none',
          key_skills_anchor: c.key_skills_anchor ?? '',
          key_skills_label: c.key_skills_label ?? 'none',
        }
      : null

  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [detected, setDetected] = useState<DetectedAnchors | null>(existingAnchors)
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState<string | null>(null)

  // Manual fields — pre-filled from detected or existing config
  const [summaryAnchor, setSummaryAnchor] = useState(c.summary_anchor === 'none' ? '' : (c.summary_anchor ?? ''))
  const [experienceAnchor, setExperienceAnchor] = useState(c.experience_anchor === 'none' ? '' : (c.experience_anchor ?? ''))
  const [skillsAnchor, setSkillsAnchor] = useState(c.key_skills_anchor === 'none' ? '' : (c.key_skills_anchor ?? ''))
  const [skillsLabel, setSkillsLabel] = useState(c.key_skills_label === 'none' ? '' : (c.key_skills_label ?? ''))

  const isDetected = detected !== null && mode === 'auto'

  async function handleAutoDetect() {
    if (!c.resume_doc_id) {
      setDetectError('Resume Doc ID not found — go back to Step 3 and enter it first.')
      return
    }
    setDetecting(true)
    setDetectError(null)
    try {
      const res = await fetch('/api/detect-anchors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_doc_id: c.resume_doc_id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setDetectError(data.error ?? 'Detection failed.')
      } else {
        setDetected(data as DetectedAnchors)
        setSummaryAnchor(data.summary_anchor)
        setExperienceAnchor(data.experience_anchor === 'none' ? '' : data.experience_anchor)
        setSkillsAnchor(data.key_skills_anchor)
        setSkillsLabel(data.key_skills_label === 'none' ? '' : data.key_skills_label)
      }
    } catch {
      setDetectError('Network error — please try again.')
    } finally {
      setDetecting(false)
    }
  }

  function switchToManual() {
    setMode('manual')
  }

  function handleNext() {
    const anchors = isDetected
      ? {
          summary_anchor: detected!.summary_anchor,
          experience_anchor: detected!.experience_anchor,
          key_skills_anchor: detected!.key_skills_anchor,
          key_skills_label: detected!.key_skills_label,
        }
      : {
          summary_anchor: summaryAnchor.trim() || 'none',
          experience_anchor: experienceAnchor.trim() || 'none',
          key_skills_anchor: skillsAnchor.trim() || 'none',
          key_skills_label: skillsLabel.trim() || 'none',
        }
    updateConfig(anchors)
    nextStep()
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium tracking-wide text-stone-400 mb-3 uppercase">Step 5</p>
        <h1 className="text-4xl font-semibold text-stone-900 mb-3">Resume anchors</h1>
        <p className="text-base text-stone-500 leading-relaxed">
          The agent needs to locate key sections in your Google Doc to tailor them for each job.
        </p>
      </div>

      {/* Auto-detect panel */}
      {mode === 'auto' && (
        <div className="space-y-4">
          {!isDetected ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-subtle">
              <p className="text-sm font-semibold text-stone-800 mb-1">Auto-detect sections</p>
              <p className="text-sm text-stone-500 leading-relaxed mb-4">
                Claude reads your resume doc and identifies the summary, experience section, skills line, and skills label automatically — no copy-pasting needed.
              </p>
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={detecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {detecting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Detecting…
                  </>
                ) : (
                  'Auto-detect from resume'
                )}
              </button>

              {detectError && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {detectError}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-semibold text-green-800">Sections detected</p>
              </div>
              <div className="space-y-2">
                <DetectedCard label="Summary opening" value={detected!.summary_anchor} onEdit={switchToManual} />
                <DetectedCard label="Experience section header" value={detected!.experience_anchor} onEdit={switchToManual} />
                <DetectedCard label="KEY SKILLS opening" value={detected!.key_skills_anchor} onEdit={switchToManual} />
                <DetectedCard label="Skills label" value={detected!.key_skills_label} onEdit={switchToManual} />
              </div>
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={detecting}
                className="mt-3 text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium"
              >
                {detecting ? 'Re-detecting…' : 'Re-detect'}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={switchToManual}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium"
          >
            Enter manually instead
          </button>
        </div>
      )}

      {/* Manual entry panel */}
      {mode === 'manual' && (
        <div className="space-y-0">
          <div className="mb-4 px-4 py-3.5 rounded-2xl border border-stone-200 bg-white flex items-start gap-3 shadow-subtle">
            <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />
            <p className="text-sm text-stone-500 leading-relaxed">
              <span className="font-semibold text-stone-700">Optional — </span>
              only needed if you plan to use resume customization. Leave any field blank to skip it.
            </p>
          </div>

          <div className="mb-6">
            <FormField
              label="Summary paragraph opening"
              hint="First 5–8 unique words of your resume summary. Used to locate that section in your Google Doc."
              optional
            >
              <textarea
                value={summaryAnchor}
                onChange={(e) => setSummaryAnchor(e.target.value)}
                rows={2}
                placeholder="e.g. Senior product designer with 6 years of experience"
                className={inputClass}
              />
              <ExpandableHelp title="How to find this">
                <p>Open your resume in Google Docs and find your summary paragraph — usually right below your name and contact info.</p>
                <p className="mt-1.5">Copy the first sentence or the first 5–8 unique words.</p>
                <div className="mt-2 p-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-700">
                  "Senior product designer with 6 years..."
                </div>
              </ExpandableHelp>
            </FormField>
          </div>

          <div className="mb-6">
            <FormField
              label="Professional experience section header"
              hint="First 4–6 words of your experience section header. Used to scope bullet searches to the right region."
              optional
            >
              <textarea
                value={experienceAnchor}
                onChange={(e) => setExperienceAnchor(e.target.value)}
                rows={2}
                placeholder="e.g. PROFESSIONAL EXPERIENCE"
                className={inputClass}
              />
              <ExpandableHelp title="How to find this">
                <p>Find the section heading that introduces your work history — usually all-caps or bold.</p>
                <div className="mt-2 p-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-700">
                  "PROFESSIONAL EXPERIENCE" or "WORK EXPERIENCE"
                </div>
              </ExpandableHelp>
            </FormField>
          </div>

          <div className="mb-6">
            <FormField
              label="KEY SKILLS line opening"
              hint="First 4–6 unique words from your KEY SKILLS section."
              optional
            >
              <textarea
                value={skillsAnchor}
                onChange={(e) => setSkillsAnchor(e.target.value)}
                rows={2}
                placeholder="e.g. Design & Research: Figma | Sketch"
                className={inputClass}
              />
              <ExpandableHelp title="How to find this">
                <p>Find the line in your resume that lists your key skills (usually comma- or pipe-separated).</p>
                <p className="mt-1.5">Copy the first 4–6 words.</p>
                <div className="mt-2 p-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-700">
                  "Design & Research: Figma | Sketch | Adobe..."
                </div>
              </ExpandableHelp>
            </FormField>
          </div>

          <div className="mb-6">
            <FormField
              label="Skills section label"
              hint='Bold label before your skills list (e.g. "Design &amp; Research:" or "Skills:"). Leave blank if there isn&apos;t one.'
              optional
            >
              <input
                type="text"
                value={skillsLabel}
                onChange={(e) => setSkillsLabel(e.target.value)}
                placeholder='e.g. Design & Research: or Skills:'
                className={inputClass}
              />
            </FormField>
          </div>

          {detected && (
            <button
              type="button"
              onClick={() => setMode('auto')}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium"
            >
              ← Back to auto-detected values
            </button>
          )}
        </div>
      )}

      <StepNav onNext={handleNext} />
    </div>
  )
}
