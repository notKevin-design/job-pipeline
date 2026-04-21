export interface WizardConfig {
  // Step 2 — Identity
  full_name: string
  first_name: string
  email: string
  portfolio_url: string // "none" if skipped

  // Step 3 — Google IDs
  resume_doc_id: string
  sheets_id: string
  drive_folder_id: string

  // Step 4 — Sheets Layout
  sheet_tab: string
  col_company: string
  col_role: string
  col_compensation: string
  col_date_posted: string
  col_url: string
  col_tier: string
  col_reason: string
  col_breakdown: string
  col_inmail: string
  col_connection_note: string

  // Step 5 — Resume Anchors
  summary_anchor: string     // "none" if skipped
  experience_anchor: string  // "none" if skipped
  key_skills_anchor: string  // "none" if skipped
  key_skills_label: string   // "none" if no label

  // Provisioning metadata
  sheet_setup_mode?: 'template' | 'byo'
  sheets_web_link?: string
  drive_folder_web_link?: string

  // Pipeline telemetry (opt-in)
  telemetry_opt_in?: boolean
  anonymous_user_id?: string
  posthog_key?: string
}

export interface PrerequisiteStatus {
  gwsInstalled: boolean | null
  gwsAuthenticated: boolean | null
  apiKeySet?: boolean
  gwsPath?: string
  errorMessage?: string
}

export interface DetectedAnchors {
  summary_anchor: string
  experience_anchor: string
  key_skills_anchor: string
  key_skills_label: string
}

export interface ExtractedIdentity {
  full_name: string
  first_name: string
  email: string
  portfolio_url: string
}

export type BackgroundJobStatus = 'idle' | 'running' | 'done' | 'error'

export interface AnchorDetectionState {
  status: BackgroundJobStatus
  data?: DetectedAnchors
  error?: string
}

export interface IdentityExtractionState {
  status: BackgroundJobStatus
  data?: ExtractedIdentity
  error?: string
}

export interface WizardState {
  currentStep: number
  config: Partial<WizardConfig>
  prereqStatus: PrerequisiteStatus
  isSaving: boolean
  saveError: string | null
  existingConfigFound: boolean
  showSuccess: boolean
  anchorDetection: AnchorDetectionState
  identityExtraction: IdentityExtractionState
}

export const STEP_LABELS = [
  'Welcome',
  'About You',
  'Sheet & Drive Setup',
  'Review & Save',
]

export const TOTAL_STEPS = STEP_LABELS.length
