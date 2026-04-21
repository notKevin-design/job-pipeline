'use client'

import { useState, useEffect } from 'react'
import { useWizard } from '@/context/WizardContext'
import StepNav from '@/components/wizard/StepNav'
import FormField from '@/components/ui/FormField'
import ColumnPreview from '@/components/ui/ColumnPreview'
import RevealSection from '@/components/ui/RevealSection'
import { deriveColumns } from '@/lib/deriveColumns'
import { inputClass } from '@/components/ui/Input'

export default function Step4SheetsLayout() {
  const { state, updateConfig, nextStep } = useWizard()
  const c = state.config

  const [sheetTab, setSheetTab] = useState(c.sheet_tab ?? '')
  const [startCol, setStartCol] = useState(c.col_company ?? 'C')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null)
  const [defaultApplied, setDefaultApplied] = useState(false)

  const derived = deriveColumns(startCol)
  const isValidCol = /^[A-Za-z]+$/.test(startCol.trim())

  useEffect(() => {
    if (isValidCol) updateConfig(derived)
  }, [startCol]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyRecommended = () => {
    setSheetTab('All_Jobs_Database')
    setStartCol('C')
    setDefaultApplied(true)
    setErrors({})
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!sheetTab.trim()) e.sheetTab = 'Sheet tab name is required.'
    if (!isValidCol) e.startCol = 'Enter a valid column letter (e.g. A, J, or AA).'
    return e
  }

  const handleNext = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    updateConfig({ sheet_tab: sheetTab.trim(), ...derived })
    nextStep()
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium tracking-wide text-stone-400 mb-3 uppercase">Step 2</p>
        <h1 className="text-4xl font-semibold text-stone-900 mb-3">Sheets layout</h1>
        <p className="text-base text-stone-500 leading-relaxed">
          Tell the pipeline which tab and columns to use in your job tracker.
          If you copied our template, just click <span className="font-medium text-stone-700">"Use recommended layout"</span> below.
        </p>
      </div>

      {/* Recommended layout one-click */}
      {!defaultApplied ? (
        <button
          type="button"
          onClick={applyRecommended}
          className="w-full mb-7 flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 border-brand-300 bg-brand-50 hover:bg-brand-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-brand-700">Use recommended layout</p>
              <p className="text-xs text-brand-500">Tab: All_Jobs_Database · Start column: C</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-brand-400 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <div className="w-full mb-7 flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-green-200 bg-green-50">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-semibold text-green-700">Recommended layout applied</p>
          <button
            type="button"
            onClick={() => setDefaultApplied(false)}
            className="ml-auto text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium"
          >
            Customize
          </button>
        </div>
      )}

      <div className="space-y-0">
        <FormField
          label="Sheet tab name"
          hint="The name of the tab inside your Google Sheet that tracks jobs."
          error={errors.sheetTab}
        >
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={sheetTab}
              onChange={(e) => { setSheetTab(e.target.value); setDefaultApplied(false) }}
              placeholder="All_Jobs_Database"
              className={inputClass}
            />
            <div className="flex gap-2">
              {['All_Jobs_Database', 'Sheet1', 'Sheet2', 'Sheet3'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setSheetTab(preset); setDefaultApplied(false) }}
                  className={`px-3 py-2 text-xs font-mono uppercase tracking-wide font-semibold border rounded-xl whitespace-nowrap transition-all focus:outline-none ${
                    sheetTab === preset
                      ? 'border-brand-400 bg-brand-50 text-brand-600'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </FormField>

        <RevealSection show={sheetTab.trim().length > 0}>
          <div className="mt-6">
            <FormField
              label="Start column"
              hint="The column letter where Company names go. All other data fills the columns that follow."
              error={errors.startCol}
            >
              <div className="flex gap-3 items-start">
                <input
                  type="text"
                  value={startCol}
                  onChange={(e) => { setStartCol(e.target.value.toUpperCase()); setDefaultApplied(false) }}
                  placeholder="C"
                  maxLength={3}
                  className="w-20 px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-mono text-center uppercase text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                />
                <div className="flex gap-2 pt-0.5">
                  {['A', 'B', 'C'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setStartCol(opt); setDefaultApplied(false) }}
                      className={`px-3 py-2 text-xs font-mono uppercase tracking-wide font-semibold border rounded-xl transition-all focus:outline-none ${
                        startCol === opt
                          ? 'border-brand-400 bg-brand-50 text-brand-600'
                          : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      Column {opt}{opt === 'C' && <span className="ml-1 text-stone-400 normal-case font-normal font-sans">rec.</span>}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-stone-400 mt-1.5">
                Column C is recommended if you are using a copy of{' '}
                <a
                  href="https://docs.google.com/spreadsheets/d/1vifOnKWyAfLgdeqT48xGsSJALeQZAOcxlPpfRbT5xSI/edit?usp=sharing"
                  className="text-blue-500 hover:text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  this Google Sheet template
                </a>.
              </p>
            </FormField>

            {isValidCol && (
              <>
                <div className="mt-6">
                  <p className="text-xs font-medium tracking-wide text-stone-400 mb-3">Column preview</p>
                  <ColumnPreview startCol={startCol} selectedFieldIndex={selectedFieldIndex} onFieldSelect={setSelectedFieldIndex} />
                </div>

                <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-medium tracking-wide text-stone-400 mb-3">Google Sheets columns mapping</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                    {[
                      ['Company', derived.col_company],
                      ['Role', derived.col_role],
                      ['Compensation', derived.col_compensation],
                      ['Date Posted', derived.col_date_posted],
                      ['Job Post URL', derived.col_url],
                      ['Tier', derived.col_tier],
                      ['Reason', derived.col_reason],
                      ['Full Breakdowns', derived.col_breakdown],
                      ['LinkedIn Mail', derived.col_inmail],
                      ['LinkedIn Connection Note', derived.col_connection_note],
                    ].map(([field, col], idx) => (
                      <div key={field} className={`flex justify-between items-center p-2 rounded-lg transition-colors ${
                        selectedFieldIndex === idx ? 'bg-brand-50' : 'hover:bg-stone-50'
                      }`}>
                        <span className={`text-xs font-semibold ${
                          selectedFieldIndex === idx ? 'text-brand-600' : 'text-stone-500'
                        }`}>{field}</span>
                        <span className={`text-xs font-mono font-bold ${selectedFieldIndex === idx ? 'text-brand-600 bg-brand-100' : 'text-stone-800 bg-stone-100'} px-1.5 py-0.5 rounded-md`}>{col}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </RevealSection>
      </div>

      <StepNav onNext={handleNext} />
    </div>
  )
}
