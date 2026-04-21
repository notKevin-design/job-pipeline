import posthog from 'posthog-js'

// ── Event taxonomy ────────────────────────────────────────────────────────────
// All events that can be tracked. Add new events here to get compile-time safety.

export type AnalyticsEvent =
  // Wizard lifecycle
  | 'wizard_started'
  | 'wizard_resumed'
  | 'wizard_completed'
  // Step navigation
  | 'step_completed'
  | 'step_back'
  | 'step_validation_failed'
  // Prerequisites check (Step 1)
  | 'prereq_check_started'
  | 'prereq_check_completed'
  | 'prereq_check_failed'
  | 'prereq_recheck_clicked'
  // API key (Step 0)
  | 'api_key_save_succeeded'
  | 'api_key_save_failed'
  | 'api_key_changed'
  // Job preview (Step 0)
  | 'job_preview_attempted'
  | 'job_preview_succeeded'
  | 'job_preview_failed'
  // Identity extraction (background, Step 1)
  | 'identity_extraction_started'
  | 'identity_extraction_completed'
  | 'identity_extraction_failed'
  | 'identity_prefill_applied'
  | 'identity_prefill_dismissed'
  // Anchor detection (background, Step 3)
  | 'anchor_detection_started'
  | 'anchor_detection_completed'
  | 'anchor_detection_failed'
  // Sheet setup (Step 2)
  | 'sheet_path_selected'
  | 'sheet_path_switched'
  | 'template_link_clicked'
  | 'byo_column_detection_attempted'
  | 'byo_column_detection_succeeded'
  | 'byo_column_detection_failed'
  // Review & Save (Step 3)
  | 'save_config_attempted'
  | 'save_config_succeeded'
  | 'save_config_failed'
  | 'config_copied_to_clipboard'
  | 'edit_section_clicked'

// ── Core track() wrapper ──────────────────────────────────────────────────────
// - Noop silently if NEXT_PUBLIC_POSTHOG_KEY is not set (local dev without key)
// - Never throws — analytics must never break the app
// - Never passes raw PII — enforce by convention in each call site

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  try {
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    posthog.capture(event, {
      wizard_version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
      ...properties,
    })
  } catch {
    // Swallow — analytics must never break the app
  }
}

// ── Wizard start-time helpers (for total_time_ms on wizard_completed) ─────────

const WIZARD_START_KEY = 'job-pipeline-wizard-start-time'

export function markWizardStart(): void {
  try {
    if (!localStorage.getItem(WIZARD_START_KEY)) {
      localStorage.setItem(WIZARD_START_KEY, String(Date.now()))
    }
  } catch {}
}

export function getWizardElapsedMs(): number {
  try {
    const start = Number(localStorage.getItem(WIZARD_START_KEY))
    return start ? Date.now() - start : 0
  } catch {
    return 0
  }
}

export function clearWizardStart(): void {
  try {
    localStorage.removeItem(WIZARD_START_KEY)
  } catch {}
}
