'use client'

import { useState } from 'react'
import { useWizard } from '@/context/WizardContext'
import StepSidebar from './StepSidebar'
import Step0Welcome from '@/components/steps/Step0Welcome'
import StepAboutYou from '@/components/steps/StepAboutYou'
import StepSheetSetup from '@/components/steps/StepSheetSetup'
import Step6Review from '@/components/steps/Step6Review'

const STEPS = [
  Step0Welcome,
  StepAboutYou,
  StepSheetSetup,
  Step6Review,
]

export default function WizardShell() {
  const { state } = useWizard()
  const StepComponent = STEPS[state.currentStep] ?? STEPS[0]
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen overflow-hidden flex bg-stone-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <StepSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex">
            <StepSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3 bg-white border-b border-stone-200 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors focus:outline-none"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-brand-500 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-stone-900">Job Pipeline Setup</span>
          </div>
          <div className="ml-auto text-xs text-stone-400 font-mono">
            {state.currentStep + 1} / {STEPS.length}
          </div>
        </div>

        <div className="flex-1 max-w-2xl w-full mx-auto px-6 md:px-10 py-8 md:py-12">
          <StepComponent />
        </div>
      </main>
    </div>
  )
}
