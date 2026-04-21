'use client'

import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import { track } from '@/lib/analytics'
import type {
  WizardConfig,
  WizardState,
  PrerequisiteStatus,
  AnchorDetectionState,
  IdentityExtractionState,
  DetectedAnchors,
  ExtractedIdentity,
} from '@/lib/types'

const STORAGE_KEY = 'job-pipeline-wizard-state'

const initialState: WizardState = {
  currentStep: 0,
  config: {},
  prereqStatus: { gwsInstalled: null, gwsAuthenticated: null },
  isSaving: false,
  saveError: null,
  existingConfigFound: false,
  showSuccess: false,
  anchorDetection: { status: 'idle' },
  identityExtraction: { status: 'idle' },
}

type Action =
  | { type: 'SET_STEP'; step: number }
  | { type: 'UPDATE_CONFIG'; patch: Partial<WizardConfig> }
  | { type: 'SET_PREREQ'; status: PrerequisiteStatus }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_SAVE_ERROR'; error: string | null }
  | { type: 'SET_EXISTING_CONFIG'; found: boolean }
  | { type: 'SET_SHOW_SUCCESS'; value: boolean }
  | { type: 'SET_ANCHOR_DETECTION'; value: AnchorDetectionState }
  | { type: 'SET_IDENTITY_EXTRACTION'; value: IdentityExtractionState }
  | { type: 'RESET' }

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step, showSuccess: false }
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.patch } }
    case 'SET_PREREQ':
      return { ...state, prereqStatus: action.status }
    case 'SET_SAVING':
      return { ...state, isSaving: action.saving }
    case 'SET_SAVE_ERROR':
      return { ...state, saveError: action.error }
    case 'SET_EXISTING_CONFIG':
      return { ...state, existingConfigFound: action.found }
    case 'SET_SHOW_SUCCESS':
      return { ...state, showSuccess: action.value }
    case 'SET_ANCHOR_DETECTION':
      return { ...state, anchorDetection: action.value }
    case 'SET_IDENTITY_EXTRACTION':
      return { ...state, identityExtraction: action.value }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

// Fields persisted to localStorage (excludes transient background-job state)
type PersistedState = Pick<
  WizardState,
  'currentStep' | 'config' | 'prereqStatus' | 'existingConfigFound'
>

interface WizardContextValue {
  state: WizardState
  dispatch: React.Dispatch<Action>
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateConfig: (patch: Partial<WizardConfig>) => void
  triggerAnchorDetection: (resumeDocId: string) => void
  triggerIdentityExtraction: (resumeDocId: string) => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Track in-flight requests so we don't fire duplicates for the same doc id
  const anchorReqRef = useRef<string | null>(null)
  const identityReqRef = useRef<string | null>(null)

  // Restore from localStorage after mount (avoids server/client mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedState
        dispatch({ type: 'RESET' })
        if (parsed.currentStep) dispatch({ type: 'SET_STEP', step: parsed.currentStep })
        if (parsed.config) dispatch({ type: 'UPDATE_CONFIG', patch: parsed.config })
        if (parsed.prereqStatus) dispatch({ type: 'SET_PREREQ', status: parsed.prereqStatus })
        if (parsed.existingConfigFound) dispatch({ type: 'SET_EXISTING_CONFIG', found: parsed.existingConfigFound })
      }
    } catch {}
  }, [])

  // Persist to localStorage on every state change (transient job state excluded)
  useEffect(() => {
    try {
      const persisted: PersistedState = {
        currentStep: state.currentStep,
        config: state.config,
        prereqStatus: state.prereqStatus,
        existingConfigFound: state.existingConfigFound,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {}
  }, [state.currentStep, state.config, state.prereqStatus, state.existingConfigFound])

  const goToStep = (step: number) => dispatch({ type: 'SET_STEP', step })
  const nextStep = () => dispatch({ type: 'SET_STEP', step: state.currentStep + 1 })
  const prevStep = () => dispatch({ type: 'SET_STEP', step: state.currentStep - 1 })
  const updateConfig = (patch: Partial<WizardConfig>) => dispatch({ type: 'UPDATE_CONFIG', patch })

  const triggerAnchorDetection = (resumeDocId: string) => {
    if (!resumeDocId) return
    if (anchorReqRef.current === resumeDocId) return
    anchorReqRef.current = resumeDocId
    dispatch({ type: 'SET_ANCHOR_DETECTION', value: { status: 'running' } })
    track('anchor_detection_started')
    fetch('/api/detect-anchors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_doc_id: resumeDocId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (anchorReqRef.current !== resumeDocId) return
        if (data.error) {
          track('anchor_detection_failed', { error_message: data.error })
          dispatch({ type: 'SET_ANCHOR_DETECTION', value: { status: 'error', error: data.error } })
        } else {
          const detected: DetectedAnchors = {
            summary_anchor: data.summary_anchor,
            experience_anchor: data.experience_anchor,
            key_skills_anchor: data.key_skills_anchor,
            key_skills_label: data.key_skills_label,
          }
          const anchors_found = [
            detected.summary_anchor,
            detected.experience_anchor,
            detected.key_skills_anchor,
            detected.key_skills_label,
          ].filter((v) => v && v !== 'none').length
          track('anchor_detection_completed', { anchors_found })
          dispatch({ type: 'SET_ANCHOR_DETECTION', value: { status: 'done', data: detected } })
        }
      })
      .catch((err) => {
        if (anchorReqRef.current !== resumeDocId) return
        const message = err instanceof Error ? err.message : 'Network error'
        track('anchor_detection_failed', { error_message: message })
        dispatch({
          type: 'SET_ANCHOR_DETECTION',
          value: { status: 'error', error: message },
        })
      })
  }

  const triggerIdentityExtraction = (resumeDocId: string) => {
    if (!resumeDocId) return
    if (identityReqRef.current === resumeDocId) return
    identityReqRef.current = resumeDocId
    dispatch({ type: 'SET_IDENTITY_EXTRACTION', value: { status: 'running' } })
    track('identity_extraction_started')
    fetch('/api/extract-identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_doc_id: resumeDocId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (identityReqRef.current !== resumeDocId) return
        if (data.error) {
          track('identity_extraction_failed', { error_message: data.error })
          dispatch({ type: 'SET_IDENTITY_EXTRACTION', value: { status: 'error', error: data.error } })
        } else {
          const extracted: ExtractedIdentity = {
            full_name: data.full_name,
            first_name: data.first_name,
            email: data.email,
            portfolio_url: data.portfolio_url,
          }
          const fields_found = [
            extracted.full_name,
            extracted.first_name,
            extracted.email,
            extracted.portfolio_url,
          ].filter((v) => v && v !== 'none').length
          track('identity_extraction_completed', { fields_found })
          dispatch({ type: 'SET_IDENTITY_EXTRACTION', value: { status: 'done', data: extracted } })
        }
      })
      .catch((err) => {
        if (identityReqRef.current !== resumeDocId) return
        const message = err instanceof Error ? err.message : 'Network error'
        track('identity_extraction_failed', { error_message: message })
        dispatch({
          type: 'SET_IDENTITY_EXTRACTION',
          value: { status: 'error', error: message },
        })
      })
  }

  return (
    <WizardContext.Provider
      value={{
        state,
        dispatch,
        goToStep,
        nextStep,
        prevStep,
        updateConfig,
        triggerAnchorDetection,
        triggerIdentityExtraction,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used inside WizardProvider')
  return ctx
}
