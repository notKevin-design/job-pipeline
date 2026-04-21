'use client'

import { useEffect, useState } from 'react'
import { useWizard } from '@/context/WizardContext'
import { track } from '@/lib/analytics'
import StepNav from '@/components/wizard/StepNav'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'

export default function Step1Prerequisites() {
  const { state, dispatch, nextStep } = useWizard()
  const { gwsInstalled, gwsAuthenticated } = state.prereqStatus
  const [checking, setChecking] = useState(false)

  const check = (isRecheck = false) => {
    if (isRecheck) {
      track('prereq_recheck_clicked', { gws_installed: gwsInstalled, gws_authenticated: gwsAuthenticated })
    } else {
      track('prereq_check_started')
    }
    setChecking(true)
    dispatch({ type: 'SET_PREREQ', status: { gwsInstalled: null, gwsAuthenticated: null } })
    fetch('/api/check-prerequisites')
      .then((r) => r.json())
      .then((data) => {
        dispatch({
          type: 'SET_PREREQ',
          status: {
            gwsInstalled: data.gwsInstalled,
            gwsAuthenticated: data.gwsAuthenticated,
            gwsPath: data.gwsPath,
          },
        })
        track('prereq_check_completed', {
          gws_installed: data.gwsInstalled,
          gws_authenticated: data.gwsAuthenticated,
          all_good: data.gwsInstalled && data.gwsAuthenticated,
        })
      })
      .catch((err) => {
        dispatch({
          type: 'SET_PREREQ',
          status: { gwsInstalled: false, gwsAuthenticated: false },
        })
        track('prereq_check_failed', { error: String(err) })
      })
      .finally(() => setChecking(false))
  }

  useEffect(() => {
    if (gwsInstalled === null) check()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allGood = gwsInstalled === true && gwsAuthenticated === true

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wide text-stone-400 mb-3 uppercase">Step 1</p>
        <h1 className="text-4xl font-semibold text-stone-900 mb-3">Prerequisites</h1>
        <p className="text-base text-stone-500 leading-relaxed">
          The pipeline uses the Google Workspace CLI (<code className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded-md">gws</code>) to
          read and write your Google Docs, Sheets, and Drive. Let's make sure it's ready.
        </p>
      </div>

      <div className="space-y-2.5 mb-6">
        <StatusBadge status={gwsInstalled} label="gws CLI is installed" failLabel="gws CLI not found" />
        <StatusBadge status={gwsAuthenticated} label="Authenticated with Google" failLabel="Not authenticated" />
      </div>

      {gwsInstalled === false && (
        <div className="mb-5 p-5 rounded-2xl border border-stone-200 bg-white space-y-3 shadow-subtle">
          <p className="text-xs font-semibold text-stone-700">How to install gws</p>
          <ol className="text-sm text-stone-600 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Open your terminal</li>
            <li>
              Visit:{' '}
              <a href="https://github.com/googleworkspace/cli" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline font-medium">
                github.com/googleworkspace/cli
              </a>
            </li>
            <li>Follow the install instructions for your operating system</li>
            <li>Run <code className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded-md">gws auth login</code> and sign in</li>
            <li>Click "Re-check" below</li>
          </ol>
        </div>
      )}

      {gwsInstalled === true && gwsAuthenticated === false && (
        <div className="mb-5 p-5 rounded-2xl border border-stone-200 bg-white space-y-3 shadow-subtle">
          <p className="text-xs font-semibold text-stone-700">Authenticate gws</p>
          <ol className="text-sm text-stone-600 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Open your terminal</li>
            <li>Run: <code className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded-md">gws auth login</code></li>
            <li>Sign in with your Google account in the browser that opens</li>
            <li>Click "Re-check" below</li>
          </ol>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Button variant="secondary" onClick={() => check(true)} disabled={checking}>
          <svg className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Re-check
        </Button>
        {allGood && (
          <span className="text-xs font-semibold text-green-600 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            All good
          </span>
        )}
      </div>

      <StepNav onNext={nextStep} nextDisabled={!allGood} />
    </div>
  )
}
