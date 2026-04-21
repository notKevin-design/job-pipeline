'use client'

import { useState } from 'react'
import { useWizard } from '@/context/WizardContext'
import StepNav from '@/components/wizard/StepNav'
import GoogleIdInput from '@/components/ui/GoogleIdInput'

export default function Step3GoogleIds() {
  const { state, updateConfig, nextStep } = useWizard()
  const c = state.config

  const [docId, setDocId] = useState(c.resume_doc_id ?? '')
  const [sheetsId, setSheetsId] = useState(c.sheets_id ?? '')
  const [driveId, setDriveId] = useState(c.drive_folder_id ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!docId.trim()) e.doc = 'Resume Doc ID is required.'
    if (!sheetsId.trim()) e.sheets = 'Sheets ID is required.'
    if (!driveId.trim()) e.drive = 'Drive Folder ID is required.'
    return e
  }

  const handleNext = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    updateConfig({ resume_doc_id: docId.trim(), sheets_id: sheetsId.trim(), drive_folder_id: driveId.trim() })
    nextStep()
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wide text-stone-400 mb-3 uppercase">Step 3</p>
        <h1 className="text-4xl font-semibold text-stone-900 mb-3">Google setup</h1>
        <p className="text-base text-stone-500 leading-relaxed">
          Paste a full URL — the ID will be extracted automatically.
        </p>
      </div>

      <div className="space-y-7">
        <GoogleIdInput
          label="Resume Google Doc"
          hint="The Google Doc containing your master resume."
          value={docId}
          onChange={setDocId}
          type="doc"
          error={errors.doc}
        />

        <GoogleIdInput
          label="Job tracker Google Sheet"
          hint="The spreadsheet where jobs will be logged."
          value={sheetsId}
          onChange={setSheetsId}
          type="sheet"
          error={errors.sheets}
        />

        <GoogleIdInput
          label="Resume Drive folder"
          hint="Google Drive folder where tailored resumes will be saved."
          value={driveId}
          onChange={setDriveId}
          type="folder"
          error={errors.drive}
        />
      </div>

      <StepNav onNext={handleNext} />
    </div>
  )
}
