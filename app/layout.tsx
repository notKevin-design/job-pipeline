import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import PostHogProvider from '@/components/providers/PostHogProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Job Pipeline Setup',
  description: 'Set up your AI-powered job search pipeline',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-stone-50 text-stone-900 antialiased font-sans">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
