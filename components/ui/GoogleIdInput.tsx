'use client'

import { useEffect, useState } from 'react'
import FormField from '@/components/ui/FormField'
import { inputClass } from '@/components/ui/Input'
import { extractGoogleId } from '@/lib/extractGoogleId'

interface GoogleIdInputProps {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  type: 'doc' | 'sheet' | 'folder'
  error?: string
  placeholder?: string
}

const DEFAULT_PLACEHOLDERS: Record<GoogleIdInputProps['type'], string> = {
  doc: 'Paste Google Doc URL — e.g. https://docs.google.com/document/d/...',
  sheet: 'Paste Google Sheet URL — e.g. https://docs.google.com/spreadsheets/d/...',
  folder: 'Paste Google Drive folder URL — e.g. https://drive.google.com/drive/folders/...',
}

const PRODUCT_LABELS: Record<GoogleIdInputProps['type'], string> = {
  doc: 'Google Doc',
  sheet: 'Google Sheet',
  folder: 'Google Drive folder',
}

export default function GoogleIdInput({
  label,
  hint,
  value,
  onChange,
  type,
  error,
  placeholder = DEFAULT_PLACEHOLDERS[type],
}: GoogleIdInputProps) {
  const [raw, setRaw] = useState(value)
  const [extractedId, setExtractedId] = useState('')

  // Reset local input if parent clears the value (e.g. mode switch)
  useEffect(() => {
    if (value === '') {
      setRaw('')
      setExtractedId('')
    }
  }, [value])

  const handleChange = (input: string) => {
    setRaw(input)
    const { id, extracted: didExtract } = extractGoogleId(input, type)
    onChange(id)
    setExtractedId(didExtract ? id : '')
  }

  return (
    <div className="space-y-2.5">
      <FormField label={label} hint={hint} error={error}>
        <input
          type="text"
          value={raw}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
        {extractedId && (
          <p className="text-xs font-mono text-green-600 flex items-center gap-1 mt-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {PRODUCT_LABELS[type]} ID extracted: {extractedId}
          </p>
        )}
      </FormField>
    </div>
  )
}
