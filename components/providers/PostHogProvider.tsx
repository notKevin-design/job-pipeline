'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return // No-op in local dev without a key

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: false, // Single-page app — we fire wizard_started manually
      session_recording: {
        maskAllInputs: true,         // Masks all <input> and <textarea> by default
        maskTextSelector: '[data-ph-mask]', // Opt-in additional masking via attribute
      },
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
