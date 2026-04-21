'use client'

import { useState } from 'react'
import { useWizard } from '@/context/WizardContext'
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
        <p className="text-sm text-stone-800 font-mono truncate">
          {value === 'none' ? <span className="text-stone-400 italic">none</span> : value}
        </p>
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

export default function ResumeAnchorsForm() {
  const { state, updateConfig, triggerAnchorDetection } = useWizard()
  const c = state.config
  const anchorDetection = state.anchorDetection

  const hasAnchors = !!c.summary_anchor && c.summary_anchor !== 'none'
  const detected: DetectedAnchors | null = hasAnchors
    ? {
        summary_anchor: c.summary_anchor ?? '',
        experience_anchor: c.experience_anchor ?? 'none',
        key_skills_anchor: c.key_skills_anchor ?? '',
        key_skills_label: c.key_skills_label ?? 'none',
      }
    : null

  const [mode, setMode] = useState<'auto' | 'manual'>('auto')

  const [summaryAnchor, setSummaryAnchor] = useState(c.summary_anchor === 'none' ? '' : (c.summary_anchor ?? ''))
  const [experienceAnchor, setExperienceAnchor] = useState(c.experience_anchor === 'none' ? '' : (c.experience_anchor ?? ''))
  const [skillsAnchor, setSkillsAnchor] = useState(c.key_skills_anchor === 'none' ? '' : (c.key_skills_anchor ?? ''))
  const [skillsLabel, setSkillsLabel] = useState(c.key_skills_label === 'none' ? '' : (c.key_skills_label ?? ''))

  const detecting = anchorDetection.status === 'running'
  const detectError = anchorDetection.status === 'error' ? anchorDetection.error : null

  function handleReDetect() {
    if (!c.resume_doc_id) return
    triggerAnchorDetection(c.resume_doc_id)
  }

  function switchToManual() {
    setMode('manual')
  }

  function handleManualChange(field: keyof DetectedAnchors, value: string) {
    const updates: Partial<DetectedAnchors> = {}
    if (field === 'summary_anchor') { setSummaryAnchor(value); updates.summary_anchor = value.trim() || 'none' }
    if (field === 'experience_anchor') { setExperienceAnchor(value); updates.experience_anchor = value.trim() || 'none' }
    if (field === 'key_skills_anchor') { setSkillsAnchor(value); updates.key_skills_anchor = value.trim() || 'none' }
    if (field === 'key_skills_label') { setSkillsLabel(value); updates.key_skills_label = value.trim() || 'none' }
    updateConfig(updates)
  }

  return (
    <div>
      {/* Auto-detect panel */}
      {mode === 'auto' && (
        <div className="space-y-3">
          {detecting && !detected ? (
            <div className="flex items-center gap-2 text-sm text-stone-500 py-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Detecting sections from your resume…
            </div>
          ) : detected ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-semibold text-green-800">Sections detected</p>
              </div>
              <div className="space-y-2">
                <DetectedCard label="Summary opening" value={detected.summary_anchor} onEdit={switchToManual} />
                <DetectedCard label="Experience section header" value={detected.experience_anchor} onEdit={switchToManual} />
                <DetectedCard label="Key skills opening" value={detected.key_skills_anchor} onEdit={switchToManual} />
                <DetectedCard label="Skills label" value={detected.key_skills_label} onEdit={switchToManual} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-500 py-2">
              No sections detected yet. Try re-detecting, or enter them manually.
            </p>
          )}

          {detectError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {detectError}
            </div>
          )}

          <div className="flex items-center gap-4 pt-1">
            <button
              type="button"
              onClick={handleReDetect}
              disabled={detecting || !c.resume_doc_id}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors font-medium disabled:opacity-50"
            >
              {detecting ? 'Re-detecting…' : 'Re-detect'}
            </button>
            <button
              type="button"
              onClick={switchToManual}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors font-medium"
            >
              Enter manually instead
            </button>
          </div>
        </div>
      )}

      {/* Manual entry panel */}
      {mode === 'manual' && (
        <div>
          <p className="text-sm text-stone-500 leading-relaxed mb-8">
            Paste a short distinctive snippet for each section. This is how the agent knows which parts of your resume to rewrite for tailored resume.
          </p>

          <div className="space-y-8">
            <FormField
              label="Summary paragraph"
              hint="Paste the first 5–8 unique words of your resume summary."
            >
              <textarea
                value={summaryAnchor}
                onChange={(e) => handleManualChange('summary_anchor', e.target.value)}
                rows={2}
                placeholder="e.g. Senior product designer with 6 years of experience"
                className={inputClass}
              />
              <ExpandableHelp title="How to find this">
                <p>Open your resume in Google Docs and find your summary paragraph.</p>
                <div className="mt-2 p-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-700">
                  "Senior product designer with 6 years..."
                </div>
              </ExpandableHelp>
            </FormField>

            <FormField
              label="Professional experience label"
              hint="The exact label of your experience section."
            >
              <textarea
                value={experienceAnchor}
                onChange={(e) => handleManualChange('experience_anchor', e.target.value)}
                rows={2}
                placeholder="e.g. Professional Experience"
                className={inputClass}
              />
              <ExpandableHelp title="How to find this">
                <p>Find the section heading that introduces your work history.</p>
                <div className="mt-2 p-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-700">
                  "Professional Experience" or "Work Experience"
                </div>
              </ExpandableHelp>
            </FormField>

            <FormField
              label="Skills section"
              hint="First 4–6 unique words from your key skills section."
            >
              <textarea
                value={skillsAnchor}
                onChange={(e) => handleManualChange('key_skills_anchor', e.target.value)}
                rows={2}
                placeholder="e.g. Design & Research: Figma | Sketch"
                className={inputClass}
              />
              <ExpandableHelp title="How to find this">
                <p>Find the line in your resume that lists your key skills.</p>
                <div className="mt-2 p-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-700">
                  "Design & Research: Figma | Sketch | Adobe..."
                </div>
              </ExpandableHelp>
            </FormField>

            <FormField
              label="Skills section label"
              hint='The exact skill labels before your skills list (e.g. "Design & Research:" or "Skills:"). Leave blank if there isn&apos;t one.'
              optional
            >
              <input
                type="text"
                value={skillsLabel}
                onChange={(e) => handleManualChange('key_skills_label', e.target.value)}
                placeholder='e.g. Design & Research: or Skills:'
                className={inputClass}
              />
            </FormField>
          </div>

          {detected && (
            <button
              type="button"
              onClick={() => setMode('auto')}
              className="mt-8 text-sm text-stone-500 hover:text-stone-700 transition-colors font-medium"
            >
              ← Back to auto-detected values
            </button>
          )}
        </div>
      )}
    </div>
  )
}
