'use client'

import { useState } from 'react'
import { useWizard } from '@/context/WizardContext'
import { track } from '@/lib/analytics'
import StepNav from '@/components/wizard/StepNav'
import Button from '@/components/ui/Button'
import GoogleIdInput from '@/components/ui/GoogleIdInput'
import { inputClass } from '@/components/ui/Input'
import GoogleSheetsLogo from '@/components/icons/google-sheets-logo.svg'
import GoogleDriveLogo from '@/components/icons/google-drive-logo.svg'

// Column values baked into the template sheet. Keep in sync with the template.
const TEMPLATE_LAYOUT = {
  sheet_tab: 'All_Jobs_Database',
  col_company: 'C',
  col_role: 'D',
  col_compensation: 'E',
  col_date_posted: 'F',
  col_url: 'G',
  col_tier: 'H',
  col_reason: 'I',
  col_breakdown: 'J',
  col_inmail: 'K',
  col_connection_note: 'L',
} as const

const COL_FIELDS: { key: keyof typeof TEMPLATE_LAYOUT; label: string }[] = [
  { key: 'col_company', label: 'Company' },
  { key: 'col_role', label: 'Role' },
  { key: 'col_compensation', label: 'Compensation' },
  { key: 'col_date_posted', label: 'Date posted' },
  { key: 'col_url', label: 'Job URL' },
  { key: 'col_tier', label: 'Tier' },
  { key: 'col_reason', label: 'Score summary' },
  { key: 'col_breakdown', label: 'Full breakdown' },
  { key: 'col_inmail', label: 'InMail draft' },
  { key: 'col_connection_note', label: 'Connection note' },
]

export default function StepSheetSetup() {
  const { state, updateConfig, nextStep } = useWizard()
  const c = state.config

  // Branch selection: undefined → show chooser
  const [mode, setMode] = useState<'template' | 'byo' | undefined>(c.sheet_setup_mode)

  // Template branch state — user copies the template in their own browser,
  // then pastes the resulting Sheet + Drive folder URLs back here.
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_TEMPLATE_SHEET_ID ?? ''
  const TEMPLATE_COPY_URL = TEMPLATE_ID
    ? `https://docs.google.com/spreadsheets/d/${TEMPLATE_ID}/copy`
    : ''
  const [templateSheetsId, setTemplateSheetsId] = useState(
    c.sheet_setup_mode === 'template' ? (c.sheets_id ?? '') : ''
  )
  const [templateDriveId, setTemplateDriveId] = useState(
    c.sheet_setup_mode === 'template' ? (c.drive_folder_id ?? '') : ''
  )

  // BYO branch state
  const [sheetsId, setSheetsId] = useState(c.sheet_setup_mode === 'byo' ? (c.sheets_id ?? '') : '')
  const [driveId, setDriveId] = useState(c.sheet_setup_mode === 'byo' ? (c.drive_folder_id ?? '') : '')
  const [sheetTab, setSheetTab] = useState(c.sheet_setup_mode === 'byo' ? (c.sheet_tab ?? '') : '')
  const [cols, setCols] = useState<Record<string, string>>(() => {
    if (c.sheet_setup_mode !== 'byo') return {}
    const seed: Record<string, string> = {}
    for (const f of COL_FIELDS) seed[f.key] = (c[f.key] as string | undefined) ?? ''
    return seed
  })
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState<string | null>(null)
  const [detected, setDetected] = useState(
    c.sheet_setup_mode === 'byo' && !!c.sheet_tab
  )

  const templateComplete =
    templateSheetsId.trim().length > 0 && templateDriveId.trim().length > 0

  // ── BYO: auto-detect ─────────────────────────────────────────────────────
  const detectColumns = async () => {
    if (!sheetsId.trim()) {
      setDetectError('Paste your Sheet URL or ID first.')
      return
    }
    setDetecting(true)
    setDetectError(null)
    track('byo_column_detection_attempted')
    try {
      const res = await fetch('/api/detect-sheet-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheets_id: sheetsId.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Detection failed')
      }
      setSheetTab(data.sheet_tab ?? '')
      const next: Record<string, string> = {}
      for (const f of COL_FIELDS) {
        const v = data[f.key]
        next[f.key] = v && v !== 'none' ? v : ''
      }
      const columns_mapped = COL_FIELDS.filter((f) => next[f.key]?.trim()).length
      track('byo_column_detection_succeeded', {
        columns_mapped,
        sheet_has_all_columns: columns_mapped === COL_FIELDS.length,
      })
      setCols(next)
      setDetected(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      track('byo_column_detection_failed', { error_message: message })
      setDetectError(message)
    } finally {
      setDetecting(false)
    }
  }

  const handleSheetsIdChange = (id: string) => {
    setSheetsId(id)
    setDetected(false)
  }

  const byoComplete =
    sheetsId.trim().length > 0 &&
    driveId.trim().length > 0 &&
    sheetTab.trim().length > 0 &&
    COL_FIELDS.every((f) => (cols[f.key] ?? '').trim().length > 0)

  const handleByoNext = () => {
    if (!byoComplete) return
    updateConfig({
      sheet_setup_mode: 'byo',
      sheets_id: sheetsId.trim(),
      sheets_web_link: `https://docs.google.com/spreadsheets/d/${sheetsId.trim()}/edit`,
      drive_folder_id: driveId.trim(),
      drive_folder_web_link: `https://drive.google.com/drive/folders/${driveId.trim()}`,
      sheet_tab: sheetTab.trim(),
      col_company: cols.col_company.trim(),
      col_role: cols.col_role.trim(),
      col_compensation: cols.col_compensation.trim(),
      col_date_posted: cols.col_date_posted.trim(),
      col_url: cols.col_url.trim(),
      col_tier: cols.col_tier.trim(),
      col_reason: cols.col_reason.trim(),
      col_breakdown: cols.col_breakdown.trim(),
      col_inmail: cols.col_inmail.trim(),
      col_connection_note: cols.col_connection_note.trim(),
    })
    nextStep()
  }

  const handleTemplateNext = () => {
    if (!templateComplete) return
    updateConfig({
      sheet_setup_mode: 'template',
      sheets_id: templateSheetsId.trim(),
      sheets_web_link: `https://docs.google.com/spreadsheets/d/${templateSheetsId.trim()}/edit`,
      drive_folder_id: templateDriveId.trim(),
      drive_folder_web_link: `https://drive.google.com/drive/folders/${templateDriveId.trim()}`,
      ...TEMPLATE_LAYOUT,
    })
    nextStep()
  }

  const switchMode = (next: 'template' | 'byo' | undefined) => {
    if (next !== undefined) {
      if (mode === undefined) {
        track('sheet_path_selected', { path: next })
      } else {
        track('sheet_path_switched', { from: mode, to: next })
      }
    }
    setMode(next)
    setDetectError(null)
  }

  // ── Renderers ────────────────────────────────────────────────────────────

  const renderHeader = () => (
    <div className="mb-8">
      <p className="text-xs font-medium tracking-wide text-stone-400 mb-3 uppercase">Step 2</p>
      <h1 className="text-4xl font-semibold text-stone-900 mb-3">Google Sheets &amp; Drive setup</h1>
      <p className="text-base text-stone-500 leading-relaxed">
        {mode === 'byo'
          ? 'Point the agent at your existing tracker. We\u2019ll auto-detect your columns.'
          : 'We\u2019ll copy a pre-configured Google Sheets template into your Drive, or connect your own.'}
      </p>
    </div>
  )

  // ── Mode chooser ──
  if (!mode) {
    return (
      <div>
        {renderHeader()}

        <div className="space-y-3">
          {/* Template card */}
          <button
            type="button"
            onClick={() => switchMode('template')}
            className="w-full text-left rounded-2xl border-2 border-brand-300 bg-brand-50 p-5 hover:border-brand-400 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-brand-700">Copy our template</p>
                  <span className="text-[10px] font-bold text-white bg-brand-500 px-1.5 py-0.5 rounded uppercase tracking-wide">Recommended</span>
                </div>
                <p className="text-sm text-brand-600 leading-relaxed">
                  One click. Builds a job tracker Google Sheets and resumes folder in your Drive, pre-configured with the right columns. ~30 seconds.
                </p>
              </div>
              <svg className="w-4 h-4 text-brand-400 group-hover:text-brand-600 transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* BYO card */}
          <button
            type="button"
            onClick={() => switchMode('byo')}
            className="w-full text-left rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-300 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-700 mb-1">I already have a Google Sheets job tracker</p>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Paste your Google Sheets and Drive folder URLs here. We&rsquo;ll auto-detect your columns in Sheets.
                </p>
              </div>
              <svg className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <StepNav nextDisabled />
      </div>
    )
  }

  // ── Template branch ──
  if (mode === 'template') {
    return (
      <div>
        {renderHeader()}

        <div className="space-y-5">
          {/* Step 1 — copy the sheet */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <GoogleSheetsLogo className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-800 mb-1">Copy the Google Sheets template</p>
                <p className="text-sm text-stone-500 leading-relaxed mb-4">
                  Click below, then hit <span className="font-semibold">Make a copy</span> — the sheet lands in your Drive with all 10 columns pre-configured.
                </p>
                {TEMPLATE_ID ? (
                  <a
                    href={TEMPLATE_COPY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('template_link_clicked')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
                  >
                    Open template to copy
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <p className="text-xs text-red-600">
                    Template sheet ID is not configured. Set <code className="font-mono">NEXT_PUBLIC_TEMPLATE_SHEET_ID</code> in <code className="font-mono">.env.local</code> and share the template as &ldquo;Anyone with the link: Viewer&rdquo;.
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-stone-200 mt-5 pt-5">
              <GoogleIdInput
                label="Your copied Google Sheets job tracker"
                hint="Paste the URL from your new copy."
                value={templateSheetsId}
                onChange={setTemplateSheetsId}
                type="sheet"
              />
            </div>
          </div>

          {/* Step 2 — create a Drive folder */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <GoogleDriveLogo className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-800 mb-1">Create a folder for your tailored resumes</p>
                <p className="text-sm text-stone-500 leading-relaxed mb-4">
                  In your Google Drive, click <span className="font-semibold">New → Folder</span>. Give the folder any name you like, and make sure you can locate it later.
                </p>
                <a
                  href="https://drive.google.com/drive/my-drive"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition-colors"
                >
                  Open Google Drive
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="border-t border-stone-200 mt-5 pt-5">
              <GoogleIdInput
                label="Your resumes Google Drive folder"
                hint="Paste the URL of the folder you just created."
                value={templateDriveId}
                onChange={setTemplateDriveId}
                type="folder"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => switchMode(undefined)}
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors font-medium"
          >
            ← Back to options
          </button>
        </div>

        <StepNav onNext={handleTemplateNext} nextDisabled={!templateComplete} />
      </div>
    )
  }

  // ── BYO branch ──
  return (
    <div>
      {renderHeader()}

      <div className="space-y-7">
        <GoogleIdInput
          label="Job tracker Google Sheet"
          hint="The ID will be extracted automatically."
          value={sheetsId}
          onChange={handleSheetsIdChange}
          type="sheet"
        />

        <GoogleIdInput
          label="Resume Drive folder"
          hint="The folder where tailored resumes will be saved."
          value={driveId}
          onChange={setDriveId}
          type="folder"
        />

        {/* Auto-detect trigger */}
        <div className="pt-2">
          <Button
            variant="secondary"
            onClick={detectColumns}
            disabled={detecting || !sheetsId.trim()}
          >
            {detecting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Detecting…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Auto-detect columns
              </>
            )}
          </Button>
          {detectError && (
            <p className="mt-2 text-xs text-red-600">{detectError}</p>
          )}
        </div>

        {/* Detected mapping — editable */}
        {detected && (
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-subtle">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs font-semibold text-stone-600">Detected mapping — review &amp; edit</p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Sheet tab</label>
                <input
                  type="text"
                  value={sheetTab}
                  onChange={(e) => setSheetTab(e.target.value)}
                  placeholder="Sheet1"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                {COL_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">{f.label}</label>
                    <input
                      type="text"
                      value={cols[f.key] ?? ''}
                      onChange={(e) =>
                        setCols((prev) => ({ ...prev, [f.key]: e.target.value.toUpperCase() }))
                      }
                      placeholder="C"
                      maxLength={3}
                      className={`${inputClass} font-mono uppercase`}
                    />
                  </div>
                ))}
              </div>
              {!byoComplete && (
                <p className="text-xs text-stone-400 pt-1">Fill in any blank column letters to continue.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => switchMode(undefined)}
        className="mt-6 text-sm text-stone-500 hover:text-stone-700 transition-colors font-medium"
      >
        ← Back to options
      </button>

      <StepNav onNext={handleByoNext} nextDisabled={!byoComplete} />
    </div>
  )
}
